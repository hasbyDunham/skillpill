<?php
namespace App\Models;
use App\Support\Currency;
use Illuminate\Database\Eloquent\Model;
class Order extends Model
{
    protected $table = 'orders'; public $incrementing = false; protected $keyType = 'string';
    protected $fillable = ['id','user_id','items','total','discount','payment_method','status','order_type','plan_key','midtrans_snap_token','midtrans_transaction_id','payment_payload','paid_at','expired_at','created_at'];
    protected $casts = ['items'=>'array','total'=>'float','discount'=>'float','payment_payload'=>'array','paid_at'=>'datetime','expired_at'=>'datetime'];
    public function toApiArray(): array
    {
        $items = array_map(function (array $item): array {
            if (array_key_exists('price', $item)) $item['price'] = Currency::rupiah((float) $item['price']);
            return $item;
        }, $this->items ?? []);

        return ['id'=>$this->id,'userId'=>(string)$this->user_id,'items'=>$items,'total'=>Currency::rupiah((float)$this->total),'discount'=>Currency::rupiah((float)($this->discount??0)),'paymentMethod'=>$this->payment_method,'status'=>$this->status,'orderType'=>$this->order_type ?? 'skill','planKey'=>$this->plan_key,'createdAt'=>optional($this->created_at)->toISOString()];
    }
}
