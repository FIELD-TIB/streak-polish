const STORAGE_KEY = "daymark-data-v1";

function emptyState() {
  return { streaks: [], tasks: [], sentReminders: {} };
}

export function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return emptyState();

  const parsed = JSON.parse(saved);
  if (!parsed || !Array.isArray(parsed.streaks) || !Array.isArray(parsed.tasks)) {
    throw new Error("Saved Daymark data has an invalid format.");
  }

  return {
    streaks: parsed.streaks,
    tasks: parsed.tasks,
    sentReminders: parsed.sentReminders && typeof parsed.sentReminders === "object"
      ? parsed.sentReminders
      : {}
  };
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
