'use client';
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import Link from 'next/link';
import { Archive, BookOpenText, Boxes, Building2, FileText, FolderTree, Gift, Image as ImageIcon, LayoutDashboard, Link2, Mail, Menu as MenuIcon, MessageSquareText, Package, ShoppingBag, Users, } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { assetUrl, formatMoney } from '@/lib/api';
import { AdminService } from '@/lib/AdminService';
import { authService } from '@/lib/services/authService';
import { brandService } from '@/lib/services/brandService';
import { categoryService } from '@/lib/services/categoryService';
import { productService } from '@/lib/services/productService';
import { userService } from '@/lib/services/userService';
const resourceInfo = {
    categories: {
        title: 'Danh mục',
        singular: 'danh mục',
        columns: ['Tên', 'Slug', 'Trạng thái', 'Ngày tạo', 'Thao tác'],
        fields: { name: 'Tên danh mục', parent_id: 'Danh mục cha', description: 'Mô tả', image: 'Đường dẫn ảnh', sort_order: 'Thứ tự', status: 'Trạng thái' },
    },
    brands: {
        title: 'Thương hiệu',
        singular: 'thương hiệu',
        columns: ['Tên', 'Slug', 'Trạng thái', 'Ngày tạo', 'Thao tác'],
        fields: { name: 'Tên thương hiệu', image: 'Đường dẫn ảnh', sort_order: 'Thứ tự', status: 'Trạng thái' },
    },
    products: {
        title: 'Sản phẩm',
        singular: 'sản phẩm',
        columns: ['Sản phẩm', 'Giá', 'Tồn kho', 'Trạng thái', 'Thao tác'],
        fields: { name: 'Tên sản phẩm', category_id: 'Danh mục', brand_id: 'Thương hiệu', price: 'Giá', sale_price: 'Giá khuyến mãi', qty: 'Số lượng', image: 'Đường dẫn ảnh', description: 'Mô tả', status: 'Trạng thái' },
    },
    users: {
        title: 'Người dùng', singular: 'người dùng', columns: ['Người dùng', 'Email', 'Điện thoại', 'Đơn hàng', 'Vai trò', 'Thao tác'],
        fields: { name: 'Họ tên', email: 'Email', phone: 'Điện thoại', password: 'Mật khẩu', password_confirmation: 'Xác nhận mật khẩu', role: 'Vai trò', is_active: 'Trạng thái tài khoản' },
    },
    orders: {
        title: 'Đơn hàng', singular: 'đơn hàng', columns: ['Mã đơn', 'Khách hàng', 'Tổng tiền', 'Trạng thái', 'Ngày đặt', 'Chi tiết đơn', 'Thao tác'],
        fields: { status: 'Trạng thái đơn hàng', shipping_fee: 'Phí vận chuyển', payment_status: 'Trạng thái thanh toán', payment_link: 'Liên kết thanh toán' },
    },
    posts: {
        title: 'Bài viết', singular: 'bài viết', columns: ['Bài viết', 'Chủ đề', 'Tác giả', 'Trạng thái', 'Ngày tạo', 'Thao tác'],
        fields: { title: 'Tiêu đề', topic_id: 'Chủ đề', image: 'Đường dẫn ảnh', description: 'Mô tả', detail: 'Nội dung', status: 'Trạng thái' },
    },
    topics: {
        title: 'Chủ đề', singular: 'chủ đề', columns: ['Chủ đề', 'Chủ đề cha', 'Thứ tự', 'Trạng thái', 'Thao tác'],
        fields: { name: 'Tên chủ đề', parent_id: 'Chủ đề cha', description: 'Mô tả', sort_order: 'Thứ tự', status: 'Trạng thái' },
    },
    menus: {
        title: 'Menu', singular: 'mục menu', columns: ['Tên menu', 'Menu cha', 'Trang', 'Đường dẫn', 'Trạng thái', 'Thao tác'],
        fields: { name: 'Tên menu', parent_id: 'Menu cha', page_id: 'Trang', url: 'Đường dẫn', sort_order: 'Thứ tự', status: 'Trạng thái' },
    },
    banners: {
        title: 'Banner', singular: 'banner', columns: ['Tiêu đề', 'Ảnh', 'Đường dẫn', 'Trạng thái', 'Thứ tự', 'Thao tác'],
        fields: { title: 'Tiêu đề', image: 'Đường dẫn ảnh', url: 'Đường dẫn đích', sort_order: 'Thứ tự', status: 'Trạng thái' },
    },
    links: {
        title: 'Liên kết', singular: 'liên kết', columns: ['Tên liên kết', 'Đường dẫn', 'Thứ tự', 'Trạng thái', 'Thao tác'],
        fields: { name: 'Tên liên kết', url: 'Đường dẫn', sort_order: 'Thứ tự', status: 'Trạng thái' },
    },
    pages: {
        title: 'Trang', singular: 'trang', columns: ['Tiêu đề', 'Slug', 'Mô tả', 'Trạng thái', 'Ngày cập nhật', 'Thao tác'],
        fields: { title: 'Tiêu đề', description: 'Mô tả', content: 'Nội dung trang', status: 'Trạng thái' },
    },
    promotions: {
        title: 'Khuyến mãi', singular: 'mã khuyến mãi', columns: ['Mã', 'Mức giảm', 'Điều kiện', 'Lượt dùng', 'Trạng thái', 'Thao tác'],
        fields: { code: 'Mã khuyến mãi', discount_type: 'Loại giảm giá', discount_value: 'Giá trị giảm', min_order: 'Đơn tối thiểu', starts_at: 'Bắt đầu', ends_at: 'Kết thúc', usage_limit: 'Giới hạn lượt dùng', status: 'Trạng thái' },
    },
    contacts: {
        title: 'Liên hệ', singular: 'liên hệ', columns: ['Khách hàng', 'Email', 'Điện thoại', 'Chủ đề', 'Thao tác'],
        fields: { status: 'Trạng thái', reply_detail: 'Nội dung phản hồi' },
    },
    reviews: {
        title: 'Đánh giá', singular: 'đánh giá', columns: ['Khách hàng', 'Sản phẩm', 'Số sao', 'Trạng thái', 'Thao tác'],
        fields: { status: 'Trạng thái duyệt' },
    },
};
const resourceGroups = [
    { label: 'SẢN PHẨM', items: ['products', 'categories', 'brands'] },
    { label: 'NỘI DUNG', items: ['posts', 'topics'] },
    { label: 'VẬN HÀNH', items: ['orders', 'users', 'promotions', 'contacts', 'reviews'] },
];
const resourceIcons = {
    categories: FolderTree,
    brands: Building2,
    products: Package,
    users: Users,
    orders: ShoppingBag,
    posts: BookOpenText,
    topics: LayoutDashboard,
    menus: MenuIcon,
    pages: FileText,
    banners: ImageIcon,
    links: Link2,
    promotions: Gift,
    contacts: Mail,
    reviews: MessageSquareText,
};
const editorialImages = [
    { path: '/images/mecha-model-photo.jpg', label: 'Khung nhựa và chi tiết mô hình' },
    { path: '/images/mecha-aster.jpg', label: 'Mô hình mecha trưng bày' },
    { path: '/images/mecha-decals.jpg', label: 'Decal và chi tiết hoàn thiện' },
    { path: '/images/mecha-tools.jpg', label: 'Kìm cắt khung nhựa' },
    { path: '/images/mecha-aegis.jpg', label: 'Khung xương mô hình' },
    { path: '/images/mecha-parts.jpg', label: 'Linh kiện lắp ráp' },
    { path: '/images/mecha-figure-photo.jpg', label: 'Mô hình hoàn thiện' },
    { path: '/images/mecha-model-photo.jpg', label: 'Mô hình robot mecha' },
];
export function AdminCatalogManager({ initialResource = 'categories', openCreateOnLoad = false, searchQuery = '', statusFilter = '', dateFrom = '', dateTo = '' }) {
    const router = useRouter();
    const [resource, setResource] = useState(initialResource);
    const [mode, setMode] = useState('list');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [form, setForm] = useState({});
    const [editingId, setEditingId] = useState(null);
    const [creating, setCreating] = useState(false);
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [brandOptions, setBrandOptions] = useState([]);
    const [topicOptions, setTopicOptions] = useState([]);
    const [pageOptions, setPageOptions] = useState([]);
    const [menuOptions, setMenuOptions] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [ready, setReady] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const info = resource === 'users' && creating
        ? { ...resourceInfo.users, singular: 'quản trị viên' }
        : resourceInfo[resource];
    const canCreate = ['categories', 'brands', 'products', 'posts', 'topics', 'menus', 'pages', 'banners', 'links', 'users', 'promotions'].includes(resource);
    const canEdit = resource !== 'orders' || mode === 'list';
    const editorOpen = creating || editingId !== null;
    const loadOptions = async () => {
        try {
            const [categoriesData, brandsData, topicsData, pagesData, menusData] = await Promise.all([
                categoryService.list(),
                brandService.list(),
                AdminService.list('topics'),
                AdminService.list('pages'),
                AdminService.list('menus'),
            ]);
            setCategoryOptions(categoriesData?.data?.data || []);
            setBrandOptions(brandsData?.data?.data || []);
            setTopicOptions(topicsData?.data?.data || []);
            setPageOptions(pagesData?.data?.data || []);
            setMenuOptions(menusData?.data?.data || []);
        }
        catch (error) {
            setMessage(error instanceof Error ? error.message : 'Không thể tải danh mục và thương hiệu.');
        }
    };
    const loadItems = async () => {
        setLoading(true);
        try {
            const options = { mode, page, perPage: 10, q: searchQuery, status: statusFilter, from: dateFrom, to: dateTo };
            const response = await AdminService.list(resource, options);
            const result = response?.data;
            setItems(Array.isArray(result?.data) ? result.data : []);
            setTotal(Number(result?.total || 0));
            setPage(Number(result?.current_page || 1));
            setLastPage(Number(result?.last_page || 1));
        }
        catch (error) {
            setMessage(error instanceof Error ? error.message : 'Không thể tải dữ liệu.');
            setItems([]);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        let active = true;
        const requestedPath = `${window.location.pathname}${window.location.search}`;
        const loginUrl = `/admin/login?next=${encodeURIComponent(requestedPath)}`;
        authService.currentUser()
            .then((response) => {
            if (!active)
                return;
            if (response.user?.role !== 'admin') {
                router.replace(loginUrl);
                return;
            }
            setReady(true);
        })
            .catch(() => {
            if (active)
                router.replace(loginUrl);
        });
        return () => {
            active = false;
        };
    }, [router]);
    useEffect(() => {
        setResource(initialResource);
        setPage(1);
        setMode('list');
        setEditingId(null);
        setCreating(false);
        setForm({});
    }, [initialResource]);
    useEffect(() => {
        if (ready && openCreateOnLoad && resource === 'users' && !creating && editingId === null) {
            openCreate();
        }
    }, [ready, openCreateOnLoad, resource]);
    useEffect(() => {
        if (!ready)
            return;
        void loadOptions();
        void loadItems();
    }, [ready, resource, mode, page, searchQuery, statusFilter, dateFrom, dateTo]);
    const openCreate = () => {
        setEditingId(null);
        setCreating(true);
        setForm({
            name: '',
            description: '',
            status: '1',
            sort_order: '0',
            price: '',
            sale_price: '',
            qty: '0',
            image: '',
            category_id: '',
            brand_id: '',
            parent_id: '',
            email: '',
            phone: '',
            password: '',
            password_confirmation: '',
        });
    };
    const openEdit = (item) => {
        setCreating(false);
        setEditingId(item.id);
        setForm({
            name: item.name ?? '',
            description: item.description ?? '',
            image: item.image ?? '',
            status: String(item.status ?? 1),
            role: item.role ?? 'user',
            is_active: String(item.is_active ?? 1),
            reply_detail: item.reply_detail ?? '',
            sort_order: String(item.sort_order ?? 0),
            url: item.url ?? '',
            price: item.price !== undefined && item.price !== null ? String(item.price) : '',
            sale_price: item.sale_price !== undefined && item.sale_price !== null ? String(item.sale_price) : '',
            qty: item.qty !== undefined && item.qty !== null ? String(item.qty) : '0',
            category_id: item.category_id ? String(item.category_id) : '',
            brand_id: item.brand_id ? String(item.brand_id) : '',
            parent_id: item.parent_id ? String(item.parent_id) : '',
            page_id: item.page_id ? String(item.page_id) : '',
            topic_id: item.topic_id ? String(item.topic_id) : '',
            content: item.content ?? '',
            detail: item.detail ?? '',
            payment_method: item.payment_method ?? '',
            payment_status: item.payment_status ?? 'unpaid',
            shipping_fee: String(item.shipping_fee ?? 0),
            shipping_confirmed: item.shipping_confirmed,
            code: item.code ?? '',
            discount_type: item.discount_type ?? 'fixed',
            discount_value: item.discount_value == null ? '' : String(item.discount_value),
            min_order: String(item.min_order ?? 0),
            starts_at: item.starts_at ? String(item.starts_at).replace(' ', 'T').slice(0, 16) : '',
            ends_at: item.ends_at ? String(item.ends_at).replace(' ', 'T').slice(0, 16) : '',
            usage_limit: item.usage_limit == null ? '' : String(item.usage_limit),
        });
    };
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (resource === 'users' && creating) {
            try {
                await userService.createAdmin(form);
                setMessage('Tạo tài khoản quản trị viên thành công.');
                setCreating(false);
                setForm({});
                await loadItems();
            }
            catch (error) {
                setMessage(error instanceof Error ? error.message : 'Không thể tạo tài khoản quản trị viên.');
            }
            return;
        }
        const payload = {};
        Object.entries(form).forEach(([key, value]) => {
            if (value === '') {
                payload[key] = null;
                return;
            }
            if (key === 'status' || key === 'is_active' || key === 'sort_order' || key === 'price' || key === 'sale_price' || key === 'qty' || key === 'category_id' || key === 'brand_id' || key === 'shipping_fee' || key === 'discount_value' || key === 'min_order' || key === 'usage_limit') {
                payload[key] = resource === 'orders' && key === 'status' ? value : Number(value);
                return;
            }
            payload[key] = value;
        });
        try {
            if (editingId && resource === 'orders') {
                await AdminService.save(resource, editingId, payload);
                if (form.payment_method === 'bank_transfer') {
                    await AdminService.updatePaymentStatus(editingId, form.payment_status);
                }
            }
            else {
                await AdminService.save(resource, editingId, payload);
            }
            setMessage('Lưu dữ liệu thành công.');
            setCreating(false);
            setEditingId(null);
            setForm({});
            await loadItems();
        }
        catch (error) {
            setMessage(error instanceof Error ? error.message : 'Không thể lưu dữ liệu.');
        }
    };
    const handleDelete = async (id) => {
        if (!window.confirm('Chuyển bản ghi này vào thùng rác?'))
            return;
        try {
            await AdminService.delete(resource, id);
            setMessage('Đã chuyển bản ghi vào thùng rác.');
            await loadItems();
        }
        catch (error) {
            setMessage(error instanceof Error ? error.message : 'Xóa thất bại.');
        }
    };
    const handleRestore = async (id) => {
        try {
            await AdminService.restore(resource, id);
            setMessage('Khôi phục thành công.');
            await loadItems();
        }
        catch (error) {
            setMessage(error instanceof Error ? error.message : 'Khôi phục thất bại.');
        }
    };
    const handleForceDelete = async (id) => {
        if (!window.confirm('Xóa vĩnh viễn bản ghi này? Thao tác này không thể hoàn tác.'))
            return;
        try {
            await AdminService.permanentlyDelete(resource, id);
            setMessage('Đã xóa vĩnh viễn.');
            await loadItems();
        }
        catch (error) {
            setMessage(error instanceof Error ? error.message : 'Xóa vĩnh viễn thất bại.');
        }
    };
    const handleImageUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setUploadingImage(true);
        try {
            const response = await AdminService.uploadImage(file);
            setForm((current) => ({ ...current, image: response.data.url }));
            setMessage('Tải ảnh lên thành công.');
        }
        catch (error) {
            setMessage(error instanceof Error ? error.message : 'Tải ảnh lên thất bại.');
        }
        finally {
            setUploadingImage(false);
            event.target.value = '';
        }
    };
    const handleCreatePaymentLink = async () => {
        try {
            const response = await AdminService.createPaymentLink(editingId);
            setForm((current) => ({ ...current, payment_url: response.data.payment_url }));
            setMessage('Đã tạo liên kết thanh toán.');
            await loadItems();
        }
        catch (error) {
            setMessage(error instanceof Error ? error.message : 'Không thể tạo liên kết thanh toán.');
        }
    };
    const renderField = (key) => {
        if (key === 'status') {
            return (_jsxs("label", { children: [_jsx("span", { children: resourceInfo[resource].fields[key] }), _jsx("select", { value: form[key] ?? '1', onChange: (event) => setForm((current) => ({ ...current, [key]: event.target.value })), children: resource === 'orders' ? (_jsxs(_Fragment, { children: [_jsx("option", { value: "pending", children: "Ch\u1EDD x\u1EED l\u00FD" }), _jsx("option", { value: "processing", children: "\u0110ang x\u1EED l\u00FD" }), _jsx("option", { value: "shipped", children: "\u0110ang giao" }), _jsx("option", { value: "delivered", children: "\u0110\u00E3 giao" }), _jsx("option", { value: "cancelled", children: "\u0110\u00E3 h\u1EE7y" })] })) : resource === 'reviews' || resource === 'contacts' ? (_jsxs(_Fragment, { children: [_jsx("option", { value: "0", children: resource === 'reviews' ? 'Chờ duyệt' : 'Chưa đọc' }), _jsx("option", { value: "1", children: resource === 'reviews' ? 'Đã duyệt' : 'Đã xử lý' })] })) : (_jsxs(_Fragment, { children: [_jsx("option", { value: "1", children: "Hi\u1EC3n th\u1ECB" }), _jsx("option", { value: "0", children: "\u1EA8n" })] })) })] }, key));
        }
        if (key === 'category_id') {
            return (_jsxs("label", { children: [_jsx("span", { children: resourceInfo[resource].fields[key] }), _jsxs("select", { value: form[key] ?? '', onChange: (event) => setForm((current) => ({ ...current, [key]: event.target.value })), children: [_jsx("option", { value: "", children: "-- Ch\u1ECDn danh m\u1EE5c --" }), categoryOptions.map((category) => (_jsx("option", { value: category.id, children: category.name }, category.id)))] })] }, key));
        }
        if (key === 'role') {
            return (_jsxs("label", { children: [_jsx("span", { children: resourceInfo[resource].fields[key] }), _jsxs("select", { value: form[key] ?? 'user', onChange: (event) => setForm((current) => ({ ...current, [key]: event.target.value })), children: [_jsx("option", { value: "user", children: "Kh\u00E1ch h\u00E0ng" }), _jsx("option", { value: "admin", children: "Qu\u1EA3n tr\u1ECB vi\u00EAn" })] })] }, key));
        }
        if (key === 'is_active') {
            return (_jsxs("label", { children: [_jsx("span", { children: resourceInfo.users.fields[key] }), _jsxs("select", { value: form[key] ?? '1', onChange: (event) => setForm((current) => ({ ...current, [key]: event.target.value })), children: [_jsx("option", { value: "1", children: "Đang hoạt động" }), _jsx("option", { value: "0", children: "Đã khóa" })] })] }, key));
        }
        if (key === 'discount_type') {
            return (_jsxs("label", { children: [_jsx("span", { children: resourceInfo[resource].fields[key] }), _jsxs("select", { value: form[key] ?? 'fixed', onChange: (event) => setForm((current) => ({ ...current, [key]: event.target.value })), children: [_jsx("option", { value: "fixed", children: "Giảm số tiền cố định (₫)" }), _jsx("option", { value: "percentage", children: "Giảm theo phần trăm (%)" })] })] }, key));
        }
        if (key === 'topic_id' || key === 'page_id' || (key === 'parent_id' && resource === 'menus')) {
            const options = key === 'topic_id' ? topicOptions : key === 'page_id' ? pageOptions : menuOptions;
            return (_jsxs("label", { children: [_jsx("span", { children: resourceInfo[resource].fields[key] }), _jsxs("select", { value: form[key] ?? '', onChange: (event) => setForm((current) => ({ ...current, [key]: event.target.value })), children: [_jsx("option", { value: "", children: "-- Kh\u00F4ng ch\u1ECDn --" }), options.filter((option) => option.id !== editingId).map((option) => (_jsx("option", { value: option.id, children: option.name ?? option.title }, option.id)))] })] }, key));
        }
        if (key === 'order_status')
            key = 'status';
        if (key === 'description') {
            return (_jsxs("label", { className: "wide", children: [_jsx("span", { children: resourceInfo[resource].fields[key] }), _jsx("textarea", { value: form[key] ?? '', onChange: (event) => setForm((current) => ({ ...current, [key]: event.target.value })) })] }, key));
        }
        if (key === 'detail' || key === 'content' || key === 'reply_detail') {
            return (_jsxs("label", { className: "wide", children: [_jsx("span", { children: resourceInfo[resource].fields[key] }), _jsx("textarea", { value: form[key] ?? '', onChange: (event) => setForm((current) => ({ ...current, [key]: event.target.value })) })] }, key));
        }
        if (key === 'parent_id') {
            const options = resource === 'topics' ? topicOptions : resource === 'menus' ? menuOptions : categoryOptions;
            return (_jsxs("label", { children: [_jsx("span", { children: resourceInfo[resource].fields[key] }), _jsxs("select", { value: form[key] ?? '', onChange: (event) => setForm((current) => ({ ...current, [key]: event.target.value })), children: [_jsx("option", { value: "", children: "Kh\u00F4ng c\u00F3 danh m\u1EE5c cha" }), options.filter((option) => option.id !== editingId).map((option) => (_jsx("option", { value: option.id, children: option.name }, option.id)))] })] }, key));
        }
        if (key === 'brand_id') {
            return (_jsxs("label", { children: [_jsx("span", { children: resourceInfo[resource].fields[key] }), _jsxs("select", { value: form[key] ?? '', onChange: (event) => setForm((current) => ({ ...current, [key]: event.target.value })), children: [_jsx("option", { value: "", children: "-- Ch\u1ECDn th\u01B0\u01A1ng hi\u1EC7u --" }), brandOptions.map((brand) => (_jsx("option", { value: brand.id, children: brand.name }, brand.id)))] })] }, key));
        }
        if (key === 'shipping_fee') {
            return (_jsxs("label", { children: [_jsx("span", { children: resourceInfo[resource].fields[key] }), _jsx("input", { type: "number", min: "0", step: "1", required: true, value: form.shipping_fee ?? '0', onChange: (event) => setForm((current) => ({ ...current, shipping_fee: event.target.value })) })] }, key));
        }
        if (key === 'payment_status') {
            if (form.payment_method !== 'bank_transfer') return null;
            return (_jsxs("label", { children: [_jsx("span", { children: resourceInfo[resource].fields[key] }), _jsxs("select", { value: form.payment_status ?? 'unpaid', onChange: (event) => setForm((current) => ({ ...current, payment_status: event.target.value })), children: [_jsx("option", { value: "unpaid", children: "Chưa thanh toán" }), _jsx("option", { value: "paid", children: "Đã nhận chuyển khoản" })] })] }, key));
        }
        if (key === 'payment_link') {
            if (!['vnpay', 'momo'].includes(form.payment_method)) return null;
            return (_jsxs("div", { className: "wide", children: [
                _jsx("span", { children: resourceInfo[resource].fields[key] }),
                form.payment_url && _jsx("p", { children: _jsx("a", { href: form.payment_url, target: "_blank", rel: "noreferrer", children: "Mở liên kết thanh toán hiện tại" }) }),
                _jsx("button", { type: "button", className: "button button-light", disabled: !form.shipping_confirmed, onClick: handleCreatePaymentLink, children: form.shipping_confirmed ? "Tạo liên kết thanh toán" : "Lưu phí vận chuyển trước để tạo liên kết" }),
            ] }, key));
        }
        if (key === 'image') {
            const currentImage = form.image ?? '';
            return (_jsxs("label", { className: "wide admin-image-field", children: [
                _jsx("span", { children: "Ảnh (tối đa 5 MB)" }),
                _jsx("input", { type: "file", accept: "image/jpeg,image/png,image/webp", disabled: uploadingImage, onChange: handleImageUpload }),
                resource === 'posts' && _jsxs("select", { value: editorialImages.some((image) => image.path === currentImage) ? currentImage : '', onChange: (event) => setForm((current) => ({ ...current, image: event.target.value })), children: [_jsx("option", { value: "", children: "-- Chọn ảnh mẫu --" }), editorialImages.map((image) => (_jsx("option", { value: image.path, children: image.label }, image.path)))] }),
                _jsx("input", { type: "text", value: currentImage, onChange: (event) => setForm((current) => ({ ...current, image: event.target.value })), placeholder: "URL ảnh hoặc đường dẫn ảnh đã tải lên" }),
                currentImage && _jsx("div", { className: "admin-image-preview", children: _jsx("img", { src: assetUrl(currentImage), alt: "Xem trước ảnh" }) }),
            ] }, key));
        }
        if (key === 'image' && resource === 'posts') {
            const currentImage = form.image ?? '';
            return (_jsxs("label", { className: "wide admin-image-field", children: [_jsx("span", { children: resourceInfo[resource].fields[key] }), _jsxs("select", { value: currentImage, onChange: (event) => setForm((current) => ({ ...current, image: event.target.value })), children: [_jsx("option", { value: "", children: "-- Ch\u1ECDn \u1EA3nh ch\u1EE7 \u0111\u1EC1 --" }), editorialImages.map((image) => (_jsx("option", { value: image.path, children: image.label }, image.path)))] }), currentImage && (_jsxs("div", { className: "admin-image-preview", children: [_jsx("img", { src: assetUrl(currentImage), alt: "Xem tr\u01B0\u1EDBc \u1EA3nh b\u00E0i vi\u1EBFt" }), _jsx("span", { children: editorialImages.find((image) => image.path === currentImage)?.label ?? currentImage })] }))] }, key));
        }
        return (_jsxs("label", { children: [_jsx("span", { children: resourceInfo[resource].fields[key] ?? key }), _jsx("input", { type: key === 'starts_at' || key === 'ends_at' ? 'datetime-local' : key.includes('price') || key.includes('sale') || key.includes('qty') || key.includes('order') || key === 'discount_value' || key === 'min_order' || key === 'usage_limit' || key === 'sort_order' ? 'number' : key === 'email' ? 'email' : key.includes('password') ? 'password' : 'text', min: key === 'discount_value' || key === 'usage_limit' ? '1' : key === 'min_order' ? '0' : undefined, max: key === 'discount_value' && form.discount_type === 'percentage' ? '100' : undefined, step: key.includes('price') || key === 'discount_value' || key === 'min_order' ? 'any' : '1', value: form[key] ?? '', required: resource === 'users' && creating && ['name', 'email', 'password', 'password_confirmation'].includes(key), minLength: key.includes('password') ? 10 : undefined, autoComplete: key.includes('password') ? 'new-password' : undefined, onChange: (event) => setForm((current) => ({ ...current, [key]: event.target.value })), placeholder: resourceInfo[resource].fields[key] ?? key })] }, key));
    };
    const fieldKeys = useMemo(() => {
        const fields = {
            categories: ['name', 'parent_id', 'image', 'sort_order', 'status', 'description'],
            brands: ['name', 'image', 'sort_order', 'status'],
            products: ['name', 'category_id', 'brand_id', 'price', 'sale_price', 'qty', 'image', 'status', 'description'],
            users: creating ? ['name', 'email', 'phone', 'password', 'password_confirmation'] : ['name', 'phone', 'role', 'is_active'],
            orders: ['shipping_fee', 'status', 'payment_status', 'payment_link'],
            posts: ['title', 'topic_id', 'image', 'description', 'detail', 'status'],
            topics: ['name', 'parent_id', 'sort_order', 'status', 'description'],
            menus: ['name', 'parent_id', 'page_id', 'url', 'sort_order', 'status'],
            banners: ['title', 'image', 'url', 'sort_order', 'status'],
            links: ['name', 'url', 'sort_order', 'status'],
            pages: ['title', 'description', 'content', 'status'],
            promotions: ['code', 'discount_type', 'discount_value', 'min_order', 'starts_at', 'ends_at', 'usage_limit', 'status'],
            contacts: ['status', 'reply_detail'],
            reviews: ['status'],
        };
        return fields[resource];
    }, [resource]);
    return (_jsx("div", { className: "next-admin-shell", style: { minHeight: '100vh' }, children: !ready ? _jsx("div", { className: "content", children: "\u0110ang ki\u1EC3m tra phi\u00EAn \u0111\u0103ng nh\u1EADp..." }) : _jsxs(_Fragment, { children: [_jsxs("aside", { className: "sidebar", children: [_jsxs("div", { className: "brand", style: { display: 'flex', alignItems: 'center', gap: 12 }, children: [_jsx("span", { className: "brand-mark", children: "M" }), _jsxs("span", { children: ["LUANHUNG", _jsx("span", { className: "brand-muted", children: "." }), _jsx("small", { children: "SHOP \u00B7 ADMIN" })] })] }), _jsxs("div", { className: "nav-caption", children: [_jsx("span", { className: "admin-nav-orb" }), " KH\u00D4NG GIAN QU\u1EA2N TR\u1ECA"] }), resourceGroups.map((group) => (_jsxs("div", { className: "admin-nav-group", children: [_jsx("div", { className: "admin-nav-group-label", children: group.label }), _jsx("nav", { className: "resource-nav", children: group.items.map((item) => {
                                        const Icon = resourceIcons[item];
                                        return (_jsxs("button", { type: "button", className: `nav-item ${resource === item ? 'is-active' : ''}`, onClick: () => {
                                                router.push(`/admin/${item}`);
                                            }, children: [_jsx("span", { className: "nav-icon", children: _jsx(Icon, { size: 17, strokeWidth: 1.8 }) }), _jsx("span", { children: resourceInfo[item].title }), _jsx("span", { className: "nav-arrow", children: "\u203A" })] }, item));
                                    }) })] }, group.label))), _jsxs("div", { className: "admin-sidebar-footer", children: [_jsx("span", { className: "admin-sidebar-footer-mark", children: _jsx(Boxes, { size: 17 }) }), _jsxs("span", { children: [_jsx("strong", { children: "LUANHUNG SHOP Studio" }), _jsx("small", { children: "Kh\u00F4ng gian d\u00E0nh cho builder" })] })] })] }), _jsxs("main", { className: "main-panel", style: { flex: 1 }, children: [_jsxs("header", { className: "topbar", children: [_jsxs("div", { className: "breadcrumbs", children: [_jsx("span", { className: "admin-breadcrumb-home", children: "LUANHUNG SHOP Studio" }), _jsx("span", { className: "crumb-divider", children: "/" }), _jsx("strong", { children: info.title })] }), _jsxs("div", { className: "topbar-right", children: [_jsxs("span", { className: "admin-topbar-status", children: [_jsx("span", {}), " H\u1EC7 th\u1ED1ng ho\u1EA1t \u0111\u1ED9ng"] }), _jsx(Link, { href: "/", className: "button button-light admin-store-link", children: "Xem c\u1EEDa h\u00E0ng" }), _jsx("button", { type: "button", className: "button button-light", onClick: async () => {
                                                try {
                                                    await authService.logout();
                                                    router.replace('/admin/login');
                                                } catch (error) {
                                                    setMessage(error instanceof Error ? error.message : 'Không thể đăng xuất. Vui lòng thử lại.');
                                                }
                                            }, children: "\u0110\u0103ng xu\u1EA5t" })] })] }), _jsxs("section", { className: "content", children: [_jsxs("div", { className: "admin-hero", children: [_jsxs("div", { className: "admin-hero-copy", children: [_jsxs("div", { className: "eyebrow", children: [_jsx("span", { className: "eyebrow-dot" }), " LUANHUNG \u00B7 ADMIN STUDIO"] }), _jsxs("h1", { children: ["Kh\u00F4ng gian", _jsx("br", {}), _jsx("span", { children: info.title.toLowerCase() })] }), _jsxs("p", { children: ["M\u1ECDi chi ti\u1EBFt c\u1EEDa h\u00E0ng trong t\u1EA7m ki\u1EC3m so\u00E1t. Qu\u1EA3n l\u00FD ", info.singular, ", c\u1EADp nh\u1EADt nhanh v\u00E0 gi\u1EEF m\u1ECDi th\u1EE9 v\u1EADn h\u00E0nh m\u01B0\u1EE3t m\u00E0."] }), canCreate && mode === 'list' && _jsxs("button", { type: "button", className: "button button-primary admin-hero-action", onClick: openCreate, children: ["+ T\u1EA1o ", info.singular] })] }), _jsxs("div", { className: "admin-hero-art", "aria-hidden": "true", children: [_jsx("div", { className: "admin-hero-orbit admin-hero-orbit-outer" }), _jsx("div", { className: "admin-hero-orbit admin-hero-orbit-inner" }), _jsx("div", { className: "admin-hero-cube", children: _jsx(Package, { size: 48, strokeWidth: 1.1 }) }), _jsx("span", { className: "admin-hero-chip admin-hero-chip-top", children: "MECHA / 01" }), _jsx("span", { className: "admin-hero-chip admin-hero-chip-bottom", children: "SHOP" })] })] }), _jsxs("div", { className: "admin-overview-row", children: [_jsxs("div", { className: "admin-overview-card", children: [_jsx("span", { className: "admin-overview-icon", children: _jsx(Boxes, { size: 18 }) }), _jsxs("span", { children: [_jsxs("small", { children: ["T\u1ED4NG ", info.title.toLocaleUpperCase('vi')] }), _jsx("strong", { children: loading ? '—' : total.toLocaleString('vi-VN') }), _jsx("i", { className: "admin-overview-detail", children: "B\u1EA3n ghi trong c\u1EEDa h\u00E0ng" })] })] }), _jsxs("div", { className: "admin-overview-card", children: [_jsx("span", { className: "admin-overview-icon admin-overview-icon-warm", children: _jsx(LayoutDashboard, { size: 18 }) }), _jsxs("span", { children: [_jsx("small", { children: "TRANG \u0110ANG XEM" }), _jsxs("strong", { children: [page, " ", _jsxs("i", { children: ["/ ", lastPage] })] }), _jsx("i", { className: "admin-overview-detail", children: "10 m\u1EE5c m\u1ED7i trang" })] })] }), _jsxs("div", { className: "admin-overview-card admin-overview-card-note", children: [_jsx("span", { className: "admin-overview-icon admin-overview-icon-violet", children: _jsx(Archive, { size: 18 }) }), _jsxs("span", { children: [_jsx("small", { children: "CH\u1EBE \u0110\u1ED8 HI\u1EC2N TH\u1ECA" }), _jsx("strong", { children: mode === 'list' ? 'Đang hoạt động' : 'Thùng rác' }), _jsx("i", { className: "admin-overview-detail", children: mode === 'list' ? 'Dữ liệu đang sử dụng' : 'Đã xóa · có thể khôi phục' })] })] })] }), _jsxs("div", { className: "admin-toolbar", children: [_jsxs("div", { className: "view-tabs", children: [_jsx("button", { type: "button", className: `view-tab ${mode === 'list' ? 'is-active' : ''}`, onClick: () => { setPage(1); setMode('list'); setEditingId(null); setCreating(false); setForm({}); }, children: "T\u1EA5t c\u1EA3 d\u1EEF li\u1EC7u" }), _jsx("button", { type: "button", className: `view-tab ${mode === 'trash' ? 'is-active' : ''}`, onClick: () => { setPage(1); setMode('trash'); setEditingId(null); setCreating(false); setForm({}); }, children: "Th\u00F9ng r\u00E1c" })] }), _jsxs("span", { className: "admin-toolbar-note", children: [total.toLocaleString('vi-VN'), " m\u1EE5c trong danh s\u00E1ch"] })] }), message && _jsx("div", { className: "next-message", children: message }), _jsx("div", { className: "admin-data-layout", children: _jsx("div", { className: "table-card", style: { padding: 0 }, children: _jsx("div", { className: "table-wrap", children: _jsxs("table", { children: [_jsx("thead", { children: _jsx("tr", { children: info.columns.map((column) => (_jsx("th", { children: column }, column))) }) }), _jsx("tbody", { children: loading ? (_jsx("tr", { children: _jsx("td", { colSpan: info.columns.length, children: "\u0110ang t\u1EA3i..." }) })) : items.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: info.columns.length, children: "Ch\u01B0a c\u00F3 d\u1EEF li\u1EC7u." }) })) : (items.map((item) => {
                                                            const cells = resource === 'products'
                                                                ? [
                                                                    _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 12 }, children: [_jsx("span", { className: "record-image", children: item.name?.slice(0, 1)?.toUpperCase() ?? 'P' }), _jsxs("div", { children: [_jsx("strong", { children: item.name }), _jsxs("div", { style: { color: '#666', fontSize: 12 }, children: [item.category?.name ?? '', " \u00B7 ", item.brand?.name ?? ''] })] })] }),
                                                                    formatMoney(Number(item.sale_price ?? item.price ?? 0)),
                                                                    item.qty ?? 0,
                                                                    item.status === 1 ? 'Hiển thị' : 'Ẩn',
                                                                ]
                                                                : resource === 'categories' || resource === 'brands'
                                                                    ? [
                                                                        _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 10 }, children: [item.image && _jsx("img", { src: item.image, alt: "", width: 38, height: 38, style: { objectFit: 'cover', borderRadius: 8 } }), _jsx("span", { children: item.name })] }),
                                                                        item.slug ?? '—',
                                                                        item.status === 1 ? 'Hiển thị' : 'Ẩn',
                                                                        item.created_at ? new Date(item.created_at).toLocaleDateString('vi-VN') : '—',
                                                                    ]
                                                                    : resource === 'users'
                                                                        ? [item.name, item.email, item.phone ?? '—', item.orders_count ?? 0, `${item.role}${Number(item.is_active ?? 1) ? '' : ' · Đã khóa'}`]
                                                                        : resource === 'orders'
                                                                            ? [item.order_number, `${item.customer_name} · ${item.customer_phone}`, formatMoney(Number(item.total ?? 0)), item.status, item.created_at ? new Date(item.created_at).toLocaleDateString('vi-VN') : '—', `${(item.items || []).map((orderItem) => `${orderItem.product_name} × ${orderItem.quantity}`).join(', ')} · ${item.shipping_address} · ${item.status_history?.map((entry) => entry.status).join(' → ') || 'Chờ xác nhận'}`]
                                                                            : resource === 'posts'
                                                                                ? [item.title, item.topic?.name ?? '—', item.author?.name ?? '—', item.status === 1 ? 'Đã đăng' : 'Ẩn', item.created_at ? new Date(item.created_at).toLocaleDateString('vi-VN') : '—']
                                                                                : resource === 'topics'
                                                                                    ? [item.name, item.parent?.name ?? '—', item.sort_order ?? 0, item.status === 1 ? 'Hiển thị' : 'Ẩn']
                                                                                    : resource === 'menus'
                                                                                        ? [item.name, item.parent?.name ?? '—', item.page?.title ?? '—', item.url ?? '—', item.status === 1 ? 'Hiển thị' : 'Ẩn']
                                                                                        : resource === 'banners'
                                                                                            ? [item.title, item.image ? _jsx("img", { src: assetUrl(item.image), alt: item.title, width: 64, height: 38, style: { objectFit: 'cover', borderRadius: 6 } }) : '—', item.url ?? '—', item.status === 1 ? 'Hiển thị' : 'Ẩn', item.sort_order ?? 0]
                                                                                            : resource === 'links'
                                                                                                ? [item.name, item.url, item.sort_order ?? 0, item.status === 1 ? 'Hiển thị' : 'Ẩn']
                                                                                        : resource === 'promotions'
                                                                                            ? [item.code, item.discount_type === 'percentage' ? `${item.discount_value}%` : `${Number(item.discount_value).toLocaleString('vi-VN')}₫`, `Đơn từ ${Number(item.min_order || 0).toLocaleString('vi-VN')}₫`, `${item.usage_count ?? 0} / ${item.usage_limit ?? '∞'}`, item.status === 1 ? 'Đang bật' : 'Đã tắt']
                                                                                        : resource === 'pages'
                                                                                            ? [item.title, item.slug, item.description ?? '—', item.status === 1 ? 'Hiển thị' : 'Ẩn', item.updated_at ? new Date(item.updated_at).toLocaleDateString('vi-VN') : '—']
                                                                                            : resource === 'contacts'
                                                                                                ? [item.name, item.email, item.phone ?? '—', item.title]
                                                                                                : [item.name, item.product?.name ?? '—', `${item.rating ?? 0} / 5`, item.status === 1 ? 'Đã duyệt' : 'Chờ duyệt'];
                                                            return (_jsxs("tr", { children: [cells.map((cell, index) => _jsx("td", { children: cell }, index)), _jsx("td", { children: _jsx("div", { className: "admin-record-actions", children: mode === 'trash' ? (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", onClick: () => handleRestore(item.id), children: "Restore" }), _jsx("button", { type: "button", className: "danger", onClick: () => handleForceDelete(item.id), children: "Del" })] })) : (_jsxs(_Fragment, { children: [canEdit && _jsx("button", { type: "button", onClick: () => openEdit(item), children: resource === 'orders' ? 'Trạng thái' : 'Sửa' }), _jsx("button", { type: "button", className: "danger", onClick: () => handleDelete(item.id), children: "X\u00F3a" })] })) }) })] }, item.id));
                                                        })) })] }) }) }) }), editorOpen && _jsx("div", { className: "admin-overlay", onMouseDown: (event) => {
                                        if (event.target === event.currentTarget) {
                                            setCreating(false);
                                            setEditingId(null);
                                        }
                                    }, children: _jsxs("section", { className: "admin-dialog", role: "dialog", "aria-modal": "true", "aria-labelledby": "admin-editor-title", children: [_jsxs("div", { className: "modal-heading", children: [_jsxs("div", { children: [_jsxs("div", { className: "eyebrow", children: [_jsx("span", { className: "eyebrow-dot" }), " LUANHUNG \u00B7 CH\u1EC8NH S\u1EECA D\u1EEE LI\u1EC6U"] }), _jsx("h2", { id: "admin-editor-title", children: editingId ? `Sửa ${info.singular}` : `Thêm ${info.singular}` })] }), _jsx("button", { type: "button", className: "modal-close", "aria-label": "\u0110\u00F3ng", onClick: () => { setCreating(false); setEditingId(null); }, children: "\u00D7" })] }), _jsx("p", { className: "modal-description", children: "\u0110i\u1EC1n th\u00F4ng tin b\u00EAn d\u01B0\u1EDBi \u0111\u1EC3 c\u1EADp nh\u1EADt d\u1EEF li\u1EC7u c\u1EEDa h\u00E0ng." }), _jsxs("form", { className: "admin-record-form", onSubmit: handleSubmit, children: [fieldKeys.map(renderField), _jsxs("div", { className: "admin-dialog-actions", children: [_jsx("button", { type: "button", className: "button button-light", onClick: () => { setCreating(false); setEditingId(null); }, children: "H\u1EE7y" }), _jsx("button", { type: "submit", className: "button button-primary", children: editingId ? 'Lưu thay đổi' : 'Tạo mới' })] })] })] }) }), _jsxs("footer", { className: "table-footer", style: { marginTop: 16 }, children: [_jsxs("span", { children: [total ? `Hiển thị ${items.length} / ${total} mục` : 'Chưa có mục nào', " \u00B7 Trang ", page, " / ", lastPage] }), _jsxs("div", { className: "pagination", children: [_jsx("button", { type: "button", className: "page-button", disabled: page <= 1 || loading, onClick: () => setPage((current) => Math.max(1, current - 1)), children: "\u2039" }), _jsxs("span", { children: [page, " / ", lastPage] }), _jsx("button", { type: "button", className: "page-button", disabled: page >= lastPage || loading, onClick: () => setPage((current) => Math.min(lastPage, current + 1)), children: "\u203A" })] })] })] })] })] }) }));
}
