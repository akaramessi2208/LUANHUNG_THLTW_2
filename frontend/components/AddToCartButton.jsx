'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
export function AddToCartButton({ productId, stock }) {
    const [added, setAdded] = useState(false);
    const addToCart = () => {
        if (stock < 1)
            return;
        let cart = [];
        try {
            const current = JSON.parse(localStorage.getItem('cart') || '[]');
            if (Array.isArray(current))
                cart = current;
        }
        catch (error) {
            console.error('Could not read the saved cart:', error);
        }
        const existing = cart.find((line) => line.product_id === productId);
        if (existing)
            existing.quantity = Math.min(stock, existing.quantity + 1);
        else
            cart.push({ product_id: productId, quantity: 1 });
        localStorage.setItem('cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('cart-updated'));
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1800);
    };
    return (_jsx("button", { type: "button", className: "store-button", disabled: stock < 1, onClick: addToCart, children: stock < 1 ? 'Hết hàng' : added ? 'Đã thêm vào giỏ' : 'Thêm vào giỏ' }));
}
