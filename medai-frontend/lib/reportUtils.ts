/**
 * Extract the risk level from a stored ai_analysis JSON string.
 * Returns "Low" | "Moderate" | "High" | null. Never throws.
 */
export function safeParseRisk(raw: string | null | undefined): "Low" | "Moderate" | "High" | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw);
    const risk = d && typeof d === "object" ? d.risk_level : undefined;
    if (risk === "Low" || risk === "Moderate" || risk === "High") return risk;
    return null;
  } catch {
    return null;
  }
}
