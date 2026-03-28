<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMessageRequestRequest;
use App\Models\MessageRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageRequestController extends Controller
{
    /* ------------------------------------------------------------------ */
    /*  RENTER – submit inquiries                                          */
    /* ------------------------------------------------------------------ */

    /**
     * List the renter's own submitted inquiries.
     */
    public function myMessages(Request $request): JsonResponse
    {
        $messages = $request->user()
            ->messageRequests()
            ->whereNull('archived_at')
            ->latest()
            ->paginate(15);

        return response()->json($messages);
    }

    /**
     * Submit a new inquiry / message request.
     */
    public function store(StoreMessageRequestRequest $request): JsonResponse
    {
        $data              = $request->validated();
        $data['renter_id'] = $request->user()->id;

        $messageRequest = MessageRequest::create($data);

        return response()->json([
            'message'         => 'Your inquiry has been submitted.',
            'message_request' => $messageRequest,
        ], 201);
    }

    /* ------------------------------------------------------------------ */
    /*  ADMIN – manage message requests                                    */
    /* ------------------------------------------------------------------ */

    /**
     * List all message requests (admin view).
     */
    public function index(Request $request): JsonResponse
    {
        $query = MessageRequest::with('renter:id,name,email')
            ->whereNull('archived_at');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->boolean('all')) {
            return response()->json($query->latest()->get());
        }

        $messages = $query->latest()->paginate(15);

        return response()->json($messages);
    }

    /**
     * Update message status: pending → reviewed → responded.
     */
    public function updateStatus(Request $request, MessageRequest $messageRequest): JsonResponse
    {
        $request->validate([
            'status' => ['required', 'in:pending,reviewed,responded'],
        ]);

        $messageRequest->update(['status' => $request->input('status')]);

        return response()->json([
            'message'         => 'Message status updated.',
            'message_request' => $messageRequest->fresh(),
        ]);
    }

    /**
     * Delete a resolved or spam inquiry.
     */
    public function destroy(MessageRequest $messageRequest): JsonResponse
    {
        $messageRequest->delete();

        return response()->json(['message' => 'Message request deleted.']);
    }
}
