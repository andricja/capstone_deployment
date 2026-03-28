<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$d = now()->startOfMonth()->copy();
echo "d class: " . get_class($d) . "\n";
echo "d start: " . $d->toDateTimeString() . "\n";
echo "now: " . now()->toDateTimeString() . "\n";

for ($i = 0; $i < 5; $i++) {
    echo "iter $i: d=" . $d->toDateTimeString() . " lte(now)=" . ($d->lte(now()) ? 'true' : 'false') . "\n";
    $d->addDay();
    echo "  after addDay: d=" . $d->toDateTimeString() . "\n";
}
