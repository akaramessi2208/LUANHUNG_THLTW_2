<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['parent_id', 'name', 'slug', 'description', 'image', 'sort_order', 'status'])]
class Category extends Model
{
    // Ép kiểu dữ liệu khi đọc từ CSDL
    protected function casts(): array
    {
        return [
            'parent_id'  => 'integer',
            'sort_order' => 'integer',
            'status'     => 'integer',
        ];
    }

    // Quan hệ: danh mục con thuộc về một danh mục cha
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    // Quan hệ: một danh mục có nhiều danh mục con
    public function children(): HasMany
    {
        return $this->hasMany(Category::class, 'parent_id');
    }

    // Scope: Category::active() -> lọc status = 1
    public function scopeActive(Builder $query): void
    {
        $query->where('status', 1);
    }
}
