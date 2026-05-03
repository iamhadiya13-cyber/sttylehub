"use client";

import Link, { type LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import { useNavigationLoading } from "@/components/providers/navigation-loading-provider";
import { cn } from "@/lib/utils";
import { useLoadingStore } from "@/stores/loading-store";

type GuardedNavLinkProps = LinkProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    disableWhileNavigating?: boolean;
  };

function hrefToString(href: GuardedNavLinkProps["href"]) {
  return typeof href === "string" ? href : href.toString();
}

export function GuardedNavLink({
  href,
  onClick,
  className,
  disableWhileNavigating = true,
  children,
  ...props
}: GuardedNavLinkProps) {
  const router = useRouter();
  const { beginNavigation, isNavigating, isPendingHref } = useNavigationLoading();
  const setLoading = useLoadingStore((state) => state.setLoading);
  const hrefValue = hrefToString(href);
  const disabled = disableWhileNavigating && (isNavigating || isPendingHref(hrefValue));

  return (
    <Link
      {...props}
      href={href}
      aria-disabled={disabled || undefined}
      className={cn(disabled ? "pointer-events-none opacity-70" : null, className)}
      onClick={(event) => {
        onClick?.(event);

        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          props.target === "_blank"
        ) {
          return;
        }

        event.preventDefault();
        event.currentTarget.blur();

        if (!beginNavigation(hrefValue)) {
          return;
        }

        setLoading(true);
        router.push(hrefValue);
      }}
    >
      {children}
    </Link>
  );
}
