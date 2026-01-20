"use client";

/**
 * Traffic light urgency indicator component.
 */

import { UrgencyLevel } from "@/types";
import { URGENCY_DESCRIPTIONS } from "@/lib/scoring/keywords";

interface TrafficLightProps {
  level: UrgencyLevel;
  score?: number;
  showDescription?: boolean;
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES = {
  sm: "w-8 h-8",
  md: "w-16 h-16",
  lg: "w-24 h-24",
};

const EMOJI_MAP: Record<UrgencyLevel, string> = {
  green: "🟢",
  yellow: "🟡",
  red: "🔴",
};

const COLOR_CLASSES: Record<UrgencyLevel, string> = {
  green: "bg-traffic-green shadow-green-500/50",
  yellow: "bg-traffic-yellow shadow-yellow-500/50",
  red: "bg-traffic-red shadow-red-500/50",
};

const GLOW_CLASSES: Record<UrgencyLevel, string> = {
  green: "shadow-[0_0_30px_rgba(34,197,94,0.6)]",
  yellow: "shadow-[0_0_30px_rgba(234,179,8,0.6)]",
  red: "shadow-[0_0_30px_rgba(239,68,68,0.6)] animate-pulse",
};

const LABEL_MAP: Record<UrgencyLevel, string> = {
  green: "Grün",
  yellow: "Gelb",
  red: "Rot",
};

export function TrafficLight({
  level,
  score,
  showDescription = true,
  size = "lg",
}: TrafficLightProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Light indicator */}
      <div
        className={`
          ${SIZE_CLASSES[size]}
          ${COLOR_CLASSES[level]}
          ${GLOW_CLASSES[level]}
          rounded-full
          flex items-center justify-center
          text-3xl
          transition-all duration-500
        `}
        role="img"
        aria-label={`Ampel: ${LABEL_MAP[level]}`}
      >
        <span className="text-5xl">{EMOJI_MAP[level]}</span>
      </div>

      {/* Label and score */}
      <div className="text-center">
        <p className="text-xl font-bold text-white">
          Ampel: {LABEL_MAP[level]}
        </p>
        {score !== undefined && (
          <p className="text-sm text-gray-400">
            Dringlichkeitswert: {score}/100
          </p>
        )}
      </div>

      {/* Description */}
      {showDescription && (
        <p className="text-center text-gray-300 max-w-md">
          {URGENCY_DESCRIPTIONS[level]}
        </p>
      )}
    </div>
  );
}
