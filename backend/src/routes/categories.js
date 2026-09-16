const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const adminAuth = require("../middleware/adminAuth");

// GET /api/categories?type=EXPENSE — used by both Mini App and Admin panel
router.get("/", async (req, res) => {
  const { type } = req.query;
  const categories = await prisma.category.findMany({
    where: type ? { type } : undefined,
    orderBy: { id: "asc" },
  });
  res.json(categories);
});

// --- Admin-only management below ---

router.post("/", adminAuth, async (req, res) => {
  const { name, type, icon, color } = req.body;
  if (!name || !type || !icon || !color) {
    return res.status(400).json({ error: "name, type, icon, color majburiy" });
  }
  const category = await prisma.category.create({ data: { name, type, icon, color } });
  res.status(201).json(category);
});

router.put("/:id", adminAuth, async (req, res) => {
  const { id } = req.params;
  const { name, type, icon, color } = req.body;
  const category = await prisma.category.update({
    where: { id: Number(id) },
    data: { name, type, icon, color },
  });
  res.json(category);
});

router.delete("/:id", adminAuth, async (req, res) => {
  const { id } = req.params;
  await prisma.transaction.deleteMany({ where: { categoryId: Number(id) } });
  await prisma.category.delete({ where: { id: Number(id) } });
  res.status(204).end();
});

module.exports = router;
