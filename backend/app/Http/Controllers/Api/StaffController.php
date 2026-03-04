<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\StaffResource;
use App\Models\Staff;
use App\Services\StaffService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffController extends Controller
{
    public function __construct(private readonly StaffService $staffService)
    {
    }

    /**
     * Display a listing of staff.
     */
    public function index(Request $request): JsonResponse
    {
        $paginator = $this->staffService->list($request);
        $paginator->setCollection(StaffResource::collection($paginator->getCollection())->collection);

        return response()->json($paginator);
    }

    /**
     * Store a newly created staff.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $this->staffService->validateStore($request);
        $staff = $this->staffService->create($request, $validated);

        return response()->json(new StaffResource($staff), 201);
    }

    /**
     * Display the specified staff.
     */
    public function show(Staff $staff): JsonResponse
    {
        return response()->json(new StaffResource($staff));
    }

    /**
     * Update the specified staff.
     */
    public function update(Request $request, Staff $staff): JsonResponse
    {
        $validated = $this->staffService->validateUpdate($request, $staff);
        $updated = $this->staffService->update($request, $staff, $validated);

        return response()->json(new StaffResource($updated));
    }

    /**
     * Remove the specified staff.
     */
    public function destroy(Staff $staff): JsonResponse
    {
        $this->staffService->delete($staff);

        return response()->json(['message' => 'Staff deleted']);
    }
}
