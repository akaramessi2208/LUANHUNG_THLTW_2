import Link from 'next/link';

export default async function PaymentResultPage({ searchParams }) {
  const params = await searchParams;
  const successful = params.status === 'success';

  return (
    <main className="next-detail">
      <h1>{successful ? 'Thanh toán thành công' : 'Thanh toán chưa hoàn tất'}</h1>
      {params.order && <p>Mã đơn hàng: <strong>{params.order}</strong></p>}
      <p>
        {successful
          ? 'Cổng thanh toán đã xác nhận giao dịch. Bạn có thể kiểm tra trạng thái đơn hàng bên dưới.'
          : 'Giao dịch chưa được xác nhận thành công. Nếu bạn đã thanh toán, vui lòng tải lại đơn hàng hoặc liên hệ cửa hàng.'}
      </p>
      <Link href="/orders">Xem đơn hàng</Link>
      {' · '}
      <Link href="/">Về trang chủ</Link>
    </main>
  );
}
