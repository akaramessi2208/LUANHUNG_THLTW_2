import Link from 'next/link';
import { StorefrontAccountActions } from '@/components/StorefrontAccountActions';
import { serverApi } from '@/lib/server-api';
import { assetUrl } from '@/lib/api';

export async function ShopLayout({ children }) {
  const settingsResponse = await serverApi('/storefront/settings');
  const settings = settingsResponse?.data || {};
  return (
    <div className="shop-layout">
      <header className="shop-layout-header">
        <Link className="shop-layout-brand" href="/" aria-label="LUANHUNG SHOP - Trang chủ">
          {settings.logo_url
            ? <img src={assetUrl(settings.logo_url)} alt={settings.site_name || 'LUANHUNG SHOP'} style={{ maxHeight: 44, maxWidth: 200 }} />
            : <><span className="shop-layout-brand-mark" aria-hidden="true">L</span><span>{settings.site_name || 'LUANHUNG'} <strong>{settings.site_name ? '' : 'SHOP'}</strong></span></>}
        </Link>
        <nav className="shop-layout-nav" aria-label="Điều hướng cửa hàng">
          <Link href="/">Trang chủ</Link>
          <Link href="/products">Sản phẩm</Link>
          <Link href="/articles">Bài viết</Link>
          <Link href="/contact">Liên hệ</Link>
        </nav>
        <div className="shop-layout-actions">
          <StorefrontAccountActions />
          <Link className="shop-layout-cart" href="/cart">Giỏ hàng</Link>
        </div>
      </header>
      {children}
      <footer className="shop-layout-footer">
        <Link className="shop-layout-footer-brand" href="/">{settings.site_name || 'LUANHUNG SHOP'}</Link>
        <span>Mô hình robot lắp ráp và phụ kiện dành cho builder.</span>
        {(settings.contact_email || settings.contact_phone || settings.contact_address) && (
          <address>
            {settings.contact_email && <div><a href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a></div>}
            {settings.contact_phone && <div><a href={`tel:${settings.contact_phone}`}>{settings.contact_phone}</a></div>}
            {settings.contact_address && <div>{settings.contact_address}</div>}
          </address>
        )}
        <nav aria-label="Liên kết cuối trang">
          <Link href="/orders">Đơn hàng</Link>
          <Link href="/contact">Hỗ trợ</Link>
          {settings.social_facebook && <a href={settings.social_facebook} target="_blank" rel="noreferrer">Facebook</a>}
          {settings.social_instagram && <a href={settings.social_instagram} target="_blank" rel="noreferrer">Instagram</a>}
        </nav>
      </footer>
    </div>
  );
}
