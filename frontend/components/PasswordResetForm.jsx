'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { browserApi } from '@/lib/api';
import { clearAuthToken } from '@/lib/cookieHelper';
import { getOtpErrorMessage } from '@/lib/otpError';
export function PasswordResetForm() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [codeSent, setCodeSent] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    useEffect(() => {
        if (resendCooldown <= 0)
            return undefined;
        const timer = window.setTimeout(() => setResendCooldown((seconds) => seconds - 1), 1000);
        return () => window.clearTimeout(timer);
    }, [resendCooldown]);
    const requestCode = async (event) => {
        event.preventDefault();
        await sendCode();
    };
    const sendCode = async () => {
        setLoading(true);
        setError('');
        setMessage('');
        try {
            const result = await browserApi('password-reset/request', {
                method: 'POST',
                body: JSON.stringify({ email }),
            });
            setCodeSent(true);
            setResendCooldown(60);
            setMessage(result.message);
        }
        catch (requestError) {
            setError(getOtpErrorMessage(requestError, 'Không thể gửi mã OTP.'));
        }
        finally {
            setLoading(false);
        }
    };
    const resetPassword = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');
        try {
            await browserApi('password-reset/confirm', {
                method: 'POST',
                body: JSON.stringify({ email, code, password, password_confirmation: confirmation }),
            });
            clearAuthToken();
            router.replace('/login?password-reset=success');
            router.refresh();
        }
        catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : 'Không thể đặt lại mật khẩu.');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("main", { className: "next-admin-login", children: _jsxs("div", { className: "auth-card", children: [_jsxs("div", { style: { marginBottom: 20 }, children: [_jsx("div", { style: { fontSize: 12, color: '#6d6b7a', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700 }, children: "LUANHUNG SHOP" }), _jsx("h1", { style: { margin: '10px 0 0', fontSize: 30, color: '#1c1b2a' }, children: "Quên mật khẩu" })] }), _jsxs("form", { onSubmit: codeSent ? resetPassword : requestCode, children: [_jsxs("label", { children: [_jsx("span", { children: "Email tài khoản" }), _jsx("input", { type: "email", required: true, value: email, onChange: (event) => setEmail(event.target.value), disabled: codeSent })] }), codeSent && _jsxs(_Fragment, { children: [_jsxs("label", { children: [_jsx("span", { children: "Mã OTP" }), _jsx("input", { inputMode: "numeric", pattern: "[0-9]{6}", maxLength: 6, required: true, value: code, onChange: (event) => setCode(event.target.value) })] }), _jsxs("label", { children: [_jsx("span", { children: "Mật khẩu mới" }), _jsx("input", { type: "password", minLength: 8, required: true, value: password, onChange: (event) => setPassword(event.target.value) })] }), _jsxs("label", { children: [_jsx("span", { children: "Xác nhận mật khẩu" }), _jsx("input", { type: "password", minLength: 8, required: true, value: confirmation, onChange: (event) => setConfirmation(event.target.value) })] })] }), message && _jsx("div", { className: "next-message", children: message }), error && _jsx("div", { className: "next-message next-error", children: error }), _jsx("button", { className: "store-button", type: "submit", disabled: loading, style: { width: '100%', justifyContent: 'center' }, children: loading ? 'Đang xử lý...' : codeSent ? 'Đặt lại mật khẩu' : 'Gửi mã OTP' })] }), codeSent && _jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: "store-link-button", disabled: loading || resendCooldown > 0, onClick: sendCode, children: resendCooldown > 0 ? `Gửi lại mã sau ${resendCooldown}s` : "Gửi lại mã OTP" }), _jsx("button", { type: "button", className: "store-link-button", disabled: loading, onClick: () => { setCodeSent(false); setCode(''); setResendCooldown(0); setMessage(''); setError(''); }, children: "Dùng email khác" })] }), _jsx("p", { style: { marginTop: 18, fontSize: 14, color: '#5d5d72' }, children: _jsx(Link, { href: "/login", children: "← Quay lại đăng nhập" }) })] }) }));
}
