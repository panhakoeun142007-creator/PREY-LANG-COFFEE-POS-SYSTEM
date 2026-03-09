import * as React from "react"
import { cn } from "../../lib/utils"

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // eslint-disable-next-line no-unused-vars
  onCheckedChange?: (checked: boolean | undefined) => void
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, onCheckedChange, checked, ...props }, ref) => {
    const isChecked = Boolean(checked)
    const isDisabled = Boolean(props.disabled)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(e.target.checked)
    }

    return (
      <div
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-[#D1D5DB] transition-colors",
          "focus-within:outline-none focus-within:ring-2 focus-within:ring-[#4B5563] focus-within:ring-offset-2 focus-within:ring-offset-white",
          isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
          isChecked ? "bg-[#6B7280]" : "bg-[#D1D5DB]",
          className
        )}
      >
        <input
          type="checkbox"
          checked={isChecked}
          onChange={handleChange}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          ref={ref}
          {...props}
        />
        <span
          className={cn(
            "pointer-events-none block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform",
            isChecked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </div>
    )
  }
)
Switch.displayName = "Switch"

export { Switch }
