import type { Coach } from "./types";

/** "₹500 — ₹2,000 / month" style fee string. */
export function formatFee(coach: Pick<Coach, "fee_min" | "fee_max" | "fee_type">): string {
  const unit =
    coach.fee_type === "hourly"
      ? "hour"
      : coach.fee_type === "per_session"
      ? "session"
      : "month";
  const fmt = (n?: number | null) =>
    n == null ? "—" : `₹${n.toLocaleString("en-IN")}`;
  if (coach.fee_min == null && coach.fee_max == null) return "Fee on request";
  if (coach.fee_min != null && coach.fee_max != null && coach.fee_min === coach.fee_max)
    return `${fmt(coach.fee_min)} / ${unit}`;
  return `${fmt(coach.fee_min)} — ${fmt(coach.fee_max)} / ${unit}`;
}

/** Two-letter initials for the avatar placeholder. */
export function initials(name: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "G";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function teachingModeLabel(mode: string): string {
  switch (mode) {
    case "home_visit":
      return "🏠 Home Visit";
    case "online":
      return "💻 Online";
    case "center":
      return "🏫 Center";
    case "all":
      return "✅ All Modes";
    default:
      return mode;
  }
}
