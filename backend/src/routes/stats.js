const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const { telegramAuth } = require("../middleware/telegramAuth");

function monthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { start, end };
}

// GET /api/stats/summary — balance / income / expense widget on Home
router.get("/summary", telegramAuth, async (req, res) => {
  const { start, end } = monthRange();
  const transactions = await prisma.transaction.findMany({
    where: { userId: req.user.id, date: { gte: start, lt: end } },
  });

  const income = transactions.filter((t) => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0);
  const expense = transactions.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0);

  res.json({ income, expense, balance: income - expense });
});

// GET /api/stats/by-category — donut chart data + top spending categories
router.get("/by-category", telegramAuth, async (req, res) => {
  const { start, end } = monthRange();
  const transactions = await prisma.transaction.findMany({
    where: { userId: req.user.id, type: "EXPENSE", date: { gte: start, lt: end } },
    include: { category: true },
  });

  const totals = {};
  for (const t of transactions) {
    const key = t.category.id;
    if (!totals[key]) {
      totals[key] = { categoryId: key, name: t.category.name, icon: t.category.icon, color: t.category.color, amount: 0 };
    }
    totals[key].amount += Number(t.amount);
  }

  const result = Object.values(totals).sort((a, b) => b.amount - a.amount);
  res.json(result);
});

module.exports = router;
