"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav className="flex items-center space-x-1.5 text-xs text-muted-foreground py-1 mb-2">
      <Link href="/" className="hover:text-slate-900 dark:hover:text-white flex items-center">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {segments.length > 0 && <ChevronRight className="h-3 w-3 opacity-50 shrink-0" />}
      {segments.map((seg, idx) => {
        const href = `/${segments.slice(0, idx + 1).join("/")}`;
        const isLast = idx === segments.length - 1;
        const title = seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

        return (
          <React.Fragment key={href}>
            {isLast ? (
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {title}
              </span>
            ) : (
              <Link href={href} className="hover:text-slate-900 dark:hover:text-white">
                {title}
              </Link>
            )}
            {!isLast && <ChevronRight className="h-3 w-3 opacity-50 shrink-0" />}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
