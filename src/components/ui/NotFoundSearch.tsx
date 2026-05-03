"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function NotFoundSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const value = query.trim();
        if (!value) {
          return;
        }
        router.push(`/search?q=${encodeURIComponent(value)}`);
      }}
      className="mx-auto mt-3 flex w-full max-w-[420px] items-center gap-3 border-b border-[#7F77DD] bg-transparent px-1 pb-2"
    >
      <Search className="h-4 w-4 shrink-0 text-[#9CA3AF]" />
      <input
        ref={inputRef}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search products..."
        className="h-10 w-full bg-transparent text-sm text-white outline-none placeholder:text-[#7B8192]"
      />
    </form>
  );
}
