import Link from 'next/link';
import { assetUrl } from '@/lib/api';
import { serverApi } from '@/lib/server-api';
import { StorefrontAccountActions } from '@/components/StorefrontAccountActions';

export const dynamic = 'force-dynamic';

async function getHomeData() {
  const response = await serverApi('/storefront/home');
  return response?.data ?? {};
}

function ProductGrid({ title, products = [] }) {
  if (!products.length) return null;
  return (
    <section style={{ maxWidth: 1200, margin: '48px auto', padding: '0 24px' }}>
      <h2>{title}</h2>
      <div className="storefront-product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
        {products.map((product) => (
          <Link key={product.id} href={`/products/${product.slug}`} className="vivid-product-card" style={{ background: '#fff', borderRadius: 18, padding: 16, color: 'inherit', textDecoration: 'none' }}>
            <div style={{ height: 180, borderRadius: 14, overflow: 'hidden', background: '#edf5ee' }}>
              <img src={assetUrl(product.image)} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <strong style={{ display: 'block', marginTop: 14 }}>{product.name}</strong>
            <span style={{ color: '#5e6a62', fontSize: 13 }}>{product.category?.name || 'Mô hình mecha'} · {product.brand?.name || 'LUANHUNG SHOP'}</span>
            <strong style={{ display: 'block', marginTop: 10, color: '#1f6a3d' }}>
              {Number(product.sale_price ?? product.price).toLocaleString('vi-VN')}₫
            </strong>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default async function HomePage() {
  const {
    hot_products: hotProducts = [],
    new_products: newProducts = [],
    latest_posts: latestPosts = [],
    banners = [],
    categories = [],
    settings = {},
  } = await getHomeData();

  return (
    <main className="next-site storefront-home" style={{ background: '#f6f7f3', minHeight: '100vh' }}>
      <header className="storefront-topbar" style={{ maxWidth: 1200, margin: '0 auto', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <Link className="mecha-brand" href="/">{settings.site_name || 'LUANHUNG SHOP'}</Link>
        <nav aria-label="Điều hướng cửa hàng" style={{ display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'center', color: '#304e3c', fontSize: 14 }}>
          <Link href="/">Trang chủ</Link>
          <Link href="/products">Sản phẩm</Link>
          <Link href="/articles">Bài viết</Link>
          <Link href="/contact">Liên hệ</Link>
          <StorefrontAccountActions />
          <Link href="/cart">Giỏ hàng</Link>
          <Link href="/orders">Đơn hàng</Link>
        </nav>
      </header>

      <section style={{ maxWidth: 1200, margin: '16px auto 0', padding: '0 24px' }}>
        <div className="storefront-hero" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 28, alignItems: 'center', background: '#1e532f', color: '#fff', borderRadius: 24, padding: 30 }}>
          <div>
            <div className="mecha-eyebrow">{settings.site_name || 'LUANHUNG SHOP'} · SERIES 01</div>
            <h1 style={{ fontSize: 52, lineHeight: 1.1, margin: '12px 0' }}>Lắp ráp<br />ý tưởng của bạn.</h1>
            <p style={{ fontSize: 18, opacity: 0.9, maxWidth: 520 }}>Khám phá mô hình robot nguyên bản, phụ kiện lắp ráp và góc trưng bày dành cho builder.</p>
            <Link href="/products" style={{ display: 'inline-block', marginTop: 16, padding: '12px 18px', background: '#fff', color: '#1c3d2a', borderRadius: 999, fontWeight: 700 }}>Khám phá mô hình</Link>
          </div>
          <div className="storefront-hero-visual" style={{ overflow: 'hidden', borderRadius: 20, minHeight: 300 }}>
            <img src={assetUrl(banners[0]?.image || '/images/mecha-model-photo.jpg')} alt={banners[0]?.title || 'Mô hình robot lắp ráp'} style={{ width: '100%', height: 320, objectFit: 'cover' }} />
          </div>
        </div>
      </section>

      {banners.length > 0 && (
        <section aria-label="Banner cửa hàng" style={{ maxWidth: 1200, margin: '32px auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {banners.map((banner) => (
            <Link key={banner.id} href={banner.url || '/products'} style={{ display: 'block', borderRadius: 16, overflow: 'hidden', background: '#fff' }}>
              {banner.image && <img src={assetUrl(banner.image)} alt={banner.title} style={{ width: '100%', height: 180, objectFit: 'cover' }} />}
              <strong style={{ display: 'block', padding: 14 }}>{banner.title}</strong>
            </Link>
          ))}
        </section>
      )}

      {categories.length > 0 && (
        <section style={{ maxWidth: 1200, margin: '44px auto', padding: '0 24px' }}>
          <h2>Danh mục nổi bật</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
            {categories.map((category) => (
              <Link key={category.id} href={`/products?category=${category.id}`} style={{ background: '#fff', borderRadius: 14, padding: 16, color: 'inherit', textDecoration: 'none' }}>
                {category.image && <img src={assetUrl(category.image)} alt="" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 10 }} />}
                <strong style={{ display: 'block', marginTop: 8 }}>{category.name}</strong>
              </Link>
            ))}
          </div>
        </section>
      )}

      <ProductGrid title="Sản phẩm bán chạy" products={hotProducts} />
      <ProductGrid title="Sản phẩm mới" products={newProducts} />

      {latestPosts.length > 0 && (
        <section style={{ maxWidth: 1200, margin: '48px auto 80px', padding: '0 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <h2>Bài viết mới nhất</h2><Link href="/articles">Xem tất cả</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
            {latestPosts.map((post) => (
              <article key={post.id} className="table-card" style={{ padding: 18 }}>
                {post.image && <img src={assetUrl(post.image)} alt="" style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 10 }} />}
                <small>{post.topic?.name || 'Bài viết'}</small>
                <h3><Link href={`/articles/${post.slug}`}>{post.title}</Link></h3>
                <p>{post.description}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
