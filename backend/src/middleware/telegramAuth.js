const crypto = require("crypto");
const prisma = require("../lib/prisma");

/**
 * Validates the `initData` string that the Telegram Mini App sends with
 * every request (in the "x-telegram-init-data" header). This proves the
 * request really comes from Telegram and tells us which user is calling.
 *
 * Docs: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
function verifyInitData(initData, botToken) {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const computedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (computedHash !== hash) return null;

  const userJson = params.get("user");
  if (!userJson) return null;

  return JSON.parse(userJson);
}

async function telegramAuth(req, res, next) {
  try {
    const initData = req.headers["x-telegram-init-data"];
    if (!initData) {
      return res.status(401).json({ error: "x-telegram-init-data header topilmadi" });
    }

    // Allow a hardcoded bypass in local development so the Mini App can be
    // tested in a normal browser (outside Telegram) with a fake user.
    if (process.env.NODE_ENV !== "production" && initData === "DEV_MODE") {
      const devUser = await prisma.user.upsert({
        where: { telegramId: BigInt(1) },
        update: {},
        create: { telegramId: BigInt(1), firstName: "Dev User", currency: "UZS" },
      });
      req.user = devUser;
      return next();
    }

    const tgUser = verifyInitData(initData, process.env.BOT_TOKEN);
    if (!tgUser) {
      return res.status(401).json({ error: "initData yaroqsiz" });
    }

    const user = await prisma.user.upsert({
      where: { telegramId: BigInt(tgUser.id) },
      update: { firstName: tgUser.first_name, username: tgUser.username },
      create: {
        telegramId: BigInt(tgUser.id),
        firstName: tgUser.first_name,
        username: tgUser.username,
      },
    });

    req.user = user;
    next();
  } catch (err) {
    console.error("telegramAuth xatosi:", err);
    res.status(401).json({ error: "Avtorizatsiya muvaffaqiyatsiz" });
  }
}

module.exports = { telegramAuth, verifyInitData };
