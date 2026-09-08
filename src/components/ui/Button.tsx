import Link from "next/link";
import type { ComponentPropsWithoutRef, ElementType } from "react";
import { clsx } from "clsx";

const variants = {
  primary: "bg-espresso text-cream hover:bg-espresso-soft",
  brass: "bg-brass text-cream hover:bg-brass-soft hover:text-espresso",
  outline: "border border-espresso/25 text-espresso hover:border-espresso hover:bg-espresso hover:text-cream",
  ghost: "text-espresso hover:bg-espresso/5",
} as const;

const sizes = {
  md: "h-11 px-6 text-sm",
  lg: "h-14 px-8 text-base",
} as const;

type ButtonOwnProps = {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  href?: string;
  className?: string;
};

export function Button<T extends ElementType = "button">({
  variant = "primary",
  size = "md",
  href,
  className,
  children,
  ...props
}: ButtonOwnProps & ComponentPropsWithoutRef<T>) {
  const classes = clsx(
    "inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-wide transition-colors duration-200",
    variants[variant],
    sizes[size],
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
