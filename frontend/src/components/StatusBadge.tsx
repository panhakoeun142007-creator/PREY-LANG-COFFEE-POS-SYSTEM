import { cn } from "../lib/utils"

type OrderStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled"
  | "active"
  | "inactive"

interface StatusBadgeProps {
  status: OrderStatus
  className?: string
}

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  preparing: {
    label: "Preparing",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  ready: {
    label: "Ready",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  completed: {
    label: "Completed",
    className: "bg-neutral-100 text-neutral-600 border-neutral-200",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-100 text-red-700 border-red-200",
  },
  active: {
    label: "Active",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  inactive: {
    label: "Inactive",
    className: "bg-neutral-100 text-neutral-600 border-neutral-200",
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}

export type { OrderStatus }
