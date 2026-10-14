<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\BannerController;
use App\Http\Controllers\Api\TopicController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\ContactController;

// 1. Categories
Route::get('categories/trash', [CategoryController::class, 'trash']);
Route::get('categories/restore/{id}', [CategoryController::class, 'restore']);
Route::delete('categories/force-delete/{id}', [CategoryController::class, 'forceDelete']);
Route::apiResource('categories', CategoryController::class);

// 2. Brands
Route::get('brands/trash', [BrandController::class, 'trash']);
Route::get('brands/restore/{id}', [BrandController::class, 'restore']);
Route::delete('brands/force-delete/{id}', [BrandController::class, 'forceDelete']);
Route::apiResource('brands', BrandController::class);

// 3. Products
Route::get('products/trash', [ProductController::class, 'trash']);
Route::get('products/restore/{id}', [ProductController::class, 'restore']);
Route::delete('products/force-delete/{id}', [ProductController::class, 'forceDelete']);
Route::apiResource('products', ProductController::class);

// 4. Banners
Route::get('banners/trash', [BannerController::class, 'trash']);
Route::get('banners/restore/{id}', [BannerController::class, 'restore']);
Route::delete('banners/force-delete/{id}', [BannerController::class, 'forceDelete']);
Route::apiResource('banners', BannerController::class);

// 5. Topics
Route::get('topics/trash', [TopicController::class, 'trash']);
Route::get('topics/restore/{id}', [TopicController::class, 'restore']);
Route::delete('topics/force-delete/{id}', [TopicController::class, 'forceDelete']);
Route::apiResource('topics', TopicController::class);

// 6. Posts
Route::get('posts/trash', [PostController::class, 'trash']);
Route::get('posts/restore/{id}', [PostController::class, 'restore']);
Route::delete('posts/force-delete/{id}', [PostController::class, 'forceDelete']);
Route::apiResource('posts', PostController::class);

// 7. Contacts
Route::get('contacts/trash', [ContactController::class, 'trash']);
Route::get('contacts/restore/{id}', [ContactController::class, 'restore']);
Route::delete('contacts/force-delete/{id}', [ContactController::class, 'forceDelete']);
Route::apiResource('contacts', ContactController::class);