import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils/cn"

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className, onCheckedChange, onChange, ...props }, ref) => {
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (onChange) {
                onChange(e)
            }
            if (onCheckedChange) {
                onCheckedChange(e.target.checked)
            }
        }

        return (
            <div className="relative inline-flex items-center">
                <input
                    type="checkbox"
                    className={cn(
                        "peer h-4 w-4 shrink-0 rounded-sm border border-slate-200 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 checked:bg-slate-900 checked:text-slate-50 appearance-none cursor-pointer",
                        className
                    )}
                    ref={ref}
                    onChange={handleChange}
                    {...props}
                />
                <Check className="absolute top-0 left-0 h-4 w-4 hidden peer-checked:block text-white pointer-events-none p-0.5" />
            </div>
        )
    }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
