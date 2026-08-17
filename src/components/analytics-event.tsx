"use client";

import { useEffect, useRef } from "react";

import { track, type AnalyticsEvent, type AnalyticsProps } from "@/lib/analytics";

/**
 * Fires a conversion event once when a page mounts. Used on confirmation
 * pages, which are the only reliable signal that a submission succeeded.
 */
export function TrackEvent({
  event,
  props = {},
}: {
  event: AnalyticsEvent;
  props?: AnalyticsProps;
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    track(event, props);
    // Intentionally mount-only: this marks a single conversion.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
