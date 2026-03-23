import { cn } from "../lib/utils"
import { useI18n } from "../context/I18nContext"

type OrderStatus = "pending" | "preparing" | "ready" | "completed" | "cancelled"
type TableStatus = "active" | "inactive"
type BadgeStatus = OrderStatus | TableStatus

interface StatusBadgeProps {
  status: BadgeStatus
  className?: string
}

const statusConfig: Record<BadgeStatus, { i18nKey: string; fallbackLabel: string; className: string }> = {
  pending: {
    i18nKey: "status.pending",
    fallbackLabel: "Pending",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  preparing: {
    i18nKey: "status.preparing",
    fallbackLabel: "Preparing",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  ready: {
    i18nKey: "status.ready",
    fallbackLabel: "Ready",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  completed: {
    i18nKey: "status.completed",
    fallbackLabel: "Completed",
    className: "bg-neutral-100 text-neutral-600 border-neutral-200",
  },
  cancelled: {
    i18nKey: "status.cancelled",
    fallbackLabel: "Cancelled",
    className: "bg-red-100 text-red-700 border-red-200",
  },
  active: {
    i18nKey: "status.active",
    fallbackLabel: "Active",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  inactive: {
    i18nKey: "status.inactive",
    fallbackLabel: "Inactive",
    className: "bg-neutral-100 text-neutral-600 border-neutral-200",
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { t } = useI18n()
  const config = statusConfig[status] || statusConfig.pending

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
        config.className,
        className
      )}
    >
      {t(config.i18nKey) ?? config.fallbackLabel}
    </span>
  )
}

export type { OrderStatus }
