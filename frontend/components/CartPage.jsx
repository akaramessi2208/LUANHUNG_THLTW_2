'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { assetUrl, formatMoney } from '@/lib/api';
import { ClientService } from '@/lib/ClientService';
function isCartLine(value) {
    if (!value || typeof value !== 'object' || !('product_id' in value) || !('quantity' in value))
        return false;
    return typeof value.product_id === 'number' && Number.isInteger(value.product_id) && value.product_id > 0
        && typeof value.quantity === 'number' && Number.isInteger(value.quantity) && value.quantity > 0;
}
export function CartPage() {
    const [cart, setCart] = useState([]);
    const [products, setProducts] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const reload = () => {
        try {
            const stored = JSON.parse(localStorage.getItem('cart') || '[]');
            const validLines = Array.isArray(stored) ? stored.filter(isCartLine) : [];
            setCart(validLines);
            if (!Array.isArray(stored) || validLines.length !== stored.length) {
                localStorage.setItem('cart', JSON.stringify(validLines));
                setError('Một số sản phẩm trong giỏ không hợp lệ đã được loại bỏ.');
            }
        }
        catch (loadError) {
            setError(loadError instanceof Error ? 'Không thể đọc giỏ hàng trên trình duyệt.' : 'Giỏ hàng không hợp lệ.');
            setCart([]);
            localStorage.removeItem('cart');
        }
    };
    useEffect(() => {
        reload();
        window.addEventListener('cart-updated', reload);
        return () => window.removeEventListener('cart-updated', reload);
    }, []);
    useEffect(() => {
        if (!cart.length) {
            setProducts([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        ClientService.getCartProducts(cart.map((line) => line.product_id))
            .then((result) => {
            setProducts(result.data);
            const existingIds = new Set(result.data.map((product) => product.id));
            const validCart = cart.filter((line) => existingIds.has(line.product_id));
            if (validCart.length !== cart.length) {
                setCart(validCart);
                localStorage.setItem('cart', JSON.stringify(validCart));
            }
        })
            .catch((requestError) => setError(requestError instanceof Error ? requestError.message : 'Không thể tải sản phẩm trong giỏ.'))
            .finally(() => setLoading(false));
    }, [cart]);
    const subtotal = useMemo(() => products.reduce((sum, product) => {
        const quantity = cart.find((line) => line.product_id === product.id)?.quantity ?? 0;
        return sum + Number(product.sale_price ?? product.price) * quantity;
    }, 0), [cart, products]);
    const changeQuantity = (productId, quantity) => {
        if (!Number.isInteger(quantity) || quantity < 1)
            return;
        const stock = products.find((product) => product.id === productId)?.qty ?? 0;
        if (stock < 1)
            return;
        const updated = cart.map((line) => line.product_id === productId ? { ...line, quantity: Math.min(stock, quantity) } : line);
        setCart(updated);
        localStorage.setItem('cart', JSON.stringify(updated));
        window.dispatchEvent(new Event('cart-updated'));
    };
    const remove = (productId) => {
        const updated = cart.filter((line) => line.product_id !== productId);
        setCart(updated);
        localStorage.setItem('cart', JSON.stringify(updated));
        window.dispatchEvent(new Event('cart-updated'));
    };
    const inventoryIssue = products.some((product) => ((cart.find((line) => line.product_id === product.id)?.quantity ?? 0) > product.qty));
    return (_jsxs("main", { className: "next-detail cart-page", children: [_jsx(Link, { href: "/", children: "\u2190 V\u1EC1 trang ch\u1EE7" }), _jsx("h1", { children: "Gi\u1ECF h\u00E0ng" }), error && _jsx("div", { className: "next-message next-error", children: error }), loading ? _jsx("p", { children: "\u0110ang t\u1EA3i gi\u1ECF h\u00E0ng..." }) : products.length === 0 ? (_jsxs("div", { className: "cart-empty", children: [_jsx("strong", { children: "Gi\u1ECF h\u00E0ng \u0111ang tr\u1ED1ng" }), _jsx("p", { children: "Nh\u1EEFng m\u1EABu m\u00F4 h\u00ECnh b\u1EA1n ch\u1ECDn s\u1EBD xu\u1EA5t hi\u1EC7n t\u1EA1i \u0111\u00E2y." }), _jsx(Link, { href: "/products", className: "store-button", children: "Kh\u00E1m ph\u00E1 m\u00F4 h\u00ECnh" })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "cart-items", children: products.map((product) => {
                            const quantity = cart.find((line) => line.product_id === product.id)?.quantity ?? 1;
                            const price = Number(product.sale_price ?? product.price);
                            return (_jsxs("article", { className: "cart-item", children: [_jsx("img", { src: assetUrl(product.image), alt: `Ảnh tham khảo ${product.name}` }), _jsxs("div", { className: "cart-item-info", children: [_jsx(Link, { href: `/products/${product.slug}`, children: product.name }), _jsx("strong", { children: formatMoney(price) }), _jsx("small", { children: product.qty > 0 ? `Còn ${product.qty} sản phẩm` : 'Tạm hết hàng' })] }), _jsxs("label", { className: "cart-quantity", children: ["S\u1ED1 l\u01B0\u1EE3ng", _jsx("input", { "aria-label": `Số lượng ${product.name}`, type: "number", min: "1", max: Math.max(1, product.qty), value: quantity, disabled: product.qty < 1, onChange: (event) => changeQuantity(product.id, Number(event.target.value)) })] }), _jsx("strong", { className: "cart-line-total", children: formatMoney(price * quantity) }), _jsx("button", { type: "button", className: "cart-remove", "aria-label": `Xóa ${product.name}`, onClick: () => remove(product.id), children: "\u00D7" })] }, product.id));
                        }) }), inventoryIssue && _jsx("div", { className: "next-message next-error", children: "S\u1ED1 l\u01B0\u1EE3ng trong gi\u1ECF v\u01B0\u1EE3t qu\u00E1 t\u1ED3n kho. H\u00E3y c\u1EADp nh\u1EADt ho\u1EB7c x\u00F3a m\u1EABu \u0111\u00E3 h\u1EBFt h\u00E0ng tr\u01B0\u1EDBc khi \u0111\u1EB7t." }), _jsxs("div", { className: "cart-summary", children: [_jsxs("strong", { children: ["T\u1EA1m t\u00EDnh: ", formatMoney(subtotal)] }), inventoryIssue
                                ? _jsx("span", { className: "store-button cart-checkout-disabled", "aria-disabled": "true", children: "C\u1EADp nh\u1EADt t\u1ED3n kho \u0111\u1EC3 ti\u1EBFp t\u1EE5c" })
                                : _jsx(Link, { href: "/checkout", className: "store-button", children: "Ti\u1EBFn h\u00E0nh \u0111\u1EB7t h\u00E0ng" })] })] }))] }));
}
