import { forwardRef, type ButtonHTMLAttributes } from "react"; // Type the shared button consistently with native HTML.
import { cva, type VariantProps } from "class-variance-authority"; // Use the shadcn component pattern for explicit variants.
import { clsx, type ClassValue } from "clsx"; // Join conditional class names safely.
import { twMerge } from "tailwind-merge"; // Resolve conflicting utility classes in one place.
export const cn = (...values: ClassValue[]) => twMerge(clsx(values)); // Share class composition with future UI components.
const buttonVariants = cva("button", { // Calculate or retain this value for the current render.
    variants: { variant: { default: "primary", secondary: "secondary", ghost: "ghost" } }, // Define this field in the shared component or request contract.
    defaultVariants: { variant: "default" }, // Define this field in the shared component or request contract.
}); // Keep button styling independent from its behavior.
export const Button = forwardRef< // Continue this clearly scoped calculation or control declaration.
    HTMLButtonElement, // Continue this clearly scoped calculation or control declaration.
    ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> // Continue this clearly scoped calculation or control declaration.
>(({ className, variant, ...props }, ref) => ( // Continue this clearly scoped calculation or control declaration.
    <button className={cn(buttonVariants({ variant }), className)} ref={ref} {...props} /> // Offer this explicit learner action.
)); // Preserve keyboard behavior and forwarded refs.
Button.displayName = "Button"; // Give the component a readable React DevTools name.
