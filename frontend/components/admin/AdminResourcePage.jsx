'use client';

import { AdminCatalogManager } from '@/components/AdminCatalogManager';
import Link from 'next/link';
import { useState } from 'react';

export function AdminResourcePage({ resource, openCreateOnLoad = false }) {
  const [filters, setFilters] = useState({ q: '', status: '', from: '', to: '' });
  const statusLabel = resource === 'orders' ? 'Trạng thái đơn' : resource === 'users' ? 'Tình trạng tài khoản' : 'Trạng thái';
  return (
    <>
      <nav aria-label="Công cụ quản trị" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, margin: '20px 24px 0' }}>
        <Link href="/admin/promotions">Mã khuyến mãi</Link>
        <Link href="/admin/inventory">Quản lý kho</Link>
        <Link href="/admin/settings">Cấu hình website</Link>
      </nav>
      <form className="next-form" onSubmit={(event) => event.preventDefault()} style={{ margin: '20px 24px', padding: 16, display: 'flex', flexWrap: 'wrap', alignItems: 'end', gap: 12 }}>
        <label style={{ flex: '1 1 220px' }}>Tìm kiếm
          <input value={filters.q} onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} placeholder="Nhập từ khóa..." />
        </label>
        <label>{statusLabel}
          <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
            <option value="">Tất cả</option>
            {resource === 'orders' ? <>
              <option value="pending">Chờ xác nhận</option>
              <option value="processing">Đã xác nhận</option>
              <option value="shipped">Đang giao</option>
              <option value="delivered">Hoàn tất</option>
              <option value="cancelled">Đã hủy</option>
            </> : <>
              <option value="1">{resource === 'users' ? 'Đang hoạt động' : 'Hiển thị / Đã xử lý'}</option>
              <option value="0">{resource === 'users' ? 'Đã khóa' : 'Ẩn / Chưa xử lý'}</option>
            </>}
          </select>
        </label>
        {resource === 'orders' && <>
          <label>Từ ngày<input type="date" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} /></label>
          <label>Đến ngày<input type="date" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} /></label>
        </>}
      </form>
      <AdminCatalogManager
        key={resource}
        initialResource={resource}
        openCreateOnLoad={openCreateOnLoad}
        searchQuery={filters.q}
        statusFilter={filters.status}
        dateFrom={filters.from}
        dateTo={filters.to}
      />
    </>
  );
}
