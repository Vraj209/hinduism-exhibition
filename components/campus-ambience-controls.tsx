"use client";

import { useId } from "react";
import { Volume2, VolumeX } from "lucide-react";
import type { CampusAmbience } from "./use-campus-ambience";
import "./campus-ambience-controls.css";

export function CampusAmbienceControls({
  ambience,
  className = "",
}: {
  ambience: CampusAmbience;
  className?: string;
}) {
  const volumeId = useId();
  const messageId = useId();
  const label = ambience.enabled
    ? "Mute ambience"
    : ambience.hasStarted
      ? "Unmute ambience"
      : "Enable Ambience";
  return (
    <div
      ref={(element) => ambience.attachControls(element)}
      className={`campus-ambience ${className}`}
      role="group"
      aria-label="Garden ambience"
      data-status={ambience.status}
      data-enabled={ambience.enabled}
    >
      <button
        className="campus-ambience-toggle"
        type="button"
        onClick={() => void ambience.toggle()}
        disabled={!ambience.available}
        aria-describedby={ambience.error ? messageId : undefined}
      >
        {ambience.enabled ? (
          <Volume2 size={16} aria-hidden="true" />
        ) : (
          <VolumeX size={16} aria-hidden="true" />
        )}
        <span>{label}</span>
      </button>
      {ambience.hasStarted && (
        <div className="campus-ambience-volume">
          <label htmlFor={volumeId}>Ambience volume</label>
          <input
            id={volumeId}
            type="range"
            min="0"
            max="100"
            step="1"
            value={Math.round(ambience.volume * 100)}
            aria-valuetext={`${Math.round(ambience.volume * 100)} percent`}
            onChange={(event) =>
              ambience.setVolume(Number(event.target.value) / 100)
            }
          />
          <output htmlFor={volumeId}>
            {Math.round(ambience.volume * 100)}%
          </output>
        </div>
      )}
      {ambience.error && (
        <p id={messageId} className="campus-ambience-error" role="status">
          {ambience.error}
        </p>
      )}
      {!ambience.available && (
        <span className="campus-ambience-unavailable">Sound unavailable</span>
      )}
    </div>
  );
}
