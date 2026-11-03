import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { assetUrl } from '@/lib/api';
import { getArticleImage, getArticleTopic } from '@/lib/article-theme';
import { serverApi } from '@/lib/server-api';
import { ApiError } from '@/lib/api';
export const dynamic = 'force-dynamic';
export default async function ArticlePage({ params }) {
    const { slug } = await params;
    let article;
    try {
        const response = await serverApi(`/storefront/articles/${encodeURIComponent(slug)}`);
        article = response.data;
    }
    catch (error) {
        if (error instanceof ApiError && error.status === 404)
            notFound();
        throw error;
    }
    return (_jsxs("main", { className: "next-detail storefront-catalog mecha-articles", children: [_jsx(Link, { href: "/articles", children: "\u2190 T\u1EA5t c\u1EA3 b\u00E0i vi\u1EBFt" }), _jsxs("article", { className: "mecha-article-detail", children: [_jsxs("p", { className: "mecha-eyebrow", children: [getArticleTopic(slug, article.topic?.name), " \u00B7 LUANHUNG SHOP BUILDER NOTES"] }), _jsx("h1", { children: article.title }), article.description && _jsx("p", { className: "mecha-article-lead", children: article.description }), _jsxs("div", { className: "mecha-article-detail-cover", children: [_jsx("img", { src: assetUrl(getArticleImage(slug, article.image)), alt: `Ảnh tham khảo chủ đề ${getArticleTopic(slug, article.topic?.name)}` }), _jsx("span", { children: "\u1EA2NH THAM KH\u1EA2O \u00B7 M\u00D4 H\u00CCNH V\u00C0 D\u1EE4NG C\u1EE4 L\u1EAEP R\u00C1P" })] }), _jsx("div", { className: "next-detail-content", children: article.detail })] })] }));
}
