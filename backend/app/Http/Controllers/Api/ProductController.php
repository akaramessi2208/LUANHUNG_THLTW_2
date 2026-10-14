<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $limit = $request->get('limit', 10);
        $products = Product::with(['category:id,name', 'brand:id,name'])
            ->orderBy('id', 'DESC')
            ->paginate($limit);

        return response()->json(['status' => true, 'data' => $products], 200);
    }

    public function store(Request $request)
    {
        $product = new Product();
        $product->category_id = $request->category_id;
        $product->brand_id = $request->brand_id;
        $product->name = $request->name;
        $product->slug = Str::slug($request->name);
        $product->price = $request->price;
        $product->sale_price = $request->sale_price;
        $product->image = $request->image;
        $product->qty = $request->qty ?? 0;
        $product->description = $request->description;
        $product->status = $request->status ?? 1;
        $product->save();

        return response()->json(['status' => true, 'message' => 'Thêm sản phẩm thành công', 'data' => $product], 201);
    }

    public function show($id)
    {
        $product = Product::with(['category', 'brand'])->find($id);
        if (!$product) return response()->json(['status' => false, 'message' => 'Không tìm thấy'], 404);
        return response()->json(['status' => true, 'data' => $product], 200);
    }

    public function update(Request $request, $id)
    {
        $product = Product::find($id);
        if (!$product) return response()->json(['status' => false, 'message' => 'Không tìm thấy'], 404);

        $product->category_id = $request->category_id ?? $product->category_id;
        $product->brand_id = $request->brand_id ?? $product->brand_id;
        $product->name = $request->name ?? $product->name;
        if ($request->has('name')) $product->slug = Str::slug($request->name);
        $product->price = $request->price ?? $product->price;
        $product->sale_price = $request->sale_price ?? $product->sale_price;
        $product->image = $request->image ?? $product->image;
        $product->qty = $request->qty ?? $product->qty;
        $product->description = $request->description ?? $product->description;
        $product->status = $request->status ?? $product->status;
        $product->save();

        return response()->json(['status' => true, 'message' => 'Cập nhật thành công', 'data' => $product], 200);
    }

    public function destroy($id)
    {
        $product = Product::find($id);
        if (!$product) return response()->json(['status' => false, 'message' => 'Không tìm thấy'], 404);
        $product->delete();
        return response()->json(['status' => true, 'message' => 'Đã chuyển vào thùng rác'], 200);
    }

    public function trash(Request $request)
    {
        $limit = $request->get('limit', 10);
        return response()->json(['status' => true, 'data' => Product::onlyTrashed()->paginate($limit)], 200);
    }

    public function restore($id)
    {
        $product = Product::onlyTrashed()->find($id);
        if (!$product) return response()->json(['status' => false, 'message' => 'Không tìm thấy'], 404);
        $product->restore();
        return response()->json(['status' => true, 'message' => 'Khôi phục thành công'], 200);
    }

    public function forceDelete($id)
    {
        $product = Product::onlyTrashed()->find($id);
        if (!$product) return response()->json(['status' => false, 'message' => 'Không tìm thấy'], 404);
        $product->forceDelete();
        return response()->json(['status' => true, 'message' => 'Đã xóa vĩnh viễn'], 200);
    }
}