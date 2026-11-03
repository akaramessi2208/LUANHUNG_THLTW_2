import path from 'node:path';
const nextConfig = {
    poweredByHeader: false,
    turbopack: {
        root: path.resolve(process.cwd(), '..'),
    },
};
export default nextConfig;
