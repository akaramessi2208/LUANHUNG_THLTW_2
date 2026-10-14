<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Post extends Model
{
    use HasFactory, SoftDeletes;
    protected $table = 'posts';
    protected $fillable = ['topic_id', 'title', 'slug', 'image', 'detail', 'type', 'description', 'status'];

    public function topic()
    {
        return $this->belongsTo(Topic::class, 'topic_id');
    }
}