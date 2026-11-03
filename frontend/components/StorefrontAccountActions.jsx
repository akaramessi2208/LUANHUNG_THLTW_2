'use client';
import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { browserApi } from '@/lib/api';
import { getAuthToken } from '@/lib/cookieHelper';
import { authService } from '@/lib/services/authService';
export function StorefrontAccountActions() {
    const [user, setUser] = useState(null);
    const [logoutError, setLogoutError] = useState('');
    const [accountError, setAccountError] = useState('');
    useEffect(() => {
        if (!getAuthToken())
            return;
        browserApi('me')
            .then((result) => setUser(result.user))
            .catch((error) => {
            setAccountError(error instanceof Error ? error.message : 'Không thể tải thông tin tài khoản.');
        });
    }, []);
    const logout = async () => {
        try {
            await authService.logout();
            setUser(null);
            window.location.assign('/');
        }
        catch (error) {
            setLogoutError(error instanceof Error ? error.message : 'Không thể đăng xuất. Vui lòng thử lại.');
        }
    };
    return user ? (_jsxs(_Fragment, { children: [_jsxs(Link, { href: "/profile", children: ["Xin ch\u00E0o, ", user.name] }), _jsx("button", { type: "button", onClick: logout, className: "store-account-logout", children: "\u0110\u0103ng xu\u1EA5t" }), logoutError && _jsx("span", { role: "alert", className: "store-account-error", children: logoutError })] })) : (_jsxs(_Fragment, { children: [_jsx(Link, { href: "/login", children: "\u0110\u0103ng nh\u1EADp" }), _jsx(Link, { href: "/register", children: "\u0110\u0103ng k\u00FD" }), accountError && _jsx("span", { role: "alert", className: "store-account-error", children: accountError })] }));
}
