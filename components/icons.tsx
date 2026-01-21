"use client";

/**
 * Centralized icon exports for consistent usage across the app.
 * Using lucide-react for clean, professional icons.
 */

export {
  // File & Upload
  Upload,
  FileText,
  File,
  
  // Camera
  Camera,
  
  // Actions
  RefreshCw,
  Search,
  X,
  ArrowRight,
  ChevronDown,
  
  // Status & Alerts
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Lock,
  
  // Data Types
  Coins,
  Calendar,
  Clock,
  ClipboardList,
  Building2,
  
  // Features
  TrafficCone,
  ListChecks,
} from "lucide-react";

// Icon size presets for consistency
export const ICON_SIZES = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-8 h-8",
  "2xl": "w-10 h-10",
} as const;

// Wrapper component for icons in circular containers (like feature cards)
import { ReactNode } from "react";

interface IconContainerProps {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const containerSizes = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
};

export function IconContainer({ children, className = "", size = "md" }: IconContainerProps) {
  return (
    <div
      className={`
        ${containerSizes[size]}
        rounded-full
        bg-primary-orange/10
        flex items-center justify-center
        ${className}
      `}
    >
      {children}
    </div>
  );
}
