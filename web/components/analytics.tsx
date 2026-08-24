"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

type AnalyticsPayload = {
  event: string;
  path: string;
  label?: string;
  href?: string;
};

const sendAnalytics = (payload: AnalyticsPayload) => {
  const body = JSON.stringify({
    ...payload,
    timestamp: new Date().toISOString(),
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics", new Blob([body], { type: "application/json" }));
    return;
  }

  void fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  });
};

function AnalyticsInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    sendAnalytics({
      event: "page_view",
      path: searchParams.size > 0 ? `${pathname}?${searchParams.toString()}` : pathname,
    });
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-analytics]") : null;

      if (!target) {
        return;
      }

      sendAnalytics({
        event: target.dataset.analytics ?? "click",
        label: target.dataset.analyticsLabel ?? target.textContent?.trim().slice(0, 80),
        href: target instanceof HTMLAnchorElement ? target.href : undefined,
        path: window.location.pathname,
      });
    };

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, []);

  return null;
}

export default function Analytics() {
  return (
    <Suspense fallback={null}>
      <AnalyticsInner />
    </Suspense>
  );
}
