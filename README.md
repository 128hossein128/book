# وب‌اپ «سایر آثار نویسنده»

وب‌اپ فارسی و راست‌به‌چپ برای انتخاب کتاب فعلی و تولید فهرست آثار قبلی، با پنل مدیریت کامل.

## امکانات

- صفحه عمومی بدون نیاز به ورود
- انتخاب کتاب فعلی
- روشن/خاموش کردن آثار «بسیج»
- خروجی مرتب و دکمه کپی
- پنل مدیر در `/admin`
- افزودن کتاب جدید
- تعیین نوع «عمومی / بسیج»
- ویرایش نام و نوع
- جابه‌جایی با Drag & Drop
- دکمه بالا/پایین برای موبایل
- حذف نرم (Soft Delete) و بازیابی
- ذخیره مشترک آنلاین برای همه کاربران با Supabase

## راه‌اندازی Supabase

1. در Supabase یک Project بسازید.
2. وارد **SQL Editor** شوید.
3. تمام محتوای فایل `supabase/schema.sql` را اجرا کنید.
4. از قسمت **Connect / API Keys** این دو مقدار را بردارید:
   - Project URL
   - Secret key (`sb_secret_...`)

> Secret key را هرگز داخل کد یا مرورگر قرار ندهید. این پروژه فقط در Route Handlerهای سرور از آن استفاده می‌کند.

## متغیرهای محیطی

فایل `.env.example` را ببینید. برای اجرای محلی یک `.env.local` بسازید:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
ADMIN_PASSWORD=یک-رمز-قوی
SESSION_SECRET=یک-رشته-تصادفی-حداقل-32-کاراکتر
```

برای ساخت `SESSION_SECRET` می‌توانید در ترمینال اجرا کنید:

```bash
openssl rand -base64 48
```

## اجرای محلی

```bash
npm install
npm run dev
```

سپس:

- سایت عمومی: `http://localhost:3000`
- پنل مدیر: `http://localhost:3000/admin`

## انتشار روی Vercel

### روش پیشنهادی: GitHub

1. پوشه پروژه را در یک Repository گیت‌هاب قرار دهید.
2. در Vercel روی **Add New Project** بزنید و Repository را Import کنید.
3. Vercel باید Framework را به صورت Next.js تشخیص دهد.
4. در **Project Settings → Environment Variables** چهار متغیر زیر را اضافه کنید:
   - `SUPABASE_URL`
   - `SUPABASE_SECRET_KEY`
   - `ADMIN_PASSWORD`
   - `SESSION_SECRET`
5. Deploy را اجرا کنید.
6. آدرس عمومی شما چیزی شبیه `project-name.vercel.app` خواهد بود.

بعد از تغییر Environment Variableها، Redeploy انجام دهید.

## نکته امنیتی

- کاربران مرورگر مستقیماً به Supabase دسترسی ندارند.
- Secret Key فقط سمت سرور است.
- مدیریت با کوکی HttpOnly امضاشده و رمز مدیر محافظت شده است.
- حذف کتاب‌ها دائمی نیست و از بخش حذف‌شده‌ها قابل بازیابی است.
