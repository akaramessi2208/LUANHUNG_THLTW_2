import Link from 'next/link';
import { notFound } from 'next/navigation';
import { assetUrl } from '@/lib/api';
import { serverApi } from '@/lib/server-api';
import { ApiError } from '@/lib/api';
import { AddToCartButton } from '@/components/AddToCartButton';
import { ReviewForm } from '@/components/ReviewForm';
import { StorefrontAccountActions } from '@/components/StorefrontAccountActions';

async function getProduct(slug) {
  const response = await serverApi(`/storefront/products/${encodeURIComponent(slug)}`);
  return response?.data ?? null;
}

export default async function ProductDetailPage({ params }) {
  const { slug } = await params;
  let result;
  try {
    result = await getProduct(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  if (!result?.product) notFound();
  const { product, reviews, average_rating: averageRating, related_products: relatedProducts = [] } = result;

  return (
    <main className="next-site storefront-product-detail" style={{ background: '#f6f7f3', minHeight: '100vh', paddingBottom: 40 }}>
      <header className="storefront-topbar" style={{ maxWidth: 1200, margin: '0 auto', padding: '24px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <Link className="mecha-brand mecha-brand-light" href="/">LUANHUNG SHOP</Link>
        <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'center' }}>
          <Link href="/">Trang chủ</Link><Link href="/products">Sản phẩm</Link><Link href="/cart">Giỏ hàng</Link>
          <StorefrontAccountActions /><Link href="/admin/login">Admin</Link>
        </nav>
      </header>
      <section style={{ maxWidth: 1100, margin: '32px auto 0', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 28 }}>
        <div className="storefront-detail-image" style={{ position: 'relative', background: '#edf5ee', minHeight: 360, borderRadius: 22, overflow: 'hidden' }}>
          <img src={assetUrl(product.image)} alt={product.name} style={{ width: '100%', height: '100%', minHeight: 360, objectFit: 'cover' }} />
        </div>
        <div style={{ padding: '10px 0' }}>
          <div className="storefront-product-category" style={{ color: '#2d6a4d', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 12 }}>
            {product.category?.name || 'Mô hình mecha'} · {product.brand?.name || 'LUANHUNG SHOP'}
          </div>
          <h1 style={{ margin: '12px 0', fontSize: 42 }}>{product.name}</h1>
          {product.sale_price != null && <del style={{ color: '#68756d' }}>{Number(product.price).toLocaleString('vi-VN')}₫</del>}
          <div className="storefront-product-price" style={{ fontSize: 28, fontWeight: 800, color: '#1c6a3d' }}>
            {Number(product.sale_price ?? product.price).toLocaleString('vi-VN')}₫
          </div>
          <p style={{ color: '#4e5e57', fontSize: 16, lineHeight: 1.7, margin: '18px 0 24px' }}>{product.description}</p>
          <div style={{ fontWeight: 600, color: '#355b46' }}>Tồn kho: {product.qty ?? 0}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 24 }}>
            <AddToCartButton productId={product.id} stock={product.qty ?? 0} />
            <Link href="/products" style={{ padding: '12px 18px', background: '#fff', color: '#1b2d23', borderRadius: 100, border: '1px solid #d9e2d8', fontWeight: 700 }}>Quay lại</Link>
          </div>
        </div>
      </section>
      {relatedProducts.length > 0 && (
        <section style={{ maxWidth: 1100, margin: '40px auto', padding: '0 24px' }}>
          <h2>Sản phẩm liên quan</h2>
          <div className="storefront-product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {relatedProducts.map((item) => (
              <Link key={item.id} href={`/products/${item.slug}`} className="vivid-product-card" style={{ background: '#fff', borderRadius: 16, padding: 14, color: 'inherit', textDecoration: 'none' }}>
                <img src={assetUrl(item.image)} alt={item.name} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 12 }} />
                <strong style={{ display: 'block', marginTop: 10 }}>{item.name}</strong>
                <span>{Number(item.sale_price ?? item.price).toLocaleString('vi-VN')}₫</span>
              </Link>
            ))}
          </div>
        </section>
      )}
      <section style={{ maxWidth: 1100, margin: '40px auto', padding: '0 24px' }}>
        <h2>Đánh giá sản phẩm {averageRating ? `· ${Number(averageRating).toFixed(1)} / 5` : ''}</h2>
        {(reviews?.data ?? []).map((review) => (
          <article key={review.id} className="table-card" style={{ padding: 18, marginBottom: 12 }}>
            <strong>{review.name}</strong><span style={{ marginLeft: 10, color: '#ca8a04' }}>{'★'.repeat(review.rating)}</span>
            <p>{review.comment}</p>
          </article>
        ))}
        <ReviewForm slug={product.slug} />
      </section>
    </main>
  );
}
