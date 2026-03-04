<?php

namespace App\Services;

use App\Models\Expense;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ExpenseService
{
    /**
     * @return array<string, mixed>
     */
    public function validateStore(Request $request): array
    {
        return $request->validate($this->rules());
    }

    /**
     * @return array<string, mixed>
     */
    public function validateUpdate(Request $request): array
    {
        return $request->validate($this->rules(true));
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function create(array $payload): Expense
    {
        return Expense::create($payload);
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function update(Expense $expense, array $payload): Expense
    {
        $expense->update($payload);

        return $expense->fresh();
    }

    /**
     * @return array<string, mixed>
     */
    private function rules(bool $partial = false): array
    {
        $required = $partial ? ['sometimes', 'required'] : ['required'];

        return [
            'title' => [...$required, 'string', 'max:100'],
            'amount' => [...$required, 'numeric', 'min:0'],
            'category' => [...$required, Rule::in(['ingredients', 'utilities', 'salary', 'rent', 'other'])],
            'date' => [...$required, 'date'],
            'note' => ['nullable', 'string'],
        ];
    }
}
