# ARVEN — Quiet Luxury Glassmorphism Storefront & Admin Dashboard

متجر **ARVEN** الإلكتروني المبني من الصفر بهوية **Quiet Luxury + Glassmorphism**، مع لوحة إدارة حقيقية محمية بـ Supabase Auth و Row Level Security، ورفع مباشر لصور المنتجات من الهاتف، ونظام شراء موثوق يمنح كل منتج رابط إحالة مستقلًا من قاعدة البيانات مباشرة دون الاعتماد على Edge Function `buy` القديمة.

---

## المعمارية التقنية

- **الواجهة الأمامية:** React 18 + TypeScript + Vite 5 + React Router v6.
- **نظام التصميم:** CSS Design Tokens مركزية (`tokens.css`, `glass.css`, `storefront.css`, `admin.css`) بدلًا من Tailwind لتوفير تحكم دقيق في تأثيرات `backdrop-filter` وبدائلها عبر `@supports not`, ودعم كامل لـ RTL/LTR و `prefers-reduced-motion` وحجم حزمة أصغر دون تعقيدات إعداد PostCSS.
- **قاعدة البيانات والمصادقة والتخزين:** Supabase PostgreSQL + Supabase Auth + Supabase Storage (`product-images`) + Row Level Security (RLS).
- **الاستضافة المتوافقة:** Vercel (`vercel.json`) أو Netlify / Cloudflare Pages (`public/_redirects`).

---

## نظام الشراء المستقل والأمان

- كل منتج يُحفظ في `public.products` بسجل مستقل وعمود `purchase_url` مستقل.
- زر الشراء (`src/components/PurchaseButton.tsx`) يستخدم عنصر `<a href="..." target="_blank" rel="noopener noreferrer">` حقيقي مرتبط مباشرة بسجل المنتج نفسه، بدون `window.open` وبدون Edge Function `buy` القديمة.
- يتم التحقق من البروتوكول (`https:` أو `http:` فقط) ورفض `javascript:` والروابط المكسورة وروابط `/functions/v1/buy` القديمة.
- **توضيح أمني شفاف:** لأن الرابط يُقرأ مباشرة في الواجهة، فهو مرئي تقنيًا في أدوات المطور وطلبات الشبكة (وليس مخفيًا على مستوى الخادم). إذا احتجت مستقبلًا لإخفاء رابط الإحالة عن المتصفح في نسخة لاحقة، سيتطلب ذلك نقطة تحويل مستقلة على الخادم (Server Redirect) تختبرها بالكامل بدل العودة لوظيفة `buy` القديمة.

---

## ملفات قاعدة البيانات (`supabase/`)

1. `supabase/00_inspect_existing_schema.sql` — فحص آمن للقراءة فقط قبل التعديل لمعرفة بنية `public.products` الحالية والسياسات القديمة.
2. `supabase/01_schema_and_migration.sql` — إنشاء/ترحيل آمن غير هدّام لجداول `admin_users`, `products`, `store_settings` دون حذف أي بيانات موجودة.
3. `supabase/02_rls_and_storage.sql` — تفعيل RLS وسياسات الصلاحيات الصارمة لقاعدة البيانات وحاوية الصور `product-images`.
4. `supabase/03_seed_admin.sql` — منح صلاحية المدير لحساب `ahmedashaer84@gmail.com` الموجود في `auth.users` دون تخزين أي كلمة مرور في الكود.

---

## التشغيل المحلي (عند توفر Node.js 18+)

```bash
cp .env.example .env
# أضف VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY داخل .env
npm install
npm run typecheck
npm test
npm run build
npm run dev
```

راجع `DEPLOYMENT_ANDROID_GUIDE.md` لخطوات النشر الكاملة من هاتف Android، وراجع `TESTING_REPORT.md` لتقرير الاختبارات الصادق.
