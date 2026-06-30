const express = require('express');
const Rank = require('../models/Rank');
const { requireAuth, requirePermission } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const ranks = await Rank.find().sort({ level: 1 });
  res.json(ranks);
});

router.post('/', requireAuth, requirePermission('manageRanks'), async (req, res) => {
  try {
    const rank = await Rank.create(req.body);
    res.json(rank);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id', requireAuth, requirePermission('manageRanks'), async (req, res) => {
  const rank = await Rank.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!rank) return res.status(404).json({ error: 'الرتبة غير موجودة' });
  res.json(rank);
});

router.delete('/:id', requireAuth, requirePermission('manageRanks'), async (req, res) => {
  await Rank.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
