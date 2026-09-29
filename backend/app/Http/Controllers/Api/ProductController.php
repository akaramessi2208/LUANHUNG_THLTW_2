<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductController extends Controller
{
    // GET /api/products (Lấy tất cả, phân trang, lọc theo status & category_id)
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Product::query();

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        $products = $query->orderBy('id', 'desc')->paginate(12);

        return ProductResource::collection($products);
    }

    // GET /api/products/new (Lấy sản phẩm mới nhất)
    public function getNew(): AnonymousResourceCollection
    {
        $products = Product::where('status', 1)
            ->orderBy('created_at', 'desc')
            ->take(8)
            ->get();

        return ProductResource::collection($products);
    }

    // GET /api/products/sale (Lấy sản phẩm đang giảm giá)
    public function getSale(): AnonymousResourceCollection
    {
        $products = Product::where('status', 1)
            ->whereNotNull('sale_price')
            ->where('sale_price', '>', 0)
            ->paginate(12);

        return ProductResource::collection($products);
    }

    // GET /api/products/hot (Lấy sản phẩm nổi bật/hot)
    public function getHot(): AnonymousResourceCollection
    {
        $products = Product::where('status', 1)
            ->orderBy('id', 'desc')
            ->take(8)
            ->get();

        return ProductResource::collection($products);
    }

    // GET /api/products/{id} (Xem chi tiết 1 sản phẩm)
    public function show($id)
    {
        $product = Product::findOrFail($id);
        return new ProductResource($product);
    }

    // DELETE /api/products/{id} (Xóa mềm / Soft Delete - Đưa vào thùng rác)
    public function softDelete($id): JsonResponse
    {
        $product = Product::findOrFail($id);
        $product->delete();

        return response()->json([
            'message' => 'Đã chuyển sản phẩm vào thùng rác thành công!'
        ], 200);
    }

    // GET /api/products/trash (Xem danh sách thùng rác)
    public function trash(): AnonymousResourceCollection
    {
        $products = Product::onlyTrashed()->get();
        return ProductResource::collection($products);
    }

    // POST /api/products/{id}/restore (Khôi phục sản phẩm từ thùng rác)
    public function restore($id): JsonResponse
    {
        $product = Product::onlyTrashed()->findOrFail($id);
        $product->restore();

        return response()->json([
            'message' => 'Đã khôi phục sản phẩm thành công!'
        ], 200);
    }

    // DELETE /api/products/{id}/force-delete (Xóa vĩnh viễn)
    public function forceDelete($id): JsonResponse
    {
        $product = Product::onlyTrashed()->findOrFail($id);
        $product->forceDelete();

        return response()->json([
            'message' => 'Đã xóa vĩnh viễn sản phẩm khỏi hệ thống!'
        ], 200);
    }
}