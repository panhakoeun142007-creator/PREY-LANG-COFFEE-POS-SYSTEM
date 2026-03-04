<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ExpenseResource;
use App\Models\Expense;
use App\Services\ExpenseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    public function __construct(private readonly ExpenseService $expenseService)
    {
    }

    /**
     * Display a listing of expenses.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Expense::query()->latest('date');

        if ($request->filled('category')) {
            $query->where('category', $request->string('category'));
        }

        return response()->json(ExpenseResource::collection($query->paginate(20)));
    }

    /**
     * Store a newly created expense.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $this->expenseService->validateStore($request);
        $expense = $this->expenseService->create($validated);

        return response()->json(new ExpenseResource($expense), 201);
    }

    /**
     * Display the specified expense.
     */
    public function show(Expense $expense): JsonResponse
    {
        return response()->json(new ExpenseResource($expense));
    }

    /**
     * Update the specified expense.
     */
    public function update(Request $request, Expense $expense): JsonResponse
    {
        $validated = $this->expenseService->validateUpdate($request);

        return response()->json(new ExpenseResource($this->expenseService->update($expense, $validated)));
    }

    /**
     * Remove the specified expense.
     */
    public function destroy(Expense $expense): JsonResponse
    {
        $expense->delete();

        return response()->json(['message' => 'Expense deleted']);
    }
}
