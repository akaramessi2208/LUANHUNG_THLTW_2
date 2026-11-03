import { createHmac, timingSafeEqual } from 'node:crypto';
import querystring from 'node:querystring';
import { getDatabase, timestamp } from '@/lib/database';

function hmac(algorithm, secret, value) {
    return createHmac(algorithm, secret).update(value, 'utf8').digest('hex');
}

function validSignature(expected, received) {
    if (typeof received !== 'string' || expected.length !== received.length || !/^[a-f\d]+$/i.test(received)) return false;
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(received, 'hex'));
}

function configuredUrl(value, name) {
    try {
        return new URL(value).toString();
    } catch {
        throw new Error(`${name} must be a valid absolute URL.`);
    }
}

export function isPaymentGatewayConfigured(method) {
    if (method === 'vnpay') {
        return Boolean(process.env.VNPAY_TMN_CODE?.trim()
            && process.env.VNPAY_HASH_SECRET
            && process.env.VNPAY_URL
            && process.env.BACKEND_PUBLIC_URL
            && process.env.FRONTEND_URL);
    }
    if (method === 'momo') {
        return Boolean(process.env.MOMO_PARTNER_CODE?.trim()
            && process.env.MOMO_ACCESS_KEY
            && process.env.MOMO_SECRET_KEY
            && process.env.MOMO_ENDPOINT
            && process.env.BACKEND_PUBLIC_URL
            && process.env.FRONTEND_URL);
    }
    return false;
}

export function getPaymentMethods() {
    const bankTransferConfigured = Boolean(process.env.BANK_NAME?.trim()
        && process.env.BANK_ACCOUNT_NUMBER?.trim()
        && process.env.BANK_ACCOUNT_NAME?.trim());
    return [
        { id: 'cod', name: 'Thanh toán khi nhận hàng', available: true },
        { id: 'bank_transfer', name: 'Chuyển khoản ngân hàng', available: bankTransferConfigured },
        { id: 'vnpay', name: 'VNPay', available: isPaymentGatewayConfigured('vnpay') },
        { id: 'momo', name: 'MoMo', available: isPaymentGatewayConfigured('momo') },
        { id: 'bank_transfer_demo', name: 'Chuyển khoản ngân hàng', available: true },
        { id: 'momo_demo', name: 'MoMo', available: true },
        { id: 'visa_demo', name: 'Thẻ Visa', available: true },
        { id: 'credit_card_demo', name: 'Thẻ tín dụng', available: true },
    ];
}

function buildBankTransferQrUrl(details) {
    const explicitQr = process.env.BANK_TRANSFER_QR_CODE || process.env.BANK_QR_CODE_URL || process.env.BANK_QR_CODE;
    if (explicitQr && explicitQr.trim()) {
        return explicitQr.trim();
    }

    const payload = [
        `BANK=${details.bank_name || ''}`,
        `ACCOUNT=${details.account_number || ''}`,
        `NAME=${details.account_name || ''}`,
        `CONTENT=${details.transfer_content || ''}`,
        `AMOUNT=${Number(details.amount || 0)}`,
    ].filter((entry) => entry.includes('=') && entry.split('=')[1])
        .join('|');

    if (!payload) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&format=png&data=${encodeURIComponent(payload)}`;
}

export function getBankTransferDetails(order) {
    const details = {
        bank_name: process.env.BANK_NAME || '',
        account_number: process.env.BANK_ACCOUNT_NUMBER || '',
        account_name: process.env.BANK_ACCOUNT_NAME || '',
        transfer_content: order.order_number,
        amount: Number(order.total),
    };

    return {
        ...details,
        qr_code_url: buildBankTransferQrUrl(details),
    };
}

export async function createPaymentUrl(order, request) {
    const frontendUrl = configuredUrl(process.env.FRONTEND_URL, 'FRONTEND_URL').replace(/\/+$/, '');
    const backendUrl = configuredUrl(process.env.BACKEND_PUBLIC_URL, 'BACKEND_PUBLIC_URL').replace(/\/+$/, '');
    const amount = Math.round(Number(order.total));
    if (!Number.isSafeInteger(amount) || amount < 1) throw new Error('Payment amount must be a positive integer.');

    if (order.payment_method === 'vnpay') {
        if (!isPaymentGatewayConfigured('vnpay')) throw new Error('VNPay is not configured.');
        const params = {
            vnp_Version: '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: process.env.VNPAY_TMN_CODE.trim(),
            vnp_Amount: String(amount * 100),
            vnp_CurrCode: 'VND',
            vnp_TxnRef: String(order.order_number),
            vnp_OrderInfo: `Thanh toan don hang ${order.order_number}`,
            vnp_OrderType: 'other',
            vnp_Locale: 'vn',
            vnp_ReturnUrl: `${backendUrl}/api/payments/vnpay/return`,
            vnp_IpAddr: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1',
            vnp_CreateDate: new Intl.DateTimeFormat('sv-SE', {
                timeZone: 'Asia/Ho_Chi_Minh',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hourCycle: 'h23',
            }).format(new Date()).replace(/[-:T]/g, ''),
        };
        const signedData = querystring.stringify(Object.fromEntries(
            Object.entries(params).sort(([left], [right]) => left.localeCompare(right)),
        ));
        const query = new URLSearchParams({
            ...params,
            vnp_SecureHash: hmac('sha512', process.env.VNPAY_HASH_SECRET, signedData),
        });
        return `${configuredUrl(process.env.VNPAY_URL, 'VNPAY_URL')}?${query}`;
    }

    if (order.payment_method === 'momo') {
        if (!isPaymentGatewayConfigured('momo')) throw new Error('MoMo is not configured.');
        const partnerCode = process.env.MOMO_PARTNER_CODE.trim();
        const requestId = `${order.order_number}-${Date.now()}`;
        const payload = {
            partnerCode,
            accessKey: process.env.MOMO_ACCESS_KEY,
            requestId,
            amount: String(amount),
            orderId: String(order.order_number),
            orderInfo: `Thanh toan don hang ${order.order_number}`,
            redirectUrl: `${backendUrl}/api/payments/momo/return`,
            ipnUrl: `${backendUrl}/api/payments/momo/ipn`,
            requestType: 'captureWallet',
            extraData: '',
            lang: 'vi',
        };
        const rawSignature = `accessKey=${payload.accessKey}&amount=${payload.amount}&extraData=${payload.extraData}&ipnUrl=${payload.ipnUrl}&orderId=${payload.orderId}&orderInfo=${payload.orderInfo}&partnerCode=${payload.partnerCode}&redirectUrl=${payload.redirectUrl}&requestId=${payload.requestId}&requestType=${payload.requestType}`;
        const response = await fetch(configuredUrl(process.env.MOMO_ENDPOINT, 'MOMO_ENDPOINT'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, signature: hmac('sha256', process.env.MOMO_SECRET_KEY, rawSignature) }),
            signal: AbortSignal.timeout(15000),
        });
        const result = await response.json();
        if (!response.ok || result.resultCode !== 0 || !result.payUrl) {
            console.error('MoMo payment URL request failed:', result);
            throw new Error('MoMo không thể tạo liên kết thanh toán. Vui lòng thử lại.');
        }
        return result.payUrl;
    }

    throw new Error('Phương thức thanh toán online không hợp lệ.');
}

export function verifyVnpayReturn(params) {
    const received = params.get('vnp_SecureHash');
    const values = Object.fromEntries([...params.entries()]
        .filter(([key]) => key.startsWith('vnp_') && key !== 'vnp_SecureHash' && key !== 'vnp_SecureHashType')
        .sort(([left], [right]) => left.localeCompare(right)));
    const signedData = querystring.stringify(values);
    const expected = hmac('sha512', process.env.VNPAY_HASH_SECRET || '', signedData);
    return validSignature(expected, received)
        ? { valid: true, orderNumber: params.get('vnp_TxnRef'), amount: Number(params.get('vnp_Amount')) / 100, successful: params.get('vnp_ResponseCode') === '00' && params.get('vnp_TransactionStatus') === '00' }
        : { valid: false };
}

export function verifyMomoNotification(payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload) || typeof payload.signature !== 'string') {
        return { valid: false };
    }
    const rawSignature = `accessKey=${process.env.MOMO_ACCESS_KEY}&amount=${payload.amount}&extraData=${payload.extraData}&message=${payload.message}&orderId=${payload.orderId}&orderInfo=${payload.orderInfo}&orderType=${payload.orderType}&partnerCode=${payload.partnerCode}&payType=${payload.payType}&requestId=${payload.requestId}&responseTime=${payload.responseTime}&resultCode=${payload.resultCode}&transId=${payload.transId}`;
    const expected = hmac('sha256', process.env.MOMO_SECRET_KEY || '', rawSignature);
    return validSignature(expected, payload.signature)
        ? { valid: true, orderNumber: payload.orderId, amount: Number(payload.amount), successful: Number(payload.resultCode) === 0 }
        : { valid: false };
}

export function frontendPaymentResultUrl(status, orderNumber) {
    const base = configuredUrl(process.env.FRONTEND_URL || 'http://localhost:3000', 'FRONTEND_URL').replace(/\/+$/, '');
    const url = new URL('/payment/result', base);
    url.searchParams.set('status', status);
    if (orderNumber) url.searchParams.set('order', orderNumber);
    return url.toString();
}

function completePayment(method, result) {
    const db = getDatabase();
    const order = result.orderNumber
        ? db.prepare('SELECT * FROM orders WHERE order_number = ? AND deleted_at IS NULL').get(result.orderNumber)
        : null;
    if (!result.valid || !order || order.payment_method !== method || Number(order.total) !== Number(result.amount)) {
        return { successful: false, orderNumber: result.orderNumber || '' };
    }
    if (result.successful) {
        db.prepare("UPDATE orders SET payment_status = 'paid', updated_at = ? WHERE id = ?").run(timestamp(), order.id);
    }
    return { successful: result.successful, orderNumber: order.order_number };
}

export function processVnpayReturn(params) {
    return completePayment('vnpay', verifyVnpayReturn(params));
}

export function processMomoReturn(payload) {
    return completePayment('momo', verifyMomoNotification(payload));
}

export function processMomoIpn(payload) {
    const result = processMomoReturn(payload);
    return result.successful
        ? { resultCode: 0, message: 'Confirm Success' }
        : { resultCode: 1, message: 'Payment verification failed' };
}
