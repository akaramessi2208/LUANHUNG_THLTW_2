import { createHash, randomBytes, randomInt } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { getDatabase, timestamp } from '@/lib/database';
import { getMissingSmtpSettings, isSmtpConfigured, sendPasswordResetEmail } from '@/lib/email';
import { createPaymentUrl, getBankTransferDetails, getPaymentMethods, isPaymentGatewayConfigured } from '@/lib/payments';
export class ApiError extends Error {
    status;
    errors;
    constructor(message, status = 400, errors) {
        super(message);
        this.status = status;
        this.errors = errors;
    }
}
const resourceMap = {
    banners: {
        table: 'banners',
        softDelete: true,
        fields: {
            title: { type: 'text', required: true, max: 255 },
            image: { type: 'text', max: 2048 },
            url: { type: 'text', max: 2048 },
            sort_order: { type: 'number' },
            status: { type: 'number' },
        },
        defaults: { status: 1, sort_order: 0 },
    },
    links: {
        table: 'links',
        softDelete: true,
        fields: {
            name: { type: 'text', required: true, max: 255 },
            url: { type: 'text', required: true, max: 2048 },
            sort_order: { type: 'number' },
            status: { type: 'number' },
        },
        defaults: { status: 1, sort_order: 0 },
    },
    categories: {
        table: 'categories',
        slug: 'name',
        softDelete: true,
        fields: {
            name: { type: 'text', required: true, max: 255 },
            parent_id: { type: 'nullable-number' },
            description: { type: 'text', max: 10000 },
            image: { type: 'text', max: 2048 },
            sort_order: { type: 'number' },
            status: { type: 'number' },
        },
        defaults: { status: 1, sort_order: 0 },
    },
    brands: {
        table: 'brands',
        slug: 'name',
        softDelete: true,
        fields: {
            name: { type: 'text', required: true, max: 255 },
            image: { type: 'text', max: 2048 },
            sort_order: { type: 'number' },
            status: { type: 'number' },
        },
        defaults: { status: 1, sort_order: 0 },
    },
    products: {
        table: 'products',
        slug: 'name',
        softDelete: true,
        fields: {
            name: { type: 'text', required: true, max: 255 },
            category_id: { type: 'nullable-number' },
            brand_id: { type: 'nullable-number' },
            price: { type: 'number', required: true },
            sale_price: { type: 'nullable-number' },
            description: { type: 'text', max: 20000 },
            image: { type: 'text', max: 2048 },
            qty: { type: 'number' },
            status: { type: 'number' },
        },
        defaults: { status: 1, qty: 0 },
    },
    topics: {
        table: 'topics',
        slug: 'name',
        softDelete: true,
        fields: {
            name: { type: 'text', required: true, max: 255 },
            parent_id: { type: 'nullable-number' },
            description: { type: 'text', max: 10000 },
            sort_order: { type: 'number' },
            status: { type: 'number' },
        },
        defaults: { status: 1, sort_order: 0 },
    },
    posts: {
        table: 'posts',
        slug: 'title',
        softDelete: true,
        fields: {
            title: { type: 'text', required: true, max: 255 },
            topic_id: { type: 'nullable-number' },
            image: { type: 'text', max: 2048 },
            description: { type: 'text', max: 255 },
            detail: { type: 'text', max: 50000 },
            status: { type: 'number' },
        },
        defaults: { status: 1, type: 'post' },
    },
    pages: {
        table: 'pages',
        slug: 'title',
        softDelete: true,
        fields: {
            title: { type: 'text', required: true, max: 255 },
            description: { type: 'text', max: 255 },
            content: { type: 'text', max: 50000 },
            status: { type: 'number' },
        },
        defaults: { status: 1 },
    },
    promotions: {
        table: 'promotions',
        softDelete: true,
        fields: {
            code: { type: 'text', required: true, max: 40 },
            discount_type: { type: 'text', required: true, max: 20 },
            discount_value: { type: 'number', required: true },
            min_order: { type: 'number' },
            starts_at: { type: 'text', max: 40 },
            ends_at: { type: 'text', max: 40 },
            usage_limit: { type: 'nullable-number' },
            status: { type: 'number' },
        },
        defaults: { discount_type: 'fixed', min_order: 0, usage_count: 0, status: 1 },
    },
    menus: {
        table: 'menus',
        softDelete: true,
        fields: {
            name: { type: 'text', required: true, max: 255 },
            url: { type: 'text', max: 2048 },
            parent_id: { type: 'nullable-number' },
            page_id: { type: 'nullable-number' },
            sort_order: { type: 'number' },
            status: { type: 'number' },
        },
        defaults: { status: 1, sort_order: 0 },
    },
};
const softResources = {
    users: 'users',
    orders: 'orders',
    contacts: 'contacts',
    reviews: 'product_reviews',
    ...Object.fromEntries(Object.entries(resourceMap).filter(([, resource]) => resource.softDelete).map(([name, resource]) => [name, resource.table])),
};
function json(data, status = 200) {
    return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}
function fail(message, status = 400, errors) {
    throw new ApiError(message, status, errors);
}
function queryRows(db, sql, ...params) {
    return db.prepare(sql).all(...params);
}
function queryRow(db, sql, ...params) {
    return db.prepare(sql).get(...params);
}
function slugify(input) {
    return input
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/gi, (letter) => letter === 'Đ' ? 'D' : 'd')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 180);
}
function validateInput(input, fields, creating) {
    const data = {};
    const errors = {};
    for (const [field, rule] of Object.entries(fields)) {
        if (!(field in input)) {
            if (creating && rule.required)
                errors[field] = [`${field} là bắt buộc.`];
            continue;
        }
        const value = input[field];
        if (value === null || value === '') {
            if (rule.type === 'nullable-number' || !rule.required) {
                data[field] = null;
                continue;
            }
            errors[field] = [`${field} là bắt buộc.`];
            continue;
        }
        if (rule.type === 'text') {
            if (typeof value !== 'string') {
                errors[field] = [`${field} phải là chuỗi.`];
                continue;
            }
            if (rule.max && value.length > rule.max) {
                errors[field] = [`${field} không được vượt quá ${rule.max} ký tự.`];
                continue;
            }
            data[field] = value.trim();
            continue;
        }
        const numberValue = Number(value);
        if (!Number.isFinite(numberValue) || numberValue < 0) {
            errors[field] = [`${field} phải là số không âm.`];
            continue;
        }
        if ((field === 'status' || field === 'qty' || field === 'sort_order' || field.endsWith('_id')) && !Number.isInteger(numberValue)) {
            errors[field] = [`${field} phải là số nguyên.`];
            continue;
        }
        if (field === 'status' && ![0, 1].includes(numberValue)) {
            errors[field] = ['status chỉ được nhận 0 hoặc 1.'];
            continue;
        }
        data[field] = numberValue;
    }
    if (Object.keys(errors).length)
        fail('Dữ liệu nhập chưa hợp lệ.', 422, errors);
    return data;
}
function safeUser(user) {
    if (!user)
        return null;
    const { password: _password, remember_token: _rememberToken, ...publicUser } = user;
    return publicUser;
}
function pagination(records, total, page, perPage, url) {
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const pageUrl = (p) => {
        const parsed = new URL(url);
        parsed.searchParams.set('page', String(p));
        parsed.searchParams.set('per_page', String(perPage));
        return parsed.toString();
    };
    return {
        current_page: page,
        data: records,
        from: total ? ((page - 1) * perPage) + 1 : null,
        last_page: lastPage,
        per_page: perPage,
        to: total ? ((page - 1) * perPage) + records.length : null,
        total,
        first_page_url: pageUrl(1),
        last_page_url: pageUrl(lastPage),
        next_page_url: page < lastPage ? pageUrl(page + 1) : null,
        prev_page_url: page > 1 ? pageUrl(page - 1) : null,
        links: [],
    };
}
function getPagination(url) {
    const page = Math.max(1, Number(url.searchParams.get('page') || 1));
    const perPage = Math.min(100, Math.max(1, Number(url.searchParams.get('per_page') || url.searchParams.get('limit') || 10)));
    if (!Number.isInteger(page) || !Number.isInteger(perPage))
        fail('Tham số phân trang không hợp lệ.', 422);
    return { page, perPage, offset: (page - 1) * perPage };
}
function productDetails(db, row) {
    return {
        ...row,
        category: row.category_id ? queryRow(db, 'SELECT id, name, slug FROM categories WHERE id = ?', Number(row.category_id)) ?? null : null,
        brand: row.brand_id ? queryRow(db, 'SELECT id, name FROM brands WHERE id = ?', Number(row.brand_id)) ?? null : null,
    };
}
function getTokenUser(request, db) {
    const authorization = request.headers.get('authorization') || '';
    const match = authorization.match(/^Bearer\s+(.+)$/i);
    if (!match)
        return null;
    const tokenText = match[1];
    const [idText, secret] = tokenText.includes('|') ? tokenText.split('|', 2) : ['', tokenText];
    const hash = createHash('sha256').update(secret).digest('hex');
    const token = idText
        ? queryRow(db, 'SELECT id, tokenable_id, token FROM personal_access_tokens WHERE id = ? AND token = ?', Number(idText), hash)
        : queryRow(db, 'SELECT id, tokenable_id, token FROM personal_access_tokens WHERE token = ?', hash);
    if (!token)
        return null;
    const user = queryRow(db, 'SELECT * FROM users WHERE id = ? AND deleted_at IS NULL', Number(token.tokenable_id));
    if (!user || Number(user.is_active ?? 1) !== 1)
        return null;
    db.prepare('UPDATE personal_access_tokens SET last_used_at = ?, updated_at = ? WHERE id = ?').run(timestamp(), timestamp(), Number(token.id));
    return { user, tokenId: Number(token.id) };
}
function requireUser(request, db) {
    const authenticated = getTokenUser(request, db);
    if (!authenticated)
        fail('Vui lòng đăng nhập để tiếp tục.', 401);
    return authenticated;
}
function requireAdmin(request, db) {
    const authenticated = requireUser(request, db);
    if (authenticated.user.role !== 'admin')
        fail('Bạn không có quyền thực hiện thao tác này.', 403);
    return authenticated;
}
function createToken(db, user, name) {
    const secret = randomBytes(32).toString('hex');
    const hash = createHash('sha256').update(secret).digest('hex');
    const now = timestamp();
    const result = db.prepare(`
    INSERT INTO personal_access_tokens (tokenable_type, tokenable_id, name, token, abilities, created_at, updated_at)
    VALUES ('App\\\\Models\\\\User', ?, ?, ?, '["*"]', ?, ?)
  `).run(user.id, name, hash, now, now);
    return `${Number(result.lastInsertRowid)}|${secret}`;
}
function uniqueSlug(db, table, value, ignoreId) {
    const base = slugify(value);
    if (!base)
        fail('Không thể tạo đường dẫn từ tên này.', 422, { name: ['Hãy nhập tên hợp lệ.'] });
    let slug = base;
    let suffix = 1;
    while (queryRow(db, `SELECT id FROM ${table} WHERE slug = ? AND id != ?`, slug, ignoreId || 0)) {
        suffix += 1;
        slug = `${base}-${suffix}`;
    }
    return slug;
}
function validateMenuParent(db, parentId, menuId) {
    if (parentId === null || parentId === undefined)
        return;
    let currentId = Number(parentId);
    const visited = new Set();
    while (currentId) {
        if (currentId === menuId || visited.has(currentId)) {
            fail('Quan hệ menu cha-con không được tạo vòng lặp.', 422);
        }
        visited.add(currentId);
        const parent = queryRow(db, 'SELECT parent_id FROM menus WHERE id = ? AND deleted_at IS NULL', currentId);
        if (!parent)
            fail('Menu cha không tồn tại.', 422);
        currentId = Number(parent.parent_id || 0);
    }
}
function validateLinkUrl(url, label = 'Đường dẫn', required = false) {
    if (required && (typeof url !== 'string' || !url.trim())) {
        fail(`${label} là bắt buộc.`, 422, { url: ['Hãy nhập đường dẫn hợp lệ.'] });
    }
    if (typeof url === 'string' && url && !/^(https?:\/\/|\/(?!\/))/i.test(url)) {
        fail(`${label} phải là URL http(s) hoặc đường dẫn nội bộ.`, 422, { url: ['Đường dẫn không hợp lệ.'] });
    }
}
function addRelations(db, resource, row) {
    if (resource === 'products')
        return productDetails(db, row);
    if (resource === 'categories' && row.parent_id) {
        return { ...row, parent: queryRow(db, 'SELECT id, name FROM categories WHERE id = ?', Number(row.parent_id)) ?? null };
    }
    if (resource === 'topics' && row.parent_id) {
        return { ...row, parent: queryRow(db, 'SELECT id, name FROM topics WHERE id = ?', Number(row.parent_id)) ?? null };
    }
    if (resource === 'posts') {
        return {
            ...row,
            topic: row.topic_id ? queryRow(db, 'SELECT id, name, slug FROM topics WHERE id = ?', Number(row.topic_id)) ?? null : null,
            author: row.user_id ? safeUser(queryRow(db, 'SELECT * FROM users WHERE id = ?', Number(row.user_id))) : null,
        };
    }
    if (resource === 'menus') {
        return {
            ...row,
            parent: row.parent_id ? queryRow(db, 'SELECT id, name FROM menus WHERE id = ?', Number(row.parent_id)) ?? null : null,
            page: row.page_id ? queryRow(db, 'SELECT id, title, slug FROM pages WHERE id = ?', Number(row.page_id)) ?? null : null,
        };
    }
    if (resource === 'users') {
        return { ...safeUser(row), orders_count: Number(queryRow(db, 'SELECT COUNT(*) AS count FROM orders WHERE user_id = ?', row.id)?.count || 0) };
    }
    if (resource === 'orders') {
        const items = queryRows(db, 'SELECT * FROM order_items WHERE order_id = ? ORDER BY id', row.id);
        const statusHistory = queryRows(db, 'SELECT status, note, created_at FROM order_status_history WHERE order_id = ? ORDER BY id', row.id);
        const user = row.user_id ? queryRow(db, 'SELECT * FROM users WHERE id = ?', Number(row.user_id)) : undefined;
        return { ...row, user: safeUser(user), items, status_history: statusHistory };
    }
    if (resource === 'reviews') {
        return { ...row, product: queryRow(db, 'SELECT id, name, slug FROM products WHERE id = ?', Number(row.product_id)) ?? null };
    }
    return resource === 'users' ? safeUser(row) : row;
}
function entityList(db, resource, url, trash) {
    const table = softResources[resource];
    if (!table)
        fail('Không tìm thấy tài nguyên.', 404);
    const { page, perPage, offset } = getPagination(url);
    const isUsers = resource === 'users';
    const isReviews = resource === 'reviews';
    const conditions = [trash ? 'deleted_at IS NOT NULL' : 'deleted_at IS NULL'];
    const params = [];
    const search = url.searchParams.get('q')?.trim();
    const searchColumns = {
        posts: ['title'],
        pages: ['title'],
        banners: ['title'],
        orders: ['order_number', 'customer_name', 'customer_email', 'customer_phone'],
        users: ['name', 'email', 'phone'],
        contacts: ['name', 'email', 'title'],
        reviews: ['name', 'comment'],
        promotions: ['code'],
        stock_movements: ['reason'],
    }[resource] || ['name'];
    if (search) {
        conditions.push(`(${searchColumns.map((column) => `${column} LIKE ?`).join(' OR ')})`);
        params.push(...searchColumns.map(() => `%${search}%`));
    }
    const status = url.searchParams.get('status');
    const statusColumn = resource === 'users' ? 'is_active' : 'status';
    if (status !== null && ['0', '1'].includes(status) && resource !== 'orders' && resource !== 'stock_movements') {
        conditions.push(`${statusColumn} = ?`);
        params.push(Number(status));
    }
    if (resource === 'orders') {
        const orderStatus = url.searchParams.get('status');
        if (orderStatus && ['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(orderStatus)) {
            conditions.push('status = ?');
            params.push(orderStatus);
        }
        const from = url.searchParams.get('from');
        const to = url.searchParams.get('to');
        if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) {
            conditions.push('date(created_at) >= date(?)');
            params.push(from);
        }
        if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) {
            conditions.push('date(created_at) <= date(?)');
            params.push(to);
        }
    }
    const where = conditions.join(' AND ');
    const total = Number(queryRow(db, `SELECT COUNT(*) AS count FROM ${table} WHERE ${where}`, ...params)?.count || 0);
    const orderBy = trash ? 'deleted_at DESC, id DESC' : (resource === 'categories' || resource === 'brands' || resource === 'topics' || resource === 'menus' || resource === 'banners' || resource === 'links') ? 'sort_order ASC, id DESC' : 'id DESC';
    const rows = queryRows(db, `SELECT * FROM ${table} WHERE ${where}${searchSql} ORDER BY ${orderBy} LIMIT ? OFFSET ?`, ...params, perPage, offset);
    const data = rows.map((row) => {
        const item = addRelations(db, resource, row);
        return isUsers ? item : item;
    });
    return { status: true, data: pagination(data, total, page, perPage, url.toString()) };
}
function createResource(db, resource, body, user) {
    const config = resourceMap[resource];
    if (!config)
        fail('Không tìm thấy tài nguyên.', 404);
    const data = { ...config.defaults, ...validateInput(body, config.fields, true) };
    if (resource === 'menus') {
        validateMenuParent(db, data.parent_id);
    }
    if (resource === 'menus') validateLinkUrl(data.url, 'Đường dẫn menu');
    else if (resource === 'links') validateLinkUrl(data.url, 'Đường dẫn', true);
    else if (resource === 'banners') validateLinkUrl(data.url);
    const now = timestamp();
    if (resource === 'promotions') {
        data.code = String(data.code).trim().toUpperCase();
        validatePromotion(data);
    }
    if (config.slug) {
        data.slug = uniqueSlug(db, config.table, String(data[config.slug]));
    }
    if (resource === 'posts') {
        data.user_id = user.id;
        data.type = 'post';
    }
    const keys = Object.keys(data);
    const values = keys.map((key) => data[key]);
    const result = db.prepare(`INSERT INTO ${config.table} (${[...keys, 'created_at', 'updated_at'].join(', ')}) VALUES (${[...keys, 'created_at', 'updated_at'].map(() => '?').join(', ')})`).run(...values, now, now);
    const row = queryRow(db, `SELECT * FROM ${config.table} WHERE id = ?`, Number(result.lastInsertRowid));
    return row ? addRelations(db, resource, row) : null;
}
function updateResource(db, resource, id, body) {
    const config = resourceMap[resource];
    if (!config)
        fail('Không tìm thấy tài nguyên.', 404);
    const row = queryRow(db, `SELECT * FROM ${config.table} WHERE id = ? AND deleted_at IS NULL`, id);
    if (!row)
        fail('Không tìm thấy bản ghi.', 404);
    const data = validateInput(body, config.fields, false);
    if (resource === 'promotions') {
        if (typeof data.code === 'string') data.code = data.code.trim().toUpperCase();
        validatePromotion({ ...row, ...data });
    }
    if (resource === 'menus' && 'parent_id' in data)
        validateMenuParent(db, data.parent_id, id);
    if (resource === 'menus') validateLinkUrl(data.url, 'Đường dẫn menu');
    else if (resource === 'links' && 'url' in data) validateLinkUrl(data.url, 'Đường dẫn', true);
    else if (resource === 'banners') validateLinkUrl(data.url);
    if (config.slug && typeof data[config.slug] === 'string') {
        data.slug = uniqueSlug(db, config.table, String(data[config.slug]), id);
    }
    if (!Object.keys(data).length)
        fail('Không có dữ liệu để cập nhật.', 422);
    data.updated_at = timestamp();
    const entries = Object.entries(data);
    db.prepare(`UPDATE ${config.table} SET ${entries.map(([key]) => `${key} = ?`).join(', ')} WHERE id = ?`)
        .run(...entries.map(([, value]) => value), id);
    const updated = queryRow(db, `SELECT * FROM ${config.table} WHERE id = ?`, id);
    return updated ? addRelations(db, resource, updated) : null;
}
function setDeleted(db, resource, id, action, actingUser) {
    const table = softResources[resource];
    if (!table)
        fail('Không tìm thấy tài nguyên.', 404);
    const row = queryRow(db, `SELECT * FROM ${table} WHERE id = ?`, id);
    if (!row || (action === 'delete' && row.deleted_at) || (action !== 'delete' && !row.deleted_at)) {
        fail(action === 'delete' ? 'Không tìm thấy bản ghi.' : 'Không tìm thấy bản ghi trong thùng rác.', 404);
    }
    if (resource === 'menus' && (action === 'delete' || action === 'force')) {
        const childQuery = action === 'force'
            ? 'SELECT id FROM menus WHERE parent_id = ?'
            : 'SELECT id FROM menus WHERE parent_id = ? AND deleted_at IS NULL';
        if (queryRow(db, childQuery, id)) {
            fail('Hãy xóa hoặc chuyển các mục menu con trước.', 422);
        }
    }
    if (action === 'delete') {
        const relatedChecks = {
            categories: ['SELECT id FROM products WHERE category_id = ? AND deleted_at IS NULL', 'Danh mục còn sản phẩm đang kinh doanh. Hãy chuyển sản phẩm sang danh mục khác trước.'],
            brands: ['SELECT id FROM products WHERE brand_id = ? AND deleted_at IS NULL', 'Thương hiệu còn sản phẩm đang kinh doanh. Hãy chuyển sản phẩm sang thương hiệu khác trước.'],
            topics: ['SELECT id FROM posts WHERE topic_id = ? AND deleted_at IS NULL', 'Chủ đề còn bài viết. Hãy chuyển bài viết sang chủ đề khác trước.'],
            pages: ['SELECT id FROM menus WHERE page_id = ? AND deleted_at IS NULL', 'Trang đang được liên kết từ menu. Hãy sửa menu trước.'],
            products: ['SELECT id FROM order_items WHERE product_id = ? LIMIT 1', 'Sản phẩm đã có trong đơn hàng. Hãy ẩn sản phẩm thay vì xóa để giữ lịch sử đơn.'],
        };
        const check = relatedChecks[resource];
        if (check && queryRow(db, check[0], id)) fail(check[1], 422);
    }
    if (resource === 'users' && action === 'delete' && Number(row.id) === actingUser?.id) {
        fail('Không thể xóa tài khoản đang đăng nhập.', 422);
    }
    if (action === 'delete') {
        db.prepare(`UPDATE ${table} SET deleted_at = ?, updated_at = ? WHERE id = ?`).run(timestamp(), timestamp(), id);
    }
    else if (action === 'restore') {
        db.prepare(`UPDATE ${table} SET deleted_at = NULL, updated_at = ? WHERE id = ?`).run(timestamp(), id);
    }
    else {
        db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
    }
}
function publicProduct(db, product) {
    return productDetails(db, product);
}
function validatePromotion(promotion) {
    if (!/^[A-Z0-9_-]{3,40}$/.test(String(promotion.code || ''))) {
        fail('Mã khuyến mãi chỉ gồm 3-40 chữ cái in hoa, số, gạch ngang hoặc gạch dưới.', 422);
    }
    if (!['fixed', 'percentage'].includes(promotion.discount_type)) {
        fail('Loại giảm giá không hợp lệ.', 422);
    }
    if (Number(promotion.discount_value) <= 0
        || (promotion.discount_type === 'percentage' && Number(promotion.discount_value) > 100)) {
        fail('Giá trị giảm giá không hợp lệ.', 422);
    }
    if (promotion.usage_limit !== null && promotion.usage_limit !== undefined
        && (!Number.isInteger(Number(promotion.usage_limit)) || Number(promotion.usage_limit) < 1)) {
        fail('Giới hạn lượt sử dụng phải là số nguyên dương.', 422);
    }
    const start = promotion.starts_at ? Date.parse(String(promotion.starts_at)) : null;
    const end = promotion.ends_at ? Date.parse(String(promotion.ends_at)) : null;
    if ((start !== null && !Number.isFinite(start)) || (end !== null && !Number.isFinite(end))
        || (start !== null && end !== null && end < start)) {
        fail('Thời gian khuyến mãi không hợp lệ.', 422);
    }
}
function getPublicSettings(db) {
    return Object.fromEntries(queryRows(db, 'SELECT setting_key, setting_value FROM app_settings')
        .map(({ setting_key, setting_value }) => [setting_key, setting_value]));
}
function storefrontProducts(db, url) {
    const { page, perPage, offset } = getPagination(url);
    const conditions = ['p.deleted_at IS NULL', 'p.status = 1'];
    const parameters = [];
    const category = url.searchParams.get('category');
    const brand = url.searchParams.get('brand');
    const query = url.searchParams.get('q')?.trim();
    const minPrice = url.searchParams.get('min_price');
    const maxPrice = url.searchParams.get('max_price');
    const sort = url.searchParams.get('sort') || 'newest';
    if (category && /^\d+$/.test(category)) {
        conditions.push('p.category_id = ?');
        parameters.push(Number(category));
    }
    if (brand && /^\d+$/.test(brand)) {
        conditions.push('p.brand_id = ?');
        parameters.push(Number(brand));
    }
    if (query) {
        conditions.push('(p.name LIKE ? OR p.description LIKE ?)');
        parameters.push(`%${query}%`, `%${query}%`);
    }
    if (minPrice !== null && Number.isFinite(Number(minPrice)) && Number(minPrice) >= 0) {
        conditions.push('COALESCE(p.sale_price, p.price) >= ?');
        parameters.push(Number(minPrice));
    }
    if (maxPrice !== null && Number.isFinite(Number(maxPrice)) && Number(maxPrice) >= 0) {
        conditions.push('COALESCE(p.sale_price, p.price) <= ?');
        parameters.push(Number(maxPrice));
    }
    if (minPrice !== null && maxPrice !== null && Number(maxPrice) < Number(minPrice)) {
        fail('Giá tối đa phải lớn hơn hoặc bằng giá tối thiểu.', 422, { max_price: ['Giá tối đa phải lớn hơn hoặc bằng giá tối thiểu.'] });
    }
    const orderBy = sort === 'price_asc'
        ? 'COALESCE(p.sale_price, p.price) ASC, p.id DESC'
        : sort === 'price_desc'
            ? 'COALESCE(p.sale_price, p.price) DESC, p.id DESC'
            : 'p.id DESC';
    const where = conditions.join(' AND ');
    const total = Number(queryRow(db, `SELECT COUNT(*) AS count FROM products p WHERE ${where}`, ...parameters)?.count || 0);
    const rows = queryRows(db, `SELECT p.* FROM products p WHERE ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`, ...parameters, perPage, offset);
    return {
        data: pagination(rows.map((row) => publicProduct(db, row)), total, page, perPage, url.toString()),
        categories: queryRows(db, 'SELECT id, name FROM categories WHERE status = 1 AND deleted_at IS NULL ORDER BY sort_order, name'),
        brands: queryRows(db, 'SELECT id, name FROM brands WHERE status = 1 AND deleted_at IS NULL ORDER BY sort_order, name'),
    };
}
function listOrders(db, user, url, trash = false) {
    const { page, perPage, offset } = getPagination(url);
    const where = trash ? 'deleted_at IS NOT NULL' : 'deleted_at IS NULL';
    const userClause = user.role === 'admin' ? '' : ' AND user_id = ?';
    const params = user.role === 'admin' ? [] : [user.id];
    const total = Number(queryRow(db, `SELECT COUNT(*) AS count FROM orders WHERE ${where}${userClause}`, ...params)?.count || 0);
    const rows = queryRows(db, `SELECT * FROM orders WHERE ${where}${userClause} ORDER BY id DESC LIMIT ? OFFSET ?`, ...params, perPage, offset);
    return {
        status: true,
        data: pagination(rows.map((row) => {
            const order = addRelations(db, 'orders', row);
            return row.payment_method === 'bank_transfer' && row.shipping_confirmed
                ? { ...order, payment_details: getBankTransferDetails(row) }
                : order;
        }), total, page, perPage, url.toString()),
    };
}
function createOrder(db, user, body) {
    const requiredText = (key, max) => {
        const value = body[key];
        if (typeof value !== 'string' || value.trim().length === 0 || value.length > max) {
            fail(`${key} không hợp lệ.`, 422, { [key]: [`${key} là bắt buộc.`] });
        }
        return value.trim();
    };
    const customerName = requiredText('customer_name', 255);
    const customerPhone = requiredText('customer_phone', 30);
    const shippingAddress = requiredText('shipping_address', 2000);
    const email = body.customer_email === undefined || body.customer_email === null || body.customer_email === '' ? null : String(body.customer_email);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        fail('Email không hợp lệ.', 422, { customer_email: ['Email không hợp lệ.'] });
    const shippingFee = 0;
    const method = String(body.payment_method ?? 'cod');
    const promotionCode = typeof body.promotion_code === 'string' ? body.promotion_code.trim().toUpperCase() : '';
    if (!['cod', 'bank_transfer', 'vnpay', 'momo', 'bank_transfer_demo', 'momo_demo', 'visa_demo', 'credit_card_demo'].includes(method))
        fail('Thông tin thanh toán không hợp lệ.', 422);
    if (!getPaymentMethods().some((paymentMethod) => paymentMethod.id === method && paymentMethod.available))
        fail('Phương thức thanh toán này chưa được cửa hàng cấu hình.', 422);
    if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 50)
        fail('Đơn hàng cần có từ 1 đến 50 sản phẩm.', 422);
    const combined = new Map();
    for (const item of body.items) {
        const productId = Number(item?.product_id);
        const quantity = Number(item?.quantity);
        if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 1000)
            fail('Sản phẩm hoặc số lượng không hợp lệ.', 422);
        combined.set(productId, (combined.get(productId) || 0) + quantity);
    }
    const now = timestamp();
    db.exec('BEGIN IMMEDIATE');
    try {
        let subtotal = 0;
        const orderItems = [];
        for (const [productId, quantity] of combined) {
            const product = queryRow(db, 'SELECT * FROM products WHERE id = ? AND status = 1 AND deleted_at IS NULL', productId);
            if (!product)
                fail('Một sản phẩm không còn kinh doanh.', 422);
            if (Number(product.qty) < quantity)
                fail(`Sản phẩm ${product.name} không đủ tồn kho.`, 422);
            const unitPrice = Number(product.sale_price ?? product.price);
            const lineTotal = Math.round(unitPrice * quantity * 100) / 100;
            subtotal = Math.round((subtotal + lineTotal) * 100) / 100;
            db.prepare('UPDATE products SET qty = qty - ?, updated_at = ? WHERE id = ?').run(quantity, now, productId);
            orderItems.push({ product_id: productId, product_name: String(product.name), unit_price: unitPrice, quantity, line_total: lineTotal });
        }
        let promotion = null;
        let discountAmount = 0;
        if (promotionCode) {
            promotion = queryRow(db, 'SELECT * FROM promotions WHERE code = ? AND status = 1 AND deleted_at IS NULL', promotionCode);
            const nowMs = Date.now();
            if (!promotion
                || (promotion.starts_at && Date.parse(String(promotion.starts_at)) > nowMs)
                || (promotion.ends_at && Date.parse(String(promotion.ends_at)) < nowMs)
                || (promotion.usage_limit !== null && Number(promotion.usage_count) >= Number(promotion.usage_limit))
                || subtotal < Number(promotion.min_order)) {
                fail('Mã khuyến mãi không hợp lệ, đã hết hạn hoặc đơn hàng chưa đủ điều kiện.', 422, {
                    promotion_code: ['Hãy kiểm tra mã, thời hạn và giá trị tối thiểu của đơn hàng.'],
                });
            }
            discountAmount = promotion.discount_type === 'percentage'
                ? Math.round(subtotal * Number(promotion.discount_value) / 100)
                : Math.round(Number(promotion.discount_value));
            discountAmount = Math.min(subtotal, discountAmount);
        }
        const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${randomBytes(4).toString('hex').toUpperCase()}`;
        const orderResult = db.prepare(`
      INSERT INTO orders (user_id, order_number, customer_name, customer_email, customer_phone, shipping_address, subtotal, shipping_fee, total, payment_method, payment_status, shipping_confirmed, promotion_code, discount_amount, status, note, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unpaid', 0, ?, ?, 'pending', ?, ?, ?)
    `).run(user.id, orderNumber, customerName, email, customerPhone, shippingAddress, subtotal, shippingFee, subtotal - discountAmount + shippingFee, method, promotion?.code ?? null, discountAmount, typeof body.note === 'string' ? body.note.slice(0, 2000) : null, now, now);
        const orderId = Number(orderResult.lastInsertRowid);
        const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, line_total, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
        for (const item of orderItems) {
            insertItem.run(orderId, item.product_id, item.product_name, item.unit_price, item.quantity, item.line_total, now, now);
            db.prepare('INSERT INTO stock_movements (product_id, movement_type, quantity, reason, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)')
                .run(item.product_id, 'outbound', item.quantity, `Đơn hàng ${orderNumber}`, user.id, now);
        }
        if (promotion) {
            db.prepare('UPDATE promotions SET usage_count = usage_count + 1, updated_at = ? WHERE id = ?')
                .run(now, Number(promotion.id));
        }
        db.prepare('INSERT INTO order_status_history (order_id, status, note, changed_by, created_at) VALUES (?, ?, ?, ?, ?)')
            .run(orderId, 'pending', 'Đơn hàng được tạo.', user.id, now);
        db.exec('COMMIT');
        const order = queryRow(db, 'SELECT * FROM orders WHERE id = ?', orderId);
        return addRelations(db, 'orders', order);
    }
    catch (error) {
        db.exec('ROLLBACK');
        throw error;
    }
}
function changeOrderStatus(db, orderId, requestedStatus, shippingFee, changedBy = null) {
    const transitions = {
        pending: ['processing', 'cancelled'],
        processing: ['shipped', 'cancelled'],
        shipped: ['delivered'],
        delivered: [],
        cancelled: [],
    };
    const now = timestamp();
    db.exec('BEGIN IMMEDIATE');
    try {
        const order = queryRow(db, 'SELECT * FROM orders WHERE id = ? AND deleted_at IS NULL', orderId);
        if (!order)
            fail('Không tìm thấy đơn hàng.', 404);
        if (requestedStatus === 'processing' && !order.shipping_confirmed)
            fail('Hãy xác nhận phí vận chuyển trước khi xử lý đơn hàng.', 422);
        if (order.status !== requestedStatus && !transitions[String(order.status)]?.includes(requestedStatus)) {
            fail('Trạng thái đơn hàng không thể chuyển theo quy trình hiện tại.', 422);
        }
        if (requestedStatus === 'cancelled' && order.status !== 'cancelled') {
            const items = queryRows(db, 'SELECT product_id, quantity FROM order_items WHERE order_id = ?', orderId);
            for (const item of items) {
                if (item.product_id) {
                    db.prepare('UPDATE products SET qty = qty + ?, updated_at = ? WHERE id = ?').run(Number(item.quantity), now, Number(item.product_id));
                    db.prepare('INSERT INTO stock_movements (product_id, movement_type, quantity, reason, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)')
                        .run(Number(item.product_id), 'inbound', Number(item.quantity), `Hoàn kho do hủy đơn ${order.order_number}`, changedBy, now);
                }
            }
        }
        if (shippingFee !== undefined) {
            if (!Number.isSafeInteger(shippingFee) || shippingFee < 0)
                fail('Phí vận chuyển phải là số nguyên không âm.', 422);
            if (requestedStatus === 'cancelled') {
                db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').run(requestedStatus, now, orderId);
            } else {
                const total = Number(order.subtotal) + shippingFee;
                db.prepare('UPDATE orders SET status = ?, shipping_fee = ?, total = ?, shipping_confirmed = 1, payment_url = NULL, updated_at = ? WHERE id = ?')
                    .run(requestedStatus, shippingFee, total, now, orderId);
            }
        } else {
            db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').run(requestedStatus, now, orderId);
        }
        if (order.status !== requestedStatus) {
            db.prepare('INSERT INTO order_status_history (order_id, status, note, changed_by, created_at) VALUES (?, ?, ?, ?, ?)')
                .run(orderId, requestedStatus, shippingFee === undefined ? null : `Cập nhật phí vận chuyển: ${shippingFee}`, changedBy, now);
        }
        db.exec('COMMIT');
        return addRelations(db, 'orders', queryRow(db, 'SELECT * FROM orders WHERE id = ?', orderId));
    }
    catch (error) {
        db.exec('ROLLBACK');
        throw error;
    }
}
function deleteOrder(db, orderId) {
    const now = timestamp();
    db.exec('BEGIN IMMEDIATE');
    try {
        const order = queryRow(db, 'SELECT * FROM orders WHERE id = ? AND deleted_at IS NULL', orderId);
        if (!order)
            fail('Không tìm thấy đơn hàng.', 404);
        if (['pending', 'processing'].includes(String(order.status))) {
            const items = queryRows(db, 'SELECT product_id, quantity FROM order_items WHERE order_id = ?', orderId);
            for (const item of items) {
                if (item.product_id) {
                    db.prepare('UPDATE products SET qty = qty + ?, updated_at = ? WHERE id = ?').run(Number(item.quantity), now, Number(item.product_id));
                    db.prepare('INSERT INTO stock_movements (product_id, movement_type, quantity, reason, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)')
                        .run(Number(item.product_id), 'inbound', Number(item.quantity), `Hoàn kho do hủy đơn ${order.order_number}`, null, now);
                }
            }
            db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').run('cancelled', now, orderId);
            db.prepare('INSERT INTO order_status_history (order_id, status, note, changed_by, created_at) VALUES (?, ?, ?, ?, ?)')
                .run(orderId, 'cancelled', 'Đơn hàng được hủy khi chuyển vào thùng rác.', null, now);
        }
        db.prepare('UPDATE orders SET deleted_at = ?, updated_at = ? WHERE id = ?').run(now, now, orderId);
        db.exec('COMMIT');
    }
    catch (error) {
        db.exec('ROLLBACK');
        throw error;
    }
}
const uploadDirectory = path.join(process.cwd(), 'uploads');
const uploadLimit = 5 * 1024 * 1024;
async function handleUpload(request, db, segments, method) {
    if (method === 'POST' && segments.length === 1) {
        requireAdmin(request, db);
        const formData = await request.formData();
        const file = formData.get('file');
        if (!(file instanceof File) || file.size < 1 || file.size > uploadLimit)
            fail('Ảnh tải lên phải có dung lượng từ 1 byte đến 5 MB.', 422);
        const bytes = Buffer.from(await file.arrayBuffer());
        let extension;
        let contentType;
        if (bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) {
            extension = 'jpg';
            contentType = 'image/jpeg';
        } else if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
            extension = 'png';
            contentType = 'image/png';
        } else if (bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') {
            extension = 'webp';
            contentType = 'image/webp';
        } else {
            fail('Định dạng ảnh không được hỗ trợ. Hãy dùng JPG, PNG hoặc WebP.', 422);
        }
        const filename = `${randomBytes(16).toString('hex')}.${extension}`;
        await mkdir(uploadDirectory, { recursive: true });
        await writeFile(path.join(uploadDirectory, filename), bytes, { flag: 'wx' });
        return json({ status: true, data: { url: `/uploads/${filename}`, contentType } }, 201);
    }
    if (method === 'GET' && segments.length === 2) {
        const filename = segments[1];
        const match = /^([a-f0-9]{32})\.(jpg|png|webp)$/.exec(filename);
        if (!match) fail('Không tìm thấy ảnh.', 404);
        const contentType = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[match[2]];
        let image;
        try {
            image = await readFile(path.join(uploadDirectory, filename));
        } catch (error) {
            if (error?.code === 'ENOENT') fail('Không tìm thấy ảnh.', 404);
            throw error;
        }
        return new Response(image, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
                'X-Content-Type-Options': 'nosniff',
            },
        });
    }
    fail('Không tìm thấy API.', 404);
}
function handleStorefront(db, method, segments, url, body, request) {
    const [section, action, id] = segments;
    if (method === 'GET' && section === 'home') {
        const banners = queryRows(db, 'SELECT id, title, image, url FROM banners WHERE status = 1 AND deleted_at IS NULL ORDER BY sort_order, id LIMIT 6');
        const categories = queryRows(db, 'SELECT id, name, slug, image FROM categories WHERE status = 1 AND deleted_at IS NULL AND parent_id IS NULL ORDER BY sort_order, id LIMIT 8');
        const hot = queryRows(db, `
      SELECT p.*, COALESCE(s.sold, 0) AS sold_count
      FROM products p
      LEFT JOIN (SELECT product_id, SUM(quantity) AS sold FROM order_items GROUP BY product_id) s ON s.product_id = p.id
      WHERE p.status = 1 AND p.deleted_at IS NULL
      ORDER BY sold_count DESC, p.id DESC LIMIT 4
    `);
        const hotIds = hot.map((product) => product.id);
        const newer = hotIds.length
            ? queryRows(db, `SELECT * FROM products WHERE status = 1 AND deleted_at IS NULL AND id NOT IN (${hotIds.map(() => '?').join(',')}) ORDER BY id DESC LIMIT 4`, ...hotIds)
            : queryRows(db, 'SELECT * FROM products WHERE status = 1 AND deleted_at IS NULL ORDER BY id DESC LIMIT 4');
        const menus = queryRows(db, 'SELECT * FROM menus WHERE status = 1 AND deleted_at IS NULL AND parent_id IS NULL ORDER BY sort_order, id')
            .map((menu) => ({ ...menu, page: menu.page_id ? queryRow(db, 'SELECT id, title, slug FROM pages WHERE id = ?', Number(menu.page_id)) ?? null : null }));
        const latestPosts = queryRows(db, "SELECT * FROM posts WHERE type = 'post' AND status = 1 AND deleted_at IS NULL ORDER BY id DESC LIMIT 4")
            .map((post) => addRelations(db, 'posts', post));
        return json({ data: {
            banners,
            categories,
            hot_products: hot.map((product) => publicProduct(db, product)),
            new_products: newer.map((product) => publicProduct(db, product)),
            latest_posts: latestPosts,
            settings: getPublicSettings(db),
            menus,
        } });
    }
    if (method === 'GET' && section === 'payment-methods') {
        return json({
            data: getPaymentMethods(),
            bank_transfer: {
                bank_name: process.env.BANK_NAME || '',
                account_number: process.env.BANK_ACCOUNT_NUMBER || '',
                account_name: process.env.BANK_ACCOUNT_NAME || '',
            },
        });
    }
    if (method === 'GET' && section === 'products' && !action)
        return json(storefrontProducts(db, url));
    if (method === 'GET' && section === 'products' && action && !id) {
        const product = queryRow(db, 'SELECT * FROM products WHERE slug = ? AND status = 1 AND deleted_at IS NULL', action);
        if (!product)
            fail('Không tìm thấy sản phẩm.', 404);
        const { page, perPage, offset } = getPagination(url);
        const total = Number(queryRow(db, 'SELECT COUNT(*) AS count FROM product_reviews WHERE product_id = ? AND status = 1 AND deleted_at IS NULL', product.id)?.count || 0);
        const reviews = queryRows(db, 'SELECT * FROM product_reviews WHERE product_id = ? AND status = 1 AND deleted_at IS NULL ORDER BY id DESC LIMIT ? OFFSET ?', product.id, perPage, offset);
        const average = queryRow(db, 'SELECT AVG(rating) AS rating FROM product_reviews WHERE product_id = ? AND status = 1 AND deleted_at IS NULL', product.id)?.rating ?? null;
        const related = queryRows(db, 'SELECT * FROM products WHERE category_id = ? AND id != ? AND status = 1 AND deleted_at IS NULL ORDER BY id DESC LIMIT 4', product.category_id, product.id);
        return json({ data: {
            product: publicProduct(db, product),
            related_products: related.map((row) => publicProduct(db, row)),
            reviews: pagination(reviews, total, page, perPage, url.toString()),
            average_rating: average,
        } });
    }
    if (method === 'POST' && section === 'products' && action && id === 'reviews') {
        const product = queryRow(db, 'SELECT id FROM products WHERE slug = ? AND status = 1 AND deleted_at IS NULL', action);
        if (!product)
            fail('Không tìm thấy sản phẩm.', 404);
        const name = typeof body.name === 'string' ? body.name.trim() : '';
        const rating = Number(body.rating);
        const comment = typeof body.comment === 'string' ? body.comment.trim() : '';
        if (!name || name.length > 255 || !Number.isInteger(rating) || rating < 1 || rating > 5 || comment.length < 3 || comment.length > 3000)
            fail('Nội dung đánh giá chưa hợp lệ.', 422);
        const now = timestamp();
        const created = db.prepare('INSERT INTO product_reviews (product_id, name, rating, comment, status, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?)').run(Number(product.id), name, rating, comment, now, now);
        return json({ message: 'Đánh giá đã được gửi và sẽ hiển thị sau khi được duyệt.', data: queryRow(db, 'SELECT * FROM product_reviews WHERE id = ?', Number(created.lastInsertRowid)) }, 201);
    }
    if (method === 'GET' && section === 'articles' && !action) {
        const { page, perPage, offset } = getPagination(url);
        const topic = url.searchParams.get('topic');
        const topicFilter = topic ? ' AND topic_id IN (SELECT id FROM topics WHERE id = ? OR slug = ?)' : '';
        const topicParams = topic ? [/^\d+$/.test(topic) ? Number(topic) : -1, topic] : [];
        const total = Number(queryRow(db, `SELECT COUNT(*) AS count FROM posts WHERE type = 'post' AND status = 1 AND deleted_at IS NULL${topicFilter}`, ...topicParams)?.count || 0);
        const rows = queryRows(db, `SELECT * FROM posts WHERE type = 'post' AND status = 1 AND deleted_at IS NULL${topicFilter} ORDER BY id DESC LIMIT ? OFFSET ?`, ...topicParams, perPage, offset);
        const topics = queryRows(db, 'SELECT id, name, slug FROM topics WHERE status = 1 AND deleted_at IS NULL ORDER BY sort_order, name');
        return json({ data: pagination(rows.map((post) => addRelations(db, 'posts', post)), total, page, perPage, url.toString()), topics });
    }
    if (method === 'GET' && section === 'articles' && action) {
        const post = queryRow(db, "SELECT * FROM posts WHERE slug = ? AND type = 'post' AND status = 1 AND deleted_at IS NULL", action);
        if (!post)
            fail('Không tìm thấy bài viết.', 404);
        return json({ data: addRelations(db, 'posts', post) });
    }
    if (method === 'GET' && section === 'pages' && action) {
        const page = queryRow(db, 'SELECT * FROM pages WHERE slug = ? AND status = 1 AND deleted_at IS NULL', action);
        if (!page)
            fail('Không tìm thấy trang.', 404);
        return json({ data: page });
    }
    if (method === 'GET' && section === 'settings') {
        return json({ data: getPublicSettings(db) });
    }
    if (method === 'GET' && section === 'menus') {
        const menus = queryRows(db, 'SELECT * FROM menus WHERE status = 1 AND deleted_at IS NULL AND parent_id IS NULL ORDER BY sort_order, id')
            .map((menu) => ({
            ...menu,
            page: menu.page_id ? queryRow(db, 'SELECT id, title, slug FROM pages WHERE id = ?', Number(menu.page_id)) ?? null : null,
            children: queryRows(db, 'SELECT * FROM menus WHERE parent_id = ? AND status = 1 AND deleted_at IS NULL ORDER BY sort_order, id', menu.id)
                .map((child) => ({ ...child, page: child.page_id ? queryRow(db, 'SELECT id, title, slug FROM pages WHERE id = ?', Number(child.page_id)) ?? null : null })),
        }));
        return json({ data: menus });
    }
    if (method === 'POST' && section === 'contact') {
        const fields = ['name', 'email', 'title', 'content'];
        for (const field of fields)
            if (typeof body[field] !== 'string' || !String(body[field]).trim())
                fail(`${field} là bắt buộc.`, 422);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email)))
            fail('Email không hợp lệ.', 422);
        const now = timestamp();
        const result = db.prepare(`
      INSERT INTO contacts (name, email, phone, title, content, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 0, ?, ?)
    `).run(String(body.name).trim(), String(body.email).trim(), typeof body.phone === 'string' ? body.phone.trim() : null, String(body.title).trim(), String(body.content).trim(), now, now);
        return json({ message: 'Cảm ơn bạn đã liên hệ với LUANHUNG SHOP.', data: queryRow(db, 'SELECT * FROM contacts WHERE id = ?', Number(result.lastInsertRowid)) }, 201);
    }
    if (method === 'GET' && section === 'cart' && action === 'products') {
        let ids;
        const rawIds = url.searchParams.get('ids') || url.searchParams.get('ids[]');
        try {
            ids = rawIds?.startsWith('[') ? JSON.parse(rawIds) : rawIds?.split(',');
        }
        catch {
            ids = null;
        }
        if (!Array.isArray(ids) || !ids.length || ids.length > 50 || ids.some((idValue) => !Number.isInteger(Number(idValue))))
            fail('Danh sách sản phẩm không hợp lệ.', 422);
        const uniqueIds = [...new Set(ids.map(Number))];
        const products = queryRows(db, `SELECT id, name, slug, price, sale_price, image, qty FROM products WHERE status = 1 AND deleted_at IS NULL AND id IN (${uniqueIds.map(() => '?').join(',')})`, ...uniqueIds);
        return json({ data: products });
    }
    return null;
}
async function handleAdminUser(db, user, method, segments, body) {
    const [resource, id, action] = segments;
    if (resource === 'users') {
        if (method === 'POST' && id === 'admin' && !action) {
            const name = typeof body.name === 'string' ? body.name.trim() : '';
            const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
            const password = typeof body.password === 'string' ? body.password : '';
            const confirmation = typeof body.password_confirmation === 'string' ? body.password_confirmation : '';
            const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
            if (!name || name.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255
                || password.length < 10 || password.length > 128 || password !== confirmation || phone.length > 50) {
                fail('Thông tin tạo tài khoản quản trị viên chưa hợp lệ.', 422, {
                    email: ['Hãy kiểm tra họ tên, email và mật khẩu (tối thiểu 10 ký tự) cùng xác nhận mật khẩu.'],
                });
            }
            if (queryRow(db, 'SELECT id FROM users WHERE email = ?', email))
                fail('Email này đã được đăng ký.', 422);
            const now = timestamp();
            const result = db.prepare('INSERT INTO users (name, email, phone, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
                .run(name, email, phone || null, await bcrypt.hash(password, 12), 'admin', now, now);
            const created = queryRow(db, 'SELECT * FROM users WHERE id = ?', Number(result.lastInsertRowid));
            return json({ status: true, message: 'Tạo tài khoản quản trị viên thành công.', data: safeUser(created) }, 201);
        }
        if (method === 'GET' && id && !action) {
            const target = queryRow(db, 'SELECT * FROM users WHERE id = ? AND deleted_at IS NULL', Number(id));
            if (!target)
                fail('Không tìm thấy người dùng.', 404);
            const orders = queryRows(db, 'SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC', Number(id))
                .map((order) => addRelations(db, 'orders', order));
            return json({ status: true, data: { ...addRelations(db, 'users', target), orders } });
        }
        if ((method === 'PATCH' || method === 'PUT') && id) {
            const target = queryRow(db, 'SELECT * FROM users WHERE id = ? AND deleted_at IS NULL', Number(id));
            if (!target)
                fail('Không tìm thấy người dùng.', 404);
            if (Number(id) === user.id && body.role && body.role !== 'admin')
                fail('Không thể hạ quyền tài khoản đang đăng nhập.', 422);
            const updates = {};
            if (typeof body.name === 'string' && body.name.trim())
                updates.name = body.name.trim();
            if (body.phone === null || typeof body.phone === 'string')
                updates.phone = body.phone;
            if (body.role === 'user' || body.role === 'admin')
                updates.role = body.role;
            if (body.is_active !== undefined) {
                if (![0, 1, '0', '1'].includes(body.is_active)) fail('Trạng thái tài khoản không hợp lệ.', 422);
                if (Number(id) === user.id && Number(body.is_active) !== 1) fail('Không thể khóa tài khoản đang đăng nhập.', 422);
                updates.is_active = Number(body.is_active);
                if (!updates.is_active) {
                    db.prepare('DELETE FROM personal_access_tokens WHERE tokenable_id = ?').run(Number(id));
                }
            }
            if (!Object.keys(updates).length)
                fail('Không có dữ liệu để cập nhật.', 422);
            updates.updated_at = timestamp();
            db.prepare(`UPDATE users SET ${Object.keys(updates).map((field) => `${field} = ?`).join(', ')} WHERE id = ?`).run(...Object.values(updates), Number(id));
            return json({ status: true, message: 'Cập nhật người dùng thành công.', data: safeUser(queryRow(db, 'SELECT * FROM users WHERE id = ?', Number(id))) });
        }
    }
    if (resource === 'orders' && method === 'PATCH' && id && action === 'status') {
        const status = String(body.status || '');
        if (!['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status))
            fail('Trạng thái đơn hàng không hợp lệ.', 422);
        return json({ status: true, message: 'Cập nhật trạng thái đơn hàng thành công.', data: changeOrderStatus(db, Number(id), status, undefined, user.id) });
    }
    if (resource === 'reviews' && method === 'PATCH' && id) {
        const review = queryRow(db, 'SELECT * FROM product_reviews WHERE id = ? AND deleted_at IS NULL', Number(id));
        if (!review)
            fail('Không tìm thấy đánh giá.', 404);
        if (![0, 1].includes(Number(body.status)))
            fail('Trạng thái đánh giá không hợp lệ.', 422);
        db.prepare('UPDATE product_reviews SET status = ?, updated_at = ? WHERE id = ?').run(Number(body.status), timestamp(), Number(id));
        return json({ status: true, message: 'Cập nhật đánh giá thành công.', data: queryRow(db, 'SELECT * FROM product_reviews WHERE id = ?', Number(id)) });
    }
    if (resource === 'contacts' && method === 'PATCH' && id) {
        const contact = queryRow(db, 'SELECT * FROM contacts WHERE id = ? AND deleted_at IS NULL', Number(id));
        if (!contact)
            fail('Không tìm thấy liên hệ.', 404);
        const updates = { updated_at: timestamp() };
        if (body.status !== undefined && [0, 1].includes(Number(body.status)))
            updates.status = Number(body.status);
        if (body.reply_detail !== undefined && typeof body.reply_detail === 'string')
            updates.reply_detail = body.reply_detail;
        db.prepare(`UPDATE contacts SET ${Object.keys(updates).map((field) => `${field} = ?`).join(', ')} WHERE id = ?`).run(...Object.values(updates), Number(id));
        return json({ status: true, message: 'Cập nhật liên hệ thành công.', data: queryRow(db, 'SELECT * FROM contacts WHERE id = ?', Number(id)) });
    }
    return null;
}
const settingLabels = new Set([
    'site_name', 'logo_url', 'favicon_url', 'contact_email', 'contact_phone', 'contact_address',
    'social_facebook', 'social_instagram', 'seo_title', 'seo_description',
]);
function handleAdminOperations(db, request, method, segments, url, body) {
    if (segments[0] === 'settings') {
        requireAdmin(request, db);
        if (method === 'GET' && segments.length === 1) return json({ data: getPublicSettings(db) });
        if (method === 'PATCH' && segments.length === 1) {
            const values = body.settings;
            if (!values || typeof values !== 'object' || Array.isArray(values)) fail('Cấu hình gửi lên không hợp lệ.', 422);
            const entries = Object.entries(values);
            if (!entries.length || entries.some(([key, value]) => !settingLabels.has(key) || typeof value !== 'string' || value.length > 2048)) {
                fail('Tên hoặc giá trị cấu hình không hợp lệ.', 422);
            }
            const now = timestamp();
            const save = db.prepare(`
              INSERT INTO app_settings (setting_key, setting_value, updated_at) VALUES (?, ?, ?)
              ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value, updated_at = excluded.updated_at
            `);
            for (const [key, value] of entries) save.run(key, value.trim(), now);
            return json({ message: 'Đã lưu cấu hình website.', data: getPublicSettings(db) });
        }
    }
    if (segments[0] === 'stock') {
        const { user } = requireAdmin(request, db);
        const { page, perPage, offset } = getPagination(url);
        if (method === 'GET' && segments.length === 1) {
            const conditions = [];
            const params = [];
            const productId = url.searchParams.get('product_id');
            if (productId && /^\d+$/.test(productId)) {
                conditions.push('m.product_id = ?');
                params.push(Number(productId));
            }
            const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
            const total = Number(queryRow(db, `SELECT COUNT(*) AS count FROM stock_movements m ${where}`, ...params)?.count || 0);
            const rows = queryRows(db, `
              SELECT m.*, p.name AS product_name, p.qty AS current_stock
              FROM stock_movements m JOIN products p ON p.id = m.product_id
              ${where} ORDER BY m.id DESC LIMIT ? OFFSET ?
            `, ...params, perPage, offset);
            return json({ data: pagination(rows, total, page, perPage, url.toString()) });
        }
        if (method === 'POST' && segments.length === 1) {
            const productId = Number(body.product_id);
            const quantity = Number(body.quantity);
            const type = body.movement_type;
            const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
            if (!Number.isInteger(productId) || productId < 1 || !Number.isInteger(quantity) || quantity < 1
                || quantity > 1_000_000 || !['inbound', 'outbound'].includes(type) || !reason || reason.length > 500) {
                fail('Thông tin phiếu nhập/xuất kho không hợp lệ.', 422);
            }
            const now = timestamp();
            db.exec('BEGIN IMMEDIATE');
            try {
                const product = queryRow(db, 'SELECT id, qty FROM products WHERE id = ? AND deleted_at IS NULL', productId);
                if (!product) fail('Không tìm thấy sản phẩm.', 404);
                if (type === 'outbound' && Number(product.qty) < quantity) fail('Số lượng xuất vượt quá tồn kho.', 422);
                const delta = type === 'inbound' ? quantity : -quantity;
                db.prepare('UPDATE products SET qty = qty + ?, updated_at = ? WHERE id = ?').run(delta, now, productId);
                const result = db.prepare('INSERT INTO stock_movements (product_id, movement_type, quantity, reason, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)')
                    .run(productId, type, quantity, reason, user.id, now);
                db.exec('COMMIT');
                return json({ message: 'Đã cập nhật tồn kho.', data: queryRow(db, `
                  SELECT m.*, p.name AS product_name, p.qty AS current_stock
                  FROM stock_movements m JOIN products p ON p.id = m.product_id WHERE m.id = ?
                `, Number(result.lastInsertRowid)) }, 201);
            } catch (error) {
                db.exec('ROLLBACK');
                throw error;
            }
        }
    }
    return null;
}
async function dispatch(request, segments) {
    const db = getDatabase();
    const method = request.method.toUpperCase();
    const url = new URL(request.url);
    if (segments[0] === 'uploads') return handleUpload(request, db, segments, method);
    let body = {};
    if (!['GET', 'HEAD'].includes(method) && request.headers.get('content-type')?.includes('application/json')) {
        try {
            const parsed = await request.json();
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
                fail('Nội dung yêu cầu không hợp lệ.', 400);
            body = parsed;
        }
        catch (error) {
            if (error instanceof ApiError)
                throw error;
            fail('Yêu cầu cần có nội dung JSON hợp lệ.', 400);
        }
    }
    if (segments[0] === 'settings' || segments[0] === 'stock') {
        const operationsResponse = handleAdminOperations(db, request, method, segments, url, body);
        if (operationsResponse) return operationsResponse;
    }
    if (segments[0] === 'promotions' && segments[1] === 'validate' && method === 'POST') {
        const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
        const subtotal = Number(body.subtotal);
        if (!code || !Number.isFinite(subtotal) || subtotal < 0) fail('Mã hoặc giá trị đơn hàng không hợp lệ.', 422);
        const promotion = queryRow(db, 'SELECT * FROM promotions WHERE code = ? AND status = 1 AND deleted_at IS NULL', code);
        const now = Date.now();
        if (!promotion
            || (promotion.starts_at && Date.parse(String(promotion.starts_at)) > now)
            || (promotion.ends_at && Date.parse(String(promotion.ends_at)) < now)
            || (promotion.usage_limit !== null && Number(promotion.usage_count) >= Number(promotion.usage_limit))
            || subtotal < Number(promotion.min_order)) {
            fail('Mã khuyến mãi không hợp lệ, đã hết hạn hoặc đơn hàng chưa đủ điều kiện.', 422);
        }
        const discountAmount = Math.min(subtotal, promotion.discount_type === 'percentage'
            ? Math.round(subtotal * Number(promotion.discount_value) / 100)
            : Math.round(Number(promotion.discount_value)));
        return json({ data: { code: promotion.code, discount_amount: discountAmount } });
    }
    if (segments[0] === 'admin-setup' && segments[1] === 'status' && method === 'GET') {
        const adminCount = Number(queryRow(db, "SELECT COUNT(*) AS count FROM users WHERE role = 'admin' AND deleted_at IS NULL")?.count || 0);
        return json({ setupRequired: adminCount === 0 });
    }
    if (segments[0] === 'admin-setup' && segments[1] === 'register' && method === 'POST') {
        const name = typeof body.name === 'string' ? body.name.trim() : '';
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        const password = typeof body.password === 'string' ? body.password : '';
        const confirmation = typeof body.password_confirmation === 'string' ? body.password_confirmation : '';
        if (!name || name.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255
            || password.length < 10 || password.length > 128 || password !== confirmation) {
            fail('Hãy kiểm tra họ tên, email và mật khẩu (tối thiểu 10 ký tự) cùng xác nhận mật khẩu.', 422);
        }

        const passwordHash = await bcrypt.hash(password, 12);
        db.exec('BEGIN IMMEDIATE');
        try {
            const adminCount = Number(queryRow(db, "SELECT COUNT(*) AS count FROM users WHERE role = 'admin' AND deleted_at IS NULL")?.count || 0);
            if (adminCount > 0) {
                fail('Admin đầu tiên đã được tạo. Hãy đăng nhập để đăng ký thêm Admin.', 409);
            }

            const existing = queryRow(db, 'SELECT * FROM users WHERE email = ?', email);
            let user;
            if (existing) {
                if (existing.deleted_at || !(await bcrypt.compare(password, String(existing.password)))) {
                    fail('Email đã có tài khoản. Hãy dùng đúng mật khẩu của tài khoản đó hoặc chọn email khác.', 409);
                }
                db.prepare("UPDATE users SET name = ?, role = 'admin', updated_at = ? WHERE id = ?")
                    .run(name, timestamp(), Number(existing.id));
                db.prepare('DELETE FROM personal_access_tokens WHERE tokenable_id = ?').run(Number(existing.id));
                user = queryRow(db, 'SELECT * FROM users WHERE id = ?', Number(existing.id));
            } else {
                const now = timestamp();
                const result = db.prepare('INSERT INTO users (name, email, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
                    .run(name, email, passwordHash, 'admin', now, now);
                user = queryRow(db, 'SELECT * FROM users WHERE id = ?', Number(result.lastInsertRowid));
            }

            const token = createToken(db, user, 'admin-token');
            db.exec('COMMIT');
            return json({ message: 'Tạo tài khoản Admin đầu tiên thành công.', user: safeUser(user), token }, 201);
        } catch (error) {
            db.exec('ROLLBACK');
            throw error;
        }
    }
    if (segments[0] === 'register' && method === 'POST') {
        const name = typeof body.name === 'string' ? body.name.trim() : '';
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        const password = typeof body.password === 'string' ? body.password : '';
        if (!name || name.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || password !== body.password_confirmation) {
            fail('Thông tin đăng ký chưa hợp lệ.', 422, { email: ['Hãy kiểm tra họ tên, email và mật khẩu xác nhận.'] });
        }
        if (queryRow(db, 'SELECT id FROM users WHERE email = ? AND deleted_at IS NULL', email))
            fail('Email này đã được đăng ký.', 422);
        const now = timestamp();
        const result = db.prepare('INSERT INTO users (name, email, phone, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(name, email, typeof body.phone === 'string' && body.phone.trim() ? body.phone.trim() : null, await bcrypt.hash(password, 12), 'user', now, now);
        const user = queryRow(db, 'SELECT * FROM users WHERE id = ?', Number(result.lastInsertRowid));
        return json({ message: 'Đăng ký thành công', user: safeUser(user) }, 201);
    }
    if ((segments[0] === 'login' || segments[0] === 'login-admin') && method === 'POST') {
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        const password = typeof body.password === 'string' ? body.password : '';
        const user = queryRow(db, 'SELECT * FROM users WHERE email = ? AND deleted_at IS NULL', email);
        if (!user || Number(user.is_active ?? 1) !== 1 || !(await bcrypt.compare(password, String(user.password))))
            fail('Email hoặc mật khẩu không đúng.', 401);
        if (segments[0] === 'login-admin' && user.role !== 'admin')
            fail('Bạn không có quyền đăng nhập Admin.', 403);
        return json({
            message: segments[0] === 'login-admin' ? 'Đăng nhập Admin thành công' : 'Đăng nhập thành công',
            user: safeUser(user),
            token: createToken(db, user, segments[0] === 'login-admin' ? 'admin-token' : 'user-token'),
        });
    }
    if (segments[0] === 'password-reset' && segments[1] === 'request' && method === 'POST') {
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
            fail('Hãy nhập địa chỉ email hợp lệ.', 422);
        }
        if (!isSmtpConfigured()) {
            fail(`Chức năng gửi OTP chưa sẵn sàng. Hãy cấu hình: ${getMissingSmtpSettings().join(', ')} trong backend/.env.local.`, 503);
        }
        const now = Date.now();
        const existingCode = queryRow(db, 'SELECT created_at FROM password_reset_codes WHERE email = ?', email);
        if (existingCode && now - Date.parse(`${String(existingCode.created_at).replace(' ', 'T')}Z`) < 60_000) {
            fail('Vui lòng đợi 60 giây trước khi yêu cầu mã mới.', 429);
        }
        const user = queryRow(db, 'SELECT * FROM users WHERE email = ? AND deleted_at IS NULL', email);
        const code = user ? String(randomInt(100000, 1000000)) : null;
        const codeHash = code ? await bcrypt.hash(code, 10) : null;
        const createdAt = timestamp();
        const expiresAt = new Date(now + 10 * 60_000).toISOString();
        db.prepare(`
      INSERT INTO password_reset_codes (email, user_id, code_hash, attempts, expires_at, created_at)
      VALUES (?, ?, ?, 0, ?, ?)
      ON CONFLICT(email) DO UPDATE SET user_id = excluded.user_id, code_hash = excluded.code_hash,
        attempts = 0, expires_at = excluded.expires_at, created_at = excluded.created_at
    `).run(email, user?.id ?? null, codeHash, expiresAt, createdAt);
        if (user && code) {
            try {
                await sendPasswordResetEmail(email, code);
            }
            catch (error) {
                db.prepare('DELETE FROM password_reset_codes WHERE email = ?').run(email);
                console.error('Password reset email delivery failed:', error);
                fail('Không thể gửi email mã xác thực. Vui lòng kiểm tra cấu hình SMTP hoặc thử lại sau.', 503);
            }
        }
        return json({ message: 'Nếu email đã đăng ký, mã xác thực sẽ được gửi đến hộp thư trong vài phút.' }, 202);
    }
    if (segments[0] === 'password-reset' && segments[1] === 'confirm' && method === 'POST') {
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        const code = typeof body.code === 'string' ? body.code.trim() : '';
        const password = typeof body.password === 'string' ? body.password : '';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{6}$/.test(code)
            || password.length < 8 || password !== body.password_confirmation) {
            fail('Email, mã OTP hoặc mật khẩu mới chưa hợp lệ.', 422);
        }
        const reset = queryRow(db, 'SELECT * FROM password_reset_codes WHERE email = ?', email);
        if (!reset || !reset.code_hash || !reset.user_id || Date.parse(String(reset.expires_at)) <= Date.now()
            || Number(reset.attempts) >= 5) {
            fail('Mã xác thực không hợp lệ hoặc đã hết hạn.', 422);
        }
        db.prepare('UPDATE password_reset_codes SET attempts = attempts + 1 WHERE email = ?').run(email);
        if (!(await bcrypt.compare(code, String(reset.code_hash)))) {
            fail('Mã xác thực không hợp lệ hoặc đã hết hạn.', 422);
        }
        const now = timestamp();
        db.prepare('UPDATE users SET password = ?, updated_at = ? WHERE id = ?').run(await bcrypt.hash(password, 12), now, Number(reset.user_id));
        db.prepare('DELETE FROM personal_access_tokens WHERE tokenable_id = ?').run(Number(reset.user_id));
        db.prepare('DELETE FROM password_reset_codes WHERE email = ?').run(email);
        return json({ message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.' });
    }
    if (segments[0] === 'storefront') {
        const storefrontResponse = handleStorefront(db, method, segments.slice(1), url, body, request);
        if (storefrontResponse)
            return storefrontResponse;
    }
    if (segments[0] === 'me' && method === 'GET') {
        const { user } = requireUser(request, db);
        return json({ user: safeUser(user) });
    }
    if (segments[0] === 'me' && (method === 'PATCH' || method === 'PUT')) {
        const { user } = requireUser(request, db);
        const name = typeof body.name === 'string' ? body.name.trim() : '';
        const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
        const address = typeof body.address === 'string' ? body.address.trim() : '';
        if (!name || name.length > 255 || phone.length > 30 || address.length > 2000) {
            fail('Họ tên, số điện thoại hoặc địa chỉ chưa hợp lệ.', 422);
        }
        db.prepare('UPDATE users SET name = ?, phone = ?, address = ?, updated_at = ? WHERE id = ?')
            .run(name, phone || null, address || null, timestamp(), user.id);
        return json({ message: 'Cập nhật hồ sơ thành công.', user: safeUser(queryRow(db, 'SELECT * FROM users WHERE id = ?', user.id)) });
    }
    if (segments[0] === 'logout' && method === 'POST') {
        const { tokenId } = requireUser(request, db);
        db.prepare('DELETE FROM personal_access_tokens WHERE id = ?').run(tokenId);
        return json({ message: 'Đăng xuất thành công.' });
    }
    if (segments[0] === 'orders') {
        const { user } = requireUser(request, db);
        const id = segments[1];
        if (id && segments[2] === 'cancel' && method === 'POST') {
            const order = queryRow(db, 'SELECT * FROM orders WHERE id = ? AND deleted_at IS NULL', Number(id));
            if (!order) fail('Không tìm thấy đơn hàng.', 404);
            if (user.role !== 'admin' && Number(order.user_id) !== user.id) fail('Bạn không có quyền hủy đơn hàng này.', 403);
            if (order.status !== 'pending') fail('Chỉ có thể tự hủy đơn hàng đang chờ xác nhận.', 422);
            return json({ message: 'Đã hủy đơn hàng.', data: changeOrderStatus(db, Number(id), 'cancelled', undefined, user.id) });
        }
        if (id === 'trash' && method === 'GET') {
            requireAdmin(request, db);
            return json(entityList(db, 'orders', url, true));
        }
        if (id === 'force-delete' && method === 'DELETE' && segments[2]) {
            requireAdmin(request, db);
            setDeleted(db, 'orders', Number(segments[2]), 'force');
            return json({ status: true, message: 'Đã xóa vĩnh viễn đơn hàng.' });
        }
        if (id && segments[2] === 'restore' && method === 'POST') {
            requireAdmin(request, db);
            setDeleted(db, 'orders', Number(id), 'restore');
            return json({ status: true, message: 'Khôi phục đơn hàng thành công.' });
        }
        if (id && segments[2] === 'status' && method === 'PATCH') {
            requireAdmin(request, db);
            const shippingFee = body.shipping_fee === undefined ? undefined : Number(body.shipping_fee);
            return json({ status: true, message: 'Cập nhật đơn hàng thành công.', data: changeOrderStatus(db, Number(id), String(body.status || 'pending'), shippingFee, user.id) });
        }
        if (id && segments[2] === 'payment-link' && method === 'POST') {
            requireAdmin(request, db);
            const order = queryRow(db, 'SELECT * FROM orders WHERE id = ? AND deleted_at IS NULL', Number(id));
            if (!order) fail('Không tìm thấy đơn hàng.', 404);
            if (!['vnpay', 'momo'].includes(order.payment_method) || !isPaymentGatewayConfigured(order.payment_method))
                fail('Cổng thanh toán của đơn hàng chưa được cấu hình.', 503);
            if (!order.shipping_confirmed)
                fail('Hãy xác nhận phí vận chuyển trước khi tạo liên kết thanh toán.', 422);
            if (order.payment_status === 'paid' || order.status === 'cancelled')
                fail('Đơn hàng đã thanh toán hoặc đã hủy.', 422);
            const paymentUrl = await createPaymentUrl(order, request);
            db.prepare('UPDATE orders SET payment_url = ?, updated_at = ? WHERE id = ?')
                .run(paymentUrl, timestamp(), Number(id));
            return json({ status: true, message: 'Đã tạo liên kết thanh toán.', data: { payment_url: paymentUrl } });
        }
        if (id && segments[2] === 'payment-status' && method === 'PATCH') {
            requireAdmin(request, db);
            const order = queryRow(db, 'SELECT * FROM orders WHERE id = ? AND deleted_at IS NULL', Number(id));
            if (!order) fail('Không tìm thấy đơn hàng.', 404);
            if (order.payment_method !== 'bank_transfer' || !['paid', 'unpaid'].includes(body.payment_status))
                fail('Chỉ có thể xác nhận trạng thái chuyển khoản thủ công.', 422);
            if (!order.shipping_confirmed)
                fail('Hãy xác nhận phí vận chuyển trước khi cập nhật thanh toán.', 422);
            db.prepare('UPDATE orders SET payment_status = ?, updated_at = ? WHERE id = ?')
                .run(body.payment_status, timestamp(), Number(id));
            return json({ status: true, message: 'Đã cập nhật trạng thái thanh toán.', data: addRelations(db, 'orders', queryRow(db, 'SELECT * FROM orders WHERE id = ?', Number(id))) });
        }
        if (method === 'GET' && !id) {
            return json(listOrders(db, user, url));
        }
        if (method === 'POST' && !id) {
            return json({ status: true, message: 'Đặt hàng thành công.', data: createOrder(db, user, body) }, 201);
        }
        if (method === 'GET' && id) {
            const order = queryRow(db, 'SELECT * FROM orders WHERE id = ? AND deleted_at IS NULL', Number(id));
            if (!order)
                fail('Không tìm thấy đơn hàng.', 404);
            if (user.role !== 'admin' && Number(order.user_id) !== user.id)
                fail('Bạn không có quyền xem đơn hàng này.', 403);
            const data = addRelations(db, 'orders', order);
            return json({
                status: true,
                data: order.payment_method === 'bank_transfer' && order.shipping_confirmed
                    ? { ...data, payment_details: getBankTransferDetails(order) }
                    : data,
            });
        }
        if (method === 'DELETE' && id) {
            requireAdmin(request, db);
            deleteOrder(db, Number(id));
            return json({ status: true, message: 'Đã chuyển đơn hàng vào thùng rác.' });
        }
    }
    if (['banners', 'links', 'categories', 'brands', 'products', 'topics', 'posts', 'pages', 'menus', 'users', 'orders', 'contacts', 'reviews'].includes(segments[0])) {
        const authenticated = requireAdmin(request, db);
        const specialResponse = await handleAdminUser(db, authenticated.user, method, segments, body);
        if (specialResponse)
            return specialResponse;
        const [resource, id, action] = segments;
        if (id === 'trash' && method === 'GET')
            return json(entityList(db, resource, url, true));
        if (id === 'force-delete' && method === 'DELETE' && action) {
            setDeleted(db, resource, Number(action), 'force');
            return json({ status: true, message: 'Đã xóa vĩnh viễn.' });
        }
        if (action === 'restore' && method === 'POST' && id) {
            setDeleted(db, resource, Number(id), 'restore');
            return json({ status: true, message: 'Khôi phục thành công.' });
        }
        const config = resourceMap[resource];
        if (config && method === 'GET' && !id)
            return json(entityList(db, resource, url, false));
        if (config && method === 'GET' && id && !action) {
            const row = queryRow(db, `SELECT * FROM ${config.table} WHERE id = ? AND deleted_at IS NULL`, Number(id));
            if (!row)
                fail('Không tìm thấy bản ghi.', 404);
            return json({ status: true, data: addRelations(db, resource, row) });
        }
        if (config && method === 'POST' && !id) {
            return json({ status: true, message: 'Tạo dữ liệu thành công.', data: createResource(db, resource, body, authenticated.user) }, 201);
        }
        if (config && (method === 'PUT' || method === 'PATCH') && id) {
            return json({ status: true, message: 'Cập nhật thành công.', data: updateResource(db, resource, Number(id), body) });
        }
        if (config && method === 'DELETE' && id) {
            setDeleted(db, resource, Number(id), 'delete', authenticated.user);
            return json({ status: true, message: 'Đã chuyển vào thùng rác.' });
        }
        if (resource === 'users' && method === 'GET' && !id)
            return json(entityList(db, resource, url, false));
        if (resource === 'orders' && method === 'GET' && id === 'trash')
            return json(entityList(db, resource, url, true));
        if ((resource === 'contacts' || resource === 'reviews') && method === 'GET' && !id)
            return json(entityList(db, resource, url, false));
        if (['contacts', 'reviews'].includes(resource) && method === 'GET' && id && !action) {
            const table = softResources[resource];
            const row = queryRow(db, `SELECT * FROM ${table} WHERE id = ? AND deleted_at IS NULL`, Number(id));
            if (!row)
                fail('Không tìm thấy bản ghi.', 404);
            return json({ status: true, data: addRelations(db, resource, row) });
        }
        if (['contacts', 'reviews'].includes(resource) && method === 'DELETE' && id) {
            setDeleted(db, resource, Number(id), 'delete');
            return json({ status: true, message: 'Đã chuyển vào thùng rác.' });
        }
        if (['contacts', 'reviews'].includes(resource) && id === 'force-delete' && action && method === 'DELETE') {
            setDeleted(db, resource, Number(action), 'force');
            return json({ status: true, message: 'Đã xóa vĩnh viễn.' });
        }
    }
    fail('Không tìm thấy API.', 404);
}
export async function handleApiRequest(request, routePath) {
    try {
        return await dispatch(request, routePath);
    }
    catch (error) {
        if (error instanceof ApiError) {
            return json({ status: false, message: error.message, ...(error.errors ? { errors: error.errors } : {}) }, error.status);
        }
        if (error instanceof Error && /UNIQUE constraint failed/.test(error.message)) {
            return json({ status: false, message: 'Giá trị bị trùng, vui lòng kiểm tra lại.' }, 422);
        }
        if (error instanceof Error && /FOREIGN KEY constraint failed|NOT NULL constraint failed/.test(error.message)) {
            return json({ status: false, message: 'Dữ liệu liên kết hoặc trường bắt buộc không hợp lệ.' }, 422);
        }
        console.error('Next.js API request failed:', error);
        return json({ status: false, message: 'Máy chủ không thể xử lý yêu cầu.' }, 500);
    }
}
