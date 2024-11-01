<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Departemen extends Model
{
    use HasFactory;
    protected $table = 'departemens';
    protected $guarded = [];
    public $incrementing = false;
    protected $primaryKey = 'id';
    protected $keyType = 'uuid';
}
