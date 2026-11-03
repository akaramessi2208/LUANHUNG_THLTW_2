import { ApiError } from '@/lib/api';

const backendApiUrl = (process.env.BACKEND_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '');

export async function serverApi(path) {
    const response = await fetch(`${backendApiUrl}/${path.replace(/^\/+/, '')}`, {
        cache: 'no-store',
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
        throw new ApiError(result?.message || `Yêu cầu thất bại (${response.status}).`, response.status);
    }
    return result;
}
