const express = require("express");
const router = express.Router();
const { telegramAuth } = require("../middleware/telegramAuth");

// POST /api/auth/me — called once when the Mini App loads. The
// telegramAuth middleware already validated initData and upserted the
// user, so we just return it here.
router.get("/me", telegramAuth, (req, res) => {
  const user = req.user;
  res.json({
    id: user.id,
    telegramId: user.telegramId.toString(),
    firstName: user.firstName,
    username: user.username,
    currency: user.currency,
  });
});

module.exports = router;
