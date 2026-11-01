/** MongoDB range predicates for bookings that overlap a requested interval. */
export function confirmedBookingOverlapRange(startTime: string, endTime: string) {
  return {
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };
}
