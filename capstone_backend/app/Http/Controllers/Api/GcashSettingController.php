<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreGcashSettingRequest;
use App\Models\GcashSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GcashSettingController extends Controller
{
    /**
     * Get the authenticated owner's GCash settings.
     */
    public function show(Request $request): JsonResponse
    {
        $setting = $request->user()->gcashSetting;

        if (! $setting) {
            return response()->json(['message' => 'No GCash settings found. Please configure your GCash details.'], 404);
        }

        return response()->json($setting);
    }

    /**
     * Create or update GCash settings for the authenticated owner.
     */
    public function store(StoreGcashSettingRequest $request): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('qr_code_image')) {
            $data['qr_code_image'] = $request->file('qr_code_image')->store('gcash_qr', 'public');
        }

        $setting = GcashSetting::updateOrCreate(
            ['owner_id' => $request->user()->id],
            $data
        );

        return response()->json([
            'message' => 'GCash settings saved.',
            'setting' => $setting,
        ]);
    }

    /**
     * Get a specific owner's GCash details (for renters to see payment info).
     */
    public function ownerGcash(int $ownerId): JsonResponse
    {
        $setting = GcashSetting::where('owner_id', $ownerId)->first();

        if (! $setting) {
            return response()->json(['message' => 'This owner has not configured GCash settings yet.'], 404);
        }

        return response()->json([
            'account_name'   => $setting->account_name,
            'account_number' => $setting->account_number,
            'qr_code_image'  => $setting->qr_code_image,
        ]);
    }
}
