const TelegramBot = require("node-telegram-bot-api");

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
  bot.sendMessage(chatId, "👋 Moliya Nazorati botiga xush kelibsiz!\n\nKirim va chiqimlaringizni Mini App orqali oson boshqaring.", {
    reply_markup: {
      inline_keyboard: [[{ text: "📱 Ilovani ochish", web_app: { url: miniAppUrl } }]],
    },
  });
});

const currencySymbol = (currency) => (currency === "USD" ? "$" : "so'm");

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

module.exports = { bot, notifyTransactionSaved };
