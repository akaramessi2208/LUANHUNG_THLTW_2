<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePaymentMethodRequest;
use App\Http\Resources\PaymentMethodResource;
use App\Models\PaymentMethod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PaymentMethodController extends Controller
{
    // GET /api/payment-methods (Lấy danh sách)
    public function index(): AnonymousResourceCollection
    {
        $methods = PaymentMethod::all();
        return PaymentMethodResource::collection($methods);
    }

    // POST /api/payment-methods (Thêm mới)
    public function store(StorePaymentMethodRequest $request): JsonResponse
    {
        $method = PaymentMethod::create($request->validated());
        return (new PaymentMethodResource($method))
            ->response()
            ->setStatusCode(210);
    }

    // GET /api/payment-methods/{id} (Xem chi tiết)
    public function show($id)
    {
        $method = PaymentMethod::findOrFail($id);
        return new PaymentMethodResource($method);
    }

    // PUT/PATCH /api/payment-methods/{id} (Cập nhật)
    public function update(StorePaymentMethodRequest $request, $id)
    {
        $method = PaymentMethod::findOrFail($id);
        $method->update($request->validated());
        return new PaymentMethodResource($method);
    }

    // DELETE /api/payment-methods/{id} (Xóa)
    public function destroy($id): JsonResponse
    {
        $method = PaymentMethod::findOrFail($id);
        $method->delete();

        return response()->json([
            'message' => 'Xóa phương thức thanh toán thành công!'
        ], 200);
    }
}