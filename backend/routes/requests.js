const express = require('express');
const Request = require('../models/Request');
const { requireAuth, requirePermission } = require('../middleware/auth');

const router = express.Router();

// تقديم طلب جديد - مفتوح بدون تسجيل دخول (مثل طلبات التجنيد)
router.post('/', async (req, res) => {
  const { type, applicantDiscordId, applicantUsername, answers } = req.body;
  if (!type || !applicantDiscordId || !applicantUsername) {
    return res.status(400).json({ error: 'بيانات الطلب ناقصة' });
  }

  const request = await Request.create({ type, applicantDiscordId, applicantUsername, answers: answers || [] });
  res.json(request);
});

// عرض الطلبات (يتطلب صلاحية مراجعة، أو يقدر المستخدم يشوف طلباته بمعرّفه)
router.get('/', requireAuth, async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (!req.officer.rank?.permissions?.reviewRequests) {
    filter.applicantDiscordId = req.officer.discordId;
  }
  const requests = await Request.find(filter)
    .populate('reviewedBy', 'username')
    .sort({ createdAt: -1 });
  res.json(requests);
});

// مراجعة طلب (قبول/رفض)
router.patch('/:id/review', requireAuth, requirePermission('reviewRequests'), async (req, res) => {
  const { status, reviewNote } = req.body;
  if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'حالة غير صالحة' });

  const request = await Request.findByIdAndUpdate(
    req.params.id,
    { status, reviewNote: reviewNote || '', reviewedBy: req.officer._id },
    { new: true }
  );
  if (!request) return res.status(404).json({ error: 'الطلب غير موجود' });
  res.json(request);
});

module.exports = router;
