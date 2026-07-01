/**
 * سكربت تعبئة الرتب دفعة وحدة
 * ═══════════════════════════════════════════
 * ⚠️ مهم جداً قبل التشغيل:
 * القائمة اللي وصلتني كانت متشابكة (أكواد + IDs ملزّقة ببعض)،
 * فبعض المعرفات هنا "أفضل تخمين" مو مؤكدة 100%.
 * راجع عمود discordRoleId لكل رتبة من روم الرولات بسيرفرك
 * (Server Settings → Roles → انسخ ID كل رول) قبل ما تشغل السكربت.
 *
 * طريقة التشغيل (من داخل مجلد backend، على جهازك أو من Railway Console):
 *   node scripts/seedRanks.js
 *
 * السكربت يحذف الرتب القديمة كلها ويعبي القائمة من جديد بالترتيب.
 * إذا ما تبي حذف رتبك الحالية، احذف سطر "Rank.deleteMany" تحت.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Rank = require('../models/Rank');

// level 1 = أعلى رتبة، الأرقام تزيد كل ما نزلت الرتبة
const RANKS = [
  { level: 1,  name: 'Head Trooper',                          discordRoleId: '507191238970048554' },
  { level: 2,  name: 'Asst. Head Trooper',                     discordRoleId: '600473853273047056' },
  { level: 3,  name: 'SAHP Chief',                              discordRoleId: '462359723270733826' },
  { level: 4,  name: 'LSPD Chief',                              discordRoleId: '708104964559470714' },
  { level: 5,  name: 'Police Administration',                  discordRoleId: '894279679962398770' },
  { level: 6,  name: 'Colonel',                                 discordRoleId: '1107071123738333224' }, // ⚠️ راجع: كان فيه 3 IDs مرتبطة (A-1/A-2/A-3)
  { level: 7,  name: 'Swat Commander',                          discordRoleId: '476987159425843201' },
  { level: 8,  name: 'Swat Supervisor',                         discordRoleId: '865287001308528702' },
  { level: 9,  name: 'Head Of Internal Affairs',                discordRoleId: '681531349064089601' },
  { level: 10, name: 'Deputy Head Of Internal Affairs',         discordRoleId: '722584058428784764' },
  { level: 11, name: 'Management Of Internal Affairs',          discordRoleId: '613271329642250240' },
  { level: 12, name: 'Supervisor Of Internal Affairs',          discordRoleId: '705135797845622865' },
  { level: 13, name: 'Head Of Police Academy',                  discordRoleId: '718934822390857738' },
  { level: 14, name: 'Management Of Police Academy',            discordRoleId: '906474876737552424' },
  { level: 15, name: 'Supervisor Of Police Academy',             discordRoleId: '620674374030065684' }, // ⚠️ راجع: رقم ملزّق بالنص الأصلي
  { level: 16, name: 'Wings Commander',                          discordRoleId: '487322410421583872' },
  { level: 17, name: 'Deputy Wings Commander',                   discordRoleId: '992005214473293915' },
  { level: 18, name: 'Police Wings Management',                  discordRoleId: '797917726228217917' }, // ⚠️ راجع
  { level: 19, name: 'CID Director',                             discordRoleId: '455959524780670976' },
  { level: 20, name: 'Deputy CID Director',                      discordRoleId: '357975670116319234' },
  { level: 21, name: 'Supervisor CID',                           discordRoleId: '1003351941948117073' },
];

// كل الرتب الـ21 هذي رتب تنظيمية للعرض بصفحة الهيكل القيادي فقط
// ما تعطي أي صلاحيات بالداشبورد — الصلاحيات محصورة بحساب واحد فقط عبر سكربت grantFullAccess.js
function defaultPermissions() {
  return { manageOfficers: false, manageRanks: false, reviewReports: false, reviewRequests: false, sendPoints: false };
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ متصل بقاعدة البيانات');

  await Rank.deleteMany({});
  console.log('🗑️  تم حذف الرتب القديمة');

  for (const r of RANKS) {
    await Rank.create({
      name: r.name,
      level: r.level,
      discordRoleId: r.discordRoleId,
      color: '#C9A24B',
      permissions: defaultPermissions(),
    });
    console.log(`  ➕ ${r.name}`);
  }

  console.log(`🎉 تم إنشاء ${RANKS.length} رتبة بنجاح`);
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('❌ خطأ:', err);
  process.exit(1);
});
