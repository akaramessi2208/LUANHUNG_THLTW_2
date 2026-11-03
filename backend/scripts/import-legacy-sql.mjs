import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { getDatabase, timestamp } from '../lib/database.js';

function extractRows(sql, table) {
  const expression = new RegExp(
    `INSERT INTO\\s+\`${table}\`\\s*\\(([\\s\\S]*?)\\)\\s*VALUES\\s*`,
    'i',
  );
  const match = expression.exec(sql);
  if (!match) return [];

  const columns = match[1].split(',').map((column) => column.replaceAll('`', '').trim());
  const valuesStart = match.index + match[0].length;
  let valuesEnd = valuesStart;
  let statementInString = false;
  for (; valuesEnd < sql.length; valuesEnd += 1) {
    const character = sql[valuesEnd];
    if (character === "'" && statementInString && sql[valuesEnd + 1] === "'") {
      valuesEnd += 1;
    } else if (character === "'") {
      statementInString = !statementInString;
    } else if (character === ';' && !statementInString) {
      break;
    }
  }
  if (valuesEnd === sql.length) throw new Error(`Missing semicolon after ${table} INSERT.`);
  const values = sql.slice(valuesStart, valuesEnd);
  const tuples = [];
  let tupleStart = -1;
  let depth = 0;
  let inString = false;

  for (let index = 0; index < values.length; index += 1) {
    const character = values[index];
    if (character === "'" && inString && values[index + 1] === "'") {
      index += 1;
      continue;
    }
    if (character === "'") {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (character === '(') {
      if (depth === 0) tupleStart = index;
      depth += 1;
    } else if (character === ')') {
      depth -= 1;
      if (depth === 0 && tupleStart >= 0) {
        tuples.push(values.slice(tupleStart + 1, index));
        tupleStart = -1;
      }
    }
  }

  return tuples.map((tuple) => {
    const fields = [];
    let start = 0;
    let nested = 0;
    let quoted = false;
    for (let index = 0; index < tuple.length; index += 1) {
      const character = tuple[index];
      if (character === "'" && quoted && tuple[index + 1] === "'") {
        index += 1;
        continue;
      }
      if (character === "'") quoted = !quoted;
      else if (!quoted && character === '(') nested += 1;
      else if (!quoted && character === ')') nested -= 1;
      else if (!quoted && nested === 0 && character === ',') {
        fields.push(tuple.slice(start, index).trim());
        start = index + 1;
      }
    }
    fields.push(tuple.slice(start).trim());
    if (fields.length !== columns.length) {
      throw new Error(`Unexpected column count in ${table} SQL row.`);
    }
    return Object.fromEntries(columns.map((column, index) => [column, fields[index]]));
  });
}

function parseValue(expression) {
  const value = expression.trim();
  if (/^NULL$/i.test(value)) return null;
  if (/^'.*'$/s.test(value)) return value.slice(1, -1).replaceAll("''", "'");
  if (/^-?\d+(?:\.\d+)?$/.test(value)) return Number(value);
  const slug = /WHERE\s+`slug`\s*=\s*'((?:''|[^'])*)'/i.exec(value)?.[1];
  if (slug) return { lookupSlug: slug.replaceAll("''", "'") };
  throw new Error(`Unsupported SQL value in legacy catalog: ${value.slice(0, 80)}`);
}

const sourcePath = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'legacy-data', 'luanhung-export.sql');
const sql = await readFile(sourcePath, 'utf8');
const db = getDatabase();
const now = timestamp();
const brands = extractRows(sql, 'brands');
const categories = extractRows(sql, 'categories');
const products = extractRows(sql, 'products');

if (!brands.length || !categories.length || !products.length) {
  throw new Error('Legacy SQL must contain INSERT data for brands, categories, and products.');
}

const upsertBrand = db.prepare(`
  INSERT INTO brands (name, slug, image, sort_order, status, deleted_at, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, NULL, ?, ?)
  ON CONFLICT(slug) DO UPDATE SET
    name = excluded.name, image = excluded.image, sort_order = excluded.sort_order,
    status = excluded.status, deleted_at = NULL, updated_at = excluded.updated_at
`);
const upsertCategory = db.prepare(`
  INSERT INTO categories (name, slug, description, image, sort_order, status, deleted_at, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)
  ON CONFLICT(slug) DO UPDATE SET
    name = excluded.name, description = excluded.description, image = excluded.image,
    sort_order = excluded.sort_order, status = excluded.status, deleted_at = NULL,
    updated_at = excluded.updated_at
`);
const upsertProduct = db.prepare(`
  INSERT INTO products (category_id, brand_id, name, slug, price, sale_price, description, image, qty, status, deleted_at, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
  ON CONFLICT(slug) DO UPDATE SET
    category_id = excluded.category_id, brand_id = excluded.brand_id, name = excluded.name,
    price = excluded.price, sale_price = excluded.sale_price, description = excluded.description,
    image = excluded.image, status = excluded.status, deleted_at = NULL,
    updated_at = excluded.updated_at
`);
const findId = (table) => db.prepare(`SELECT id FROM ${table} WHERE slug = ?`);

db.exec('BEGIN IMMEDIATE');
try {
  for (const raw of brands) {
    const row = Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, parseValue(value)]));
    upsertBrand.run(row.name, row.slug, row.image ?? null, row.sort_order ?? 0, row.status ?? 1, now, now);
  }
  for (const raw of categories) {
    const row = Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, parseValue(value)]));
    upsertCategory.run(row.name, row.slug, row.description ?? null, row.image ?? null, row.sort_order ?? 0, row.status ?? 1, now, now);
  }
  for (const raw of products) {
    const row = Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, parseValue(value)]));
    const categorySlug = row.category_id?.lookupSlug;
    const brandSlug = row.brand_id?.lookupSlug;
    const categoryId = categorySlug ? findId('categories').get(categorySlug)?.id : null;
    const brandId = brandSlug ? findId('brands').get(brandSlug)?.id : null;
    if (!categoryId || !brandId) {
      throw new Error(`Product "${row.slug}" references a missing category or brand.`);
    }
    upsertProduct.run(categoryId, brandId, row.name, row.slug, row.price, row.sale_price, row.description ?? null, row.image ?? null, row.qty ?? 0, row.status ?? 1, now, now);
  }
  db.exec('COMMIT');
} catch (error) {
  db.exec('ROLLBACK');
  db.close();
  throw error;
}

const result = {
  brands: brands.length,
  categories: categories.length,
  products: products.length,
  unsupportedTables: ['banners', 'configs', 'contacts', 'links', 'orders', 'order_details', 'pages', 'posts', 'topics', 'users'],
};
console.log(`Imported ${result.brands} brands, ${result.categories} categories, and ${result.products} products from ${sourcePath}.`);
console.log(`Skipped legacy tables without usable data: ${result.unsupportedTables.join(', ')}.`);
db.close();
