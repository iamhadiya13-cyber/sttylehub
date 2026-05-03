"use client";

import {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type MutableRefObject,
  type ReactNode,
  type Ref,
} from "react";

type LoadingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingText?: string;
  spinnerSize?: number;
  icon?: ReactNode;
};

function mergeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (value: T) => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === "function") {
        ref(value);
        return;
      }
      (ref as MutableRefObject<T>).current = value;
    });
  };
}

export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  function LoadingButton(
    {
      loading = false,
      loadingText,
      spinnerSize = 14,
      icon,
      children,
      disabled,
      style,
      className,
      ...props
    },
    ref,
  ) {
    const internalRef = useRef<HTMLButtonElement | null>(null);
    const [minWidth, setMinWidth] = useState<number>();

    useLayoutEffect(() => {
      if (!internalRef.current) return;
      if (loading) return;
      const nextWidth = internalRef.current.getBoundingClientRect().width;
      if (!Number.isNaN(nextWidth) && nextWidth > 0) {
        setMinWidth(Math.ceil(nextWidth));
      }
    }, [children, className, icon, loading, loadingText]);

    useEffect(() => {
      const button = internalRef.current;
      if (!button) return;
      if (loading) return;

      const observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        const nextWidth = entry.contentRect.width;
        if (!Number.isNaN(nextWidth) && nextWidth > 0) {
          setMinWidth(Math.ceil(nextWidth));
        }
      });

      observer.observe(button);
      return () => observer.disconnect();
    }, [loading]);

    const mergedStyle = useMemo<CSSProperties>(
      () => ({
        ...style,
        minWidth: minWidth ? `${minWidth}px` : style?.minWidth,
        opacity: loading ? 0.8 : style?.opacity,
        transform: loading
          ? `${style?.transform ? `${style.transform} ` : ""}scale(0.98)`
          : style?.transform,
      }),
      [loading, minWidth, style],
    );

    const spinner = (
      <span
        aria-hidden="true"
        style={{
          width: spinnerSize,
          height: spinnerSize,
          border: "2px solid rgba(255,255,255,0.18)",
          borderTopColor: "#FFFFFF",
          borderRadius: "50%",
          animation: "stylehub-button-spin 0.7s linear infinite",
          display: "inline-block",
          flexShrink: 0,
        }}
      />
    );

    const showTextReplacement = Boolean(loading && loadingText);
    const showIcon = !loading && icon;
    const showSpinner = loading;

    return (
      <>
        <style>{`
          @keyframes stylehub-button-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
        <button
          {...props}
          ref={mergeRefs(ref, internalRef)}
          disabled={disabled || loading}
          className={className}
          style={mergedStyle}
        >
          {showSpinner ? spinner : null}
          {showIcon ? icon : null}
          {showTextReplacement ? loadingText : children}
        </button>
      </>
    );
  },
);

export default LoadingButton;
