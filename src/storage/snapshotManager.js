import { STORAGE_KEYS } from "./storageKeys.js";

export function saveSnapshot(state) {
  const snapshots =
    JSON.parse(localStorage.getItem(STORAGE_KEYS.SNAPSHOTS)) || [];

  snapshots.push({
    timestamp: Date.now(),
    snapshot: structuredClone(state)
  });

  localStorage.setItem(
    STORAGE_KEYS.SNAPSHOTS,
    JSON.stringify(snapshots.slice(-5)) // keep last 5 snapshots
  );
}

export function loadSnapshots() {
  return (
    JSON.parse(localStorage.getItem(STORAGE_KEYS.SNAPSHOTS)) || []
  );
}
