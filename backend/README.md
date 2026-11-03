# LUANHUNG SHOP API backend

This Next.js app contains the API route handlers and SQLite database. The storefront and admin UI are in the sibling `frontend/` app.

From the repository root, start both apps with:

```sh
npm install
npm run dev
```

The backend listens on `http://localhost:4000`; the frontend listens on `http://localhost:3000` and proxies `/api/*` requests and `/uploads/*` images to it. To start only the backend, run `npm run dev:backend` from the repository root.

SQLite data is stored in `backend/data/luanhung.sqlite` by default. Set `SQLITE_DATABASE_PATH` to use another location. Uploaded images are stored in `backend/uploads/`.

To import brands, categories, and products from `legacy-data/luanhung-export.sql`, run `npm --workspace backend run import-legacy-sql` from the repository root. The import is repeatable, updates matching catalog entries by slug, and preserves existing product stock.

SMTP, bank-transfer details, VNPay, and MoMo settings belong in `backend/.env.local`; see `.env.example`. Admins confirm shipping fees before payment instructions or online payment links are provided. Online payments require valid gateway credentials and public callback URLs.
