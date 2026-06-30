# نظام الشرطة — Police Management System

موقع + بوت ديسكورد + داشبورد لإدارة قسم شرطة (رتب، نقاط، تقارير، طلبات).

## الهيكل
```
police-system/
├── backend/      → يُرفع على Railway (API + بوت ديسكورد في خدمة واحدة)
└── frontend/     → يُرفع على Netlify (صفحة دخول + داشبورد)
```

## خطوات التشغيل

### 1) Discord Developer Portal
- أنشئ تطبيق جديد → فعّل Bot، خذ `DISCORD_BOT_TOKEN`
- من تبويب OAuth2 خذ `DISCORD_CLIENT_ID` و `DISCORD_CLIENT_SECRET`
- أضف Redirect URI: `https://رابط-الباكند-على-Railway/auth/discord/callback`
- Scopes عند الدعوة: `bot`, `applications.commands`
- صلاحيات البوت المطلوبة: إدارة الرولات (Manage Roles) + إرسال رسائل

### 2) MongoDB Atlas
- أنشئ Cluster مجاني وخذ رابط `MONGO_URI`

### 3) Railway (الباكند)
- ارفع مجلد `backend/`
- ضيف متغيرات البيئة من `.env.example`
- بعد أول تشغيل، استخدم API لإنشاء أول رتبة بصلاحيات كاملة (manageOfficers, manageRanks, reviewReports, reviewRequests, sendPoints) عشان تقدر تدخل كأدمن — أو ضيفها يدوياً في قاعدة البيانات وعيّنها لنفسك.

### 4) Netlify (الفرونت اند)
- ارفع مجلد `frontend/`
- عدّل `js/config.js` وحط رابط الباكند الصحيح
- عدّل `FRONTEND_URL` في إعدادات Railway ليطابق رابط Netlify

### 5) أوامر البوت
- `/نقاط إضافة` `/نقاط خصم` `/نقاط عرض`
- `/رتبة تعيين`
- `/ملفي`

ملاحظة: صلاحية استخدام أوامر النقاط/الرتب في ديسكورد مبنية على `ADMIN_ROLE_IDS` في متغيرات البيئة (رولات الأدمن في السيرفر)، بينما صلاحيات الداشبورد مبنية على نظام الرتب الداخلي.

## أول دخول
أول شخص يسجل دخول يُنشأ تلقائياً بأقل رتبة موجودة. لازم تنشئ رتبة "قائد" أو ما شابه بكل الصلاحيات وتعيّنها يدوياً لنفسك من قاعدة البيانات في أول مرة فقط.
