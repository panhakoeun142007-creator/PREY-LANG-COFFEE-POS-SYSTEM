<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ExpenseController extends Controller
{
    /**
     * Display a listing of expenses.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Expense::query()->latest('date');

        if ($request->filled('category')) {
            $query->where('category', $request->string('category'));
        }

        return response()->json($query->paginate(20));
    }

    /**
     * Store a newly created expense.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:100'],
            'amount' => ['required', 'numeric', 'min:0'],
            'category' => ['required', Rule::in(['ingredients', 'utilities', 'salary', 'rent', 'other'])],
            'date' => ['required', 'date'],
            'note' => ['nullable', 'string'],
        ]);

        $expense = Expense::create($validated);

        return response()->json($expense, 201);
    }

    /**
     * Display the specified expense.
     */
    public function show(Expense $expense): JsonResponse
    {
        return response()->json($expense);
    }

    /**
     * Update the specified expense.
     */
    public function update(Request $request, Expense $expense): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:100'],
            'amount' => ['sometimes', 'required', 'numeric', 'min:0'],
            'category' => ['sometimes', 'required', Rule::in(['ingredients', 'utilities', 'salary', 'rent', 'other'])],
            'date' => ['sometimes', 'required', 'date'],
            'note' => ['nullable', 'string'],
        ]);

        $expense->update($validated);

        return response()->json($expense->fresh());
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
