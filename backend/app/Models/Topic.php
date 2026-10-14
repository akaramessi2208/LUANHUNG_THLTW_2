<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Topic extends Model
{
    use HasFactory, SoftDeletes;
    protected $table = 'topics';
    protected $fillable = ['name', 'slug', 'parent_id', 'sort_order', 'description', 'status'];
}