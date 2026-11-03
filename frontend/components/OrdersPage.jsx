'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { browserApi, formatMoney } from '@/lib/api';

const orderStatuses = {
  pending: 'Chờ xử lý',
  processing: 'Đang xử lý',
  shipped: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
};

const paymentNames = {
  cod: 'Thanh toán khi nhận hàng',
  bank_transfer: 'Chuyển khoản ngân hàng',
  vnpay: 'VNPay',
  momo: 'MoMo',
  bank_transfer_demo: 'Chuyển khoản ngân hàng',
  momo_demo: 'MoMo',
  visa_demo: 'Thẻ Visa',
  credit_card_demo: 'Thẻ tín dụng',
};

const demoPaymentMethods = new Set(['bank_transfer_demo', 'momo_demo', 'visa_demo', 'credit_card_demo']);

const deliverySteps = [
  { key: 'pending', label: 'Đã đặt hàng' },
  { key: 'processing', label: 'Đang xử lý' },
  { key: 'shipped', label: 'Đang giao' },
  { key: 'delivered', label: 'Đã giao' },
];

function getDeliveryTimeline(order) {
  if (order.status === 'cancelled') {
    return [{ key: 'cancelled', label: 'Đã hủy', complete: true, active: true }];
  }

  const currentIndex = deliverySteps.findIndex((step) => step.key === order.status);
  return deliverySteps.map((step, index) => ({
    ...step,
    complete: currentIndex >= 0 && index < currentIndex,
    active: step.key === order.status,
  }));
}

export function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await browserApi('orders?per_page=20');
      setOrders(response.data?.data ?? []);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Không thể tải đơn hàng.';
      setError(message);
      if (message.includes('đăng nhập')) router.replace('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const cancelOrder = async (orderId) => {
    setError('');
    try {
      await browserApi(`orders/${orderId}/cancel`, { method: 'POST' });
      await loadOrders();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể hủy đơn hàng.');
    }
  };

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  return (
    <main className="next-detail">
      <Link href="/">← Về trang chủ</Link>
      <h1>Đơn hàng của tôi</h1>
      {!loading && <button type="button" className="button button-light" onClick={loadOrders}>Tải lại đơn hàng</button>}
      {error && <div className="next-message next-error" role="alert">{error}</div>}
      {loading ? <p>Đang tải đơn hàng...</p> : orders.length === 0 ? (
        <div className="store-empty">
          <strong>Bạn chưa có đơn hàng</strong>
          <p>Đơn hàng sau khi đặt sẽ xuất hiện tại đây.</p>
          <Link href="/products">Mua sắm ngay</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {orders.map((order) => (
            <section className="table-card" style={{ padding: 20 }} key={order.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <strong>{order.order_number}</strong>
                <span>{orderStatuses[order.status] ?? order.status}</span>
                <span>{new Date(order.created_at).toLocaleDateString('vi-VN')}</span>
              </div>
              <ul>
                {(order.items || []).map((item) => (
                  <li key={item.id}>
                    {item.product_name} × {item.quantity} — {formatMoney(Number(item.line_total))}
                  </li>
                ))}
              </ul>
              <p>Thanh toán: {paymentNames[order.payment_method] || order.payment_method} · {order.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</p>
              {demoPaymentMethods.has(order.payment_method) && (
                <div className="next-message" role="note">
                  Phương thức thanh toán mô phỏng — không có khoản tiền nào được thu.
                </div>
              )}
              <p>
                Tạm tính: {formatMoney(Number(order.subtotal))} · Phí vận chuyển:{' '}
                {order.shipping_confirmed ? formatMoney(Number(order.shipping_fee)) : 'Chờ cửa hàng xác nhận'}
              </p>
              <strong>Tổng cộng: {formatMoney(Number(order.total))}</strong>
              {Number(order.discount_amount) > 0 && (
                <p>Mã giảm giá {order.promotion_code}: -{formatMoney(Number(order.discount_amount))}</p>
              )}
              {order.status === 'pending' && (
                <p><button type="button" className="button button-light" onClick={() => cancelOrder(order.id)}>Hủy đơn hàng</button></p>
              )}
              {order.status_history?.length > 0 && (
                <div className="next-message">
                  <strong>Lịch sử trạng thái</strong>
                  <ul>{order.status_history.map((entry) => (
                    <li key={`${entry.status}-${entry.created_at}`}>
                      {orderStatuses[entry.status] || entry.status} · {new Date(entry.created_at).toLocaleString('vi-VN')}
                      {entry.note ? ` — ${entry.note}` : ''}
                    </li>
                  ))}</ul>
                </div>
              )}

              <div className="next-message" role="note">
                <strong>Lịch sử giao hàng</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
                  {getDeliveryTimeline(order).map((step) => {
                    const isComplete = step.complete || step.active;
                    return (
                      <div
                        key={step.key}
                        style={{
                          flex: '1 1 140px',
                          minWidth: 140,
                          padding: '10px 12px',
                          borderRadius: 10,
                          border: `1px solid ${isComplete ? '#1d8f5f' : '#d7dfea'}`,
                          background: step.active ? '#e9f9f3' : step.complete ? '#f3fbf7' : '#fff',
                          color: isComplete ? '#134c38' : '#5d5d72',
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                          {isComplete ? 'Hoàn tất' : 'Chờ'}
                        </div>
                        <div style={{ marginTop: 6, fontWeight: 600 }}>{step.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {order.payment_method === 'bank_transfer' && order.shipping_confirmed && order.payment_details && (
                <div className="next-message">
                  <strong>Thông tin chuyển khoản</strong>
                  {order.payment_details.bank_name && <p>Ngân hàng: {order.payment_details.bank_name}</p>}
                  {order.payment_details.account_number && <p>Số tài khoản: {order.payment_details.account_number}</p>}
                  {order.payment_details.account_name && <p>Chủ tài khoản: {order.payment_details.account_name}</p>}
                  <p>Số tiền: {formatMoney(order.payment_details.amount)}</p>
                  <p>Nội dung chuyển khoản: <strong>{order.payment_details.transfer_content}</strong></p>
                  {order.payment_details.qr_code_url && (
                    <div style={{ marginTop: 12 }}>
                      <p><strong>Quét mã QR để thanh toán</strong></p>
                      <a href={order.payment_details.qr_code_url} target="_blank" rel="noreferrer">
                        <img
                          src={order.payment_details.qr_code_url}
                          alt="Mã QR chuyển khoản"
                          style={{
                            width: 220,
                            height: 220,
                            background: '#fff',
                            borderRadius: 12,
                            border: '1px solid #d7dfea',
                            padding: 8,
                            display: 'block',
                          }}
                        />
                      </a>
                    </div>
                  )}
                </div>
              )}
              {['vnpay', 'momo'].includes(order.payment_method) && order.shipping_confirmed && order.payment_status !== 'paid' && (
                order.payment_url
                  ? <p><a className="button button-primary" href={order.payment_url} target="_blank" rel="noreferrer">Thanh toán qua {paymentNames[order.payment_method]}</a></p>
                  : <p>Cửa hàng đang chuẩn bị liên kết thanh toán. Hãy tải lại trang sau.</p>
              )}
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
