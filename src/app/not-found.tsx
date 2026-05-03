import Link from "next/link";
import { PageShell } from "@/components/storefront/chrome";
import NotFoundSearch from "@/components/ui/NotFoundSearch";

function CornerBracket({
  className,
  rotate = "",
}: {
  className: string;
  rotate?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      aria-hidden="true"
      className={className}
      style={{ transform: rotate }}
    >
      <path
        d="M14 46V14h32"
        fill="none"
        stroke="#7F77DD"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function NotFound() {
  return (
    <PageShell hideFooter>
      <main className="relative flex min-h-[calc(100vh-80px)] items-center justify-center overflow-hidden bg-[#0A0A0A] px-6 py-14">
        <div className="relative w-full max-w-[760px] overflow-hidden rounded-[32px] border border-white/6 bg-[linear-gradient(180deg,rgba(16,19,30,0.72)_0%,rgba(10,10,10,0.94)_100%)] px-6 py-14 text-center shadow-[0_24px_80px_rgba(0,0,0,0.34)] sm:px-10 sm:py-16">
          <CornerBracket className="absolute left-6 top-6 h-14 w-14 opacity-[0.14]" />
          <CornerBracket className="absolute right-6 top-6 h-14 w-14 opacity-[0.12]" rotate="rotate(90deg)" />
          <CornerBracket className="absolute bottom-6 left-6 h-14 w-14 opacity-[0.12]" rotate="rotate(-90deg)" />
          <CornerBracket className="absolute bottom-6 right-6 h-14 w-14 opacity-[0.14]" rotate="rotate(180deg)" />

          <div className="relative">
            <p className="bg-[linear-gradient(180deg,#FFFFFF_0%,#7F77DD_100%)] bg-clip-text text-[72px] font-black leading-none tracking-[-0.06em] text-transparent sm:text-[96px] lg:text-[120px]">
              404
            </p>
            <div className="mx-auto mt-5 h-px w-28 bg-[#7F77DD]/30" />
            <h1 className="mt-7 text-[22px] font-bold tracking-[0.08em] text-white sm:text-[28px]">
              Page Not Found
            </h1>
            <p className="mx-auto mt-3 max-w-[520px] text-sm leading-7 text-[#8A8F9F] sm:text-[15px]">
              The page you are looking for does not exist or has been moved.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/products"
                className="inline-flex h-11 min-w-[180px] items-center justify-center rounded-xl bg-[linear-gradient(135deg,#4F46E5_0%,#4338CA_100%)] px-5 text-sm font-semibold text-[#F8FAFC]"
              >
                Browse Products
              </Link>
              <Link
                href="/"
                className="inline-flex h-11 min-w-[180px] items-center justify-center rounded-xl border border-white/12 bg-white/[0.02] px-5 text-sm font-semibold text-white transition hover:border-[#7F77DD]/35"
              >
                Go Home
              </Link>
            </div>

            <div className="mt-10">
              <p className="text-sm text-[#8A8F9F]">
                Looking for something specific?
              </p>
              <NotFoundSearch />
            </div>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
