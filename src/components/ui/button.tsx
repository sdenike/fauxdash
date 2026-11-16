import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Bear "Red Graphite": buttons are graphite. Destructive is an outline in red so it never shouts
// louder than the primary action; it fills with its soft tint on hover. Every variant carries a 1px
// border (transparent on filled ones) so a row of mixed buttons is one height.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "border-destructive/40 bg-transparent text-destructive hover:bg-destructive-soft",
        outline:
          "border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/70",
        ghost: "border-transparent hover:bg-accent hover:text-accent-foreground",
        link: "border-transparent text-brand underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 coarse:h-11 px-4",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-6",
        icon: "h-9 w-9 coarse:h-11 coarse:w-11",
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
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
