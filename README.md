# Daymark

A lightweight daily dashboard for tracking habits, building streaks, and managing tasks.

## Run locally

No package installation or build step is required. From the project folder, start a local web server:

```powershell
python -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000) in your browser.

The app uses JavaScript ES modules, so open it through a local web server rather than directly as a `file://` URL.

To install it on a phone, deploy the site over HTTPS, open it in the phone's browser, and tap **Install app**. On iPhone or iPad, open the site in Safari, tap **Share**, and choose **Add to Home Screen**. On Android, open the site in Chrome and choose **Install app** or **Add to Home screen** from the menu. Installation is not available from a computer's `localhost` address on a separate phone.

## Features

- Create daily streaks with a condition for what counts as complete, a color, and an optional reminder time.
- Check off a streak each day, undo a check-in, and track consecutive completed days.
- Create tasks with due dates and optional reminder times. Upcoming tasks are listed separately until their due date.
- Filter tasks by all, to do, and done.
- See daily completion progress and counts on the overview.
- Save streaks, tasks, and check-ins in this browser using `localStorage`.
- Get in-app reminders while the app is open. Grant browser notification permission to enable system notifications as well.
- Install Daymark to a phone or computer home screen as a progressive web app (PWA); its app shell is cached for offline use after the first successful load.

## Project structure

```text
index.html                  App markup and add-item dialogs
styles.css                  Layout, responsive styles, and component styles
src/
  main.js                   App entry point, events, and dashboard rendering
service-worker.js           Offline app-shell cache
manifest.webmanifest        Install name, display mode, colors, and icons
icons/                      Home-screen and browser app icons
  data/
    storage.js              Browser storage and saved-state loading
  features/
    reminders.js            Reminder scheduling and notifications
    streaks.js              Streak rendering and consecutive-day counts
    tasks.js                Task rendering, filtering, and upcoming tasks
  utils/
    date.js                 Local date keys and date formatting
```

## Data and reminders

App data is saved in the browser's local storage under `daymark-data-v1`. It is local to this browser and is not synchronized across devices.

Reminders are checked while the app is open. Browser notifications require permission and a supported browser; in-app reminder messages remain available when system notifications are unavailable or blocked.
