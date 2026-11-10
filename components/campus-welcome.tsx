"use client";

import { useEffect } from "react";
import "./campus-welcome.css";

export function CampusWelcome({ ready, reducedMotion, onComplete }: {
  ready: boolean;
  reducedMotion: boolean;
  onComplete: () => void;
}) {
  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(onComplete, reducedMotion ? 0 : 1500);
    return () => window.clearTimeout(timer);
  }, [ready, reducedMotion, onComplete]);

  return (
    <div className="campus-welcome" data-ready={ready} data-reduced-motion={reducedMotion}>
      <div className="campus-welcome-sky" aria-hidden="true" />
      <div className="campus-welcome-clouds campus-welcome-clouds-far" aria-hidden="true" />
      <div className="campus-welcome-clouds campus-welcome-clouds-near" aria-hidden="true" />
      <div className="campus-welcome-copy">
        <h1 className="campus-welcome-title" aria-label="Welcome to Hinduism Exhibition">
          <span className="campus-welcome-greeting">Welcome to</span>
          {/* The persistent hero title occupies this space, then travels upward. */}
          <span className="campus-welcome-name" aria-hidden="true" />
          <span className="campus-welcome-exhibition">Exhibition</span>
        </h1>
        <div className="campus-welcome-status" role="status" aria-live="polite">
          <span className="campus-welcome-line" aria-hidden="true" />
          <span>{ready ? "Your visit is ready" : "Preparing your visit"}</span>
        </div>
      </div>
    </div>
  );
}
