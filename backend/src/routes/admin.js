const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const adminAuth = require("../middleware/adminAuth");

router.use(adminAuth);

// GET /api/admin/overview — top cards on the Admin Dashboard
router.get("/overview", async (req, res) => {
  const [usersCount, incomeAgg, expenseAgg, transactionsCount] = await Promise.all([
    prisma.user.count(),
    prisma.transaction.aggregate({ where: { type: "INCOME" }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: "EXPENSE" }, _sum: { amount: true } }),
    prisma.transaction.count(),
  ]);

  res.json({
    usersCount,
    transactionsCount,
    totalIncome: Number(incomeAgg._sum.amount || 0),
    totalExpense: Number(expenseAgg._sum.amount || 0),
  });
});

// GET /api/admin/transactions?page=1&pageSize=20 — full operations list
router.get("/transactions", async (req, res) => {
  const page = Number(req.query.page || 1);
  const pageSize = Number(req.query.pageSize || 20);

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      include: { user: true, category: true },
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.transaction.count(),
  ]);

  res.json({
    total,
    page,
    pageSize,
    items: transactions.map((t) => ({
      id: t.id,
      amount: Number(t.amount),
      type: t.type,
      note: t.note,
      date: t.date,
      category: { name: t.category.name, icon: t.category.icon, color: t.category.color },
      user: {
        telegramId: t.user.telegramId.toString(),
        name: t.user.firstName || t.user.username || `ID ${t.user.telegramId}`,
      },
    })),
  });
});

// GET /api/admin/monthly-trend — last 6 months income vs expense, for the dashboard chart
router.get("/monthly-trend", async (req, res) => {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const [income, expense] = await Promise.all([
      prisma.transaction.aggregate({ where: { type: "INCOME", date: { gte: start, lt: end } }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { type: "EXPENSE", date: { gte: start, lt: end } }, _sum: { amount: true } }),
    ]);
    months.push({
      label: start.toLocaleDateString("uz-UZ", { month: "short" }),
      income: Number(income._sum.amount || 0),
      expense: Number(expense._sum.amount || 0),
    });
  }
  res.json(months);
});

module.exports = router;
