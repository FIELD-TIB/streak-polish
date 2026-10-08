import { localDateKey, shiftDate } from "../utils/date.js";

const icons = { green: "✳", blue: "◌", peach: "☀", purple: "✦" };

export function getCurrentStreak(streak, today = localDateKey()) {
  const completed = new Set(streak.completedDates || []);
  let cursor = completed.has(today) ? today : shiftDate(today, -1);
  let count = 0;
  while (completed.has(cursor)) {
    count += 1;
    cursor = shiftDate(cursor, -1);
  }
  return count;
}

function getStatus(streak, now = new Date()) {
  const today = localDateKey(now);
  if ((streak.completedDates || []).includes(today)) return { label: "Done for today", className: "is-done" };
  if (streak.reminder && now.toTimeString().slice(0, 5) >= streak.reminder) {
    return { label: "Still time to check in", className: "is-risk" };
  }
  return { label: "Ready for today", className: "" };
}

export function renderStreaks(container, streaks, onToggle, now = new Date()) {
  if (!streaks.length) {
    container.innerHTML = `
      <div class="empty-state streak-empty">
        <div><div class="empty-icon" aria-hidden="true">✳</div><strong>Your next great habit starts here</strong><p>Add a daily streak to see your routine take shape.</p></div>
      </div>`;
    return;
  }

  const today = localDateKey(now);
  container.innerHTML = streaks.map((streak) => {
    const done = (streak.completedDates || []).includes(today);
    const status = getStatus(streak, now);
    const current = getCurrentStreak(streak, today);
    const condition = streak.condition || "Show up for this every day";
    const reminder = streak.reminder ? `Reminder ${streak.reminder}` : "Daily";
    return `
      <article class="streak-card" data-color="${escapeHtml(streak.color || "green")}">
        <div class="streak-card-top">
          <div class="streak-identity">
            <span class="streak-emoji" aria-hidden="true">${icons[streak.color] || icons.green}</span>
            <div style="min-width:0">
              <h3 title="${escapeHtml(streak.name)}">${escapeHtml(streak.name)}</h3>
              <p class="streak-condition" title="${escapeHtml(condition)}">${escapeHtml(condition)}</p>
            </div>
          </div>
          <button class="streak-check${done ? " is-done" : ""}" type="button" data-toggle-streak="${escapeHtml(streak.id)}" aria-label="${done ? "Undo" : "Complete"} ${escapeHtml(streak.name)} for today" aria-pressed="${done}">${done ? "✓" : "○"}</button>
        </div>
        <div class="streak-status ${status.className}"><span class="status-dot"></span>${status.label}</div>
        <div class="streak-stats"><strong>🔥 ${current} day${current === 1 ? "" : "s"}</strong><span class="streak-divider">·</span><span>${reminder}</span></div>
      </article>`;
  }).join("");

  container.querySelectorAll("[data-toggle-streak]").forEach((button) => {
    button.addEventListener("click", () => onToggle(button.dataset.toggleStreak));
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}
