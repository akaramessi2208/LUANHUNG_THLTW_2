export function getOtpErrorMessage(error, fallback) {
  const message = error instanceof Error ? error.message : fallback;
  if (!message.includes('SMTP_PASSWORD')) return message;

  return `${message} Với Gmail, hãy bật Xác minh 2 bước rồi tạo Google App Password tại https://myaccount.google.com/apppasswords; nhập App Password (không phải mật khẩu Gmail) vào SMTP_PASSWORD trong backend/.env.local và khởi động lại backend.`;
}
