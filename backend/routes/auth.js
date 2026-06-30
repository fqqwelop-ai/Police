const express = require('express');
const jwt = require('jsonwebtoken');
const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
const Officer = require('../models/Officer');
const Rank = require('../models/Rank');

const router = express.Router();

const {
  DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET,
  DISCORD_REDIRECT_URI,
  JWT_SECRET,
  FRONTEND_URL,
  REQUIRED_GUILD_ID,
} = process.env;

// الخطوة 1: تحويل المستخدم لصفحة دسكورد للموافقة
router.get('/discord', (req, res) => {
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: 'identify guilds',
  });
  res.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
});

// الخطوة 2: استقبال الكود وتبديله بتوكن، ثم إنشاء/تحديث الضابط
router.get('/discord/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.redirect(`${FRONTEND_URL}/index.html?error=no_code`);

  try {
    // تبديل الكود بتوكن وصول
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: DISCORD_REDIRECT_URI,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error('فشل الحصول على توكن الوصول');

    // جلب بيانات المستخدم
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const user = await userRes.json();

    // (اختياري) التحقق إن المستخدم عضو في سيرفر الشرطة
    if (REQUIRED_GUILD_ID) {
      const guildsRes = await fetch('https://discord.com/api/users/@me/guilds', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const guilds = await guildsRes.json();
      const isMember = Array.isArray(guilds) && guilds.some(g => g.id === REQUIRED_GUILD_ID);
      if (!isMember) return res.redirect(`${FRONTEND_URL}/index.html?error=not_member`);
    }

    // إنشاء الضابط إذا أول مرة، أو تحديث بياناته
    let officer = await Officer.findOne({ discordId: user.id });
    if (!officer) {
      const lowestRank = await Rank.findOne().sort({ level: -1 });
      officer = await Officer.create({
        discordId: user.id,
        username: `${user.username}`,
        avatar: user.avatar
          ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
          : null,
        rank: lowestRank?._id || null,
      });
    } else {
      officer.username = user.username;
      officer.avatar = user.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
        : officer.avatar;
      await officer.save();
    }

    const sessionToken = jwt.sign({ id: officer._id }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('session', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect(`${FRONTEND_URL}/dashboard.html`);
  } catch (err) {
    console.error('Discord OAuth error:', err);
    res.redirect(`${FRONTEND_URL}/index.html?error=oauth_failed`);
  }
});

// تسجيل الخروج
router.post('/logout', (req, res) => {
  res.clearCookie('session');
  res.json({ ok: true });
});

module.exports = router;
