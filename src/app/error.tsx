"use client";

import Link from "next/link";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-6 py-14 text-white">
      <div className="w-full max-w-[620px] rounded-[28px] border border-white/6 bg-[linear-gradient(180deg,rgba(16,19,30,0.72)_0%,rgba(10,10,10,0.94)_100%)] px-6 py-12 text-center shadow-[0_24px_80px_rgba(0,0,0,0.34)] sm:px-10">
        <div className="mx-auto h-px w-24 bg-[#7F77DD]/35" />
        <h1 className="mt-8 text-[24px] font-bold tracking-[0.06em] text-white sm:text-[30px]">
          Something went wrong
        </h1>
        <p className="mx-auto mt-3 max-w-[440px] text-sm leading-7 text-[#8A8F9F] sm:text-[15px]">
          An unexpected error occurred.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 min-w-[170px] items-center justify-center rounded-xl bg-[linear-gradient(135deg,#4F46E5_0%,#4338CA_100%)] px-5 text-sm font-semibold text-[#F8FAFC]"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex h-11 min-w-[170px] items-center justify-center rounded-xl border border-white/12 bg-white/[0.02] px-5 text-sm font-semibold text-white transition hover:border-[#7F77DD]/35"
          >
            Go Home
          </Link>
        </div>
      </div>
    </main>
  );
}
