const express = require('express');
const Report = require('../models/Report');
const { requireAuth, requirePermission } = require('../middleware/auth');

const router = express.Router();

// تقديم تقرير جديد (أي ضابط)
router.post('/', requireAuth, async (req, res) => {
  const { type, title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'العنوان والمحتوى مطلوبين' });

  const report = await Report.create({
    officer: req.officer._id,
    type: type || 'يومي',
    title,
    content,
  });
  res.json(report);
});

// عرض كل التقارير (مع فلترة اختيارية بالحالة)
router.get('/', requireAuth, async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  // الضباط العاديين يشوفون تقاريرهم فقط، إلا إذا عندهم صلاحية المراجعة
  if (!req.officer.rank?.permissions?.reviewReports) {
    filter.officer = req.officer._id;
  }
  const reports = await Report.find(filter)
    .populate('officer', 'username avatar')
    .populate('reviewedBy', 'username')
    .sort({ createdAt: -1 });
  res.json(reports);
});

// مراجعة تقرير (قبول/رفض)
router.patch('/:id/review', requireAuth, requirePermission('reviewReports'), async (req, res) => {
  const { status, reviewNote } = req.body;
  if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'حالة غير صالحة' });

  const report = await Report.findByIdAndUpdate(
    req.params.id,
    { status, reviewNote: reviewNote || '', reviewedBy: req.officer._id },
    { new: true }
  ).populate('officer', 'username avatar');
  if (!report) return res.status(404).json({ error: 'التقرير غير موجود' });
  res.json(report);
});

module.exports = router;
