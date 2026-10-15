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
            ->with([
                'equipment:id,name,category,image,price_per_hectare,location,owner_id',
                'equipment.owner:id,name,email'
            ])
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
     * Bulk restore rentals (renter).
     */
    public function renterBulkRestoreRentals(Request $request): JsonResponse
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer'
        ]);

        $request->user()
            ->rentalRequests()
            ->whereIn('id', $request->ids)
            ->whereNotNull('archived_at')
            ->update(['archived_at' => null]);

        return response()->json([
            'message' => count($request->ids) . ' rental request(s) restored successfully.'
        ]);
    }

    /**
     * Bulk delete rentals (renter).
     */
    public function renterBulkDeleteRentals(Request $request): JsonResponse
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer'
        ]);

        $request->user()
            ->rentalRequests()
            ->whereIn('id', $request->ids)
            ->whereNotNull('archived_at')
            ->delete();

        return response()->json([
            'message' => count($request->ids) . ' rental request(s) permanently deleted.'
        ]);
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

    /**
     * Bulk restore messages (renter).
     */
    public function renterBulkRestoreMessages(Request $request): JsonResponse
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer'
        ]);

        $request->user()
            ->messageRequests()
            ->whereIn('id', $request->ids)
            ->whereNotNull('archived_at')
            ->update(['archived_at' => null]);

        return response()->json([
            'message' => count($request->ids) . ' message(s) restored successfully.'
        ]);
    }

    /**
     * Bulk delete messages (renter).
     */
    public function renterBulkDeleteMessages(Request $request): JsonResponse
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer'
        ]);

        $request->user()
            ->messageRequests()
            ->whereIn('id', $request->ids)
            ->whereNotNull('archived_at')
            ->delete();

        return response()->json([
            'message' => count($request->ids) . ' message(s) permanently deleted.'
        ]);
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
     * Bulk restore equipment (owner).
     */
    public function ownerBulkRestoreEquipment(Request $request): JsonResponse
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer'
        ]);

        $request->user()
            ->equipment()
            ->whereIn('id', $request->ids)
            ->whereNotNull('archived_at')
            ->update(['archived_at' => null]);

        return response()->json([
            'message' => count($request->ids) . ' equipment item(s) restored successfully.'
        ]);
    }

    /**
     * Bulk delete equipment (owner).
     */
    public function ownerBulkDeleteEquipment(Request $request): JsonResponse
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer'
        ]);

        $request->user()
            ->equipment()
            ->whereIn('id', $request->ids)
            ->whereNotNull('archived_at')
            ->delete();

        return response()->json([
            'message' => count($request->ids) . ' equipment item(s) permanently deleted.'
        ]);
    }

    /**
     * List archived rental requests for the owner's equipment.
     */
    public function ownerArchivedRentals(Request $request): JsonResponse
    {
        $equipmentIds = $request->user()->equipment()->pluck('id');

        $items = RentalRequest::with([
                'renter:id,name,email',
                'equipment:id,name,category,price_per_hectare,location'
            ])
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

    /**
     * Bulk restore rentals (owner).
     */
    public function ownerBulkRestoreRentals(Request $request): JsonResponse
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer'
        ]);

        $equipmentIds = $request->user()->equipment()->pluck('id');

        RentalRequest::whereIn('equipment_id', $equipmentIds)
            ->whereIn('id', $request->ids)
            ->whereNotNull('archived_at')
            ->update(['archived_at' => null]);

        return response()->json([
            'message' => count($request->ids) . ' rental request(s) restored successfully.'
        ]);
    }

    /**
     * Bulk delete rentals (owner).
     */
    public function ownerBulkDeleteRentals(Request $request): JsonResponse
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer'
        ]);

        $equipmentIds = $request->user()->equipment()->pluck('id');

        RentalRequest::whereIn('equipment_id', $equipmentIds)
            ->whereIn('id', $request->ids)
            ->whereNotNull('archived_at')
            ->delete();

        return response()->json([
            'message' => count($request->ids) . ' rental request(s) permanently deleted.'
        ]);
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

    /* ================================================================== */
    /*  ADMIN  – Get archived items by type                                */
    /* ================================================================== */

    /**
     * Get all archived owners.
     */
    public function adminArchivedOwners(): JsonResponse
    {
        $owners = User::where('role', 'owner')
            ->whereNotNull('archived_at')
            ->withCount('equipment')
            ->latest('archived_at')
            ->get();

        return response()->json($owners);
    }

    /**
     * Get all archived equipment.
     */
    public function adminArchivedEquipment(): JsonResponse
    {
        $equipment = Equipment::with('owner:id,name,email')
            ->whereNotNull('archived_at')
            ->latest('archived_at')
            ->get();

        return response()->json($equipment);
    }

    /**
     * Get all archived rentals.
     */
    public function adminArchivedRentals(): JsonResponse
    {
        $rentals = RentalRequest::with([
                'renter:id,name,email',
                'equipment:id,name,category,price_per_hectare,location,owner_id',
                'equipment.owner:id,name,email'
            ])
            ->whereNotNull('archived_at')
            ->latest('archived_at')
            ->get();

        return response()->json($rentals);
    }

    /**
     * Get all archived payments (if payments table has archived_at column).
     */
    public function adminArchivedPayments(): JsonResponse
    {
        // Payment model doesn't exist yet, return empty array
        // TODO: Create Payment model if payment archiving is needed
        return response()->json([]);
    }

    /* ================================================================== */
    /*  ADMIN  – Bulk restore operations                                   */
    /* ================================================================== */

    /**
     * Bulk restore owners.
     */
    public function bulkRestoreOwners(Request $request): JsonResponse
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:users,id'
        ]);

        User::where('role', 'owner')
            ->whereIn('id', $request->ids)
            ->whereNotNull('archived_at')
            ->update(['archived_at' => null]);

        return response()->json([
            'message' => count($request->ids) . ' owner(s) restored successfully.'
        ]);
    }

    /**
     * Bulk restore equipment.
     */
    public function bulkRestoreEquipment(Request $request): JsonResponse
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:equipment,id'
        ]);

        Equipment::whereIn('id', $request->ids)
            ->whereNotNull('archived_at')
            ->update(['archived_at' => null]);

        return response()->json([
            'message' => count($request->ids) . ' equipment item(s) restored successfully.'
        ]);
    }

    /**
     * Bulk restore rentals.
     */
    public function bulkRestoreRentals(Request $request): JsonResponse
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:rental_requests,id'
        ]);

        RentalRequest::whereIn('id', $request->ids)
            ->whereNotNull('archived_at')
            ->update(['archived_at' => null]);

        return response()->json([
            'message' => count($request->ids) . ' rental(s) restored successfully.'
        ]);
    }

    /**
     * Bulk restore payments.
     */
    public function bulkRestorePayments(Request $request): JsonResponse
    {
        // Payment model doesn't exist yet
        return response()->json([
            'message' => 'Payment archiving feature not available yet.'
        ], 404);
    }

    /* ================================================================== */
    /*  ADMIN  – Bulk delete operations                                    */
    /* ================================================================== */

    /**
     * Bulk delete owners permanently.
     */
    public function bulkDeleteOwners(Request $request): JsonResponse
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:users,id'
        ]);

        User::where('role', 'owner')
            ->whereIn('id', $request->ids)
            ->whereNotNull('archived_at')
            ->delete();

        return response()->json([
            'message' => count($request->ids) . ' owner(s) permanently deleted.'
        ]);
    }

    /**
     * Bulk delete equipment permanently.
     */
    public function bulkDeleteEquipment(Request $request): JsonResponse
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:equipment,id'
        ]);

        Equipment::whereIn('id', $request->ids)
            ->whereNotNull('archived_at')
            ->delete();

        return response()->json([
            'message' => count($request->ids) . ' equipment item(s) permanently deleted.'
        ]);
    }

    /**
     * Bulk delete rentals permanently.
     */
    public function bulkDeleteRentals(Request $request): JsonResponse
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:rental_requests,id'
        ]);

        RentalRequest::whereIn('id', $request->ids)
            ->whereNotNull('archived_at')
            ->delete();

        return response()->json([
            'message' => count($request->ids) . ' rental(s) permanently deleted.'
        ]);
    }

    /**
     * Bulk delete payments permanently.
     */
    public function bulkDeletePayments(Request $request): JsonResponse
    {
        // Payment model doesn't exist yet
        return response()->json([
            'message' => 'Payment archiving feature not available yet.'
        ], 404);
    }

    /* ================================================================== */
    /*  ADMIN  – Single restore operations                                 */
    /* ================================================================== */

    /**
     * Restore a single owner (uses toggle, but called from restore action).
     */
    public function restoreOwner(int $id): JsonResponse
    {
        $owner = User::where('role', 'owner')
            ->whereNotNull('archived_at')
            ->findOrFail($id);
        
        $owner->archived_at = null;
        $owner->save();

        return response()->json(['message' => 'Owner restored successfully.']);
    }

    /**
     * Restore a single equipment.
     */
    public function restoreEquipment(int $id): JsonResponse
    {
        $equipment = Equipment::whereNotNull('archived_at')->findOrFail($id);
        $equipment->archived_at = null;
        $equipment->save();

        return response()->json(['message' => 'Equipment restored successfully.']);
    }

    /**
     * Restore a single rental.
     */
    public function restoreRental(int $id): JsonResponse
    {
        $rental = RentalRequest::whereNotNull('archived_at')->findOrFail($id);
        $rental->archived_at = null;
        $rental->save();

        return response()->json(['message' => 'Rental restored successfully.']);
    }

    /**
     * Restore a single payment.
     */
    public function restorePayment(int $id): JsonResponse
    {
        // Payment model doesn't exist yet
        return response()->json([
            'message' => 'Payment archiving feature not available yet.'
        ], 404);
    }
}
