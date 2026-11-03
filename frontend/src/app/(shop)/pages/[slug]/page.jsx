import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { serverApi } from '@/lib/server-api';
import { ApiError } from '@/lib/api';
export const dynamic = 'force-dynamic';
export default async function StorePageRoute({ params }) {
    const { slug } = await params;
    let page;
    try {
        const response = await serverApi(`/storefront/pages/${encodeURIComponent(slug)}`);
        page = response.data;
    }
    catch (error) {
        if (error instanceof ApiError && error.status === 404)
            notFound();
        throw error;
    }
    return (_jsxs("main", { className: "next-detail", children: [_jsx(Link, { href: "/", children: "\u2190 V\u1EC1 trang ch\u1EE7" }), _jsx("h1", { children: page.title }), page.description && _jsx("p", { children: page.description }), _jsx("div", { className: "next-detail-content", children: page.content })] }));
}
