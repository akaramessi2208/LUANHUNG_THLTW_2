# LTWTW_LuanHung-24F

## Next.js frontend and backend

The `frontend/` Next.js application contains the storefront and admin interface. The separate `backend/` Next.js application provides the API and SQLite data for mecha model kits, build tools, and display accessories.

```sh
npm install
npm run dev
```

Open `http://localhost:3000`. The frontend proxies `/api/*` requests and uploaded images to the backend at `http://localhost:4000`; set `BACKEND_API_URL` in `frontend/.env.local` if the backend runs elsewhere. The backend uses `backend/data/luanhung.sqlite` by default, initializes its schema and sample mecha model products on first run, and keeps the local database out of Git. You can override the database path with `SQLITE_DATABASE_PATH`.

To run either app separately, use `npm run dev:frontend` or `npm run dev:backend` in separate terminals.

The frontend App Router lives under `frontend/src/app/`, with public pages grouped in `(shop)/` and the admin login grouped in `admin/(auth)/login/` without changing their URLs. Admin resources have separate routes for products, categories, brands, orders, pages, posts, topics, users, contacts, menus, banners, links, reviews, promotions, inventory, and website settings (for example `/admin/products`, `/admin/promotions`, `/admin/inventory`, and `/admin/settings`). Shared admin CRUD, API, and domain services live under `frontend/lib/` and `frontend/lib/services/`. Banners and links have SQLite storage and admin CRUD APIs.

The storefront includes product search/filtering, product details and related items, topic-filtered articles, cart and checkout, coupon validation, member profiles and order history, and cancellation of orders awaiting confirmation. Admin tools include catalog/content management, member account locking, order status history, website settings, promotions, and stock-in/stock-out records. All admin pages require an authenticated administrator.

Create the first administrator at `/admin/register`; the first Admin is created once and signed in automatically. After an Admin exists, the same page requires an Admin login and creates additional administrators from the users management screen. Alternatively, create an administrator from the repository root with:

```sh
npm run create-admin
```

The command prompts for an email and password. Admin management is at `/admin`; public routes include `/`, `/products`, `/articles`, `/contact`, `/cart`, `/checkout`, `/orders`, `/login`, `/register`, `/profile`, and `/forgot-password`.

Password reset codes are sent by SMTP. Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM` in `backend/.env.local` (see `backend/.env.example`) before using the OTP flow. For Gmail, use `smtp.gmail.com`, port `587`, your Gmail address as `SMTP_USER` and `SMTP_FROM`, and a Google App Password (not your normal Gmail password) as `SMTP_PASSWORD`; Google requires 2-Step Verification to create an App Password. If the OTP email still does not arrive, the usual cause is that the email account is using the regular Gmail password instead of an App Password, or the backend was not restarted after the `.env.local` change. Restart the backend after changing the file. Codes expire after 10 minutes, can be requested once per minute per email, and allow at most five attempts.

Manual bank-transfer instructions also support a QR code. Set `BANK_TRANSFER_QR_CODE` to a direct image URL in `backend/.env.local` if you want a custom QR; otherwise the app automatically generates a QR from the configured bank account and the order total.

To synchronize catalog data from the MySQL export in the repository-root `luanhung-export.sql` into SQLite, run `npm --workspace backend run import-legacy-sql -- ../luanhung-export.sql` from the repository root. The dump creates/uses the MySQL database `thltw-luanhung-24f`, but the application itself uses SQLite at `backend/data/luanhung.sqlite`; do not use the `.sql` file as `SQLITE_DATABASE_PATH`. The importer is safe to rerun: matching brands, categories, and products are updated by slug, existing product stock is preserved, and unrelated application records are untouched. It imports only those three catalog tables; the other legacy tables do not contain usable application data.

Checkout supports cash on delivery, bank transfer, VNPay, and MoMo. Configure bank account details and gateway credentials in `backend/.env.local` using `backend/.env.example`. The admin confirms the shipping fee before a bank transfer's payment instructions or an online gateway link becomes available. Gateway use also requires public backend/frontend callback URLs and valid sandbox or production credentials.

Build and run production:

```sh
npm run build
npm start
```

All active application pages, API handlers, database logic, and scripts use JavaScript/JSX for Next.js/Node.js. The repository-root `luanhung-export.sql` is not loaded automatically; use the importer above when you want to synchronize its catalog into the active SQLite database.
