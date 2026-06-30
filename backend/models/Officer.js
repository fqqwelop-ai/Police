const mongoose = require('mongoose');

const OfficerSchema = new mongoose.Schema({
  discordId: { type: String, required: true, unique: true, index: true },
  username: { type: String, required: true },
  avatar: { type: String, default: null },
  badgeNumber: { type: String, default: null },
  rank: { type: mongoose.Schema.Types.ObjectId, ref: 'Rank', default: null },
  points: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'suspended', 'fired', 'vacation'], default: 'active' },
  joinDate: { type: Date, default: Date.now },
  notes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Officer', OfficerSchema);
