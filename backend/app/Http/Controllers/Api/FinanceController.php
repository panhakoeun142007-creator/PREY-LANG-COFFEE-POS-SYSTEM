<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FinanceController extends Controller
{
    /**
     * Return paginated income transactions from completed orders.
     */
    public function income(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'payment_type' => ['nullable', Rule::in(['cash', 'khqr'])],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = Order::query()
            ->with('table:id,name')
            ->where('status', 'completed');

        if (!empty($validated['date_from'])) {
            $query->whereDate('created_at', '>=', $validated['date_from']);
        }

        if (!empty($validated['date_to'])) {
            $query->whereDate('created_at', '<=', $validated['date_to']);
        }

        if (!empty($validated['payment_type'])) {
            $query->where('payment_type', $validated['payment_type']);
        }

        if (!empty($validated['search'])) {
            $search = trim((string) $validated['search']);
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('id', 'like', "%{$search}%")
                    ->orWhere('queue_number', 'like', "%{$search}%")
                    ->orWhereHas('table', function ($tableQuery) use ($search) {
                        $tableQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $incomeTotal = (float) (clone $query)->sum('total_price');
        $transactionsCount = (clone $query)->count();
        $perPage = isset($validated['per_page']) ? (int) $validated['per_page'] : 20;

        $paginator = $query
            ->latest('created_at')
            ->paginate($perPage);

        $payload = $paginator->toArray();
        $payload['data'] = collect($payload['data'])->map(function (array $row): array {
            $orderId = (int) $row['id'];

            return [
                'id' => $orderId,
                'order_code' => '#ORD-' . str_pad((string) $orderId, 4, '0', STR_PAD_LEFT),
                'queue_number' => (int) ($row['queue_number'] ?? 0),
                'table' => $row['table']['name'] ?? 'Takeaway',
                'payment_type' => $row['payment_type'] ?? null,
                'amount' => (float) $row['total_price'],
                'date' => $row['created_at'],
                'status' => $row['status'],
            ];
        })->values();
        $payload['summary'] = [
            'total_income' => round($incomeTotal, 2),
            'transactions' => $transactionsCount,
        ];

        return response()->json($payload);
    }
}
