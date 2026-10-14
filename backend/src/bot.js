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
    "👋 Moliya Nazorati botiga xush kelibsiz!\n\nKirim va chiqimlaringizni Mini App orqali oson boshqaring.\n\nYoki istalgan xabarni (masalan, bank/boshqa botdan kelgan chek xabarini) menga forward qiling — men undan summani topib, kategoriyasini so'rab, avtomatik saqlayman.",
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
// The user forwards an arbitrary message (bank notification, another bot,
// a channel, or free text) into this bot. We read it line by line — bank
// notifications always put the amount on its own line, often marked with
// ➖ (debit) or ➕ (credit) — and pick the amount from there instead of
// scanning the whole blob of text (which would also catch the commission,
// balance, card number, or date). Then we ask which category it belongs
// to via inline buttons, with an option to create a brand new category.

// A number written with thousands separators (space, dot or comma) and an
// optional 1-2 digit decimal tail, e.g. "132.000,00", "50 000", "1,234.5".
const NUMBER_RE = /\d{1,3}(?:[ .,]\d{3})*(?:[.,]\d{1,2})?/g;

// Lines that are clearly NOT the transaction amount (commission, balance,
// masked card number, etc.) even though they contain numbers.
const EXCLUDE_LINE = /komissiya|коммис|balans|qoldiq|остат|karta|card|humocard|uzcard|\*\d{2,4}/i;
const CURRENCY_LINE = /so'?m|UZS|сум/i;

function tokenToInt(token) {
  const parts = token.split(/[\s.,]/).filter(Boolean);
  if (parts.length > 1 && parts[parts.length - 1].length <= 2) {
    parts.pop(); // drop a trailing 1-2 digit decimal fraction
  }
  const digits = parts.join("");
  const num = parseInt(digits, 10);
  return Number.isFinite(num) && num > 0 ? num : null;
}

function numbersInLine(line) {
  return [...line.matchAll(NUMBER_RE)].map((m) => tokenToInt(m[0])).filter((n) => n);
}

function extractAmount(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // 1) A line explicitly marked with ➖ (debit) or ➕ (credit).
  for (const line of lines) {
    const type = line.includes("➕") ? "INCOME" : line.includes("➖") ? "EXPENSE" : null;
    if (type) {
      const nums = numbersInLine(line);
      if (nums.length) return { amount: nums[0], type };
    }
  }

  // 2) A line that mentions the currency and isn't commission/balance/card.
  for (const line of lines) {
    if (EXCLUDE_LINE.test(line)) continue;
    if (CURRENCY_LINE.test(line)) {
      const nums = numbersInLine(line);
      if (nums.length) return { amount: nums[0], type: null };
    }
  }

  // 3) Fallback: the largest number in any non-excluded line.
  let best = null;
  for (const line of lines) {
    if (EXCLUDE_LINE.test(line)) continue;
    for (const n of numbersInLine(line)) {
      if (!best || n > best) best = n;
    }
  }
  return best ? { amount: best, type: null } : null;
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

// token -> { telegramId, chatId, amount, note, type }
const pendingCategoryChoice = new Map();
// chatId -> { telegramId, note } — waiting for the user's next message to
// be the amount, because we couldn't find one in the forwarded text.
const pendingAmountOnly = new Map();
// chatId -> token — waiting for the user's next message to be the name of
// a brand new category.
const pendingNewCategoryName = new Map();

async function askCategory(chatId, telegramId, amount, note, type) {
  const resolvedType = type || "EXPENSE";
  const categories = await prisma.category.findMany({ where: { type: resolvedType }, orderBy: { id: "asc" } });

  const token = makeToken();
  pendingCategoryChoice.set(token, { telegramId, chatId, amount, note, type: resolvedType });

  const buttons = categories.map((c) => [{ text: `${c.icon} ${c.name}`, callback_data: `cat:${token}:${c.id}` }]);
  buttons.push([{ text: "➕ Yangi kategoriya qo'shish", callback_data: `newcat:${token}` }]);

  const label = resolvedType === "INCOME" ? "Kirim" : "Chiqim";

  await bot.sendMessage(chatId, `💰 ${formatAmount(amount, "UZS")} (${label}) topildi.\n\nQaysi kategoriyaga tegishli?`, {
    reply_markup: { inline_keyboard: buttons },
  });
}

async function saveTransaction({ userId, amount, type, categoryId, note }) {
  return prisma.transaction.create({ data: { userId, amount, type, categoryId, note } });
}

bot.on("message", async (msg) => {
  if (!msg.chat || msg.chat.type !== "private") return; // faqat shaxsiy chat
  const text = msg.text || msg.caption;
  if (!text) return;
  if (text.startsWith("/")) return; // komandalar alohida onText orqali ishlaydi

  const chatId = msg.chat.id;
  const telegramId = msg.from.id;

  // 1) Yangi kategoriya nomi kutilyaptimi?
  const newCatToken = pendingNewCategoryName.get(chatId);
  if (newCatToken) {
    pendingNewCategoryName.delete(chatId);
    const pending = pendingCategoryChoice.get(newCatToken);
    if (!pending) {
      return bot.sendMessage(chatId, "Bu so'rov muddati o'tgan. Iltimos, xabarni qaytadan forward qiling.");
    }
    const name = text.trim().slice(0, 60);
    const category = await prisma.category.create({
      data: { name, type: pending.type, icon: pending.type === "INCOME" ? "💰" : "🏷️", color: "#4F46E5" },
    });
    const user = await getOrCreateUser(pending.telegramId, msg.from.first_name, msg.from.username);
    await saveTransaction({ userId: user.id, amount: pending.amount, type: category.type, categoryId: category.id, note: pending.note });
    pendingCategoryChoice.delete(newCatToken);
    const label = category.type === "INCOME" ? "kirim" : "chiqim";
    return bot.sendMessage(
      chatId,
      `✅ Yangi "${category.icon} ${category.name}" kategoriyasi yaratildi va ${formatAmount(pending.amount, "UZS")} shu ${label}ga saqlandi!`
    );
  }

  // 2) Summa kutilyaptimi (avvalgi xabarda topilmagan edi)?
  const awaiting = pendingAmountOnly.get(chatId);
  if (awaiting) {
    const parsed = extractAmount(text);
    if (!parsed) {
      return bot.sendMessage(chatId, "Raqam topilmadi. Iltimos, faqat summani yuboring (masalan: 50000).");
    }
    pendingAmountOnly.delete(chatId);
    await getOrCreateUser(telegramId, msg.from.first_name, msg.from.username);
    return askCategory(chatId, telegramId, parsed.amount, awaiting.note, parsed.type);
  }

  // 3) Oddiy holat: xabarni tahlil qilib, summani topamiz.
  const parsed = extractAmount(text);
  await getOrCreateUser(telegramId, msg.from.first_name, msg.from.username);

  if (!parsed) {
    pendingAmountOnly.set(chatId, { telegramId, note: text.slice(0, 200) });
    return bot.sendMessage(chatId, "Bu xabarda summani topa olmadim 🤔\nIltimos, summani raqam bilan yuboring (masalan: 50000).");
  }

  await askCategory(chatId, telegramId, parsed.amount, text.slice(0, 200), parsed.type);
});

bot.on("callback_query", async (query) => {
  const data = query.data || "";

  if (data.startsWith("newcat:")) {
    const token = data.split(":")[1];
    const pending = pendingCategoryChoice.get(token);
    if (!pending) {
      return bot.answerCallbackQuery(query.id, { text: "Bu so'rov muddati o'tgan, qayta yuboring." });
    }
    pendingNewCategoryName.set(pending.chatId, token);
    await bot.answerCallbackQuery(query.id);
    return bot.sendMessage(pending.chatId, "Yangi kategoriya nomini yozing (masalan: Sport):");
  }

  if (!data.startsWith("cat:")) return;

  const [, token, categoryIdStr] = data.split(":");
  const pending = pendingCategoryChoice.get(token);
  if (!pending) {
    return bot.answerCallbackQuery(query.id, { text: "Bu so'rov muddati o'tgan, qayta yuboring." });
  }

  try {
    const user = await getOrCreateUser(pending.telegramId, query.from.first_name, query.from.username);
    const category = await prisma.category.findUnique({ where: { id: Number(categoryIdStr) } });
    if (!category) throw new Error("Kategoriya topilmadi");

    await saveTransaction({ userId: user.id, amount: pending.amount, type: category.type, categoryId: category.id, note: pending.note });

    pendingCategoryChoice.delete(token);

    const label = category.type === "INCOME" ? "kirim" : "chiqim";
    await bot.editMessageText(
      `✅ ${formatAmount(pending.amount, "UZS")} (${category.icon} ${category.name}) ${label} sifatida saqlandi!`,
      { chat_id: pending.chatId, message_id: query.message.message_id }
    );
    await bot.answerCallbackQuery(query.id);
  } catch (err) {
    console.error("Kategoriya tanlashda xato:", err.message);
    await bot.answerCallbackQuery(query.id, { text: "Xatolik yuz berdi, qayta urinib ko'ring." });
  }
});

module.exports = { bot, notifyTransactionSaved };
