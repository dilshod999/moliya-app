const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const { telegramAuth } = require("../middleware/telegramAuth");

// GET /api/export/csv — downloads full history as CSV (opens in Excel).
// Kept dependency-free on purpose; swap in a library like exceljs later
// if you need native .xlsx formatting instead of CSV.
router.get("/csv", telegramAuth, async (req, res) => {
  const transactions = await prisma.transaction.findMany({
    where: { userId: req.user.id },
    include: { category: true },
    orderBy: { date: "desc" },
  });

  const header = "Sana,Turi,Kategoriya,Summa,Izoh\n";
  const rows = transactions
    .map((t) => {
      const date = t.date.toISOString().slice(0, 10);
      const type = t.type === "INCOME" ? "Kirim" : "Chiqim";
      const note = (t.note || "").replace(/,/g, ";");
      return `${date},${type},${t.category.name},${t.amount},${note}`;
    })
    .join("\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=tarix.csv");
  res.send(header + rows);
});

module.exports = router;
