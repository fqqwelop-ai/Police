const express = require('express');
const Officer = require('../models/Officer');
const { requireAuth, requirePermission } = require('../middleware/auth');

const router = express.Router();

// بيانات الضابط الحالي
router.get('/me', requireAuth, (req, res) => {
  res.json(req.officer);
});

// قائمة كل الضباط
router.get('/', requireAuth, async (req, res) => {
  const officers = await Officer.find().populate('rank').sort({ points: -1 });
  res.json(officers);
});

// تعديل نقاط ضابط (إضافة أو خصم)
router.patch('/:id/points', requireAuth, requirePermission('sendPoints'), async (req, res) => {
  const { amount, reason } = req.body;
  if (typeof amount !== 'number') return res.status(400).json({ error: 'القيمة يجب أن تكون رقم' });

  const officer = await Officer.findById(req.params.id);
  if (!officer) return res.status(404).json({ error: 'الضابط غير موجود' });

  officer.points = Math.max(0, officer.points + amount);
  await officer.save();
  res.json({ ok: true, officer, reason: reason || null });
});

// تغيير رتبة ضابط
router.patch('/:id/rank', requireAuth, requirePermission('manageOfficers'), async (req, res) => {
  const { rankId } = req.body;
  const officer = await Officer.findByIdAndUpdate(req.params.id, { rank: rankId }, { new: true }).populate('rank');
  if (!officer) return res.status(404).json({ error: 'الضابط غير موجود' });
  res.json(officer);
});

// تغيير حالة ضابط (نشط / موقوف / مفصول / إجازة)
router.patch('/:id/status', requireAuth, requirePermission('manageOfficers'), async (req, res) => {
  const { status } = req.body;
  const valid = ['active', 'suspended', 'fired', 'vacation'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'حالة غير صالحة' });

  const officer = await Officer.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate('rank');
  if (!officer) return res.status(404).json({ error: 'الضابط غير موجود' });
  res.json(officer);
});

module.exports = router;
