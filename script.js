// script.js

// ----------------------
// Set initial theme based on saved value
// ----------------------
document.addEventListener('DOMContentLoaded', function() {
  const savedTheme = localStorage.getItem('mt_theme') || 'light';
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
  }
});

// ----------------------
// Authentication Function
// ----------------------
function login(username) {
  localStorage.setItem('mt_username', username);
  window.location.href = 'home.html';
}

// ----------------------
// Account-Based Mood Logs (LocalStorage)
// 
// Mood logs are stored in an object keyed by username, e.g.:
// { "alice": [ { date, rating, emoji }, ... ], "bob": [ ... ] }
// ----------------------
function getMoodLogs() {
  const logsObj = JSON.parse(localStorage.getItem('mt_moodLogs') || '{}');
  const currentUser = localStorage.getItem('mt_username');
  return logsObj[currentUser] || [];
}

function saveMoodLogs(logs) {
  const logsObj = JSON.parse(localStorage.getItem('mt_moodLogs') || '{}');
  const currentUser = localStorage.getItem('mt_username');
  logsObj[currentUser] = logs;
  localStorage.setItem('mt_moodLogs', JSON.stringify(logsObj));
}

function logMood(dateObj, rating, emoji) {
  const dateKey = dateObj.toISOString().split('T')[0];
  let logs = getMoodLogs();
  const existingIndex = logs.findIndex(log => log.date === dateKey);
  
  if (existingIndex !== -1) {
    logs[existingIndex].rating = rating;
    logs[existingIndex].emoji = emoji;
  } else {
    logs.push({
      date: dateKey,
      rating: rating,
      emoji: emoji
    });
  }
  saveMoodLogs(logs);
}

// ----------------------
// Delete a Mood Entry
// ----------------------
function deleteMood(dateKey) {
  let logs = getMoodLogs();
  logs = logs.filter(log => log.date !== dateKey);
  saveMoodLogs(logs);
  displayTimeline(currentView);
}

// ----------------------
// Display Timeline / History
// ----------------------
let currentView = 'day'; // global variable for current view

function displayTimeline(view) {
  const timelineContainer = document.getElementById('timelineView');
  if (!timelineContainer) return;
  timelineContainer.innerHTML = '';
  const logs = getMoodLogs();

  if (!logs.length) {
    timelineContainer.innerHTML = '<p>No mood logs yet.</p>';
    return;
  }

  if (view === 'day') {
    const todayKey = new Date().toISOString().split('T')[0];
    const todayLog = logs.find(log => log.date === todayKey);
    if (todayLog) {
      timelineContainer.appendChild(createTimelineEntry(todayLog));
    } else {
      timelineContainer.innerHTML = '<p>No mood logged for today.</p>';
    }
  } else if (view === 'week') {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const weekLogs = logs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= startOfWeek && logDate <= endOfWeek;
    });

    if (weekLogs.length) {
      weekLogs.sort((a, b) => new Date(a.date) - new Date(b.date));
      weekLogs.forEach(log => timelineContainer.appendChild(createTimelineEntry(log)));
    } else {
      timelineContainer.innerHTML = '<p>No mood logs for this week.</p>';
    }
  } else if (view === 'month') {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const monthLogs = logs.filter(log => {
      const logDate = new Date(log.date);
      return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear;
    });

    if (monthLogs.length) {
      monthLogs.sort((a, b) => new Date(a.date) - new Date(b.date));
      monthLogs.forEach(log => timelineContainer.appendChild(createTimelineEntry(log)));
    } else {
      timelineContainer.innerHTML = '<p>No mood logs for this month.</p>';
    }
  } else if (view === 'calendar') {
    timelineContainer.appendChild(generateCalendarView());
  }
}

function createTimelineEntry(log) {
  const entryDiv = document.createElement('div');
  entryDiv.className = 'feed-entry';

  const dateObj = new Date(log.date);
  const formattedDate = dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

  // Emoji
  const emojiSpan = document.createElement('span');
  emojiSpan.className = 'feed-emoji';
  emojiSpan.textContent = log.emoji;

  // Info container
  const infoDiv = document.createElement('div');
  infoDiv.className = 'feed-info';

  const dateElem = document.createElement('h3');
  dateElem.className = 'feed-date';
  dateElem.textContent = formattedDate;

  const ratingElem = document.createElement('p');
  ratingElem.className = 'feed-rating';
  ratingElem.textContent = `Mood rating: ${log.rating}`;

  const noteElem = document.createElement('p');
  noteElem.className = 'feed-note';
  const ratingNum = parseInt(log.rating, 10);
  if (ratingNum > 7) {
    noteElem.textContent = "Keep going! You seem really happy!";
  } else if (ratingNum < 4) {
    noteElem.textContent = "Stay strong! Better days are ahead.";
  } else {
    noteElem.textContent = "Hang in there, keep tracking your mood.";
  }

  // Delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn btn-secondary btn-delete';
  deleteBtn.textContent = 'Delete';
  deleteBtn.addEventListener('click', function() {
    if (confirm('Are you sure you want to delete this entry?')) {
      deleteMood(log.date);
    }
  });

  infoDiv.appendChild(dateElem);
  infoDiv.appendChild(ratingElem);
  infoDiv.appendChild(noteElem);
  infoDiv.appendChild(deleteBtn);

  entryDiv.appendChild(emojiSpan);
  entryDiv.appendChild(infoDiv);

  return entryDiv;
}

// ----------------------
// Generate Calendar View for Timeline "Calendar" Mode
// ----------------------
function generateCalendarView() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);

  const table = document.createElement('table');
  table.className = 'calendar-table';

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  daysOfWeek.forEach(day => {
    const th = document.createElement('th');
    th.textContent = day;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const logs = getMoodLogs();
  const moodMap = {};
  logs.forEach(log => {
    const logDate = new Date(log.date);
    if (logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear) {
      moodMap[logDate.getDate()] = { rating: log.rating, emoji: log.emoji };
    }
  });

  const tbody = document.createElement('tbody');
  let row = document.createElement('tr');
  // Fill initial empty cells
  for (let i = 0; i < firstDay.getDay(); i++) {
    const emptyCell = document.createElement('td');
    row.appendChild(emptyCell);
  }

  for (let date = 1; date <= lastDay.getDate(); date++) {
    if (row.children.length === 7) {
      tbody.appendChild(row);
      row = document.createElement('tr');
    }
    const cell = document.createElement('td');
    cell.textContent = date;
    if (moodMap[date]) {
      const moodDiv = document.createElement('div');
      moodDiv.className = 'calendar-mood';
      moodDiv.textContent = moodMap[date].emoji;
      const ratingDiv = document.createElement('div');
      ratingDiv.className = 'calendar-rating';
      ratingDiv.textContent = `(${moodMap[date].rating})`;
      cell.appendChild(moodDiv);
      cell.appendChild(ratingDiv);
    }
    row.appendChild(cell);
  }

  // Fill remaining empty cells
  while (row.children.length < 7) {
    const emptyCell = document.createElement('td');
    row.appendChild(emptyCell);
  }
  tbody.appendChild(row);
  table.appendChild(tbody);

  return table;
}

// ----------------------
// Dynamic Quotes using Quotable API
// ----------------------
function fetchQuote() {
  const quoteBlock = document.getElementById('quoteBlock');
  if (!quoteBlock) return;
  
  fetch('https://api.quotable.io/random')
    .then(response => response.json())
    .then(data => {
      if (data && data.content && data.author) {
        quoteBlock.textContent = `${data.content} — ${data.author}`;
      } else {
        quoteBlock.textContent = "“Be yourself; everyone else is already taken.” — Oscar Wilde";
      }
    })
    .catch(error => {
      console.error('Error fetching quote:', error);
      quoteBlock.textContent = "“Failure is the condiment that gives success its flavor.” — Truman Capote";
    });
}
