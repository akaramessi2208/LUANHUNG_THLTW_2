'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { browserApi } from '@/lib/api';
import { authService } from '@/lib/services/authService';

const settingFields = [
  ['site_name', 'Tên website'],
  ['logo_url', 'Đường dẫn logo'],
  ['favicon_url', 'Đường dẫn favicon'],
  ['contact_email', 'Email liên hệ'],
  ['contact_phone', 'Số điện thoại liên hệ'],
  ['contact_address', 'Địa chỉ liên hệ'],
  ['social_facebook', 'Facebook'],
  ['social_instagram', 'Instagram'],
  ['seo_title', 'SEO mặc định - tiêu đề'],
  ['seo_description', 'SEO mặc định - mô tả'],
];

export function AdminOperationsPage({ mode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [settings, setSettings] = useState({});
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [form, setForm] = useState({ product_id: '', movement_type: 'inbound', quantity: '1', reason: '' });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (mode === 'settings') {
        const response = await browserApi('settings');
        setSettings(response.data || {});
      } else {
        const [productResponse, movementResponse] = await Promise.all([
          browserApi('products?per_page=100'),
          browserApi('stock?per_page=50'),
        ]);
        setProducts(productResponse.data?.data || []);
        setMovements(movementResponse.data?.data || []);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể tải dữ liệu quản trị.');
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    let active = true;
    authService.currentUser()
      .then((response) => {
        if (!active) return;
        if (response.user?.role !== 'admin') {
          router.replace('/admin/login');
          return;
        }
        setReady(true);
      })
      .catch(() => {
        if (active) router.replace('/admin/login');
      });
    return () => { active = false; };
  }, [router]);

  useEffect(() => {
    if (ready) void loadData();
  }, [ready, loadData]);

  const saveSettings = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await browserApi('settings', {
        method: 'PATCH',
        body: JSON.stringify({ settings }),
      });
      setSettings(response.data || settings);
      setMessage(response.message || 'Đã lưu cấu hình website.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể lưu cấu hình.');
    } finally {
      setSaving(false);
    }
  };

  const createMovement = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await browserApi('stock', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          product_id: Number(form.product_id),
          quantity: Number(form.quantity),
        }),
      });
      setMessage(response.message || 'Đã cập nhật tồn kho.');
      setForm((current) => ({ ...current, quantity: '1', reason: '' }));
      await loadData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể cập nhật tồn kho.');
    } finally {
      setSaving(false);
    }
  };

  if (!ready) return <main className="next-detail"><p>Đang kiểm tra phiên Admin...</p></main>;
  const title = mode === 'settings' ? 'Cấu hình website' : 'Quản lý kho';

  return (
    <main className="next-detail">
      <Link href="/admin">← Về trang quản trị</Link>
      <nav aria-label="Công cụ quản trị" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, margin: '16px 0' }}>
        <Link href="/admin/promotions">Mã khuyến mãi</Link>
        <Link href="/admin/inventory">Quản lý kho</Link>
        <Link href="/admin/settings">Cấu hình website</Link>
      </nav>
      <h1>{title}</h1>
      {message && <div className="next-message" role="status">{message}</div>}
      {error && <div className="next-message next-error" role="alert">{error}</div>}
      {loading ? <p>Đang tải dữ liệu...</p> : mode === 'settings' ? (
        <form className="next-form" onSubmit={saveSettings}>
          {settingFields.map(([key, label]) => (
            <label key={key}>
              {label}
              {key === 'seo_description' || key === 'contact_address'
                ? <textarea maxLength={2048} value={settings[key] || ''} onChange={(event) => setSettings((current) => ({ ...current, [key]: event.target.value }))} />
                : <input maxLength={2048} value={settings[key] || ''} onChange={(event) => setSettings((current) => ({ ...current, [key]: event.target.value }))} />}
            </label>
          ))}
          <button className="store-button" type="submit" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu cấu hình'}</button>
        </form>
      ) : (
        <>
          <form className="next-form" onSubmit={createMovement}>
            <label>Sản phẩm
              <select required value={form.product_id} onChange={(event) => setForm((current) => ({ ...current, product_id: event.target.value }))}>
                <option value="">-- Chọn sản phẩm --</option>
                {products.map((product) => <option key={product.id} value={product.id}>{product.name} (tồn: {product.qty})</option>)}
              </select>
            </label>
            <label>Loại phiếu
              <select value={form.movement_type} onChange={(event) => setForm((current) => ({ ...current, movement_type: event.target.value }))}>
                <option value="inbound">Nhập kho</option>
                <option value="outbound">Xuất kho</option>
              </select>
            </label>
            <label>Số lượng
              <input type="number" min="1" max="1000000" required value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} />
            </label>
            <label>Lý do
              <input maxLength={500} required value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} />
            </label>
            <button className="store-button" type="submit" disabled={saving}>{saving ? 'Đang cập nhật...' : 'Tạo phiếu kho'}</button>
          </form>
          <h2>Lịch sử nhập / xuất kho</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Thời gian</th><th>Sản phẩm</th><th>Loại</th><th>Số lượng</th><th>Tồn hiện tại</th><th>Lý do</th></tr></thead>
              <tbody>
                {movements.map((movement) => (
                  <tr key={movement.id}>
                    <td>{new Date(movement.created_at).toLocaleString('vi-VN')}</td>
                    <td>{movement.product_name}</td>
                    <td>{movement.movement_type === 'inbound' ? 'Nhập' : 'Xuất'}</td>
                    <td>{movement.quantity}</td>
                    <td>{movement.current_stock}</td>
                    <td>{movement.reason}</td>
                  </tr>
                ))}
                {!movements.length && <tr><td colSpan="6">Chưa có phiếu nhập/xuất.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
