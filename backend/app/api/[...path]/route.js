import { handleApiRequest } from '@/lib/api-handler';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
async function handle(request, context) {
    const { path } = await context.params;
    return handleApiRequest(request, path);
}
export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE };
