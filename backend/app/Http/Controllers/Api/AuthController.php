<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    // Đăng ký account (/api/register)
    public function register(Request $request)
    {
        $fields = $request->validate([
            'name'     => 'required|string',
            'email'    => 'required|string|unique:users,email',
            'phone'    => 'nullable|string',
            'password' => 'required|string|min:6',
        ]);

        $user = User::create([
            'name'     => $fields['name'],
            'email'    => $fields['email'],
            'phone'    => $fields['phone'] ?? null,
            'password' => Hash::make($fields['password']),
        ]);

        $token = $user->createToken('myapptoken')->plainTextToken;

        return response()->json([
            'user'  => $user,
            'token' => $token
        ], 201);
    }

    // Đăng nhập (/api/login & /api/login-admin)
    public function login(Request $request)
    {
        $fields = $request->validate([
            'email'    => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $fields['email'])->first();

        if (!$user || !Hash::check($fields['password'], $user->password)) {
            return response()->json(['message' => 'Thông tin đăng nhập không hợp lệ!'], 401);
        }

        $token = $user->createToken('myapptoken')->plainTextToken;

        return response()->json([
            'user'  => [
                'id'    => $user->id,
                'name'  => $user->name,
                'phone' => $user->phone,
                'email' => $user->email,
            ],
            'token' => $token
        ], 200);
    }

    // Lấy thông tin cá nhân (/api/me)
    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    // Đăng xuất (/api/logout)
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Đã đăng xuất thành công!']);
    }
}