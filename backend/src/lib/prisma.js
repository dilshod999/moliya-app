const { PrismaClient } = require("@prisma/client");

// Reuse a single PrismaClient instance across the app (avoids exhausting
// Neon's connection pool during development hot-reloads).
const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
