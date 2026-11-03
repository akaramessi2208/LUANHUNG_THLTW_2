'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminResourcePage } from '@/components/admin/AdminResourcePage';
import { browserApi } from '@/lib/api';
import { setAuthToken } from '@/lib/cookieHelper';
import { authService } from '@/lib/services/authService';

export function AdminRegistrationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    browserApi('admin-setup/status')
      .then(async (result) => {
        if (!active) return;
        if (result.setupRequired) {
          setSetupRequired(true);
          setLoading(false);
          return;
        }

        try {
          const current = await authService.currentUser();
          if (current.user?.role === 'admin') {
            setLoading(false);
            return;
          }
        } catch {
          // Unauthenticated visitors are sent to the admin login below.
        }

        if (active) {
          router.replace(`/admin/login?next=${encodeURIComponent('/admin/register')}`);
        }
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError instanceof Error ? requestError.message : 'Không thể kiểm tra trạng thái thiết lập Admin.');
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [router]);

  const registerFirstAdmin = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const result = await browserApi('admin-setup/register', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          password,
          password_confirmation: confirmation,
        }),
      });
      if (result.token) {
        setAuthToken(result.token);
        router.replace('/admin');
        router.refresh();
      } else {
        router.replace('/admin/login?setup=success');
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể tạo tài khoản Admin.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <main className="next-detail"><p>Đang kiểm tra thiết lập Admin...</p></main>;
  }

  if (error && !setupRequired) {
    return <main className="next-detail"><div className="next-message next-error">{error}</div></main>;
  }

  if (!setupRequired) {
    return <AdminResourcePage resource="users" openCreateOnLoad />;
  }

  return (
    <main className="next-admin-login">
      <section className="auth-card">
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: '#6d6b7a', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700 }}>
            LUANHUNG SHOP
          </div>
          <h1 style={{ margin: '10px 0 0', fontSize: 30, color: '#1c1b2a' }}>Tạo Admin đầu tiên</h1>
          <p>Đăng ký tài khoản quản trị đầu tiên để bắt đầu quản lý cửa hàng.</p>
        </div>
        <form onSubmit={registerFirstAdmin}>
          <label>
            <span>Họ tên</span>
            <input value={name} onChange={(event) => setName(event.target.value)} maxLength={255} required />
          </label>
          <label>
            <span>Email</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={255} required />
          </label>
          <label>
            <span>Mật khẩu (ít nhất 10 ký tự)</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={10} maxLength={128} autoComplete="new-password" required />
          </label>
          <label>
            <span>Xác nhận mật khẩu</span>
            <input type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={10} maxLength={128} autoComplete="new-password" required />
          </label>
          {error && <div className="next-message next-error" role="alert">{error}</div>}
          <button type="submit" className="store-button" disabled={submitting} style={{ width: '100%', justifyContent: 'center' }}>
            {submitting ? 'Đang tạo tài khoản...' : 'Tạo Admin'}
          </button>
        </form>
      </section>
    </main>
  );
}
