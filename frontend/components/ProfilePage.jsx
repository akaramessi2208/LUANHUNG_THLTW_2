'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { browserApi } from '@/lib/api';
import { clearAuthToken } from '@/lib/cookieHelper';
import { getOtpErrorMessage } from '@/lib/otpError';

export function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', address: '' });
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [codeSent, setCodeSent] = useState(false);

  useEffect(() => {
    browserApi('me')
      .then((result) => setProfile({
        ...result.user,
        phone: result.user.phone || '',
        address: result.user.address || '',
      }))
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : 'Không thể tải hồ sơ.');
        router.replace('/login');
      })
      .finally(() => setLoading(false));
  }, [router]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const result = await browserApi('me', {
        method: 'PATCH',
        body: JSON.stringify({ name: profile.name, phone: profile.phone, address: profile.address }),
      });
      setProfile({ ...result.user, phone: result.user.phone || '', address: result.user.address || '' });
      setMessage(result.message);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể cập nhật hồ sơ.');
    } finally {
      setSaving(false);
    }
  };

  const requestCode = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const result = await browserApi('password-reset/request', {
        method: 'POST',
        body: JSON.stringify({ email: profile.email }),
      });
      setCodeSent(true);
      setMessage(result.message);
    } catch (requestError) {
      setError(getOtpErrorMessage(requestError, 'Không thể gửi mã OTP.'));
    } finally {
      setSaving(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await browserApi('password-reset/confirm', {
        method: 'POST',
        body: JSON.stringify({
          email: profile.email,
          code,
          password,
          password_confirmation: confirmation,
        }),
      });
      clearAuthToken();
      router.replace('/login?password-reset=success');
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể đổi mật khẩu.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <main className="next-detail"><p>Đang tải hồ sơ...</p></main>;

  return (
    <main className="next-detail profile-page">
      <Link href="/">← Về trang chủ</Link>
      <h1>Tài khoản của tôi</h1>
      <p>Quản lý thông tin liên hệ và bảo vệ tài khoản LUANHUNG SHOP.</p>
      {message && <div className="next-message" role="status">{message}</div>}
      {error && <div className="next-message next-error" role="alert">{error}</div>}
      <form className="next-form" onSubmit={saveProfile}>
        <h2>Thông tin cá nhân</h2>
        <label>Họ tên
          <input required maxLength={255} value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} />
        </label>
        <label>Email đăng nhập
          <input type="email" value={profile.email} readOnly />
          <small>Email đăng nhập không thể sửa tại đây.</small>
        </label>
        <label>Số điện thoại
          <input maxLength={30} value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} />
        </label>
        <label>Địa chỉ mặc định
          <textarea maxLength={2000} value={profile.address} onChange={(event) => setProfile({ ...profile, address: event.target.value })} />
        </label>
        <button type="submit" className="store-button" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu thông tin'}</button>
      </form>
      <section className="next-form profile-password">
        <h2>Đổi mật khẩu bằng mã OTP</h2>
        <p>Mã xác thực gửi đến <strong>{profile.email}</strong>, có hiệu lực trong 10 phút.</p>
        {!codeSent ? (
          <button type="button" className="store-button" disabled={saving} onClick={requestCode}>Gửi mã OTP qua email</button>
        ) : (
          <form onSubmit={resetPassword}>
            <label>Mã OTP 6 chữ số
              <input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(event) => setCode(event.target.value)} />
            </label>
            <label>Mật khẩu mới
              <input type="password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            <label>Xác nhận mật khẩu mới
              <input type="password" minLength={8} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
            </label>
            <button type="submit" className="store-button" disabled={saving}>{saving ? 'Đang cập nhật...' : 'Xác nhận mật khẩu mới'}</button>
            <button type="button" className="store-link-button" disabled={saving} onClick={requestCode}>Gửi lại mã</button>
          </form>
        )}
      </section>
      <p className="profile-shortcuts"><Link href="/orders">Xem đơn hàng</Link> · <Link href="/cart">Giỏ hàng</Link></p>
    </main>
  );
}
