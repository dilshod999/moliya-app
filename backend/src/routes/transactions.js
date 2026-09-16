const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const { telegramAuth } = require("../middleware/telegramAuth");
const { notifyTransactionSaved } = require("../bot");

// GET /api/transactions?limit=5 — history / "last 5 transactions" widget
router.get("/", telegramAuth, async (req, res) => {
  const { limit } = req.query;
  const transactions = await prisma.transaction.findMany({
    where: { userId: req.user.id },
    include: { category: true },
    orderBy: { date: "desc" },
    take: limit ? Number(limit) : undefined,
  });
  res.json(transactions);
});

// POST /api/transactions — add income/expense from the bottom-sheet form
router.post("/", telegramAuth, async (req, res) => {
  const { amount, type, categoryId, note, date } = req.body;
  if (!amount || !type || !categoryId) {
    return res.status(400).json({ error: "amount, type, categoryId majburiy" });
  }

  const category = await prisma.category.findUnique({ where: { id: Number(categoryId) } });
  if (!category) return res.status(404).json({ error: "Kategoriya topilmadi" });

  const transaction = await prisma.transaction.create({
    data: {
      userId: req.user.id,
      amount,
      type,
      categoryId: Number(categoryId),
      note,
      date: date ? new Date(date) : new Date(),
    },
    include: { category: true },
  });

  notifyTransactionSaved(req.user.telegramId, {
    amount: transaction.amount,
    type: transaction.type,
    categoryName: category.name,
    currency: req.user.currency,
  });

  res.status(201).json(transaction);
});

// DELETE /api/transactions/:id — remove a wrongly entered transaction
router.delete("/:id", telegramAuth, async (req, res) => {
  const { id } = req.params;
  const transaction = await prisma.transaction.findUnique({ where: { id: Number(id) } });
  if (!transaction || transaction.userId !== req.user.id) {
    return res.status(404).json({ error: "Amal topilmadi" });
  }
  await prisma.transaction.delete({ where: { id: Number(id) } });
  res.status(204).end();
});

module.exports = router;
