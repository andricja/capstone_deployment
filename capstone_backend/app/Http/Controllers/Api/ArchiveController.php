<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Equipment;
use App\Models\MessageRequest;
use App\Models\RentalRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ArchiveController extends Controller
{
    /* ================================================================== */
    /*  GENERIC HELPERS                                                    */
    /* ================================================================== */

    /**
     * Toggle archived_at on a model instance.
     */
    private function toggleArchive($model, string $label): JsonResponse
    {
        $model->archived_at = $model->archived_at ? null : now();
        $model->save();

        return response()->json([
            'message'     => $model->archived_at ? "{$label} archived." : "{$label} restored.",
            'archived_at' => $model->archived_at,
        ]);
    }

    /* ================================================================== */
    /*  RENTER  – archive own rentals & messages                           */
    /* ================================================================== */

    /**
     * List archived rental requests for the authenticated renter.
     */
    public function renterArchivedRentals(Request $request): JsonResponse
    {
        $items = $request->user()
            ->rentalRequests()
            ->with('equipment:id,name,category,image,daily_rate,location')
            ->whereNotNull('archived_at')
            ->latest('archived_at')
            ->get();

        return response()->json($items);
    }

    /**
     * Toggle archive on a renter's own rental request.
     */
    public function renterToggleRental(Request $request, int $id): JsonResponse
    {
        $rental = $request->user()->rentalRequests()->findOrFail($id);
        return $this->toggleArchive($rental, 'Rental request');
    }

    /**
     * Permanently delete an archived rental request (renter).
     */
    public function renterDeleteRental(Request $request, int $id): JsonResponse
    {
        $rental = $request->user()
            ->rentalRequests()
            ->whereNotNull('archived_at')
            ->findOrFail($id);

        $rental->delete();

        return response()->json(['message' => 'Rental request permanently deleted.']);
    }

    /**
     * List archived messages for the authenticated renter.
     */
    public function renterArchivedMessages(Request $request): JsonResponse
    {
        $items = $request->user()
            ->messageRequests()
            ->whereNotNull('archived_at')
            ->latest('archived_at')
            ->get();

        return response()->json($items);
    }

    /**
     * Toggle archive on a renter's own message.
     */
    public function renterToggleMessage(Request $request, int $id): JsonResponse
    {
        $message = $request->user()->messageRequests()->findOrFail($id);
        return $this->toggleArchive($message, 'Message');
    }

    /**
     * Permanently delete an archived message (renter).
     */
    public function renterDeleteMessage(Request $request, int $id): JsonResponse
    {
        $message = $request->user()
            ->messageRequests()
            ->whereNotNull('archived_at')
            ->findOrFail($id);

        $message->delete();

        return response()->json(['message' => 'Message permanently deleted.']);
    }

    /* ================================================================== */
    /*  OWNER  – archive own equipment & rental requests                   */
    /* ================================================================== */

    /**
     * List archived equipment for the authenticated owner.
     */
    public function ownerArchivedEquipment(Request $request): JsonResponse
    {
        $items = $request->user()
            ->equipment()
            ->whereNotNull('archived_at')
            ->latest('archived_at')
            ->get();

        return response()->json($items);
    }

    /**
     * Toggle archive on owner's own equipment.
     */
    public function ownerToggleEquipment(Request $request, int $id): JsonResponse
    {
        $equipment = $request->user()->equipment()->findOrFail($id);
        return $this->toggleArchive($equipment, 'Equipment');
    }

    /**
     * Permanently delete archived equipment (owner).
     */
    public function ownerDeleteEquipment(Request $request, int $id): JsonResponse
    {
        $equipment = $request->user()
            ->equipment()
            ->whereNotNull('archived_at')
            ->findOrFail($id);

        $equipment->delete();

        return response()->json(['message' => 'Equipment permanently deleted.']);
    }

    /**
     * List archived rental requests for the owner's equipment.
     */
    public function ownerArchivedRentals(Request $request): JsonResponse
    {
        $equipmentIds = $request->user()->equipment()->pluck('id');

        $items = RentalRequest::with('renter:id,name,email', 'equipment:id,name,category')
            ->whereIn('equipment_id', $equipmentIds)
            ->whereNotNull('archived_at')
            ->latest('archived_at')
            ->get();

        return response()->json($items);
    }

    /**
     * Toggle archive on a rental request for the owner's equipment.
     */
    public function ownerToggleRental(Request $request, int $id): JsonResponse
    {
        $equipmentIds = $request->user()->equipment()->pluck('id');
        $rental = RentalRequest::whereIn('equipment_id', $equipmentIds)->findOrFail($id);
        return $this->toggleArchive($rental, 'Rental request');
    }

    /**
     * Permanently delete archived rental request (owner).
     */
    public function ownerDeleteRental(Request $request, int $id): JsonResponse
    {
        $equipmentIds = $request->user()->equipment()->pluck('id');

        $rental = RentalRequest::whereIn('equipment_id', $equipmentIds)
            ->whereNotNull('archived_at')
            ->findOrFail($id);

        $rental->delete();

        return response()->json(['message' => 'Rental request permanently deleted.']);
    }

    /* ================================================================== */
    /*  ADMIN  – archive any equipment, rentals, messages, owners          */
    /* ================================================================== */

    /**
     * List all archived items across all types (admin overview).
     */
    public function adminArchivedAll(): JsonResponse
    {
        $owners = User::where('role', 'owner')
            ->whereNotNull('archived_at')
            ->latest('archived_at')
            ->get(['id', 'name', 'email', 'role', 'archived_at']);

        $equipment = Equipment::with('owner:id,name')
            ->whereNotNull('archived_at')
            ->latest('archived_at')
            ->get();

        $rentals = RentalRequest::with('renter:id,name,email', 'equipment:id,name,category')
            ->whereNotNull('archived_at')
            ->latest('archived_at')
            ->get();

        $messages = MessageRequest::with('renter:id,name,email')
            ->whereNotNull('archived_at')
            ->latest('archived_at')
            ->get();

        return response()->json([
            'owners'    => $owners,
            'equipment' => $equipment,
            'rentals'   => $rentals,
            'messages'  => $messages,
        ]);
    }

    /**
     * Toggle archive on equipment (admin).
     */
    public function adminToggleEquipment(int $id): JsonResponse
    {
        $equipment = Equipment::findOrFail($id);
        return $this->toggleArchive($equipment, 'Equipment');
    }

    /**
     * Permanently delete archived equipment (admin).
     */
    public function adminDeleteEquipment(int $id): JsonResponse
    {
        $equipment = Equipment::whereNotNull('archived_at')->findOrFail($id);
        $equipment->delete();
        return response()->json(['message' => 'Equipment permanently deleted.']);
    }

    /**
     * Toggle archive on rental request (admin).
     */
    public function adminToggleRental(int $id): JsonResponse
    {
        $rental = RentalRequest::findOrFail($id);
        return $this->toggleArchive($rental, 'Rental request');
    }

    /**
     * Permanently delete archived rental request (admin).
     */
    public function adminDeleteRental(int $id): JsonResponse
    {
        $rental = RentalRequest::whereNotNull('archived_at')->findOrFail($id);
        $rental->delete();
        return response()->json(['message' => 'Rental request permanently deleted.']);
    }

    /**
     * Toggle archive on message (admin).
     */
    public function adminToggleMessage(int $id): JsonResponse
    {
        $message = MessageRequest::findOrFail($id);
        return $this->toggleArchive($message, 'Message');
    }

    /**
     * Permanently delete archived message (admin).
     */
    public function adminDeleteMessage(int $id): JsonResponse
    {
        $message = MessageRequest::whereNotNull('archived_at')->findOrFail($id);
        $message->delete();
        return response()->json(['message' => 'Message permanently deleted.']);
    }

    /**
     * Restore (unarchive) an owner (admin). Uses existing archiveOwner toggle.
     */
    public function adminToggleOwner(int $id): JsonResponse
    {
        $owner = User::where('role', 'owner')->findOrFail($id);
        return $this->toggleArchive($owner, 'Owner');
    }

    /**
     * Permanently delete archived owner (admin).
     */
    public function adminDeleteOwner(int $id): JsonResponse
    {
        $owner = User::where('role', 'owner')
            ->whereNotNull('archived_at')
            ->findOrFail($id);

        $owner->delete();

        return response()->json(['message' => 'Owner permanently deleted.']);
    }
}
