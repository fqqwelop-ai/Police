const mongoose = require('mongoose');

const RankSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },       // اسم الرتبة
  level: { type: Number, required: true, unique: true },     // الترتيب الهرمي (1 = الأعلى)
  color: { type: String, default: '#D4A24C' },                // لون شارة الرتبة
  discordRoleId: { type: String, default: null },             // الرول المرتبط في ديسكورد
  minPoints: { type: Number, default: 0 },                    // أقل نقاط مطلوبة (اختياري)
  permissions: {
    manageOfficers: { type: Boolean, default: false },
    manageRanks: { type: Boolean, default: false },
    reviewReports: { type: Boolean, default: false },
    reviewRequests: { type: Boolean, default: false },
    sendPoints: { type: Boolean, default: false },
  },
}, { timestamps: true });

module.exports = mongoose.model('Rank', RankSchema);
