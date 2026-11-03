import { processMomoIpn } from '@/lib/payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
    let payload;
    try {
        payload = await request.json();
    } catch {
        return Response.json({ resultCode: 1, message: 'Invalid JSON payload' }, { status: 400 });
    }

    const result = processMomoIpn(payload);
    return Response.json(result, { status: result.resultCode === 0 ? 200 : 400 });
}
