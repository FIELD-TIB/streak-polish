import { loadState, saveState } from "./data/storage.js";
import { getCurrentStreak, renderStreaks } from "./features/streaks.js";
import { renderTasks, renderUpcomingTasks } from "./features/tasks.js";
import { checkReminders, getReminderPermission, requestReminderPermission } from "./features/reminders.js";
import { formatLongDate, localDateKey } from "./utils/date.js";

const $ = (selector) => document.querySelector(selector);
let state;
let loadError = null;
try {
  state = loadState();
} catch (error) {
  loadError = error;
  state = { streaks: [], tasks: [], sentReminders: {} };
}
let taskFilter = "all";

const streakList = $("#streak-list");
const taskList = $("#task-list");
const streakDialog = $("#streak-dialog");
const taskDialog = $("#task-dialog");
const installDialog = $("#install-dialog");
const statusMessage = $("#status-message");
const toastRegion = $("#toast-region");
let deferredInstallPrompt = null;

function persist() {
  try {
    saveState(state);
    statusMessage.hidden = true;
    statusMessage.textContent = "";
  } catch (error) {
    statusMessage.textContent = `Your changes could not be saved in this browser: ${error.message}`;
    statusMessage.hidden = false;
  }
}

function todayStreaks() {
  const today = localDateKey();
  return state.streaks.filter((streak) => !(streak.completedDates || []).includes(today));
}

function dueTasks() {
  const today = localDateKey();
  return state.tasks.filter((task) => task.date <= today);
}

function renderDashboard() {
  const today = localDateKey();
  const currentTasks = dueTasks();
  const doneTasks = currentTasks.filter((task) => task.done).length;
  const completedStreaks = state.streaks.filter((streak) => (streak.completedDates || []).includes(today)).length;
  const totalItems = state.streaks.length + currentTasks.length;
  const completedItems = completedStreaks + doneTasks;
  const progress = totalItems ? Math.round((completedItems / totalItems) * 100) : 0;
  const activeStreaks = state.streaks.filter((streak) => getCurrentStreak(streak, today) > 0).length;

  $("#today-date").textContent = formatLongDate();
  $("#active-streak-count").textContent = String(activeStreaks);
  $("#today-task-count").textContent = String(currentTasks.filter((task) => !task.done).length);
  $("#today-task-detail").textContent = currentTasks.length
    ? `${doneTasks} of ${currentTasks.length} completed`
    : "ready when you are";
  $("#completed-streak-count").textContent = String(completedStreaks);
  $("#streak-nav-count").textContent = String(state.streaks.length);
  $("#task-nav-count").textContent = String(currentTasks.filter((task) => !task.done).length);
  $("#progress-number").textContent = `${progress}%`;
  $("#progress-ring").style.setProperty("--progress", `${progress}%`);
  $("#progress-summary").textContent = totalItems
    ? `${completedItems} of ${totalItems} done`
    : "Let's get started";
  $("#all-task-count").textContent = String(currentTasks.length);
  $("#open-task-count").textContent = String(currentTasks.filter((task) => !task.done).length);
  $("#done-task-count").textContent = String(doneTasks);

  renderStreaks(streakList, state.streaks, toggleStreak);
  renderTasks(taskList, state.tasks, taskFilter, toggleTask, deleteTask);
  renderUpcomingTasks($("#upcoming-list"), $("#upcoming-count"), state.tasks, taskFilter, toggleTask, deleteTask);
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  toastRegion.append(toast);
  window.setTimeout(() => toast.remove(), 6500);
}

function notify(reminder) {
  showToast(`${reminder.title}: ${reminder.message}`);
  if (getReminderPermission() === "granted") {
    new Notification(reminder.title, { body: reminder.message, tag: reminder.key });
  }
}

function runReminderCheck() {
  const reminderCount = Object.keys(state.sentReminders).length;
  checkReminders(state, notify);
  if (Object.keys(state.sentReminders).length !== reminderCount) persist();
}

function toggleStreak(id) {
  const streak = state.streaks.find((item) => item.id === id);
  if (!streak) return;
  const today = localDateKey();
  const completed = new Set(streak.completedDates || []);
  if (completed.has(today)) completed.delete(today);
  else completed.add(today);
  streak.completedDates = [...completed].sort();
  persist();
  renderDashboard();
  runReminderCheck();
}

function toggleTask(id) {
  const task = state.tasks.find((item) => item.id === id);
  if (!task) return;
  task.done = !task.done;
  persist();
  renderDashboard();
}

function deleteTask(id) {
  const index = state.tasks.findIndex((item) => item.id === id);
  if (index === -1) return;
  state.tasks.splice(index, 1);
  persist();
  renderDashboard();
}

function createId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function setDefaultTaskDate() {
  $("#task-date").value = localDateKey();
}

function updateReminderButton() {
  const permission = getReminderPermission();
  const button = $("#enable-reminders");
  const label = $("#reminder-button-label");
  if (permission === "granted") {
    label.textContent = "Reminders on";
    button.setAttribute("aria-label", "Browser reminders are enabled");
  } else if (permission === "denied") {
    label.textContent = "Notifications blocked";
    button.setAttribute("aria-label", "Browser notifications are blocked in browser settings");
  } else if (permission === "unsupported") {
    label.textContent = "In-app reminders";
    button.setAttribute("aria-label", "Browser notifications are unavailable; in-app reminders remain active");
  }
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function updateInstallButton() {
  const button = $("#install-app");
  const label = $("#install-button-label");
  if (isStandalone()) {
    label.textContent = "App installed";
    button.disabled = true;
    button.setAttribute("aria-label", "Daymark is installed");
    return;
  }
  label.textContent = "Install app";
  button.disabled = false;
  button.removeAttribute("aria-label");
}

async function installApp() {
  if (!deferredInstallPrompt) {
    installDialog.showModal();
    return;
  }

  await deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  if (outcome === "accepted") {
    showToast("Daymark is installing. Look for it on your home screen.");
  }
}

function bindEvents() {
  $("#add-streak-button").addEventListener("click", () => streakDialog.showModal());
  $("#add-task-button").addEventListener("click", () => {
    setDefaultTaskDate();
    taskDialog.showModal();
  });

  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => button.closest("dialog").close());
  });

  document.querySelectorAll(".form-dialog").forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  });

  $("#streak-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    state.streaks.push({
      id: createId(),
      name: String(form.get("name")).trim(),
      condition: String(form.get("condition") || "").trim(),
      reminder: String(form.get("reminder") || ""),
      color: String(form.get("color") || "green"),
      completedDates: []
    });
    persist();
    event.currentTarget.reset();
    $("#streak-reminder").value = "20:00";
    streakDialog.close();
    renderDashboard();
  });

  $("#task-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    state.tasks.push({
      id: createId(),
      name: String(form.get("name")).trim(),
      date: String(form.get("date")),
      reminder: String(form.get("reminder") || ""),
      done: false,
      createdAt: Date.now()
    });
    persist();
    event.currentTarget.reset();
    taskDialog.close();
    renderDashboard();
  });

  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      taskFilter = button.dataset.filter;
      document.querySelectorAll("[data-filter]").forEach((filterButton) => {
        filterButton.classList.toggle("is-selected", filterButton === button);
      });
      renderDashboard();
    });
  });

  $("#enable-reminders").addEventListener("click", async () => {
    const permission = await requestReminderPermission();
    updateReminderButton();
    if (permission === "granted") {
      showToast("Browser reminders are on. We’ll nudge you when a streak or task is due.");
    } else if (permission === "denied") {
      showToast("Notifications are blocked by your browser. In-app reminders will still appear while Daymark is open.");
    } else if (permission === "unsupported") {
      showToast("This browser does not support notifications. In-app reminders will still appear while Daymark is open.");
    }
  });

  $("#install-app").addEventListener("click", installApp);
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    updateInstallButton();
  });
  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    updateInstallButton();
    showToast("Daymark has been added to your device.");
  });
}

bindEvents();
setDefaultTaskDate();
updateReminderButton();
updateInstallButton();
if (loadError) {
  statusMessage.textContent = `Saved Daymark data could not be loaded: ${loadError.message}. A fresh workspace is ready.`;
  statusMessage.hidden = false;
}
renderDashboard();
runReminderCheck();
window.setInterval(runReminderCheck, 30_000);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./service-worker.js")
    .catch((error) => {
      statusMessage.textContent = `Offline support could not be enabled: ${error.message}`;
      statusMessage.hidden = false;
    });
}
