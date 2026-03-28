<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ad;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class AdController extends Controller
{
    /**
     * Get active ads for renter pages (public)
     */
    public function getActiveAds(): JsonResponse
    {
        $ads = Ad::active()
            ->orderBy('display_order', 'asc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($ads);
    }

    /**
     * Get all ads for admin management
     */
    public function index(Request $request): JsonResponse
    {
        $query = Ad::query();

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $ads = $query->orderBy('display_order', 'asc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($ads);
    }

    /**
     * Create a new ad
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'image' => ['nullable', 'image', 'max:5120'], // 5MB max
            'link_url' => ['nullable', 'url', 'max:500'],
            'status' => ['required', 'in:active,inactive'],
            'display_order' => ['nullable', 'integer', 'min:0'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();

        // Handle image upload
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('ads', 'public');
            $data['image'] = $path;
        }

        $ad = Ad::create($data);

        return response()->json([
            'message' => 'Ad created successfully',
            'ad' => $ad,
        ], 201);
    }

    /**
     * Update an existing ad
     */
    public function update(Request $request, Ad $ad): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'image' => ['nullable', 'image', 'max:5120'],
            'link_url' => ['nullable', 'url', 'max:500'],
            'status' => ['required', 'in:active,inactive'],
            'display_order' => ['nullable', 'integer', 'min:0'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();

        // Handle image upload
        if ($request->hasFile('image')) {
            // Delete old image
            if ($ad->image) {
                Storage::disk('public')->delete($ad->image);
            }
            $path = $request->file('image')->store('ads', 'public');
            $data['image'] = $path;
        }

        $ad->update($data);

        return response()->json([
            'message' => 'Ad updated successfully',
            'ad' => $ad,
        ]);
    }

    /**
     * Delete an ad
     */
    public function destroy(Ad $ad): JsonResponse
    {
        // Delete image file
        if ($ad->image) {
            Storage::disk('public')->delete($ad->image);
        }

        $ad->delete();

        return response()->json([
            'message' => 'Ad deleted successfully',
        ]);
    }

    /**
     * Toggle ad status
     */
    public function toggleStatus(Ad $ad): JsonResponse
    {
        $ad->status = $ad->status === 'active' ? 'inactive' : 'active';
        $ad->save();

        return response()->json([
            'message' => 'Ad status updated successfully',
            'ad' => $ad,
        ]);
    }
}
