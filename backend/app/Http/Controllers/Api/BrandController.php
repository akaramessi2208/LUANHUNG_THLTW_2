<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BrandController extends Controller
{
    public function index(Request $request)
    {
        $limit = $request->get('limit', 10);
        $brands = Brand::select('id', 'name', 'slug', 'image', 'status', 'created_at')
            ->orderBy('id', 'DESC')
            ->paginate($limit);

        return response()->json(['status' => true, 'data' => $brands], 200);
    }

    public function store(Request $request)
    {
        $brand = new Brand();
        $brand->name = $request->name;
        $brand->slug = Str::slug($request->name);
        $brand->image = $request->image;
        $brand->status = $request->status ?? 1;
        $brand->save();

        return response()->json(['status' => true, 'message' => 'Thêm brand thành công', 'data' => $brand], 201);
    }

    public function show($id)
    {
        $brand = Brand::find($id);
        if (!$brand) return response()->json(['status' => false, 'message' => 'Không tìm thấy'], 404);
        return response()->json(['status' => true, 'data' => $brand], 200);
    }

    public function update(Request $request, $id)
    {
        $brand = Brand::find($id);
        if (!$brand) return response()->json(['status' => false, 'message' => 'Không tìm thấy'], 404);

        $brand->name = $request->name ?? $brand->name;
        if ($request->has('name')) $brand->slug = Str::slug($request->name);
        $brand->image = $request->image ?? $brand->image;
        $brand->status = $request->status ?? $brand->status;
        $brand->save();

        return response()->json(['status' => true, 'message' => 'Cập nhật thành công', 'data' => $brand], 200);
    }

    public function destroy($id)
    {
        $brand = Brand::find($id);
        if (!$brand) return response()->json(['status' => false, 'message' => 'Không tìm thấy'], 404);
        $brand->delete();
        return response()->json(['status' => true, 'message' => 'Đã chuyển vào thùng rác'], 200);
    }

    public function trash(Request $request)
    {
        $limit = $request->get('limit', 10);
        return response()->json(['status' => true, 'data' => Brand::onlyTrashed()->paginate($limit)], 200);
    }

    public function restore($id)
    {
        $brand = Brand::onlyTrashed()->find($id);
        if (!$brand) return response()->json(['status' => false, 'message' => 'Không tìm thấy'], 404);
        $brand->restore();
        return response()->json(['status' => true, 'message' => 'Khôi phục thành công'], 200);
    }

    public function forceDelete($id)
    {
        $brand = Brand::onlyTrashed()->find($id);
        if (!$brand) return response()->json(['status' => false, 'message' => 'Không tìm thấy'], 404);
        $brand->forceDelete();
        return response()->json(['status' => true, 'message' => 'Đã xóa vĩnh viễn'], 200);
    }
}