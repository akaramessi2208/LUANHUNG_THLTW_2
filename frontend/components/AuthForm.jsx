'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { authService } from '@/lib/services/authService';
export function AuthForm({ mode }) {
    const router = useRouter();
    const isAdmin = mode === 'admin';
    const isRegister = mode === 'register';
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [notice, setNotice] = useState('');
    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.get('password-reset') === 'success') {
            setNotice('Mật khẩu đã được cập nhật. Hãy đăng nhập bằng mật khẩu mới.');
        } else if (searchParams.get('registered') === 'success') {
            setNotice('Đăng ký thành công. Vui lòng đăng nhập bằng tài khoản vừa tạo.');
        }
    }, []);
    const title = useMemo(() => {
        if (isAdmin)
            return 'Đăng nhập quản trị';
        if (isRegister)
            return 'Đăng ký tài khoản';
        return 'Đăng nhập';
    }, [isAdmin, isRegister]);
    const onSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');
        try {
            const payload = { email, password };
            if (isRegister) {
                payload.name = name;
                payload.phone = phone;
                payload.password_confirmation = passwordConfirmation;
            }
            const requestedPath = new URLSearchParams(window.location.search).get('next');
            const nextPath = requestedPath?.startsWith('/') && !requestedPath.startsWith('//')
                ? requestedPath
                : '/';
            if (isRegister) {
                await authService.register(payload);
                const loginParams = new URLSearchParams({ registered: 'success' });
                if (nextPath !== '/') loginParams.set('next', nextPath);
                router.push(`/login?${loginParams.toString()}`);
                router.refresh();
                return;
            }
            await authService.login(email, password, isAdmin);
            const adminNextPath = requestedPath?.startsWith('/admin/') && !requestedPath.startsWith('//')
                ? requestedPath
                : '/admin';
            router.push(isAdmin ? adminNextPath : nextPath);
            router.refresh();
        }
        catch (requestError) {
            const message = requestError instanceof Error ? requestError.message : 'Đăng nhập thất bại.';
            setError(message);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("main", { className: "next-admin-login", children: _jsxs("div", { className: "auth-card", children: [_jsxs("div", { style: { marginBottom: 20 }, children: [_jsx("div", { style: { fontSize: 12, color: '#6d6b7a', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700 }, children: "LUANHUNG SHOP" }), _jsx("h1", { style: { margin: '10px 0 0', fontSize: 30, color: '#1c1b2a' }, children: title })] }), _jsxs("form", { onSubmit: onSubmit, children: [isRegister && (_jsxs("label", { children: [_jsx("span", { children: "H\u1ECD t\u00EAn" }), _jsx("input", { value: name, onChange: (event) => setName(event.target.value), required: true })] })), _jsxs("label", { children: [_jsx("span", { children: "Email" }), _jsx("input", { type: "email", value: email, onChange: (event) => setEmail(event.target.value), required: true })] }), isRegister && (_jsxs("label", { children: [_jsx("span", { children: "S\u1ED1 \u0111i\u1EC7n tho\u1EA1i" }), _jsx("input", { value: phone, onChange: (event) => setPhone(event.target.value) })] })), _jsxs("label", { children: [_jsx("span", { children: "M\u1EADt kh\u1EA9u" }), _jsx("input", { type: "password", value: password, onChange: (event) => setPassword(event.target.value), required: true, minLength: 8 })] }), isRegister && (_jsxs("label", { children: [_jsx("span", { children: "X\u00E1c nh\u1EADn m\u1EADt kh\u1EA9u" }), _jsx("input", { type: "password", value: passwordConfirmation, onChange: (event) => setPasswordConfirmation(event.target.value), required: true, minLength: 8 })] })), error && _jsx("div", { className: "next-message next-error", children: error }), notice && _jsx("div", { className: "next-message", children: notice }), _jsx("button", { type: "submit", className: "store-button", disabled: loading, style: { width: '100%', justifyContent: 'center' }, children: loading ? 'Đang xử lý...' : title })] }), isAdmin ? (_jsxs("p", { style: { marginTop: 18, fontSize: 14, color: '#5d5d72' }, children: ["Cần đăng nhập Admin trước khi đăng ký tài khoản quản trị. ", _jsx(Link, { href: "/admin/register", children: "Đăng ký Admin" })] })) : (_jsxs("p", { style: { marginTop: 18, fontSize: 14, color: '#5d5d72' }, children: [isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?', ' ', _jsx(Link, { href: isRegister ? '/login' : '/register', children: isRegister ? 'Đăng nhập' : 'Đăng ký' }), !isRegister && _jsxs(_Fragment, { children: [" \u00B7 ", _jsx(Link, { href: "/forgot-password", children: "Qu\u00EAn m\u1EADt kh\u1EA9u?" })] })] }))] }) }));
}
