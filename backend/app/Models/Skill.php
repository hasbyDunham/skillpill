<?php
namespace App\Models;
use App\Support\Currency;
use Illuminate\Database\Eloquent\Model;
class Skill extends Model
{
    protected $table = 'skills'; public $incrementing = false; protected $keyType = 'string';
    protected $fillable = ['id','title','short_description','category','price','cover_url','is_custom','payload'];
    protected $casts = ['price'=>'float','is_custom'=>'boolean','payload'=>'array'];
    public function toApiArray(): array { return array_merge($this->payload ?? [], ['id'=>$this->id,'title'=>$this->title,'shortDescription'=>$this->short_description,'category'=>$this->category,'price'=>Currency::rupiah((float)$this->price),'coverUrl'=>$this->cover_url,'isCustom'=>(bool)$this->is_custom]); }
}
