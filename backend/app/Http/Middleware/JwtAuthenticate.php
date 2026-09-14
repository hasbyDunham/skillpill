<?php
namespace App\Http\Middleware;
use App\Support\JwtService; use Closure; use Illuminate\Http\Request; use Symfony\Component\HttpFoundation\Response;
class JwtAuthenticate { public function handle(Request $request, Closure $next): Response { $user=JwtService::userFromToken($request->bearerToken()); if(!$user)return response()->json(['error'=>'Token JWT tidak valid atau sudah kedaluwarsa.'],401); $user->refreshPlanStatus(); $request->setUserResolver(fn()=> $user); return $next($request); } }
