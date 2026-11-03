import { frontendPaymentResultUrl, processVnpayReturn } from '@/lib/payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
    const result = processVnpayReturn(new URL(request.url).searchParams);
    return Response.redirect(frontendPaymentResultUrl(result.successful ? 'success' : 'failed', result.orderNumber), 303);
}
