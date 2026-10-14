<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    // 1. Danh sách có phân trang
    public function index(Request $request)
    {
        $limit = $request->get('limit', 10);
        $categories = Category::select('id', 'name', 'slug', 'image', 'status', 'created_at')
            ->orderBy('id', 'DESC')
            ->paginate($limit);

        return response()->json([
            'status' => true,
            'message' => 'Lấy danh sách thành công',
            'data' => $categories
        ], 200);
    }

    // 2. Thêm mới
    public function store(Request $request)
    {
        $category = new Category();
        $category->name = $request->name;
        $category->slug = Str::slug($request->name);
        $category->image = $request->image;
        $category->status = $request->status ?? 1;
        $category->save();

        return response()->json([
            'status' => true,
            'message' => 'Thêm danh mục thành công',
            'data' => $category
        ], 201);
    }

    // 3. Chi tiết
    public function show($id)
    {
        $category = Category::find($id);
        if (!$category) {
            return response()->json(['status' => false, 'message' => 'Không tìm thấy danh mục'], 404);
        }

        return response()->json(['status' => true, 'data' => $category], 200);
    }

    // 4. Cập nhật
    public function update(Request $request, $id)
    {
        $category = Category::find($id);
        if (!$category) {
            return response()->json(['status' => false, 'message' => 'Không tìm thấy danh mục'], 404);
        }

        $category->name = $request->name ?? $category->name;
        if ($request->has('name')) {
            $category->slug = Str::slug($request->name);
        }
        $category->image = $request->image ?? $category->image;
        $category->status = $request->status ?? $category->status;
        $category->save();

        return response()->json([
            'status' => true,
            'message' => 'Cập nhật thành công',
            'data' => $category
        ], 200);
    }

    // 5. Chuyển vào thùng rác (Soft Delete)
    public function destroy($id)
    {
        $category = Category::find($id);
        if (!$category) {
            return response()->json(['status' => false, 'message' => 'Không tìm thấy danh mục'], 404);
        }

        $category->delete();

        return response()->json([
            'status' => true,
            'message' => 'Đã chuyển danh mục vào thùng rác'
        ], 200);
    }

    // --- KHU VỰC THÙNG RÁC (TRASH) ---

    // 6. Danh sách trong thùng rác
    public function trash(Request $request)
    {
        $limit = $request->get('limit', 10);
        $categories = Category::onlyTrashed()
            ->orderBy('deleted_at', 'DESC')
            ->paginate($limit);

        return response()->json([
            'status' => true,
            'data' => $categories
        ], 200);
    }

    // 7. Khôi phục
    public function restore($id)
    {
        $category = Category::onlyTrashed()->find($id);
        if (!$category) {
            return response()->json(['status' => false, 'message' => 'Không tìm thấy trong thùng rác'], 404);
        }

        $category->restore();

        return response()->json([
            'status' => true,
            'message' => 'Khôi phục danh mục thành công'
        ], 200);
    }

    // 8. Xóa vĩnh viễn
    public function forceDelete($id)
    {
        $category = Category::onlyTrashed()->find($id);
        if (!$category) {
            return response()->json(['status' => false, 'message' => 'Không tìm thấy trong thùng rác'], 404);
        }

        $category->forceDelete();

        return response()->json([
            'status' => true,
            'message' => 'Đã xóa vĩnh viễn danh mục'
        ], 200);
    }
}