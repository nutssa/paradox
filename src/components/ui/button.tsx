import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        arcade:
          "font-pixel bg-lime text-primary-foreground border-2 border-background shadow-[var(--shadow-pixel)] hover:-translate-y-0.5 hover:glow-lime active:translate-y-0.5 transition-transform",
        violet:
          "font-pixel bg-violet text-secondary-foreground border-2 border-background shadow-[var(--shadow-pixel)] hover:-translate-y-0.5 hover:glow-violet active:translate-y-0.5 transition-transform",
        danger:
          "font-pixel bg-danger text-destructive-foreground border-2 border-background shadow-[var(--shadow-pixel)] hover:-translate-y-0.5 hover:glow-danger transition-transform",
        peach:
          "font-pixel bg-peach text-accent-foreground border-2 border-background shadow-[var(--shadow-pixel)] hover:-translate-y-0.5 transition-transform",
        pixel: "font-pixel border-2 border-border bg-muted text-foreground hover:border-lime hover:text-lime",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
