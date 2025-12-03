// Live Clock Display
// 
// Updates the header clock capsule with current time and date every second.
// Formats time as HH:MM:SS and date as "Weekday, Month DD, YYYY".
// Runs continuously in the background to keep the display synchronized with system time.

// Update clock display with current time and date
function updateClock() {
  const now = new Date();
  
  // Format time as HH:MM:SS
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const timeString = `${hours}:${minutes}:${seconds}`;
  
  // Format date as "Day, Month DD, YYYY"
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  const dateString = now.toLocaleDateString('en-US', options);
  
  // Update DOM elements
  const timeElement = document.getElementById('liveTime');
  const dateElement = document.getElementById('liveDate');
  
  if (timeElement) timeElement.textContent = timeString;
  if (dateElement) dateElement.textContent = dateString;
}

// Initialize clock on page load
document.addEventListener('DOMContentLoaded', () => {
  updateClock();
  setInterval(updateClock, 1000); // Update every second
});
