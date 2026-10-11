<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMessageRequestRequest;
use App\Models\MessageRequest;
use App\Models\MessageReply;
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
            ->with(['replies.user:id,name,email'])
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
        $query = MessageRequest::with(['renter:id,name,email', 'replies.user:id,name,email'])
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

    /**
     * Send a reply to a message request (Admin or Renter).
     */
    public function sendReply(Request $request, MessageRequest $messageRequest): JsonResponse
    {
        $request->validate([
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $user = $request->user();
        $senderType = $user->role === 'admin' ? 'admin' : 'renter';

        // Check if user is authorized to reply
        if ($senderType === 'renter' && $messageRequest->renter_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $reply = MessageReply::create([
            'message_request_id' => $messageRequest->id,
            'user_id'            => $user->id,
            'sender_type'        => $senderType,
            'message'            => $request->input('message'),
        ]);

        // Load the user relationship for the response
        $reply->load('user:id,name,email');

        return response()->json([
            'message' => 'Reply sent successfully.',
            'reply'   => $reply,
        ], 201);
    }

    /**
     * Get all replies for a specific message request.
     */
    public function getReplies(MessageRequest $messageRequest): JsonResponse
    {
        $replies = $messageRequest->replies()->with('user:id,name,email')->get();

        return response()->json($replies);
    }
}
