<?php
use App\Http\Controllers\Api\CategoryController;
use Illuminate\Support\Facades\Route;

// Mọi route trong file này tự có tiền tố /api
Route::get('/categories', [CategoryController::class, 'index']);
