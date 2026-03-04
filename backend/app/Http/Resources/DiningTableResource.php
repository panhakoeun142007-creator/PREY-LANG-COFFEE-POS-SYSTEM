<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DiningTableResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (int) $this->id,
            'name' => $this->name,
            'capacity' => (int) $this->seats,
            'status' => $this->is_active ? 'active' : 'inactive',
            'qrCode' => $this->qr_code ?: ('QR-TBL-' . str_pad((string) $this->id, 3, '0', STR_PAD_LEFT)),
            'seats' => (int) $this->seats,
            'is_active' => (bool) $this->is_active,
            'qr_code' => $this->qr_code,
            'db_status' => $this->status,
        ];
    }
}
