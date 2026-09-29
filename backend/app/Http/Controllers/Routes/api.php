<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Import các Controller
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\PaymentMethodController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// 1. API Danh mục (Categories)
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{slug}', [CategoryController::class, 'show']);

// 2. API Thương hiệu (Brands)
Route::get('/brands', [BrandController::class, 'index']);

// 3. API Sản phẩm (Products)
Route::get('/products', [ProductController::class, 'index']);

// 4. API CRUD Phương thức thanh toán (Payment Methods)
// Tự động khai báo 5 route: GET (danh sách), POST (thêm), GET {id} (chi tiết), PUT {id} (sửa), DELETE {id} (xóa)
Route::apiResource('payment-methods', PaymentMethodController::class);