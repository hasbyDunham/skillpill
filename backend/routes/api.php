<?php

use App\Models\Order;
use App\Models\Progress;
use App\Models\Skill;
use App\Models\User;
use App\Support\JwtService;
use App\Support\Currency;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\Rule;

Route::options('/{any}', fn () => response()->noContent())->where('any', '.*');

$userArray = function (User $user): array {
    return [
        'id' => (string) $user->id, 'name' => $user->name, 'email' => $user->email, 'phone' => $user->phone,
        'role' => $user->role, 'plan' => $user->plan, 'joinedAt' => optional($user->joined_at ?? $user->created_at)->toISOString(),
        'purchasedSkillPills' => $user->purchased_skill_pills ?? [], 'wishlist' => $user->wishlist ?? [],
        'collections' => $user->collections ?? [], 'learningHours' => (float) $user->learning_hours,
        'completedSkillCount' => (int) $user->completed_skill_count, 'streakDays' => (int) $user->streak_days,
    ];
};

$authUser = function (Request $request): ?User { return $request->user(); };

Route::prefix('auth')->group(function () use ($userArray) {
    Route::post('/register', function (Request $request) use ($userArray) {
        $data = $request->validate(['name'=>'required|string|max:120','email'=>'required|email|max:190|unique:users,email','password'=>'required|string|min:8','phone'=>'nullable|string|max:30']);
        $data['joined_at'] = now(); $data['role'] = 'user'; $data['plan'] = 'free';
        $user = User::create($data); return response()->json(['token'=>JwtService::issue($user),'user'=>$userArray($user)], 201);
    });
    Route::post('/login', function (Request $request) use ($userArray) {
        $data = $request->validate(['email'=>'required|email','password'=>'required|string']);
        $user = User::where('email', $data['email'])->first();
        if (!$user || !JwtService::verifyPassword($user, $data['password'])) return response()->json(['error'=>'Email atau password salah.'], 401);
        return response()->json(['token'=>JwtService::issue($user),'user'=>$userArray($user)]);
    });
    Route::middleware('jwt')->group(function () use ($userArray) {
        Route::get('/me', fn (Request $request) => response()->json(['user'=>$userArray($request->user())]));
        Route::post('/refresh', fn (Request $request) => response()->json(['token'=>JwtService::issue($request->user())]));
        Route::post('/logout', fn () => response()->json(['success'=>true]));
    });
});

Route::get('/skills', fn () => response()->json(Skill::orderBy('created_at')->get()->map->toApiArray()->values()));
Route::get('/skills/{skill}', fn (Skill $skill) => response()->json($skill->toApiArray()));

Route::middleware('jwt')->group(function () use ($userArray, $authUser) {
    Route::get('/profile', function (Request $request) use ($userArray) {
        $user = $request->user();
        $progress = Progress::where('user_id', $user->id)->get()->mapWithKeys(fn (Progress $p) => [$p->skill_id => $p->toApiArray()]);
        $orders = Order::where('user_id', $user->id)->latest()->get()->map->toApiArray()->values();
        return response()->json(['profile'=>$userArray($user),'progress'=>$progress,'orders'=>$orders]);
    });
    Route::post('/profile/purchase', function (Request $request) use ($userArray) {
        $data = $request->validate(['skillId'=>'required|string','paymentMethod'=>'nullable|string|max:120','couponCode'=>'nullable|string|max:40']);
        $user = $request->user(); $skill = Skill::find($data['skillId']);
        if (!$skill) return response()->json(['error'=>'SkillPill tidak ditemukan.'], 404);
        $purchased = $user->purchased_skill_pills ?? [];
        if (in_array($skill->id, $purchased, true)) return response()->json(['error'=>'Skill sudah dimiliki.'], 422);
        $price = Currency::rupiah((float) $skill->price);
        $finalPrice = strtoupper((string)($data['couponCode'] ?? '')) === 'PILLFREE' ? 0 : $price;
        $order = Order::create(['id'=>'ord-'.random_int(10000,99999),'user_id'=>$user->id,'items'=>[['skillId'=>$skill->id,'title'=>$skill->title,'price'=>$finalPrice]],'total'=>$finalPrice,'discount'=>$price-$finalPrice,'payment_method'=>$data['paymentMethod'] ?? 'Credit Card','status'=>'paid']);
        $user->purchased_skill_pills = array_values(array_unique([...$purchased, $skill->id])); $user->save();
        Progress::firstOrCreate(['user_id'=>$user->id,'skill_id'=>$skill->id], ['completed_lessons'=>[],'practice_answers'=>[],'reflection_answers'=>[],'notes'=>[]]);
        return response()->json(['success'=>true,'profile'=>$userArray($user),'order'=>$order->toApiArray(),'progress'=>Progress::where('user_id',$user->id)->get()->mapWithKeys(fn(Progress $p)=>[$p->skill_id=>$p->toApiArray()])]);
    });
    Route::post('/profile/wishlist', function (Request $request) use ($userArray) {
        $data = $request->validate(['skillId'=>'required|string']); $user=$request->user(); $wishlist=$user->wishlist ?? []; $index=array_search($data['skillId'],$wishlist,true); if($index===false)$wishlist[]=$data['skillId']; else array_splice($wishlist,$index,1); $user->wishlist=$wishlist; $user->save(); return response()->json(['wishlist'=>$wishlist,'profile'=>$userArray($user)]);
    });
    Route::post('/profile/progress', function (Request $request) use ($userArray) {
        $data = $request->validate(['skillId'=>'required|string','completedLessons'=>'nullable|array','isCompleted'=>'nullable|boolean','practiceAnswers'=>'nullable|array','reflectionAnswers'=>'nullable|array','favorite'=>'nullable|boolean','bookmarked'=>'nullable|boolean','notes'=>'nullable|array']);
        $user=$request->user(); $p=Progress::firstOrCreate(['user_id'=>$user->id,'skill_id'=>$data['skillId']], ['completed_lessons'=>[],'practice_answers'=>[],'reflection_answers'=>[],'notes'=>[]]); $wasCompleted=(bool)$p->is_completed;
        if(array_key_exists('completedLessons',$data))$p->completed_lessons=$data['completedLessons']; if(array_key_exists('isCompleted',$data))$p->is_completed=$data['isCompleted']; if(array_key_exists('practiceAnswers',$data))$p->practice_answers=array_merge($p->practice_answers??[],$data['practiceAnswers']); if(array_key_exists('reflectionAnswers',$data))$p->reflection_answers=array_merge($p->reflection_answers??[],$data['reflectionAnswers']); if(array_key_exists('notes',$data))$p->notes=array_merge($p->notes??[],$data['notes']); foreach(['favorite','bookmarked'] as $key)if(array_key_exists($key,$data))$p->{$key}=$data[$key]; if(!$wasCompleted && $p->is_completed){$p->completed_at=now();$user->completed_skill_count++;$user->learning_hours=(float)$user->learning_hours+0.5;$user->save();} $p->save(); return response()->json(['progress'=>$p->toApiArray(),'profile'=>$userArray($user)]);
    });
    Route::get('/leaderboard', function () use ($userArray) { return response()->json(User::orderByDesc(DB::raw('completed_skill_count * 100 + streak_days * 10'))->orderBy('name')->get()->values()->map(function(User $u,$i) use($userArray){$row=$userArray($u);return ['rank'=>$i+1,'name'=>$u->name,'cohort'=>'Pembelajar aktif','pills'=>(int)$u->completed_skill_count,'streak'=>(int)$u->streak_days,'points'=>(int)$u->completed_skill_count*100+(int)$u->streak_days*10,'user'=>$row];})); });
});

Route::middleware(['jwt','admin'])->group(function () use ($userArray) {
    Route::get('/admin/users', function () use ($userArray) { return response()->json(User::latest()->get()->map($userArray)->values()); });
    Route::get('/admin/orders', fn () => response()->json(Order::latest()->get()->map->toApiArray()->values()));
    Route::put('/admin/orders/{order}', function (Request $request, Order $order) {
        $data = $request->validate(['status' => ['required', Rule::in(['paid', 'pending', 'refunded'])]]);
        $order->status = $data['status'];
        $order->save();
        return response()->json($order->toApiArray());
    });
    Route::post('/admin/users', function (Request $request) use ($userArray) { $data=$request->validate(['name'=>'required|string|max:120','email'=>'required|email|max:190|unique:users,email','password'=>'required|string|min:8','role'=>['nullable',Rule::in(['user','admin'])],'plan'=>['nullable',Rule::in(['free','pro'])]]); $user=User::create([...$data,'joined_at'=>now(),'role'=>$data['role']??'user','plan'=>$data['plan']??'free','purchased_skill_pills'=>[],'wishlist'=>[],'collections'=>[]]); return response()->json($userArray($user),201); });
    Route::put('/admin/users/{user}', function (Request $request, User $user) use ($userArray) { $data=$request->validate(['name'=>'sometimes|string|max:120','email'=>['sometimes','email','max:190',Rule::unique('users','email')->ignore($user->id)],'password'=>'sometimes|string|min:8','role'=>['sometimes',Rule::in(['user','admin'])],'plan'=>['sometimes',Rule::in(['free','pro'])]]); $user->fill($data); $user->save(); return response()->json($userArray($user)); });
    Route::delete('/admin/users/{user}', function (User $user) { if($user->isAdmin()) return response()->json(['error'=>'Akun admin tidak dapat dihapus melalui API.'],422); $user->delete(); return response()->json(['success'=>true]); });
    Route::post('/skills', function (Request $request) { $data=$request->validate(['id'=>'nullable|string|max:120','title'=>'required|string|max:190','shortDescription'=>'nullable|string','category'=>'nullable|string|max:100','price'=>'required|numeric|min:0','coverUrl'=>'nullable|string','isCustom'=>'nullable|boolean']); $id=$data['id']??str()->slug($data['title']).'-'.substr(uniqid(),-5); $skill=Skill::create(['id'=>$id,'title'=>$data['title'],'short_description'=>$data['shortDescription']??'','category'=>$data['category']??'Umum','price'=>$data['price'],'cover_url'=>$data['coverUrl']??null,'is_custom'=>$data['isCustom']??true,'payload'=>$request->except(['id','title','shortDescription','category','price','coverUrl','isCustom'])]); return response()->json($skill->toApiArray(),201); });
    Route::post('/skills/manual', function (Request $request) {
        $data=$request->validate(['id'=>'nullable|string|max:120','title'=>'required|string|max:190','shortDescription'=>'nullable|string','category'=>'nullable|string|max:100','price'=>'required|numeric|min:0','coverUrl'=>'nullable|string','isCustom'=>'nullable|boolean']);
        $id=$data['id']??str()->slug($data['title']).'-'.substr(uniqid(),-5);
        $skill=Skill::create(['id'=>$id,'title'=>$data['title'],'short_description'=>$data['shortDescription']??'','category'=>$data['category']??'Umum','price'=>$data['price'],'cover_url'=>$data['coverUrl']??null,'is_custom'=>$data['isCustom']??true,'payload'=>$request->except(['id','title','shortDescription','category','price','coverUrl','isCustom'])]);
        return response()->json($skill->toApiArray(),201);
    });
    Route::put('/skills/{skill}', function (Request $request, Skill $skill) { $data=$request->all(); $skill->fill(['title'=>$data['title']??$skill->title,'short_description'=>$data['shortDescription']??$skill->short_description,'category'=>$data['category']??$skill->category,'price'=>$data['price']??$skill->price,'cover_url'=>$data['coverUrl']??$skill->cover_url,'is_custom'=>$data['isCustom']??$skill->is_custom]); $known=['id','title','shortDescription','category','price','coverUrl','isCustom']; $skill->payload=array_merge($skill->payload??[],array_diff_key($data,array_flip($known))); $skill->save(); return response()->json($skill->toApiArray()); });
    Route::delete('/skills/{skill}', function (Request $request, Skill $skill) { $skill->delete(); return response()->json(['success'=>true]); });
});
