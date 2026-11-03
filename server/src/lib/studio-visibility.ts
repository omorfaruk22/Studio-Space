export const publicStudioFilter = {
  isAvailable: true,
  $or: [
    { moderationStatus: "approved" },
    // Treat older listings as approved so adding moderation does not hide existing hosts.
    { moderationStatus: { $exists: false } },
  ],
};
