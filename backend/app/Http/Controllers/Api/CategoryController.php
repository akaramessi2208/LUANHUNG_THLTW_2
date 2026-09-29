<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CategoryController extends Controller
{
    // GET /api/categories
    public function index(): AnonymousResourceCollection
    {
        $categories = Category::active()        // (1) scope của Model
            ->whereNull('parent_id')            // (2) danh mục gốc
            ->with(['children' => fn ($q) => $q->active()])  // (1)
            ->orderBy('sort_order')             // (2) sắp xếp
            ->get();                            // trả về tập Model

        return CategoryResource::collection($categories);
    }
        public function show(string $slug): CategoryResource
    {
        $category = Category::active()
            ->where('slug', $slug)
            ->with([
                // Load danh mục con (nếu đây là danh mục cha)
                'children' => fn ($q) => $q->active()->orderBy('sort_order'),
                // Load danh mục cha (nếu đây là danh mục con)
                'parent' => fn ($q) => $q->active(),
                // Load danh sách sản phẩm thuộc danh mục (tuỳ chọn)
                'products' => fn ($q) => $q->active()->latest()->paginate(12) 
            ])
            ->firstOrFail(); // Tự động trả về HTTP 404 nếu không tìm thấy slug

        return new CategoryResource($category);
    }
}

