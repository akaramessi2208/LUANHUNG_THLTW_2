<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BrandResource;
use App\Models\Brand;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BrandController extends Controller
{
    // GET /api/brands
    public function index(): AnonymousResourceCollection
    {
        $brands = Brand::where('status', 1)
            ->orderBy('sort_order', 'asc')
            ->get();

        return BrandResource::collection($brands);
    }
}