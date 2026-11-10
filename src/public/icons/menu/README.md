# آیکون‌های سه‌بعدی منو

این پوشه محل نگهداری آیکون‌های منوی کناری است. سایدبار و مودال «همه‌ی بخش‌ها»
آیکون هر بخش را از این مسیر می‌خوانند:

```
/icons/menu/{slug}.png
```

یعنی فایل‌های داخل `public/icons/menu/` مستقیماً از ریشه‌ی سایت سرو می‌شوند.

---

## چطور آیکون‌های خودم را جایگزین کنم؟

فقط کافی است فایل تصویری خودت را **با همان نام** در این پوشه بگذاری.
هیچ تغییری در کد لازم نیست — حتی نیازی به ری‌استارت نیست (در حالت dev).

| نام فایل | بخش | مسیر |
|---|---|---|
| `dashboard.png` | داشبورد | `/admin/dashboard` · `/user/dashboard` |
| `cases.png` | پرونده‌ها | `/admin/cases` |
| `tasks.png` | وظایف / ایجاد وظایف | `/admin/tasks` · `/user/tasks` |
| `archive.png` | بایگانی وظایف | `/admin/archive` · `/user/archive` |
| `taskroutine.png` | وظایف تکرارشونده | `/admin/taskroutine` · `/user/taskroutine` |
| `staffconversation.png` | گفتگوی کارکنان | `/admin/staffConversation` |
| `ticketarchive.png` | بایگانی تیکت | `/admin/Ticketarchive` · `/user/Ticketarchive` |
| `ticketsent.png` | تیکت ارسال شده | `/user/Ticketsent` |
| `ticketreceipt.png` | تیکت دریافت شده | `/user/Ticketreceipt` |
| `customer.png` | مشتری | `/admin/customer` · `/user/customer` |
| `customer-ranking.png` | رتبه‌بندی مشتریان | `/admin/customer-ranking` · `/user/customer-ranking` |
| `sales.png` | فروش | `/admin/sales` · `/user/sales` |
| `seasonal.png` | مشتریان فصلی | `/admin/seasonal` · `/user/seasonal` |
| `human-resources.png` | منابع انسانی | `/admin/human-resources` |
| `minutes.png` | صورت جلسه | `/admin/minutes` · `/user/minutes/` |
| `departments.png` | دپارتمان‌ها | `/admin/departments` |
| `users.png` | کاربران | `/admin/users` |
| `performance.png` | عملکرد | `/admin/performance` |
| `calendar.png` | تقویم | `/admin/calendar` · `/user/calendar` |
| `processes.png` | فرآیندها | `/user/processes` |

> نکته: `slug` همان **بخش آخر آدرس** با حروف کوچک است. چون درخت
> `admin` و `user` آیکون‌های یکسانی دارند، هر دو از یک فایل استفاده می‌کنند.

---

## مشخصات پیشنهادی تصویر

| مورد | مقدار |
|---|---|
| فرمت | `png` (شفاف) — اگر `webp` یا `svg` داری، پسوند را در `config/menu.ts` → `MENU_ICON_BASE`/`menuIconSrc` عوض کن |
| ابعاد | `256×256` (یا `512×512` برای رتینا) |
| پس‌زمینه | شفاف — کاشی رنگی داخل خود تصویر باشد |
| حاشیه‌ی داخلی | حدود ۶٪ از هر طرف، تا آیکون به لبه نچسبد |
| وزن بصری | سبک سه‌بعدی / براق / رنگی (آبی، زرد، نارنجی) |

سایدبار آیکون را در `28px` و مودال در `64px` نشان می‌دهد؛ پس جزئیات ریز
در اندازه‌ی کوچک گم می‌شوند — فرم‌های ساده و پرکنتراست بهتر دیده می‌شوند.

---

## اگر فایلی نبود چه می‌شود؟

هیچ خطایی رخ نمی‌دهد. کامپوننت `MenuIcon` در صورت خطای لود، به‌صورت
خودکار آیکون خطی (Lucide) همان بخش را با پس‌زمینه‌ی نیمه‌شفاف نشان می‌دهد.
پس می‌توانی آیکون‌ها را مرحله‌به‌مرحله اضافه کنی.

---

## فایل‌های مرتبط

- `src/config/menu.ts` — تعریف بخش‌ها، `iconSlug`، `description`، `group`
- `src/components/sidebar/MenuIcon.tsx` — بارگذاری تصویر + fallback
- `src/components/sidebar/Sidebar.tsx` — ریل کناری
- `src/components/sidebar/MenuLauncher.tsx` — مودال بزرگ همه‌ی بخش‌ها
