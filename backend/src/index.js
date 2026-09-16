require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const authRoutes = require("./routes/auth");
const categoriesRoutes = require("./routes/categories");
const transactionsRoutes = require("./routes/transactions");
const statsRoutes = require("./routes/stats");
const usersRoutes = require("./routes/users");
const adminRoutes = require("./routes/admin");
const exportRoutes = require("./routes/export");

// Starting the bot here (instead of only inside bot.js) makes sure
// `node src/index.js` boots both the API and the Telegram bot together.
require("./bot");

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
  })
);
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/export", exportRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Server xatosi", details: err.message });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Backend server ${PORT}-portda ishga tushdi`);
});
