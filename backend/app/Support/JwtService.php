<?php
namespace App\Support;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
class JwtService
{
    private static function b64(string $v): string { return rtrim(strtr(base64_encode($v), '+/', '-_'), '='); }
    private static function secret(): string { return (string)config('app.key'); }
    public static function issue(User $u, int $ttl=86400): string { $h=self::b64(json_encode(['alg'=>'HS256','typ'=>'JWT'])); $p=self::b64(json_encode(['sub'=>$u->id,'role'=>$u->role,'iat'=>time(),'exp'=>time()+$ttl])); return $h.'.'.$p.'.'.self::b64(hash_hmac('sha256',$h.'.'.$p,self::secret(),true)); }
    public static function userFromToken(?string $token): ?User { if (!$token) return null; $parts=explode('.',$token); if(count($parts)!==3)return null; [$h,$p,$s]=$parts; if(!hash_equals(self::b64(hash_hmac('sha256',$h.'.'.$p,self::secret(),true)),$s))return null; $d=json_decode(base64_decode(strtr($p,'-_','+/')),true); if(!is_array($d)||empty($d['sub'])||($d['exp']??0)<time())return null; return User::find($d['sub']); }
    public static function verifyPassword(User $u,string $password): bool { return Hash::check($password,$u->password); }
}
