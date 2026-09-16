const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const defaultCategories = [
  { name: "Oziq-ovqat", type: "EXPENSE", icon: "🍔", color: "#F2542D" },
  { name: "Transport", type: "EXPENSE", icon: "🚕", color: "#3B82F6" },
  { name: "Kommunal", type: "EXPENSE", icon: "💡", color: "#F59E0B" },
  { name: "Ko'ngilochar", type: "EXPENSE", icon: "🎬", color: "#A855F7" },
  { name: "Oylik", type: "INCOME", icon: "💼", color: "#0EA5A0" },
  { name: "Biznes", type: "INCOME", icon: "📈", color: "#16A34A" },
];

async function main() {
  for (const category of defaultCategories) {
    const existing = await prisma.category.findFirst({
      where: { name: category.name, type: category.type },
    });
    if (!existing) {
      await prisma.category.create({ data: category });
      console.log(`Kategoriya yaratildi: ${category.name}`);
    }
  }
  console.log("Seed muvaffaqiyatli yakunlandi.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
