import { jsx as _jsx } from "react/jsx-runtime";
import './globals.css';
import { serverApi } from '@/lib/server-api';
export async function generateMetadata() {
    const response = await serverApi('/storefront/settings');
    const settings = response?.data || {};
    const siteName = settings.site_name || 'LUANHUNG SHOP';
    return {
        title: {
            default: settings.seo_title || `${siteName} · Mô hình robot lắp ráp`,
            template: `%s · ${siteName}`,
        },
        description: settings.seo_description || 'Mô hình robot nguyên bản, phụ kiện lắp ráp và góc trưng bày dành cho builder.',
        ...(settings.favicon_url ? { icons: { icon: settings.favicon_url } } : {}),
    };
}
export default function RootLayout({ children }) {
    return (_jsx("html", { lang: "vi", children: _jsx("body", { children: children }) }));
}
