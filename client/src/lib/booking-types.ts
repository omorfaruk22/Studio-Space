export type BookingStatus = "Pending" | "Confirmed" | "Completed" | "Cancelled" | "Declined";

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours && remainingMinutes) return `${hours} hr ${remainingMinutes} min`;
  if (hours) return `${hours} ${hours === 1 ? "hr" : "hrs"}`;
  return `${remainingMinutes} ${remainingMinutes === 1 ? "min" : "mins"}`;
}
