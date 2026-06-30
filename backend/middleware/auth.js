const jwt = require('jsonwebtoken');
const Officer = require('../models/Officer');

// يتحقق من وجود توكن صالح في الكوكي
async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.session;
    if (!token) return res.status(401).json({ error: 'غير مسجل دخول' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const officer = await Officer.findById(payload.id).populate('rank');
    if (!officer) return res.status(401).json({ error: 'الحساب غير موجود' });
    if (officer.status === 'fired' || officer.status === 'suspended') {
      return res.status(403).json({ error: 'حسابك موقوف حالياً' });
    }

    req.officer = officer;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'الجلسة منتهية، سجّل دخول من جديد' });
  }
}

// يتحقق من صلاحية معينة بناءً على رتبة الضابط
function requirePermission(permission) {
  return (req, res, next) => {
    const rank = req.officer?.rank;
    if (!rank || !rank.permissions?.[permission]) {
      return res.status(403).json({ error: 'ليس لديك صلاحية لهذا الإجراء' });
    }
    next();
  };
}

module.exports = { requireAuth, requirePermission };
