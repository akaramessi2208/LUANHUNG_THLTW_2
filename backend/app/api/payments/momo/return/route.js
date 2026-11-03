import { frontendPaymentResultUrl, processMomoReturn } from '@/lib/payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
    const result = processMomoReturn(Object.fromEntries(new URL(request.url).searchParams));
    return Response.redirect(frontendPaymentResultUrl(result.successful ? 'success' : 'failed', result.orderNumber), 303);
}
