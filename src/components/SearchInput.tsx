"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Interactive search box. Debounces input and syncs the term to the URL via
 * `router.replace` (a soft navigation — updates results without a full page
 * reload), keeping the query shareable/bookmarkable. The page reads the param
 * server-side; pair it with a `<Suspense key={q}>` to show a skeleton while the
 * new results stream in. Shows a spinner while the navigation is pending.
 */
export function SearchInput({
  placeholder = "Buscar…",
  paramName = "q",
}: {
  placeholder?: string;
  paramName?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [value, setValue] = useState(searchParams.get(paramName) ?? "");
  const [pending, startTransition] = useTransition();

  // Reflect external param changes (back/forward) — but never fight active typing.
  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setValue(searchParams.get(paramName) ?? "");
    }
  }, [searchParams, paramName]);

  const commit = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set(paramName, next);
    else params.delete(paramName);
    params.delete("page"); // a new search resets pagination
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setValue(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => commit(next), 300);
  };

  return (
    <div className="relative w-full max-w-xs">
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-(--radius-button) border border-border bg-surface px-4 py-2 pl-9 text-sm text-text placeholder:text-subtle outline-none focus:border-primary/60"
      />
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-subtle">
        {pending ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="animate-spin">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" opacity="0.25" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" strokeLinecap="round" />
          </svg>
        )}
      </span>
    </div>
  );
}
