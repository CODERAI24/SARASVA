/**
 * Wrap sensitive actions with Safe Mode protection
 */
export function runSafeAction(action, { safeModeEnabled = true } = {}) {
  if (!safeModeEnabled) {
    return action();
  }

  const confirmed = window.confirm(
    "This is a sensitive action. Are you sure you want to continue?"
  );

  if (!confirmed) {
    return null;
  }

  return action();
}
