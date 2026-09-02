<?php

namespace App\Support;

final class Currency
{
    public const LEGACY_USD_TO_IDR = 15000;

    public static function rupiah(float|int $value): float
    {
        $amount = (float) $value;

        return $amount > 0 && $amount <= 1000
            ? round($amount * self::LEGACY_USD_TO_IDR)
            : round($amount);
    }
}
