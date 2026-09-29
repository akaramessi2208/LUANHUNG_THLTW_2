<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'slug'        => $this->slug,
            'description' => $this->description,
            'image_url'   => $this->image ? asset('storage/' . $this->image) : null,
            'sort_order'  => $this->sort_order,
            
            // Tự động gộp dữ liệu liên quan nếu controller có call `with()`
            'parent'      => new CategoryResource($this->whenLoaded('parent')),
            'children'    => CategoryResource::collection($this->whenLoaded('children')),
            'products'    => $this->whenLoaded('products'),
            
            'created_at'  => $this->created_at?->toIso8601String(),
        ];
    }
}