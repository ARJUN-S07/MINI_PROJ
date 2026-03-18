// --- CONFIGURATION ---
// IMPORTANT: Replace this with your Firebase Realtime Database URL
// Make sure to add "/sensorData.json" exactly as shown at the end!
// Example: const FIREBASE_URL = "https://my-project-default-rtdb.firebaseio.com/sensorData.json";
const FIREBASE_URL = "https://esp32-d9d14-default-rtdb.asia-southeast1.firebasedatabase.app/sensorData.json";
const REFRESH_RATE = 1000; // 1 second

// --- DOM Elements ---
const tempValue = document.getElementById('temp-value');
const currentValue = document.getElementById('current-value');
const vibrationStatusContainer = document.getElementById('vibration-status');
const gasStatusContainer = document.getElementById('gas-status');
const vibrationCard = document.getElementById('vibration-card');
const gasCard = document.getElementById('gas-card');
const connectionStatus = document.getElementById('connection-status');
const offlineBanner = document.getElementById('offline-banner');
const themeToggleBtn = document.getElementById('theme-toggle');

// --- Theme Management ---
// Determine initial theme based on local storage or system preferences
const savedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.body.setAttribute('data-theme', 'dark');
    themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
}
// --- Chart.js Setup ---
const MAX_DATA_POINTS = 20;

const tempCtx = document.getElementById('tempChart').getContext('2d');
const currentCtx = document.getElementById('currentChart').getContext('2d');

const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
        x: { ticks: { color: document.body.getAttribute('data-theme') === 'dark' ? '#94a3b8' : '#64748b' } },
        y: { ticks: { color: document.body.getAttribute('data-theme') === 'dark' ? '#94a3b8' : '#64748b' } }
    }
};

const tempChart = new Chart(tempCtx, {
    type: 'line',
    data: { labels: [], datasets: [{ data: [], borderColor: '#f97316', backgroundColor: 'rgba(249, 115, 22, 0.1)', borderWidth: 3, fill: true, tension: 0.4 }] },
    options: commonOptions
});

const currentChart = new Chart(currentCtx, {
    type: 'line',
    data: { labels: [], datasets: [{ data: [], borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderWidth: 3, fill: true, tension: 0.4 }] },
    options: commonOptions
});

themeToggleBtn.addEventListener('click', () => {
    if (document.body.getAttribute('data-theme') === 'dark') {
        document.body.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
    } else {
        document.body.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }
    
    // Update Chart Colors dynamically
    const newColor = document.body.getAttribute('data-theme') === 'dark' ? '#94a3b8' : '#64748b';
    tempChart.options.scales.x.ticks.color = newColor;
    tempChart.options.scales.y.ticks.color = newColor;
    currentChart.options.scales.x.ticks.color = newColor;
    currentChart.options.scales.y.ticks.color = newColor;
    tempChart.update();
    currentChart.update();
});

// --- Data Fetching & UI Update ---
async function fetchSensorData() {
    try {
        // Use an AbortController to establish a strict timeout.
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        // Fetch from Firebase instead of the ESP32 directly!
        const response = await fetch(FIREBASE_URL, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        // If the database is completely empty/null, return an error
        if (!data) {
            throw new Error("No data found in Firebase");
        }

        // Expected Data Structure from Firebase:
        // { "temperature": 25.4, "current": 1.2, "vibration": 0, "gas": 1 }
        updateDashboard(data);
        setOnlineStatus(true);

    } catch (error) {
        console.warn("Failed to fetch data from Firebase:", error.message);
        setOnlineStatus(false);
    }
}

function updateDashboard(data) {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // 1. Update Temperature (Alert > 32C)
    if (data.temperature !== undefined) {
        const temp = Number(data.temperature);
        tempValue.textContent = temp.toFixed(1);
        const tempCard = document.getElementById('temp-card');
        if (temp > 32.0) tempCard.classList.add('alert');
        else tempCard.classList.remove('alert');
        
        // Update Chart
        tempChart.data.labels.push(timeString);
        tempChart.data.datasets[0].data.push(temp);
        if (tempChart.data.labels.length > MAX_DATA_POINTS) {
            tempChart.data.labels.shift();
            tempChart.data.datasets[0].data.shift();
        }
        tempChart.update();
    }

    // 2. Update Current (Alert > 2.0A)
    if (data.current !== undefined) {
        const amp = Number(data.current);
        currentValue.textContent = amp.toFixed(2);
        const currentCard = document.getElementById('current-card');
        if (amp > 2.0) currentCard.classList.add('alert');
        else currentCard.classList.remove('alert');

        // Update Chart
        currentChart.data.labels.push(timeString);
        currentChart.data.datasets[0].data.push(amp);
        if (currentChart.data.labels.length > MAX_DATA_POINTS) {
            currentChart.data.labels.shift();
            currentChart.data.datasets[0].data.shift();
        }
        currentChart.update();
    }

    // 3. Update Vibration Status
    if (data.vibration !== undefined) {
        if (data.vibration === 1) {
            vibrationStatusContainer.innerHTML = '<span class="status-text alert-text">Detected!</span>';
            if (!vibrationCard.classList.contains('alert')) {
                vibrationCard.classList.add('alert');
            }
        } else {
            vibrationStatusContainer.innerHTML = '<span class="status-text normal">Normal</span>';
            vibrationCard.classList.remove('alert');
        }
    }

    // 4. Update Gas Status
    if (data.gas !== undefined) {
        if (data.gas === 1) {
            gasStatusContainer.innerHTML = '<span class="status-text alert-text">Detected!</span>';
            if (!gasCard.classList.contains('alert')) {
                gasCard.classList.add('alert');
            }
        } else {
            gasStatusContainer.innerHTML = '<span class="status-text normal">Normal</span>';
            gasCard.classList.remove('alert');
        }
    }
}

function setOnlineStatus(isOnline) {
    if (isOnline) {
        connectionStatus.textContent = "Online";
        connectionStatus.className = "status badge online";
        offlineBanner.classList.add('hidden');
    } else {
        connectionStatus.textContent = "Offline";
        connectionStatus.className = "status badge offline";
        offlineBanner.classList.remove('hidden');
    }
}

// Start polling immediately, then repeat every REFRESH_RATE ms
fetchSensorData();
setInterval(fetchSensorData, REFRESH_RATE);
