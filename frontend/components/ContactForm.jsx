'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { ClientService } from '@/lib/ClientService';
export function ContactForm() {
    const [values, setValues] = useState({ name: '', email: '', phone: '', title: '', content: '' });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const submit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');
        try {
            const response = await ClientService.submitContact(values);
            setMessage(response.message || 'Đã gửi liên hệ.');
            setValues({ name: '', email: '', phone: '', title: '', content: '' });
        }
        catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : 'Không thể gửi liên hệ.');
        }
        finally {
            setLoading(false);
        }
    };
    const update = (key, value) => setValues((current) => ({ ...current, [key]: value }));
    return (_jsxs("form", { className: "next-form", onSubmit: submit, children: [_jsxs("label", { children: ["H\u1ECD t\u00EAn", _jsx("input", { required: true, maxLength: 255, value: values.name, onChange: (event) => update('name', event.target.value) })] }), _jsxs("label", { children: ["Email", _jsx("input", { required: true, type: "email", maxLength: 255, value: values.email, onChange: (event) => update('email', event.target.value) })] }), _jsxs("label", { children: ["S\u1ED1 \u0111i\u1EC7n tho\u1EA1i", _jsx("input", { maxLength: 30, value: values.phone, onChange: (event) => update('phone', event.target.value) })] }), _jsxs("label", { children: ["Ch\u1EE7 \u0111\u1EC1", _jsx("input", { required: true, maxLength: 255, value: values.title, onChange: (event) => update('title', event.target.value) })] }), _jsxs("label", { children: ["N\u1ED9i dung", _jsx("textarea", { required: true, maxLength: 5000, value: values.content, onChange: (event) => update('content', event.target.value) })] }), message && _jsx("div", { className: "next-message", children: message }), error && _jsx("div", { className: "next-message next-error", children: error }), _jsx("button", { type: "submit", className: "store-button", disabled: loading, children: loading ? 'Đang gửi...' : 'Gửi liên hệ' })] }));
}
