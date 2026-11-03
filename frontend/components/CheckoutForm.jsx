'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatMoney } from '@/lib/api';
import { ClientService } from '@/lib/ClientService';
import { getAuthToken } from '@/lib/cookieHelper';
import { authService } from '@/lib/services/authService';

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

function isCartLine(value) {
  return value
    && Number.isInteger(value.product_id)
    && value.product_id > 0
    && Number.isInteger(value.quantity)
    && value.quantity > 0;
}

export function CheckoutForm() {
  const router = useRouter();
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [methods, setMethods] = useState([]);
  const [user, setUser] = useState(undefined);
  const [cartLoading, setCartLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);
  const [promotionPreview, setPromotionPreview] = useState(null);
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    shipping_address: '',
    payment_method: 'cod',
    promotion_code: '',
    note: '',
  });

  useEffect(() => {
    let active = true;
    try {
      const saved = JSON.parse(localStorage.getItem('cart') || '[]');
      if (!Array.isArray(saved)) {
        setError('Giỏ hàng không hợp lệ.');
        setCart([]);
      } else {
        const valid = saved.filter(isCartLine);
        if (valid.length !== saved.length) setError('Một số sản phẩm trong giỏ hàng không hợp lệ.');
        setCart(valid);
      }
    } catch {
      setError('Không thể đọc giỏ hàng trên trình duyệt.');
      setCart([]);
    } finally {
      setCartLoading(false);
    }

    ClientService.getPaymentMethods()
      .then((response) => {
        if (active) setMethods((response.data || []).filter((method) => method.available));
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Không thể tải phương thức thanh toán.');
      });

    if (!getAuthToken()) {
      setUser(null);
    } else {
      authService.currentUser()
        .then((response) => {
          if (!active) return;
          const account = response.user;
          setUser(account);
          setForm((current) => ({
            ...current,
            customer_name: account.name || current.customer_name,
            customer_email: account.email || current.customer_email,
            customer_phone: account.phone || current.customer_phone,
            shipping_address: account.address || current.shipping_address,
          }));
        })
        .catch((requestError) => {
          if (!active) return;
          if (requestError instanceof Error && requestError.message.includes('Vui lòng đăng nhập')) {
            setUser(null);
          } else {
            setError(requestError instanceof Error ? requestError.message : 'Không thể kiểm tra tài khoản.');
            setUser(null);
          }
        });
    }

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!cart.length) {
      setProducts([]);
      setProductsLoading(false);
      return;
    }
    let active = true;
    setProductsLoading(true);
    ClientService.getCartProducts(cart.map((line) => line.product_id))
      .then((response) => {
        if (active) setProducts(response.data || []);
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Không thể kiểm tra sản phẩm trong giỏ.');
      })
      .finally(() => {
        if (active) setProductsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [cart]);

  const subtotal = useMemo(() => products.reduce((sum, product) => {
    const quantity = cart.find((line) => line.product_id === product.id)?.quantity || 0;
    return sum + Number(product.sale_price ?? product.price) * quantity;
  }, 0), [cart, products]);
  const unavailableProduct = cart.some((line) => !products.some((product) => product.id === line.product_id));
  const stockIssue = products.some((product) => (
    (cart.find((line) => line.product_id === product.id)?.quantity || 0) > Number(product.qty)
  ));

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const checkPromotion = async () => {
    setError('');
    setPromotionPreview(null);
    try {
      const result = await ClientService.request('promotions/validate', {
        method: 'POST',
        body: JSON.stringify({ code: form.promotion_code, subtotal }),
      });
      setPromotionPreview(result.data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Mã khuyến mãi không hợp lệ.');
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!cart.length) {
      setError('Giỏ hàng đang trống.');
      return;
    }
    if (unavailableProduct || stockIssue) {
      setError('Có sản phẩm không còn đủ tồn kho. Hãy quay lại giỏ hàng để cập nhật trước khi đặt.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await ClientService.request('orders', {
        method: 'POST',
        body: JSON.stringify({ ...form, items: cart }),
      });
      setDone(result.data);
      localStorage.removeItem('cart');
      setCart([]);
      window.dispatchEvent(new Event('cart-updated'));
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Không thể đặt hàng.';
      setError(message);
      if (message.includes('Vui lòng đăng nhập')) setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="next-detail">
      <Link href="/cart">← Quay lại giỏ hàng</Link>
      <h1>Thông tin giao hàng</h1>
      {!done && !cartLoading && cart.length > 0 && (
        <section aria-label="Tóm tắt đơn hàng">
          <h2>Sản phẩm trong đơn</h2>
          {products.map((product) => {
            const quantity = cart.find((line) => line.product_id === product.id)?.quantity || 0;
            const price = Number(product.sale_price ?? product.price);
            return (
              <p key={product.id}>
                {product.name} × {quantity} — {formatMoney(price * quantity)}
              </p>
            );
          })}
          {unavailableProduct && <p role="alert">Có sản phẩm không còn kinh doanh trong giỏ hàng.</p>}
          {stockIssue && <p role="alert">Số lượng đặt vượt quá tồn kho hiện tại.</p>}
          <strong>Tạm tính sản phẩm: {formatMoney(subtotal)}</strong>
          {promotionPreview && <p>Giảm giá ({promotionPreview.code}): -{formatMoney(Number(promotionPreview.discount_amount))}</p>}
          {promotionPreview && <strong>Tạm tính sau giảm: {formatMoney(Math.max(0, subtotal - Number(promotionPreview.discount_amount)))}</strong>}
          <p>Phí vận chuyển sẽ được cửa hàng xác nhận trước khi xử lý.</p>
        </section>
      )}
      {done ? (
        <div className="next-message">
          <strong>Đặt hàng thành công.</strong>
          <p>Mã đơn: {done.order_number}</p>
          <p>
            {demoPaymentMethods.has(done.payment_method)
              ? 'Đơn hàng đã được đặt, cảm ơn quý khách'
              : 'Phí vận chuyển do cửa hàng xác nhận. Sau khi xác nhận, thông tin thanh toán hoặc liên kết VNPay/MoMo sẽ hiển thị trong đơn hàng của bạn.'}
          </p>
          <Link href="/orders">Theo dõi đơn hàng</Link>
          {' · '}
          <Link href="/products">Tiếp tục mua sắm</Link>
        </div>
      ) : cartLoading || user === undefined ? (
        <p>Đang kiểm tra giỏ hàng và tài khoản...</p>
      ) : !cart.length ? (
        <div className="store-empty">
          <strong>Giỏ hàng đang trống</strong>
          <p>Hãy chọn sản phẩm trước khi đặt hàng.</p>
          <Link href="/products">Xem sản phẩm</Link>
        </div>
      ) : user === null ? (
        <div className="next-message">
          <p>Bạn cần đăng nhập để đặt hàng. Giỏ hàng sẽ được giữ lại sau khi đăng nhập.</p>
          <Link className="store-button" href="/login?next=%2Fcheckout">Đăng nhập để tiếp tục</Link>
          {' · '}
          <Link href="/register?next=%2Fcheckout">Tạo tài khoản</Link>
        </div>
      ) : (
        <form className="next-form" onSubmit={submit}>
          <label>
            Họ tên
            <input required maxLength={255} value={form.customer_name} onChange={(event) => update('customer_name', event.target.value)} />
          </label>
          <label>
            Mã khuyến mãi
            <input maxLength={40} value={form.promotion_code} onChange={(event) => {
              update('promotion_code', event.target.value);
              setPromotionPreview(null);
            }} />
            <button type="button" className="button button-light" onClick={checkPromotion} disabled={!form.promotion_code.trim() || loading}>Áp dụng mã</button>
          </label>
          <label>
            Email
            <input type="email" maxLength={255} value={form.customer_email} onChange={(event) => update('customer_email', event.target.value)} />
          </label>
          <label>
            Số điện thoại
            <input required maxLength={30} value={form.customer_phone} onChange={(event) => update('customer_phone', event.target.value)} />
          </label>
          <label>
            Địa chỉ nhận hàng
            <textarea required maxLength={2000} value={form.shipping_address} onChange={(event) => update('shipping_address', event.target.value)} />
          </label>
          <label>
            Phương thức thanh toán
            <select value={form.payment_method} onChange={(event) => update('payment_method', event.target.value)} required>
              {methods.map((method) => (
                <option key={method.id} value={method.id}>{paymentNames[method.id] || method.name}</option>
              ))}
            </select>
          </label>
          {demoPaymentMethods.has(form.payment_method) && (
            <div className="next-message" role="note">
            </div>
          )}
          <label>
            Ghi chú
            <textarea maxLength={2000} value={form.note} onChange={(event) => update('note', event.target.value)} />
          </label>
          {error && <div className="next-message next-error" role="alert">{error}</div>}
          <button type="submit" className="store-button" disabled={loading || productsLoading || !methods.length || unavailableProduct || stockIssue}>
            {loading ? 'Đang đặt hàng...' : productsLoading ? 'Đang kiểm tra sản phẩm...' : 'Xác nhận đặt hàng'}
          </button>
        </form>
      )}
      {error && !done && !cartLoading && user !== true && <div className="next-message next-error" role="alert">{error}</div>}
    </main>
  );
}
