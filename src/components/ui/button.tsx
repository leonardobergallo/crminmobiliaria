import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils/cn"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99]",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-b from-sky-500 to-sky-600 text-white shadow-sm hover:from-sky-600 hover:to-sky-700 hover:shadow-md",
        destructive:
          "bg-gradient-to-b from-rose-500 to-rose-600 text-white shadow-sm hover:from-rose-600 hover:to-rose-700",
        outline:
          "border border-slate-200/90 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300",
        secondary:
          "bg-slate-100 text-slate-800 hover:bg-slate-200",
        ghost: "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900",
        link: "text-sky-600 underline-offset-4 hover:underline",
        success: "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-sm hover:from-emerald-600 hover:to-emerald-700",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-lg px-3.5 text-xs",
        lg: "h-12 rounded-xl px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
)
Button.displayName = "Button"

export { Button, buttonVariants }
