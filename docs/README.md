# Hướng dẫn chạy LuanHung Shop

Tài liệu này hướng dẫn cài đặt và chạy website trên Windows, tạo tài khoản khách hàng/Admin, và thử quy trình mua hàng.

## 1. Yêu cầu

- Node.js tương thích với phiên bản Next.js trong dự án và npm.
- PowerShell hoặc terminal tại thư mục gốc của dự án.
- Nếu muốn dùng thanh toán trực tuyến thật: tài khoản sandbox/production và thông tin cấu hình tương ứng từ cổng thanh toán.

## 2. Cơ sở dữ liệu

Ứng dụng dùng **SQLite**, không cần cài hoặc chạy MySQL riêng.

- Tên file cơ sở dữ liệu: `luanhung.sqlite`
- Đường dẫn mặc định: `backend/data/luanhung.sqlite`
- File được tạo cùng cấu trúc bảng và dữ liệu sản phẩm mẫu khi backend khởi động lần đầu.
- Có thể đổi đường dẫn bằng biến `SQLITE_DATABASE_PATH` trong `backend/.env.local`.

File [luanhung-export.sql](../luanhung-export.sql) nằm ở thư mục gốc dự án. Đây là bản export **MySQL** có tên database `thltw-luanhung-24f`, không phải file SQLite và không phải giá trị để đặt cho `SQLITE_DATABASE_PATH`. Backend không tự nạp file này khi khởi động. Nếu muốn dùng catalog từ bản export, chạy lệnh sau tại thư mục gốc:

```powershell
npm.cmd --workspace backend run import-legacy-sql -- ..\luanhung-export.sql
```

Importer chỉ đồng bộ brands, categories và products vào `backend/data/luanhung.sqlite`; dữ liệu catalog trùng slug được cập nhật, còn số lượng tồn kho của sản phẩm đã có được giữ nguyên. Các bảng legacy còn lại trong SQL không được nhập vì không có dữ liệu ứng dụng phù hợp. Lệnh có thể chạy lại nếu cần.

## 3. Cài đặt và chạy website

Mở PowerShell tại thư mục gốc dự án (thư mục chứa `package.json`), rồi chạy:

```powershell
npm.cmd install
npm.cmd run dev
```

Lệnh trên khởi động cả backend và frontend. Mở website tại **http://localhost:3000**. Backend API chạy tại **http://localhost:4000**; frontend tự chuyển tiếp các yêu cầu `/api` tới backend.

Giữ cửa sổ terminal đang chạy để website hoạt động. Nhấn `Ctrl+C` để dừng.

### Chạy riêng từng phần

Nếu muốn chạy backend và frontend ở hai cửa sổ PowerShell khác nhau, chạy cả hai lệnh sau từ thư mục gốc:

```powershell
npm.cmd run dev:backend
```

```powershell
npm.cmd run dev:frontend
```

Các địa chỉ mặc định là backend `http://localhost:4000` và frontend `http://localhost:3000`. Nếu backend chạy ở địa chỉ khác, cập nhật `BACKEND_API_URL` trong `frontend/.env.local` (xem `frontend/.env.example`).

### Cấu hình tùy chọn

Backend tự đọc `backend/.env.local`; frontend tự đọc `frontend/.env.local`. Có thể tạo các file này bằng cách sao chép `.env.example` tương ứng. Không đưa thông tin bí mật hoặc khóa thanh toán thật vào Git.

Các biến quan trọng:

- `SQLITE_DATABASE_PATH`: vị trí file SQLite.
- `BANK_NAME`, `BANK_ACCOUNT_NUMBER`, `BANK_ACCOUNT_NAME`: bật hướng dẫn chuyển khoản ngân hàng.
- `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET` và `VNPAY_URL`: cấu hình VNPay.
- `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY` và `MOMO_ENDPOINT`: cấu hình MoMo.
- `BACKEND_PUBLIC_URL`, `FRONTEND_URL`: URL callback/điều hướng của cổng thanh toán; mặc định dùng localhost trong môi trường phát triển.

Các file `.env.example` có danh sách đầy đủ hơn. Chỉ phương thức đã cấu hình mới hiện như phương thức thanh toán thật. Khi đổi biến môi trường, hãy khởi động lại ứng dụng.

## 4. Chức năng hiện có

### Khách hàng và thành viên

- Xem/tìm kiếm sản phẩm, lọc danh mục và xem chi tiết, giá khuyến mãi, tồn kho, sản phẩm liên quan.
- Thêm, cập nhật số lượng và xóa sản phẩm trong giỏ; tồn kho được kiểm tra khi đặt hàng.
- Đặt hàng, áp dụng mã khuyến mãi hợp lệ, xem lịch sử/chi tiết đơn và tự hủy đơn đang chờ xác nhận.
- Đăng ký, đăng nhập, cập nhật hồ sơ/địa chỉ, đổi hoặc khôi phục mật khẩu qua mã email (cần cấu hình SMTP).
- Xem bài viết theo chủ đề, xem trang tĩnh và gửi liên hệ.

### Quản trị viên

- Quản lý danh mục, thương hiệu, sản phẩm, chủ đề/bài viết, trang tĩnh, menu, banner, liên hệ, thành viên và đơn hàng.
- Lọc/tìm kiếm danh sách quản trị; khóa hoặc mở khóa tài khoản thành viên; cập nhật trạng thái và xem lịch sử đơn hàng.
- Quản lý mã khuyến mãi tại **/admin/promotions**.
- Nhập/xuất kho và xem lịch sử biến động tồn kho tại **/admin/inventory**.
- Cập nhật thông tin cửa hàng và nội dung SEO tại **/admin/settings**.

Các trang quản trị yêu cầu đăng nhập Admin. Trạng thái đơn hàng và thay đổi tồn kho được lưu trong SQLite. Cổng thanh toán thật chỉ dùng được khi đã cấu hình thông tin tương ứng; PayPal chưa được tích hợp.

## 5. Tạo tài khoản khách hàng và Admin

### Khách hàng

1. Mở **http://localhost:3000/register**.
2. Điền họ tên, email, số điện thoại (nếu có) và mật khẩu rồi đăng ký.
3. Đăng nhập tại **http://localhost:3000/login**.

Tài khoản khách hàng do người dùng tự đăng ký; dự án không cung cấp email/mật khẩu mẫu có sẵn.

### Admin

1. Khi chưa có Admin nào, mở **http://localhost:3000/admin/register**.
2. Nhập họ tên, email Admin và mật khẩu tối thiểu **10 ký tự**, sau đó xác nhận mật khẩu.
3. Đăng ký xong, tài khoản đầu tiên được đăng nhập tự động. Trang quản trị ở **http://localhost:3000/admin**.
4. Lần sau đăng nhập bằng email và mật khẩu vừa tạo tại **http://localhost:3000/admin/login**.

**Thông tin đăng nhập Admin:** email là email bạn tự nhập ở bước 2; mật khẩu là mật khẩu bạn tự đặt ở bước 2. Mã nguồn không khai báo email/mật khẩu Admin mặc định và không thể khôi phục mật khẩu từ cơ sở dữ liệu. Nếu trang đăng ký chuyển hướng sang trang đăng nhập, Admin đã được tạo; hãy dùng tài khoản của dự án. Nếu không biết mật khẩu, từ thư mục gốc chạy `npm.cmd run create-admin` rồi nhập email và mật khẩu mới để tạo/cập nhật tài khoản Admin.

Khi đã có Admin, việc tạo thêm tài khoản quản trị cần đăng nhập Admin trước. Không chia sẻ mật khẩu thật trong tài liệu hoặc công khai trên Internet.

## 6. Hướng dẫn mua hàng

1. Vào **http://localhost:3000/products** hoặc trang chủ, chọn sản phẩm và thêm vào giỏ hàng.
2. Mở **http://localhost:3000/cart**, kiểm tra sản phẩm/số lượng rồi tiếp tục thanh toán.
3. Đăng nhập hoặc đăng ký tài khoản khách hàng nếu được yêu cầu.
4. Tại **http://localhost:3000/checkout**, nhập tên, số điện thoại, địa chỉ nhận hàng và chọn phương thức thanh toán.
5. Đặt hàng. Website hiển thị mã đơn hàng; theo dõi đơn tại **http://localhost:3000/orders**.
6. Phí vận chuyển do cửa hàng/Admin xác nhận. Với chuyển khoản hoặc VNPay/MoMo thật, thông tin thanh toán/liên kết sẽ có sau khi cửa hàng xác nhận phí vận chuyển.

### Các phương thức thanh toán

- **Thanh toán khi nhận hàng (COD):** có sẵn.
- **Chuyển khoản ngân hàng, VNPay, MoMo:** chỉ hoạt động như thanh toán thật sau khi cấu hình thông tin tương ứng trong `backend/.env.local`.
- **Chuyển khoản demo, MoMo demo, Visa demo, thẻ tín dụng demo:** có sẵn để thử giao diện/luồng đặt hàng; không thực hiện giao dịch tiền thật.
- **PayPal:** hiện chưa được tích hợp trong ứng dụng.

## 7. Chạy bản production (tùy chọn)

Từ thư mục gốc, tạo bản build rồi khởi động cả hai ứng dụng:

```powershell
npm.cmd run build
npm.cmd start
```

Mở **http://localhost:3000**. Không dùng tài khoản, khóa thanh toán hoặc dữ liệu demo cho môi trường production.