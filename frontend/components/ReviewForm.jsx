'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { ClientService } from '@/lib/ClientService';
export function ReviewForm({ slug }) {
    const [name, setName] = useState('');
    const [rating, setRating] = useState('5');
    const [comment, setComment] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const submit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');
        try {
            const response = await ClientService.submitReview(slug, { name, rating: Number(rating), comment });
            setMessage(response.message || 'Đánh giá của bạn đã được gửi để duyệt.');
            setName('');
            setComment('');
        }
        catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : 'Không thể gửi đánh giá.');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("form", { className: "next-form", onSubmit: submit, children: [_jsx("h2", { children: "Vi\u1EBFt \u0111\u00E1nh gi\u00E1" }), _jsxs("label", { children: ["H\u1ECD t\u00EAn", _jsx("input", { required: true, maxLength: 255, value: name, onChange: (event) => setName(event.target.value) })] }), _jsxs("label", { children: ["S\u1ED1 sao", _jsx("select", { value: rating, onChange: (event) => setRating(event.target.value), children: [5, 4, 3, 2, 1].map((number) => _jsxs("option", { value: number, children: [number, " sao"] }, number)) })] }), _jsxs("label", { children: ["N\u1ED9i dung", _jsx("textarea", { required: true, minLength: 3, maxLength: 3000, value: comment, onChange: (event) => setComment(event.target.value) })] }), message && _jsx("div", { className: "next-message", children: message }), error && _jsx("div", { className: "next-message next-error", children: error }), _jsx("button", { type: "submit", className: "store-button", disabled: loading, children: loading ? 'Đang gửi...' : 'Gửi đánh giá' })] }));
}
