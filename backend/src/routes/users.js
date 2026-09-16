const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const { telegramAuth } = require("../middleware/telegramAuth");

// PUT /api/users/currency — { "currency": "USD" | "UZS" }
router.put("/currency", telegramAuth, async (req, res) => {
  const { currency } = req.body;
  if (!["UZS", "USD"].includes(currency)) {
    return res.status(400).json({ error: "currency UZS yoki USD bo'lishi kerak" });
  }
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { currency },
  });
  res.json({ currency: user.currency });
});

module.exports = router;
