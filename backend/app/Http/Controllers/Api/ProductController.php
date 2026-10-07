<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    // GET /api/products
    public function index()
    {
        $products = Product::latest()->get();

        return response()->json([
            'message' => 'Lấy danh sách sản phẩm thành công',
            'products' => $products,
        ]);
    }


    // GET /api/products/{id}
    public function show($id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json([
                'message' => 'Không tìm thấy sản phẩm',
            ], 404);
        }

        return response()->json([
            'message' => 'Lấy sản phẩm thành công',
            'product' => $product,
        ]);
    }


    // POST /api/products
    public function store(Request $request)
    {
        $fields = $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'image' => 'nullable|string',
            'status' => 'nullable|integer|in:0,1',
        ]);

        $product = Product::create([
            'name' => $fields['name'],
            'price' => $fields['price'],
            'description' => $fields['description'] ?? null,
            'image' => $fields['image'] ?? null,
            'status' => $fields['status'] ?? 1,
        ]);

        return response()->json([
            'message' => 'Thêm sản phẩm thành công',
            'product' => $product,
        ], 201);
    }


    // PUT /api/products/{id}
    public function update(Request $request, $id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json([
                'message' => 'Không tìm thấy sản phẩm',
            ], 404);
        }

        $fields = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'price' => 'sometimes|required|numeric|min:0',
            'description' => 'nullable|string',
            'image' => 'nullable|string',
            'status' => 'sometimes|integer|in:0,1',
        ]);

        $product->update($fields);

        return response()->json([
            'message' => 'Cập nhật sản phẩm thành công',
            'product' => $product->fresh(),
        ]);
    }


    // DELETE /api/products/{id}
    public function destroy($id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json([
                'message' => 'Không tìm thấy sản phẩm',
            ], 404);
        }

        $product->delete();

        return response()->json([
            'message' => 'Xóa sản phẩm thành công',
        ]);
    }
}