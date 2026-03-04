<?php

namespace App\Services;

use App\Models\Ingredient;
use App\Models\Purchase;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class PurchaseService
{
    public function list(Request $request): LengthAwarePaginator
    {
        $query = Purchase::query()->with('ingredient')->latest('date');

        if ($request->filled('ingredient_id')) {
            $query->where('ingredient_id', $request->integer('ingredient_id'));
        }

        return $query->paginate(20);
    }

    /**
     * @return array<string, mixed>
     */
    public function validateStore(Request $request): array
    {
        return $request->validate([
            'ingredient_id' => ['required', 'exists:ingredients,id'],
            'qty' => ['required', 'numeric', 'min:0.01'],
            'cost' => ['required', 'numeric', 'min:0'],
            'date' => ['required', 'date'],
            'note' => ['nullable', 'string'],
        ]);
    }

    public function create(array $validated): Purchase
    {
        return DB::transaction(function () use ($validated) {
            $purchase = Purchase::create($validated);

            Ingredient::query()
                ->where('id', $validated['ingredient_id'])
                ->increment('stock_qty', (float) $validated['qty']);

            return $purchase->load('ingredient');
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function validateUpdate(Request $request): array
    {
        return $request->validate([
            'ingredient_id' => ['sometimes', 'required', 'exists:ingredients,id'],
            'qty' => ['sometimes', 'required', 'numeric', 'min:0.01'],
            'cost' => ['sometimes', 'required', 'numeric', 'min:0'],
            'date' => ['sometimes', 'required', 'date'],
            'note' => ['nullable', 'string'],
        ]);
    }

    public function update(Purchase $purchase, array $validated): Purchase
    {
        $purchase->update($validated);

        return $purchase->fresh()->load('ingredient');
    }

    public function delete(Purchase $purchase): void
    {
        $purchase->delete();
    }
}
