import { localDateKey } from "../utils/date.js";

export function getReminderPermission() {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export async function requestReminderPermission() {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission;
  }
  return Notification.requestPermission();
}

export function checkReminders(state, onReminder, now = new Date()) {
  const today = localDateKey(now);
  const currentTime = now.toTimeString().slice(0, 5);
  const due = [];

  for (const streak of state.streaks) {
    const key = `streak:${streak.id}:${today}`;
    if (streak.reminder && streak.reminder <= currentTime &&
        !(streak.completedDates || []).includes(today) && !state.sentReminders[key]) {
      due.push({ key, title: streak.name, message: streak.condition || "Time for your daily check-in." });
    }
  }

  for (const task of state.tasks) {
    const key = `task:${task.id}:${today}`;
    if (task.date === today && task.reminder && task.reminder <= currentTime &&
        !task.done && !state.sentReminders[key]) {
      due.push({ key, title: task.name, message: "This task is due today." });
    }
  }

  for (const reminder of due) {
    state.sentReminders[reminder.key] = true;
    onReminder(reminder);
  }
}
