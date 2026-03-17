export const state = {
  pageCounter: 0,
  saveTimeout: null,
  isUpdatingFromServer: false,
  saveIndicator: null,
  lastSyncedSignature: null,
  pageStreamSource: null,
  /** ISO timestamp of the most recent successful save/sync */
  lastSyncedAt: null,
  /** Whether the SSE stream is currently connected */
  streamConnected: false,
  /** Element reference for the ARIA live region */
  liveRegion: null,
  /** Element reference for the sync health indicator */
  syncHealthEl: null,
  /** Whether a conflict banner is currently visible */
  conflictBannerVisible: false,
  /** Pending incoming pages waiting for conflict resolution */
  pendingConflict: null,
};
