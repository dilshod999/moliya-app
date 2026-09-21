const TelegramBot = require("node-telegram-bot-api");
const prisma = require("./lib/prisma");

const token = process.env.BOT_TOKEN;
const miniAppUrl = process.env.MINIAPP_URL;

if (!token) {
  throw new Error("BOT_TOKEN .env faylida topilmadi");
}

// Polling is the simplest way to run the bot both locally and on most
// hosts (Railway/Render/VPS). Switch to webhooks in bot.setWebHook(...) if
// you prefer that instead once you have a stable HTTPS domain.
const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    "👋 Moliya Nazorati botiga xush kelibsiz!\n\nKirim va chiqimlaringizni Mini App orqali oson boshqaring.\n\nYoki istalgan xabarni (masalan, boshqa botdan kelgan chek/xarajat xabarini) menga forward qiling — men undan summani topib, kategoriyasini so'rab, avtomatik chiqim sifatida saqlayman.",
    {
      reply_markup: {
        inline_keyboard: [[{ text: "📱 Ilovani ochish", web_app: { url: miniAppUrl } }]],
      },
    }
  );
});

function formatAmount(amount, currency) {
  const num = Number(amount);
  const formatted = num.toLocaleString("uz-UZ", { maximumFractionDigits: 0 });
  return currency === "USD" ? `$${formatted}` : `${formatted} so'm`;
}

/**
 * Called by the transactions route right after a transaction is saved, so
 * the user gets an instant confirmation inside the chat.
 */
async function notifyTransactionSaved(telegramId, transaction) {
  try {
    const emoji = transaction.type === "INCOME" ? "📥" : "➖";
    const amountText = formatAmount(transaction.amount, transaction.currency);
    await bot.sendMessage(
      Number(telegramId),
      `✅ ${amountText} (${transaction.categoryName}) muvaffaqiyatli saqlandi! ${emoji}`
    );
  } catch (err) {
    console.error("Telegramga xabar yuborishda xato:", err.message);
  }
}

// --- Forward-to-categorize flow -------------------------------------------
//
// The user forwards an arbitrary message (from another bot, a channel, or
// just types free text) into this bot. Since the incoming format is never
// the same twice, we don't try to fully parse it — we just pull out the
// biggest number in the text as the amount, then ask the user which
// expense category it belongs to via inline buttons.

// token -> { telegramId, chatId, amount, note }
const pendingCategoryChoice = new Map();
// chatId -> { telegramId, note } — set when we couldn't find an amount and
// are waiting for the user's next message to contain just the number.
const pendingAmountOnly = new Map();

function extractAmount(text) {
  const matches = text.match(/\d[\d\s.,]*\d|\d+/g) || [];
  const numbers = matches
    .map((m) => parseInt(m.replace(/[^\d]/g, ""), 10))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (!numbers.length) return null;
  return Math.max(...numbers);
}

function makeToken() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

async function getOrCreateUser(telegramId, firstName, username) {
  return prisma.user.upsert({
    where: { telegramId: BigInt(telegramId) },
    update: { firstName, username },
    create: { telegramId: BigInt(telegramId), firstName, username },
  });
}

async function askCategory(chatId, telegramId, amount, note) {
  const categories = await prisma.category.findMany({ where: { type: "EXPENSE" }, orderBy: { id: "asc" } });
  if (!categories.length) {
    return bot.sendMessage(chatId, "Hozircha chiqim kategoriyalari sozlanmagan. Avval Admin Panel orqali kategoriya qo'shing.");
  }

  const token = makeToken();
  pendingCategoryChoice.set(token, { telegramId, chatId, amount, note });

  const buttons = categories.map((c) => [{ text: `${c.icon} ${c.name}`, callback_data: `expcat:${token}:${c.id}` }]);

  await bot.sendMessage(chatId, `💸 ${formatAmount(amount, "UZS")} topildi.\n\nQaysi kategoriyaga tegishli?`, {
    reply_markup: { inline_keyboard: buttons },
  });
}

bot.on("message", async (msg) => {
  if (!msg.chat || msg.chat.type !== "private") return; // faqat shaxsiy chat
  const text = msg.text || msg.caption;
  if (!text) return;
  if (text.startsWith("/")) return; // komandalar alohida onText orqali ishlaydi

  const chatId = msg.chat.id;
  const telegramId = msg.from.id;

  // Agar avvalroq "summani yuboring" deb so'ragan bo'lsak, bu xabarni
  // to'g'ridan-to'g'ri summa sifatida o'qiymiz.
  const awaiting = pendingAmountOnly.get(chatId);
  if (awaiting) {
    const amount = extractAmount(text);
    if (!amount) {
      return bot.sendMessage(chatId, "Raqam topilmadi. Iltimos, faqat summani yuboring (masalan: 50000).");
    }
    pendingAmountOnly.delete(chatId);
    await getOrCreateUser(telegramId, msg.from.first_name, msg.from.username);
    return askCategory(chatId, telegramId, amount, awaiting.note);
  }

  const amount = extractAmount(text);
  await getOrCreateUser(telegramId, msg.from.first_name, msg.from.username);

  if (!amount) {
    pendingAmountOnly.set(chatId, { telegramId, note: text.slice(0, 200) });
    return bot.sendMessage(chatId, "Bu xabarda summani topa olmadim 🤔\nIltimos, summani raqam bilan yuboring (masalan: 50000).");
  }

  await askCategory(chatId, telegramId, amount, text.slice(0, 200));
});

bot.on("callback_query", async (query) => {
  const data = query.data || "";
  if (!data.startsWith("expcat:")) return;

  const [, token, categoryIdStr] = data.split(":");
  const pending = pendingCategoryChoice.get(token);
  if (!pending) {
    return bot.answerCallbackQuery(query.id, { text: "Bu so'rov muddati o'tgan, qayta yuboring." });
  }

  try {
    const user = await getOrCreateUser(pending.telegramId, query.from.first_name, query.from.username);
    const category = await prisma.category.findUnique({ where: { id: Number(categoryIdStr) } });
    if (!category) throw new Error("Kategoriya topilmadi");

    await prisma.transaction.create({
      data: {
        userId: user.id,
        amount: pending.amount,
        type: "EXPENSE",
        categoryId: category.id,
        note: pending.note,
      },
    });

    pendingCategoryChoice.delete(token);

    await bot.editMessageText(
      `✅ ${formatAmount(pending.amount, "UZS")} (${category.icon} ${category.name}) chiqim sifatida saqlandi!`,
      { chat_id: pending.chatId, message_id: query.message.message_id }
    );
    await bot.answerCallbackQuery(query.id);
  } catch (err) {
    console.error("Kategoriya tanlashda xato:", err.message);
    await bot.answerCallbackQuery(query.id, { text: "Xatolik yuz berdi, qayta urinib ko'ring." });
  }
});

module.exports = { bot, notifyTransactionSaved };
