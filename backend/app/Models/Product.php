<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'products';

    protected $fillable = [
        'category_id',
        'brand_id',
        'name',
        'slug',
        'price',
        'sale_price',
        'image',
        'description',
        'status',
    ];

    protected $casts = [
        'category_id' => 'integer',
        'brand_id'    => 'integer',
        'price'       => 'float',
        'sale_price'  => 'float',
        'status'      => 'integer',
    ];
}