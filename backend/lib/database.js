import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
const globalDatabase = globalThis;
const schema = `
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  email_verified_at TEXT,
  password TEXT NOT NULL,
  address TEXT,
  remember_token TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  is_active INTEGER NOT NULL DEFAULT 1,
  deleted_at TEXT,
  created_at TEXT,
  updated_at TEXT
);
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status INTEGER NOT NULL DEFAULT 1,
  deleted_at TEXT,
  created_at TEXT,
  updated_at TEXT
);
CREATE TABLE IF NOT EXISTS brands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  image TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status INTEGER NOT NULL DEFAULT 1,
  deleted_at TEXT,
  created_at TEXT,
  updated_at TEXT
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  price NUMERIC NOT NULL,
  sale_price NUMERIC,
  description TEXT,
  image TEXT,
  qty INTEGER NOT NULL DEFAULT 0,
  status INTEGER NOT NULL DEFAULT 1,
  deleted_at TEXT,
  created_at TEXT,
  updated_at TEXT
);
CREATE TABLE IF NOT EXISTS topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id INTEGER REFERENCES topics(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status INTEGER NOT NULL DEFAULT 1,
  deleted_at TEXT,
  created_at TEXT,
  updated_at TEXT
);
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id INTEGER REFERENCES topics(id) ON DELETE SET NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  image TEXT,
  type TEXT NOT NULL DEFAULT 'post',
  description TEXT,
  detail TEXT,
  status INTEGER NOT NULL DEFAULT 1,
  deleted_at TEXT,
  created_at TEXT,
  updated_at TEXT
);
CREATE TABLE IF NOT EXISTS pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  content TEXT,
  status INTEGER NOT NULL DEFAULT 1,
  deleted_at TEXT,
  created_at TEXT,
  updated_at TEXT
);
CREATE TABLE IF NOT EXISTS menus (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id INTEGER REFERENCES menus(id) ON DELETE SET NULL,
  page_id INTEGER REFERENCES pages(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status INTEGER NOT NULL DEFAULT 1,
  deleted_at TEXT,
  created_at TEXT,
  updated_at TEXT
);
CREATE TABLE IF NOT EXISTS banners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  image TEXT,
  url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status INTEGER NOT NULL DEFAULT 1,
  deleted_at TEXT,
  created_at TEXT,
  updated_at TEXT
);
CREATE TABLE IF NOT EXISTS links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status INTEGER NOT NULL DEFAULT 1,
  deleted_at TEXT,
  created_at TEXT,
  updated_at TEXT
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  subtotal NUMERIC NOT NULL,
  shipping_fee NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cod',
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  payment_url TEXT,
  shipping_confirmed INTEGER NOT NULL DEFAULT 0,
  promotion_code TEXT,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  note TEXT,
  deleted_at TEXT,
  created_at TEXT,
  updated_at TEXT
);
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  unit_price NUMERIC NOT NULL,
  quantity INTEGER NOT NULL,
  line_total NUMERIC NOT NULL,
  created_at TEXT,
  updated_at TEXT
);
CREATE TABLE IF NOT EXISTS order_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT,
  changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS promotions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL DEFAULT 'fixed',
  discount_value NUMERIC NOT NULL,
  min_order NUMERIC NOT NULL DEFAULT 0,
  starts_at TEXT,
  ends_at TEXT,
  usage_limit INTEGER,
  usage_count INTEGER NOT NULL DEFAULT 0,
  status INTEGER NOT NULL DEFAULT 1,
  deleted_at TEXT,
  created_at TEXT,
  updated_at TEXT
);
CREATE TABLE IF NOT EXISTS stock_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  movement_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS app_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  reply_detail TEXT,
  status INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT,
  created_at TEXT,
  updated_at TEXT
);
CREATE TABLE IF NOT EXISTS product_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT NOT NULL,
  status INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT,
  created_at TEXT,
  updated_at TEXT
);
CREATE TABLE IF NOT EXISTS personal_access_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tokenable_type TEXT NOT NULL,
  tokenable_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  abilities TEXT,
  last_used_at TEXT,
  expires_at TEXT,
  created_at TEXT,
  updated_at TEXT
);
CREATE TABLE IF NOT EXISTS password_reset_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  code_hash TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS app_migrations (
  name TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS products_status_created_at_index ON products(status, created_at);
CREATE INDEX IF NOT EXISTS categories_status_sort_order_index ON categories(status, sort_order);
CREATE INDEX IF NOT EXISTS brands_status_sort_order_index ON brands(status, sort_order);
CREATE INDEX IF NOT EXISTS banners_status_sort_order_index ON banners(status, sort_order);
CREATE INDEX IF NOT EXISTS links_status_sort_order_index ON links(status, sort_order);
CREATE INDEX IF NOT EXISTS orders_status_created_at_index ON orders(status, created_at);
CREATE INDEX IF NOT EXISTS order_status_history_order_id_index ON order_status_history(order_id, created_at);
CREATE INDEX IF NOT EXISTS stock_movements_product_id_index ON stock_movements(product_id, created_at);
CREATE INDEX IF NOT EXISTS reviews_product_status_created_at_index ON product_reviews(product_id, status, created_at);
CREATE INDEX IF NOT EXISTS password_reset_codes_user_id_index ON password_reset_codes(user_id);
`;
function openDatabase() {
    const configuredPath = process.env.SQLITE_DATABASE_PATH;
    const databasePath = configuredPath
        ? path.resolve(/* turbopackIgnore: true */ process.cwd(), configuredPath)
        : path.join(process.cwd(), 'data', 'luanhung.sqlite');
    mkdirSync(path.dirname(databasePath), { recursive: true });
    const db = new DatabaseSync(databasePath);
    ensureSchema(db);
    seedSampleCatalog(db);
    return db;
}
function ensureSchema(db) {
    db.exec(schema);
    const userColumns = new Set(db.prepare('PRAGMA table_info(users)').all().map((column) => column.name));
    if (!userColumns.has('address')) db.exec('ALTER TABLE users ADD COLUMN address TEXT');
    if (!userColumns.has('is_active')) db.exec('ALTER TABLE users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1');
    const orderColumns = new Set(db.prepare('PRAGMA table_info(orders)').all().map((column) => column.name));
    if (!orderColumns.has('payment_url')) db.exec('ALTER TABLE orders ADD COLUMN payment_url TEXT');
    if (!orderColumns.has('shipping_confirmed')) db.exec('ALTER TABLE orders ADD COLUMN shipping_confirmed INTEGER NOT NULL DEFAULT 0');
    if (!orderColumns.has('promotion_code')) db.exec('ALTER TABLE orders ADD COLUMN promotion_code TEXT');
    if (!orderColumns.has('discount_amount')) db.exec('ALTER TABLE orders ADD COLUMN discount_amount NUMERIC NOT NULL DEFAULT 0');
}
function seedSampleCatalog(db) {
    const productCount = Number(db.prepare('SELECT COUNT(*) AS count FROM products').get()?.count || 0);
    if (productCount > 0)
        return;
    const now = timestamp();
    const categories = [
        ['Mô hình lắp ráp', 'mo-hinh-lap-rap'],
        ['Robot chiến đấu', 'robot-chien-dau'],
        ['Diorama & trưng bày', 'diorama-trung-bay'],
        ['Nhân vật & phi công', 'nhan-vat-phi-cong'],
        ['Phụ kiện mô hình', 'phu-kien-mo-hinh'],
        ['Dụng cụ lắp ráp', 'dung-cu-lap-rap'],
    ];
    const brands = [['Frame Works', 'frame-works'], ['Orbit Forge', 'orbit-forge'], ['Nova Assembly', 'nova-assembly']];
    const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (name, slug, sort_order, status, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)');
    categories.forEach(([name, slug], index) => insertCategory.run(name, slug, index + 1, now, now));
    const insertBrand = db.prepare('INSERT OR IGNORE INTO brands (name, slug, sort_order, status, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)');
    brands.forEach(([name, slug], index) => insertBrand.run(name, slug, index + 1, now, now));
    const categoryId = (slug) => Number(db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug)?.id);
    const brandId = (slug) => Number(db.prepare('SELECT id FROM brands WHERE slug = ?').get(slug)?.id);
    const products = [
        ['Mô hình robot trinh sát 1/144', 'astra-scout-frame-144', 'mo-hinh-lap-rap', 'frame-works', 590000, 520000, '/images/mecha-model-photo.jpg', 24, 'Mô hình robot lắp ráp tỉ lệ 1/144, phù hợp cho người sưu tầm và trưng bày.'],
        ['Mô hình robot chiến đấu 1/100', 'orion-vanguard-frame-100', 'robot-chien-dau', 'orbit-forge', 1490000, null, '/images/mecha-figure-photo.jpg', 18, 'Mô hình robot lắp ráp cỡ lớn tỉ lệ 1/100 với nhiều chi tiết tạo dáng.'],
        ['Mô hình robot tốc chiến màu đỏ', 'crimson-striker-unit', 'robot-chien-dau', 'nova-assembly', 1290000, 1150000, '/images/gunpla-rx78-model.jpg', 12, 'Mô hình robot lắp ráp phong cách cơ động, đi kèm phụ kiện tạo dáng.'],
        ['Mô hình robot hộ vệ màu trắng', 'aegis-guardian-frame', 'mo-hinh-lap-rap', 'frame-works', 1690000, null, '/images/gunpla-model-packed.jpg', 20, 'Mô hình robot hộ vệ lắp ráp với giáp lớn và các khớp chuyển động.'],
        ['Mô hình robot giáp hạng nặng', 'titan-heavy-armor-unit', 'robot-chien-dau', 'orbit-forge', 1890000, 1750000, '/images/gunpla-model-sprues.jpg', 35, 'Bộ mô hình robot lắp ráp nhiều chi tiết, dành cho người chơi có kinh nghiệm.'],
        ['Mô hình robot mini dễ lắp', 'pico-mini-mecha-chibi', 'nhan-vat-phi-cong', 'nova-assembly', 390000, null, '/images/gunpla-body-sprues.jpg', 35, 'Mô hình robot cỡ nhỏ với các chi tiết dễ lắp, phù hợp cho người mới bắt đầu.'],
        ['Buồng lái robot và phi công', 'frontier-pilot-pod', 'nhan-vat-phi-cong', 'frame-works', 450000, 410000, '/images/gunpla-internal-frame.jpg', 16, 'Bộ mô hình buồng lái và chi tiết khung trong dành để lắp ráp, trưng bày.'],
        ['Đế trưng bày mô hình robot', 'hangar-display-base', 'diorama-trung-bay', 'orbit-forge', 650000, null, '/images/gunpla-rx78-model.jpg', 20, 'Đế và bối cảnh trưng bày giúp tạo dáng cho mô hình robot.'],
        ['Bộ vũ khí và khớp nối robot', 'astra-weapon-pack', 'phu-kien-mo-hinh', 'nova-assembly', 290000, null, '/images/gunpla-parts.jpg', 35, 'Bộ phụ kiện gồm các chi tiết nhựa lắp rời cho mô hình robot.'],
        ['Bộ kìm cắt lắp ráp mô hình', 'model-craft-tool-set', 'dung-cu-lap-rap', 'frame-works', 340000, 310000, '/images/gunpla-sprue-cutter.jpg', 16, 'Kìm cắt chi tiết nhựa khỏi khung, phù hợp cho việc lắp ráp mô hình.'],
        ['Bộ đèn LED cho mô hình', 'nova-core-led-kit', 'phu-kien-mo-hinh', 'orbit-forge', 220000, null, '/images/gunpla-model-packed.jpg', 24, 'Bộ đèn LED mini cho buồng lái và đế trưng bày; cần tự lắp pin theo hướng dẫn.'],
        ['Bộ decal dán và đi nét mô hình', 'panel-line-decal-kit', 'dung-cu-lap-rap', 'nova-assembly', 180000, null, '/images/gunpla-decals.jpg', 18, 'Bộ decal tham khảo để trang trí, hoàn thiện bề mặt mô hình lắp ráp.'],
        ['Bộ khung nhựa robot nhiều màu', 'multicolor-robot-sprue-kit', 'mo-hinh-lap-rap', 'frame-works', 630000, null, '/images/gunpla-color-sprues.jpg', 15, 'Bộ chi tiết nhựa nhiều màu trên khung, phù hợp để lắp thành mô hình robot.'],
        ['Bộ khung xương robot lắp ráp', 'mecha-inner-frame-kit', 'mo-hinh-lap-rap', 'orbit-forge', 720000, null, '/images/gunpla-plastic-types.jpg', 20, 'Bộ khung trong và các chi tiết khớp robot dạng nhựa lắp rời.'],
        ['Bộ giáp robot trên khung nhựa', 'robot-armor-sprue-kit', 'mo-hinh-lap-rap', 'nova-assembly', 540000, null, '/images/gunpla-body-sprues.jpg', 16, 'Bộ chi tiết giáp robot còn trên khung nhựa, cần lắp ráp hoàn thiện.'],
        ['Hộp mô hình robot kèm decal', 'robot-kit-with-decals', 'mo-hinh-lap-rap', 'frame-works', 990000, null, '/images/gunpla-model-packed.jpg', 10, 'Bộ mô hình robot đóng hộp cùng các chi tiết lắp ráp và decal trang trí.'],
        ['Kìm cắt khung nhựa mô hình', 'model-sprue-cutter', 'dung-cu-lap-rap', 'orbit-forge', 185000, null, '/images/gunpla-sprue-cutter.jpg', 28, 'Kìm cắt chuyên dụng để tách chi tiết mô hình khỏi khung nhựa.'],
        ['Bộ chi tiết khớp nối robot', 'robot-joint-parts-set', 'phu-kien-mo-hinh', 'nova-assembly', 260000, null, '/images/gunpla-parts.jpg', 22, 'Bộ chi tiết nhựa và khớp nối thay thế cho mô hình robot lắp ráp.'],
    ];
    const insertProduct = db.prepare(`
    INSERT INTO products (category_id, brand_id, name, slug, price, sale_price, image, qty, description, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `);
    products.forEach(([name, slug, categorySlug, brandSlug, price, salePrice, image, qty, description]) => {
        insertProduct.run(categoryId(categorySlug), brandId(brandSlug), name, slug, price, salePrice, image, qty, description, now, now);
    });
}
function updateCatalogArtwork(db) {
    const migration = 'mecha-model-shop-v1';
    if (db.prepare('SELECT name FROM app_migrations WHERE name = ?').get(migration))
        return;
    const categories = [
        ['Mô hình lắp ráp', 'mo-hinh-lap-rap'],
        ['Robot chiến đấu', 'robot-chien-dau'],
        ['Diorama & trưng bày', 'diorama-trung-bay'],
        ['Nhân vật & phi công', 'nhan-vat-phi-cong'],
        ['Phụ kiện mô hình', 'phu-kien-mo-hinh'],
        ['Dụng cụ lắp ráp', 'dung-cu-lap-rap'],
    ];
    const brands = [['Frame Works', 'frame-works'], ['Orbit Forge', 'orbit-forge'], ['Nova Assembly', 'nova-assembly']];
    const products = [
        ['Astra Scout Frame 1/144', 'astra-scout-frame-144', 'mo-hinh-lap-rap', 'frame-works', 590000, 520000, '/images/mecha-aster.jpg', 24, 'Mô hình robot trinh sát tỉ lệ 1/144 với giáp xanh ngọc, khớp linh hoạt và bộ phụ kiện tay thay thế. Sản phẩm lắp ráp, chưa sơn.'],
        ['Orion Vanguard Frame 1/100', 'orion-vanguard-frame-100', 'robot-chien-dau', 'orbit-forge', 1490000, null, '/images/mecha-orion.jpg', 18, 'Khung robot chiến đấu tỉ lệ 1/100 với giáp xanh cobalt, khớp tạo dáng và khiên trưng bày. Sản phẩm lắp ráp, chưa sơn.'],
        ['Crimson Striker Unit', 'crimson-striker-unit', 'robot-chien-dau', 'nova-assembly', 1290000, 1150000, '/images/mecha-crimson.jpg', 12, 'Mẫu mecha cơ động màu đỏ cam, kèm hai lưỡi năng lượng và đế tạo dáng. Sản phẩm lắp ráp, chưa sơn.'],
        ['Aegis Guardian Frame', 'aegis-guardian-frame', 'mo-hinh-lap-rap', 'frame-works', 1690000, null, '/images/mecha-aegis.jpg', 20, 'Robot hộ vệ giáp trắng ngọc trai với khiên lớn và các khớp chuyển động. Sản phẩm lắp ráp, chưa sơn.'],
        ['Titan Heavy Armor Unit', 'titan-heavy-armor-unit', 'robot-chien-dau', 'orbit-forge', 1890000, 1750000, '/images/mecha-titan.jpg', 35, 'Mô hình robot hạng nặng với giáp vai mở rộng, ba lô động cơ và phụ kiện vũ khí. Sản phẩm lắp ráp, chưa sơn.'],
        ['Pico Mini Mecha Chibi', 'pico-mini-mecha-chibi', 'nhan-vat-phi-cong', 'nova-assembly', 390000, null, '/images/mecha-pico.jpg', 35, 'Robot mini phong cách dễ thương, ít chi tiết, phù hợp làm quen với mô hình lắp ráp.'],
        ['Frontier Pilot & Pod', 'frontier-pilot-pod', 'nhan-vat-phi-cong', 'frame-works', 450000, 410000, '/images/mecha-pilot.jpg', 16, 'Buồng lái trưng bày cùng nhân vật phi công nguyên bản và bảng điều khiển chi tiết.'],
        ['Hangar Display Base', 'hangar-display-base', 'diorama-trung-bay', 'orbit-forge', 650000, null, '/images/mecha-hangar.jpg', 20, 'Đế trưng bày dạng nhà chứa máy bay không gian, có sàn kỹ thuật và bảng tên tùy chỉnh.'],
        ['Astra Weapon Pack', 'astra-weapon-pack', 'phu-kien-mo-hinh', 'nova-assembly', 290000, null, '/images/mecha-parts.jpg', 35, 'Bộ phụ kiện gồm kiếm, khiên nhỏ, bàn tay thay thế và khớp nối tương thích với dòng Frame.'],
        ['Model Craft Tool Set', 'model-craft-tool-set', 'dung-cu-lap-rap', 'frame-works', 340000, 310000, '/images/mecha-tools.jpg', 16, 'Bộ dụng cụ cơ bản cho người chơi mô hình: kìm cắt, dũa mịn và nhíp gắp chi tiết.'],
        ['Nova Core LED Kit', 'nova-core-led-kit', 'phu-kien-mo-hinh', 'orbit-forge', 220000, null, '/images/mecha-led.jpg', 24, 'Bộ đèn LED mini cho buồng lái và đế trưng bày; cần tự lắp pin theo hướng dẫn.'],
        ['Panel Line & Decal Kit', 'panel-line-decal-kit', 'dung-cu-lap-rap', 'nova-assembly', 180000, null, '/images/mecha-decals.jpg', 18, 'Bộ bút tạo đường panel và decal họa tiết nguyên bản giúp hoàn thiện mô hình.'],
    ];
    db.exec('BEGIN IMMEDIATE');
    try {
        const now = timestamp();
        const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (name, slug, sort_order, status, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)');
        const insertBrand = db.prepare('INSERT OR IGNORE INTO brands (name, slug, sort_order, status, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)');
        categories.forEach(([name, slug], index) => insertCategory.run(name, slug, index + 1, now, now));
        brands.forEach(([name, slug], index) => insertBrand.run(name, slug, index + 1, now, now));
        const categoryId = (slug) => Number(db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug)?.id);
        const brandId = (slug) => Number(db.prepare('SELECT id FROM brands WHERE slug = ?').get(slug)?.id);
        const oldProductSlugs = [
            'ao-dau-bong-da-pro-do', 'ao-bong-da-soc-xanh-trang', 'giay-da-bong-speed-fg', 'giay-da-bong-control-tf',
            'quan-da-bong-flex-training', 'bong-da-pro-match-size-5', 'tat-da-bong-grip-pro', 'ao-tap-bong-da-training-neon',
            'giay-da-bong-classic-fg', 'bong-da-li-ning-match-size-5', 'gang-tay-thu-mon-force-1000', 'bao-ve-ong-dong-pro',
        ];
        db.prepare(`UPDATE products SET deleted_at = ?, updated_at = ? WHERE slug IN (${oldProductSlugs.map(() => '?').join(', ')}) AND deleted_at IS NULL`)
            .run(now, now, ...oldProductSlugs);
        const oldCategorySlugs = ['ao-bong-da', 'giay-da-bong', 'quan-da-bong', 'tat-da-bong', 'bong-da', 'phu-kien-bong-da'];
        db.prepare(`UPDATE categories SET deleted_at = ?, updated_at = ? WHERE slug IN (${oldCategorySlugs.map(() => '?').join(', ')}) AND deleted_at IS NULL`)
            .run(now, now, ...oldCategorySlugs);
        const oldBrandSlugs = ['nike', 'adidas', 'puma'];
        db.prepare(`UPDATE brands SET deleted_at = ?, updated_at = ? WHERE slug IN (${oldBrandSlugs.map(() => '?').join(', ')}) AND deleted_at IS NULL`)
            .run(now, now, ...oldBrandSlugs);
        const insertProduct = db.prepare(`
      INSERT OR IGNORE INTO products (category_id, brand_id, name, slug, price, sale_price, image, qty, description, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `);
        for (const [name, slug, categorySlug, brandSlug, price, salePrice, image, qty, description] of products) {
            insertProduct.run(categoryId(categorySlug), brandId(brandSlug), name, slug, price, salePrice, image, qty, description, now, now);
        }
        const topics = [
            ['Hướng dẫn lắp ráp', 'huong-dan-lap-rap'],
            ['Trưng bày mô hình', 'trung-bay-mo-hinh'],
            ['Kỹ thuật sơn & hoàn thiện', 'ky-thuat-son-hoan-thien'],
        ];
        const insertTopic = db.prepare('INSERT OR IGNORE INTO topics (name, slug, sort_order, status, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)');
        topics.forEach(([name, slug], index) => insertTopic.run(name, slug, index + 1, now, now));
        const articles = [
            ['Cách bắt đầu lắp ráp mô hình mecha', 'bat-dau-lap-rap-mo-hinh-mecha', 1, 'Bộ dụng cụ cơ bản và cách làm việc gọn gàng.', 'Kìm cắt, nhíp và dũa mịn là bộ dụng cụ cơ bản cho người mới. Tách chi tiết khỏi khung nhựa nhẹ tay, xử lý phần thừa bằng dũa và thử khớp trước khi lắp hoàn chỉnh. Làm chậm theo từng bước giúp hạn chế xước hoặc gãy chi tiết.'],
            ['Chọn tỉ lệ mô hình phù hợp với kệ trưng bày', 'chon-ti-le-mo-hinh-phu-hop', 2, 'Cân nhắc kích thước mô hình và không gian sẵn có.', 'Mô hình cỡ nhỏ phù hợp bàn làm việc và bộ sưu tập nhiều mẫu. Tỉ lệ lớn có nhiều chi tiết và khả năng tạo dáng hơn nhưng cần thêm diện tích. Hãy đo kệ trưng bày trước khi chọn, đồng thời chừa khoảng trống cho đế và phụ kiện.'],
            ['Tạo đường panel và hoàn thiện mô hình', 'tao-duong-panel-hoan-thien-mo-hinh', 3, 'Một vài bước hoàn thiện dễ thực hiện.', 'Làm sạch bụi trên chi tiết trước khi tô đường panel. Dùng lượng mực vừa phải, lau phần thừa theo hướng dẫn của sản phẩm và để khô hoàn toàn. Nếu sơn phủ, hãy thử trên chi tiết thừa và làm việc ở nơi thông thoáng.'],
            ['Bảo quản mô hình để hạn chế bụi và phai màu', 'bao-quan-mo-hinh-trung-bay', 2, 'Giữ bộ sưu tập sạch đẹp lâu hơn.', 'Ưu tiên tủ kính hoặc hộp trưng bày, tránh nắng trực tiếp và nguồn nhiệt. Dùng cọ mềm để phủi bụi định kỳ, tháo phụ kiện rời trước khi di chuyển và kiểm tra khớp sau thời gian dài trưng bày.'],
            ['Lắp ráp an toàn với chi tiết nhỏ và dụng cụ cắt', 'lap-rap-mo-hinh-an-toan', 1, 'Giữ bàn làm việc an toàn khi lắp ráp.', 'Làm việc trên thảm cắt, hướng lưỡi kìm ra xa tay và cất chi tiết nhỏ khỏi trẻ em. Không dùng lực quá mạnh với khớp nhựa; nếu chi tiết chưa khớp, hãy kiểm tra đúng chiều thay vì ép vào.'],
        ];
        const updateArticle = db.prepare('UPDATE posts SET topic_id = ?, title = ?, slug = ?, image = ?, description = ?, detail = ?, updated_at = ? WHERE id = ?');
        const insertArticle = db.prepare(`
      INSERT OR IGNORE INTO posts (topic_id, title, slug, image, type, description, detail, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'post', ?, ?, 1, ?, ?)
    `);
        for (const [index, [title, slug, topicId, description, detail]] of articles.entries()) {
            const oldId = index + 1;
            const existing = db.prepare('SELECT id FROM posts WHERE id = ? AND type = ? AND deleted_at IS NULL').get(oldId, 'post');
            if (existing) {
                updateArticle.run(topicId, title, slug, '/images/mecha-hangar.jpg', description, detail, now, oldId);
            }
            else {
                insertArticle.run(topicId, title, slug, '/images/mecha-hangar.jpg', description, detail, now, now);
            }
        }
        const pages = [
            ['Giới thiệu LUANHUNG SHOP', 'gioi-thieu-mechalab', 'Không gian dành cho người yêu mô hình robot lắp ráp.', 'LUANHUNG SHOP tuyển chọn mô hình mecha nguyên bản, phụ kiện lắp ráp và đồ trưng bày cho người chơi ở nhiều cấp độ. Thiết kế trên website là sản phẩm minh họa nguyên bản.'],
            ['Chính sách giao hàng', 'chinh-sach-giao-hang', 'Thông tin đóng gói và giao hàng mô hình.', 'Sản phẩm mô hình được đóng gói cẩn thận để hạn chế va đập trong quá trình vận chuyển. Vui lòng kiểm tra kiện hàng khi nhận.'],
            ['Chính sách đổi trả', 'chinh-sach-doi-tra', 'Hướng dẫn hỗ trợ đổi trả sản phẩm.', 'Vui lòng liên hệ cửa hàng khi sản phẩm bị thiếu hoặc hư hỏng trong quá trình giao nhận. Giữ lại bao bì và hình ảnh kiện hàng để được hỗ trợ.'],
        ];
        const updatePage = db.prepare('UPDATE pages SET title = ?, slug = ?, description = ?, content = ?, updated_at = ? WHERE id = ?');
        for (const [index, [title, slug, description, content]] of pages.entries()) {
            const id = index + 1;
            const exists = db.prepare('SELECT id FROM pages WHERE id = ?').get(id);
            if (exists) {
                updatePage.run(title, slug, description, content, now, id);
                db.prepare('UPDATE menus SET name = ?, updated_at = ? WHERE page_id = ?').run(title, now, id);
            }
            else {
                db.prepare('INSERT INTO pages (title, slug, description, content, status, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?)').run(title, slug, description, content, now, now);
            }
        }
        db.prepare("DELETE FROM product_reviews WHERE name = 'Người mua mẫu (đánh giá minh họa)'").run();
        db.prepare('INSERT INTO app_migrations (name, applied_at) VALUES (?, ?)').run(migration, now);
        db.exec('COMMIT');
    }
    catch (error) {
        db.exec('ROLLBACK');
        throw error;
    }
}
function updateProductPhotos(db) {
    const migration = 'mecha-real-product-photos-v1';
    if (db.prepare('SELECT name FROM app_migrations WHERE name = ?').get(migration))
        return;
    const productPhotos = [
        ['astra-scout-frame-144', '/images/mecha-model-photo.jpg'],
        ['orion-vanguard-frame-100', '/images/gunpla-rx78-model.jpg'],
        ['crimson-striker-unit', '/images/mecha-model-photo.jpg'],
        ['aegis-guardian-frame', '/images/gunpla-rx78-model.jpg'],
        ['titan-heavy-armor-unit', '/images/mecha-model-photo.jpg'],
        ['pico-mini-mecha-chibi', '/images/gunpla-rx78-model.jpg'],
        ['frontier-pilot-pod', '/images/mecha-model-photo.jpg'],
        ['hangar-display-base', '/images/gunpla-rx78-model.jpg'],
        ['astra-weapon-pack', '/images/gunpla-parts.jpg'],
        ['model-craft-tool-set', '/images/gunpla-foot-assembly.jpg'],
        ['nova-core-led-kit', '/images/gunpla-internal-frame.jpg'],
        ['panel-line-decal-kit', '/images/gunpla-decals.jpg'],
    ];
    const now = timestamp();
    db.exec('BEGIN');
    try {
        const updateImage = db.prepare('UPDATE products SET image = ?, updated_at = ? WHERE slug = ? AND deleted_at IS NULL');
        for (const [slug, image] of productPhotos) {
            updateImage.run(image, now, slug);
        }
        db.prepare('INSERT INTO app_migrations (name, applied_at) VALUES (?, ?)').run(migration, now);
        db.exec('COMMIT');
    }
    catch (error) {
        db.exec('ROLLBACK');
        throw error;
    }
}
function updateProductCatalog(db) {
    const migration = 'mecha-product-expansion-v1';
    if (db.prepare('SELECT name FROM app_migrations WHERE name = ?').get(migration))
        return;
    const categories = {
        model: 'mo-hinh-lap-rap',
        combat: 'robot-chien-dau',
        accessories: 'phu-kien-mo-hinh',
        tools: 'dung-cu-lap-rap',
    };
    const brands = ['frame-works', 'orbit-forge', 'nova-assembly'];
    const newProducts = [
        ['Bộ khung xương robot lắp ráp', 'mecha-inner-frame-kit', categories.model, brands[1], 720000, null, '/images/gunpla-plastic-types.jpg', 20, 'Bộ khung trong và các chi tiết khớp robot dạng nhựa lắp rời.'],
        ['Bộ giáp robot trên khung nhựa', 'robot-armor-sprue-kit', categories.model, brands[2], 540000, null, '/images/gunpla-body-sprues.jpg', 16, 'Bộ chi tiết giáp robot còn trên khung nhựa, cần lắp ráp hoàn thiện.'],
        ['Hộp mô hình robot kèm decal', 'robot-kit-with-decals', categories.model, brands[0], 990000, null, '/images/gunpla-model-packed.jpg', 10, 'Bộ mô hình robot đóng hộp cùng các chi tiết lắp ráp và decal trang trí.'],
        ['Kìm cắt khung nhựa mô hình', 'model-sprue-cutter', categories.tools, brands[1], 185000, null, '/images/gunpla-sprue-cutter.jpg', 28, 'Kìm cắt chuyên dụng để tách chi tiết mô hình khỏi khung nhựa.'],
        ['Bộ chi tiết khớp nối robot', 'robot-joint-parts-set', categories.accessories, brands[2], 260000, null, '/images/gunpla-parts.jpg', 22, 'Bộ chi tiết nhựa và khớp nối thay thế cho mô hình robot lắp ráp.'],
        ['Bộ khung nhựa robot nhiều màu', 'multicolor-robot-sprue-kit', categories.model, brands[0], 630000, null, '/images/gunpla-color-sprues.jpg', 15, 'Bộ chi tiết nhựa nhiều màu trên khung, phù hợp để lắp thành mô hình robot.'],
    ];
    const namesAndPhotos = [
        ['astra-scout-frame-144', 'Mô hình robot trinh sát 1/144', '/images/mecha-model-photo.jpg'],
        ['orion-vanguard-frame-100', 'Mô hình robot chiến đấu 1/100', '/images/mecha-figure-photo.jpg'],
        ['crimson-striker-unit', 'Mô hình robot tốc chiến màu đỏ', '/images/gunpla-rx78-model.jpg'],
        ['aegis-guardian-frame', 'Mô hình robot hộ vệ màu trắng', '/images/gunpla-model-sprues.jpg'],
        ['titan-heavy-armor-unit', 'Mô hình robot giáp hạng nặng', '/images/gunpla-internal-frame.jpg'],
        ['pico-mini-mecha-chibi', 'Mô hình robot mini dễ lắp', '/images/gunpla-sprue-array.jpg'],
        ['frontier-pilot-pod', 'Buồng lái robot và phi công', '/images/gunpla-internal-frame.jpg'],
        ['hangar-display-base', 'Đế trưng bày mô hình robot', '/images/mecha-model-photo.jpg'],
        ['astra-weapon-pack', 'Bộ vũ khí và khớp nối robot', '/images/gunpla-parts.jpg'],
        ['model-craft-tool-set', 'Bộ kìm cắt lắp ráp mô hình', '/images/gunpla-foot-assembly.jpg'],
        ['nova-core-led-kit', 'Bộ đèn LED cho mô hình', '/images/gunpla-model-packed.jpg'],
        ['panel-line-decal-kit', 'Bộ decal dán và đi nét mô hình', '/images/gunpla-decals.jpg'],
    ];
    const now = timestamp();
    db.exec('BEGIN');
    try {
        const categoryId = (slug) => Number(db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug)?.id);
        const brandId = (slug) => Number(db.prepare('SELECT id FROM brands WHERE slug = ?').get(slug)?.id);
        const insertProduct = db.prepare(`
      INSERT OR IGNORE INTO products (category_id, brand_id, name, slug, price, sale_price, image, qty, description, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `);
        for (const [name, slug, categorySlug, brandSlug, price, salePrice, image, qty, description] of newProducts) {
            insertProduct.run(categoryId(categorySlug), brandId(brandSlug), name, slug, price, salePrice, image, qty, description, now, now);
        }
        const updateProduct = db.prepare('UPDATE products SET name = ?, image = ?, updated_at = ? WHERE slug = ? AND deleted_at IS NULL');
        for (const [slug, name, image] of namesAndPhotos) {
            updateProduct.run(name, image, now, slug);
        }
        db.prepare('INSERT INTO app_migrations (name, applied_at) VALUES (?, ?)').run(migration, now);
        db.exec('COMMIT');
    }
    catch (error) {
        db.exec('ROLLBACK');
        throw error;
    }
}
function updateArticleArtwork(db) {
    const migration = 'mecha-article-photography-v1';
    if (db.prepare('SELECT name FROM app_migrations WHERE name = ?').get(migration))
        return;
    const now = timestamp();
    const articleImages = [
        ['bat-dau-lap-rap-mo-hinh-mecha', '/images/gunpla-model-sprues.jpg', 'huong-dan-lap-rap'],
        ['chon-ti-le-mo-hinh-phu-hop', '/images/gunpla-rx78-model.jpg', 'trung-bay-mo-hinh'],
        ['tao-duong-panel-hoan-thien-mo-hinh', '/images/gunpla-decals.jpg', 'ky-thuat-son-hoan-thien'],
        ['bao-quan-mo-hinh-trung-bay', '/images/mecha-figure-photo.jpg', 'trung-bay-mo-hinh'],
        ['lap-rap-mo-hinh-an-toan', '/images/gunpla-sprue-cutter.jpg', 'huong-dan-lap-rap'],
    ];
    db.exec('BEGIN');
    try {
        const topics = [
            ['Hướng dẫn lắp ráp', 'huong-dan-lap-rap'],
            ['Trưng bày mô hình', 'trung-bay-mo-hinh'],
            ['Kỹ thuật sơn & hoàn thiện', 'ky-thuat-son-hoan-thien'],
        ];
        const upsertTopic = db.prepare(`
      INSERT INTO topics (name, slug, sort_order, status, created_at, updated_at)
      VALUES (?, ?, ?, 1, ?, ?)
      ON CONFLICT(slug) DO UPDATE SET name = excluded.name, status = 1, updated_at = excluded.updated_at
    `);
        topics.forEach(([name, slug], index) => upsertTopic.run(name, slug, index + 1, now, now));
        const updateArticle = db.prepare(`
      UPDATE posts SET
        image = CASE WHEN image IS NULL OR image = '' OR image = '/images/mecha-hangar.jpg' THEN ? ELSE image END,
        topic_id = (SELECT id FROM topics WHERE slug = ?),
        updated_at = ?
      WHERE slug = ? AND type = 'post'
    `);
        for (const [slug, image, topicSlug] of articleImages) {
            updateArticle.run(image, topicSlug, now, slug);
        }
        db.prepare('INSERT INTO app_migrations (name, applied_at) VALUES (?, ?)').run(migration, now);
        db.exec('COMMIT');
    }
    catch (error) {
        db.exec('ROLLBACK');
        throw error;
    }
}
function repairCatalogImagePaths(db) {
    const migration = 'mecha-catalog-image-paths-v2';
    if (db.prepare('SELECT name FROM app_migrations WHERE name = ?').get(migration))
        return;
    const productImages = [
        ['astra-scout-frame-144', '/images/mecha-aster.jpg'],
        ['orion-vanguard-frame-100', '/images/mecha-orion.jpg'],
        ['crimson-striker-unit', '/images/mecha-crimson.jpg'],
        ['aegis-guardian-frame', '/images/mecha-aegis.jpg'],
        ['titan-heavy-armor-unit', '/images/mecha-titan.jpg'],
        ['pico-mini-mecha-chibi', '/images/mecha-pico.jpg'],
        ['frontier-pilot-pod', '/images/mecha-figure-photo.jpg'],
        ['hangar-display-base', '/images/mecha-hangar.jpg'],
        ['astra-weapon-pack', '/images/mecha-parts.jpg'],
        ['model-craft-tool-set', '/images/mecha-tools.jpg'],
        ['nova-core-led-kit', '/images/mecha-led.jpg'],
        ['panel-line-decal-kit', '/images/mecha-decals.jpg'],
        ['robot-joint-parts-set', '/images/mecha-parts.jpg'],
        ['robot-kit-with-decals', '/images/mecha-figure-photo.jpg'],
        ['robot-armor-sprue-kit', '/images/mecha-crimson.jpg'],
        ['mecha-inner-frame-kit', '/images/mecha-aegis.jpg'],
        ['model-sprue-cutter', '/images/mecha-tools.jpg'],
        ['multicolor-robot-sprue-kit', '/images/mecha-aster.jpg'],
    ];
    const now = timestamp();
    db.exec('BEGIN IMMEDIATE');
    try {
        const updateProduct = db.prepare('UPDATE products SET image = ?, updated_at = ? WHERE slug = ?');
        for (const [slug, image] of productImages) {
            updateProduct.run(image, now, slug);
        }
        const articleImages = [
            ['bat-dau-lap-rap-mo-hinh-mecha', '/images/mecha-model-photo.jpg'],
            ['chon-ti-le-mo-hinh-phu-hop', '/images/mecha-aster.jpg'],
            ['tao-duong-panel-hoan-thien-mo-hinh', '/images/mecha-decals.jpg'],
            ['bao-quan-mo-hinh-trung-bay', '/images/mecha-figure-photo.jpg'],
            ['lap-rap-mo-hinh-an-toan', '/images/mecha-tools.jpg'],
        ];
        const updateArticle = db.prepare("UPDATE posts SET image = ?, updated_at = ? WHERE slug = ? AND type = 'post'");
        for (const [slug, image] of articleImages) {
            updateArticle.run(image, now, slug);
        }
        db.prepare('INSERT INTO app_migrations (name, applied_at) VALUES (?, ?)').run(migration, now);
        db.exec('COMMIT');
    }
    catch (error) {
        db.exec('ROLLBACK');
        throw error;
    }
}
export function getDatabase() {
    if (!globalDatabase.luanhungDatabase) {
        globalDatabase.luanhungDatabase = openDatabase();
        updateCatalogArtwork(globalDatabase.luanhungDatabase);
        updateProductPhotos(globalDatabase.luanhungDatabase);
        updateProductCatalog(globalDatabase.luanhungDatabase);
        updateArticleArtwork(globalDatabase.luanhungDatabase);
        repairCatalogImagePaths(globalDatabase.luanhungDatabase);
    }
    ensureSchema(globalDatabase.luanhungDatabase);
    return globalDatabase.luanhungDatabase;
}
export function timestamp() {
    return new Date().toISOString().replace('T', ' ').slice(0, 19);
}
