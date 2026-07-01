/**
 * سكربت منح صلاحيات كاملة لحساب واحد فقط
 * ═══════════════════════════════════════════
 * ينشئ رتبة خاصة "المدير العام" بصلاحيات كاملة (غير ظاهرة بالهيكل القيادي العام
 * لأنها بمستوى 0 فوق كل الرتب)، ويربطها حصرياً بمعرف الديسكورد المحدد تحت.
 *
 * أي حساب ثاني ما ياخذ صلاحيات إدارية إطلاقاً إلا هذا الحساب فقط.
 *
 * طريقة التشغيل (من Railway Console داخل مجلد backend):
 *   node scripts/grantFullAccess.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Rank = require('../models/Rank');
const Officer = require('../models/Officer');

// عدّل هذا المعرف لو تبي تغيّر الحساب صاحب الصلاحيات الكاملة
const OWNER_DISCORD_ID = '727844176015917146';

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ متصل بقاعدة البيانات');

  // أنشئ (أو حدّث) رتبة "المدير العام" بمستوى 0 وصلاحيات كاملة
  let ownerRank = await Rank.findOne({ name: 'المدير العام' });
  if (!ownerRank) {
    ownerRank = await Rank.create({
      name: 'المدير العام',
      level: 0,
      color: '#E63946',
      permissions: {
        manageOfficers: true,
        manageRanks: true,
        reviewReports: true,
        reviewRequests: true,
        sendPoints: true,
      },
    });
    console.log('➕ تم إنشاء رتبة "المدير العام"');
  } else {
    console.log('ℹ️  رتبة "المدير العام" موجودة مسبقاً');
  }

  // أنشئ الحساب لو ما كان موجود، أو حدّث رتبته لو كان موجود
  let officer = await Officer.findOne({ discordId: OWNER_DISCORD_ID });
  if (!officer) {
    officer = await Officer.create({
      discordId: OWNER_DISCORD_ID,
      username: 'المدير العام',
      rank: ownerRank._id,
    });
    console.log('➕ تم إنشاء حساب جديد وربطه برتبة المدير العام');
  } else {
    officer.rank = ownerRank._id;
    await officer.save();
    console.log('🔄 تم تحديث رتبة الحساب الموجود إلى المدير العام');
  }

  console.log('🎉 تم منح الصلاحيات الكاملة بنجاح لهذا الحساب فقط:', OWNER_DISCORD_ID);
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('❌ خطأ:', err);
  process.exit(1);
});
