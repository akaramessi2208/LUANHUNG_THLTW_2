<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'category_id' => $this->category_id,
            'brand_id'    => $this->brand_id,
            'name'        => $this->name,
            'slug'        => $this->slug,
            'price'       => $this->price,
            'sale_price'  => $this->sale_price,
            'image'       => $this->image,
            'description' => $this->description,
            'status'      => $this->status,
            'deleted_at'  => $this->deleted_at,
            'created_at'  => $this->created_at,
            'updated_at'  => $this->updated_at,
        ];
    }
}