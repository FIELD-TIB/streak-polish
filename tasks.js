import { formatTaskDate, localDateKey } from "../utils/date.js";

export function renderTasks(container, tasks, filter, onToggle, onDelete, now = new Date()) {
  const today = localDateKey(now);
  const visibleTasks = tasks
    .filter((task) => task.date <= today)
    .filter((task) => filter === "all" || (filter === "open" ? !task.done : task.done))
    .sort((a, b) => a.date.localeCompare(b.date) || Number(a.done) - Number(b.done) || a.createdAt - b.createdAt);

  if (!visibleTasks.length) {
    const hasTasks = tasks.some((task) => task.date <= today);
    const title = hasTasks
      ? (filter === "done" ? "Nothing completed just yet" : "You're all caught up")
      : "A clear day starts with a plan";
    const detail = hasTasks
      ? (filter === "done" ? "Your completed tasks will show here." : "Add a task whenever something needs your attention.")
      : "Add a task and it will appear here when its day arrives.";
    container.innerHTML = `<div class="empty-state"><div><div class="empty-icon" aria-hidden="true">${hasTasks ? "✓" : "☷"}</div><strong>${title}</strong><p>${detail}</p></div></div>`;
    return;
  }

  container.innerHTML = visibleTasks.map((task) => {
    const overdue = task.date < today && !task.done;
    const dateLabel = overdue ? `Overdue · ${formatTaskDate(task.date, today)}` : formatTaskDate(task.date, today);
    const reminder = task.reminder ? `<span class="task-reminder">◷ ${escapeHtml(task.reminder)}</span>` : "";
    return `
      <article class="task-row">
        <button class="task-checkbox${task.done ? " is-done" : ""}" type="button" data-toggle-task="${escapeHtml(task.id)}" aria-label="${task.done ? "Mark" : "Complete"} ${escapeHtml(task.name)}" aria-pressed="${Boolean(task.done)}">${task.done ? "✓" : ""}</button>
        <div class="task-main">
          <span class="task-title${task.done ? " is-done" : ""}">${escapeHtml(task.name)}</span>
          <span class="task-meta"><span class="task-date-badge${overdue ? " is-overdue" : ""}">${dateLabel}</span>${reminder}</span>
        </div>
        <button class="task-delete" type="button" data-delete-task="${escapeHtml(task.id)}" aria-label="Delete ${escapeHtml(task.name)}">×</button>
      </article>`;
  }).join("");

  container.querySelectorAll("[data-toggle-task]").forEach((button) => {
    button.addEventListener("click", () => onToggle(button.dataset.toggleTask));
  });
  container.querySelectorAll("[data-delete-task]").forEach((button) => {
    button.addEventListener("click", () => onDelete(button.dataset.deleteTask));
  });
}

export function renderUpcomingTasks(container, countElement, tasks, filter, onToggle, onDelete, now = new Date()) {
  const today = localDateKey(now);
  const upcomingTasks = tasks
    .filter((task) => task.date > today)
    .filter((task) => filter === "all" || (filter === "open" ? !task.done : task.done))
    .sort((a, b) => a.date.localeCompare(b.date) || Number(a.done) - Number(b.done) || a.createdAt - b.createdAt);
  const block = container.parentElement;

  block.hidden = upcomingTasks.length === 0;
  countElement.textContent = upcomingTasks.length
    ? `${upcomingTasks.length} task${upcomingTasks.length === 1 ? "" : "s"}`
    : "";
  if (!upcomingTasks.length) {
    container.replaceChildren();
    return;
  }

  container.innerHTML = upcomingTasks.map((task) => `
    <article class="task-row">
      <button class="task-checkbox${task.done ? " is-done" : ""}" type="button" data-toggle-task="${escapeHtml(task.id)}" aria-label="${task.done ? "Mark" : "Complete"} ${escapeHtml(task.name)}" aria-pressed="${Boolean(task.done)}">${task.done ? "✓" : ""}</button>
      <div class="task-main">
        <span class="task-title${task.done ? " is-done" : ""}">${escapeHtml(task.name)}</span>
        <span class="task-meta"><span class="task-date-badge">Due ${formatTaskDate(task.date, today)}</span>${task.reminder ? `<span class="task-reminder">◷ ${escapeHtml(task.reminder)}</span>` : ""}</span>
      </div>
      <button class="task-delete" type="button" data-delete-task="${escapeHtml(task.id)}" aria-label="Delete ${escapeHtml(task.name)}">×</button>
    </article>`).join("");

  container.querySelectorAll("[data-toggle-task]").forEach((button) => {
    button.addEventListener("click", () => onToggle(button.dataset.toggleTask));
  });
  container.querySelectorAll("[data-delete-task]").forEach((button) => {
    button.addEventListener("click", () => onDelete(button.dataset.deleteTask));
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}
