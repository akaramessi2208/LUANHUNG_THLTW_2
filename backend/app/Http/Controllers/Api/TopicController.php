<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use Illuminate\Http\Request;

class BannerController extends Controller
{
    public function index(Request $request)
    {
        $limit = $request->get('limit', 10);
        return response()->json(['status' => true, 'data' => Banner::orderBy('id', 'DESC')->paginate($limit)], 200);
    }

    public function store(Request $request)
    {
        $banner = Banner::create($request->all());
        return response()->json(['status' => true, 'message' => 'Thêm banner thành công', 'data' => $banner], 201);
    }

    public function show($id)
    {
        $banner = Banner::find($id);
        if (!$banner) return response()->json(['status' => false, 'message' => 'Không tìm thấy'], 404);
        return response()->json(['status' => true, 'data' => $banner], 200);
    }

    public function update(Request $request, $id)
    {
        $banner = Banner::find($id);
        if (!$banner) return response()->json(['status' => false, 'message' => 'Không tìm thấy'], 404);
        $banner->update($request->all());
        return response()->json(['status' => true, 'message' => 'Cập nhật thành công', 'data' => $banner], 200);
    }

    public function destroy($id)
    {
        $banner = Banner::find($id);
        if (!$banner) return response()->json(['status' => false, 'message' => 'Không tìm thấy'], 404);
        $banner->delete();
        return response()->json(['status' => true, 'message' => 'Đã chuyển vào thùng rác'], 200);
    }

    public function trash(Request $request)
    {
        $limit = $request->get('limit', 10);
        return response()->json(['status' => true, 'data' => Banner::onlyTrashed()->paginate($limit)], 200);
    }

    public function restore($id)
    {
        $banner = Banner::onlyTrashed()->find($id);
        if (!$banner) return response()->json(['status' => false, 'message' => 'Không tìm thấy trong thùng rác'], 404);
        $banner->restore();
        return response()->json(['status' => true, 'message' => 'Khôi phục thành công'], 200);
    }

    public function forceDelete($id)
    {
        $banner = Banner::onlyTrashed()->find($id);
        if (!$banner) return response()->json(['status' => false, 'message' => 'Không tìm thấy trong thùng rác'], 404);
        $banner->forceDelete();
        return response()->json(['status' => true, 'message' => 'Đã xóa vĩnh viễn'], 200);
    }
}