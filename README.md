# ESP32 Sensor Dashboard

A modern, cross-platform web dashboard to monitor real-time sensor data from an ESP32 microcontroller over WiFi. It features a premium glassmorphism UI with smooth animations and dark mode support.

## 🚀 Features
- **Real-Time Data**: Automatically refreshes data every 1 second without page reloads.
- **Modern UI**: Clean, glassmorphism-inspired design elements, vibrant accents, and smooth transitions.
- **Alert System**: Instantly highlights vibration or gas detection with eye-catching pulsating red card states.
- **Dark/Light Mode**: User-friendly theme toggle that Remembers your visual preference.
- **Connection Handling**: Gracefully detects when the ESP32 is offline or unreachable and presents an obvious banner.
- **Cross-Platform**: Built purely with HTML/CSS/JS. It works responsively on Desktop, Tablet, and Mobile devices.

## 📂 Folder Structure
The source code requires no compilation. Inside the project folder:
```text
/web antigravity
│── index.html    # The main HTML layout and structure
│── style.css     # The theme, colors, layouts, and animations
│── script.js     # Data fetching logic and DOM updates
│── README.md     # Setup instructions
```

## 🛠️ Step-by-Step Setup Instructions

### 1. Edit the ESP32 IP Address
Before opening the dashboard, configure it with your ESP32's local network address.
1. Open `script.js` in a text editor (like VS Code or Notepad).
2. Locate the configuration line at the top:
   ```javascript
   const ESP32_URL = "http://esp32.local/data";
   ```
3. Replace the URL with the actual IP address or mDNS hostname of your ESP32. 
   - *Example: `const ESP32_URL = "http://192.168.1.100/data";`*

### 2. Run the Web App
Because of modern browser security measures regarding HTTP requests (CORS constraints when loading local files), **you should run this from a local development server** rather than simply double-clicking `index.html`.

**Option A: Using VS Code (Recommended)**
1. Install the "Live Server" extension in Visual Studio Code.
2. Right-click the `index.html` file and click **"Open with Live Server"**.

**Option B: Using Python**
1. Open your terminal or command prompt inside this folder.
2. Run `python -m http.server 8000` (or `python3 -m http.server 8000`).
3. Open your favorite web browser and navigate to `http://localhost:8000`.

### 3. Ensure ESP32 Firmware Handling CORS
In order for this standalone web application to fetch data directly from the ESP32 API, **your ESP32 code must include CORS headers** in its HTTP response.

If you are using the standard `WebServer.h` library on Arduino IDE for your ESP32, ensure your JSON response handler looks similar to this:
```cpp
// Inside your request handler callback:
server.sendHeader("Access-Control-Allow-Origin", "*");
String json = "{\"temperature\": 24.5, \"current\": 1.2, \"vibration\": 0, \"gas\": 1}";
server.send(200, "application/json", json);
```

## 🧠 How Data Fetching Works
The application relies strictly on standard web APIs:
1. **The Polling Loop**: In `script.js`, built-in `setInterval(fetchSensorData, 1000)` executes the main fetch sequence precisely once every 1,000 milliseconds.
2. **GET Requests**: The browser issues a background asynchronous `GET` request using the modern `fetch()` API against the designated `ESP32_URL`.
3. **Graceful Timeouts**: An `AbortController` is used to strictly timeout the background request after 2 seconds. If the ESP32 disconnects from WiFi or loses power, the request is aborted natively instead of indefinitely hanging the JS thread.
4. **Data Handling**: Upon a successful JSON response, the data is parsed as a JavaScript object.
5. **DOM Manipulation**: Based on the returned JSON object, the `updateDashboard(data)` function directly reads properties and edits Text nodes (i.e. modifying `tempValue.textContent`).
6. **Alert Styling Validation**: When checking if the vibration or gas integer equals `1`, the app dynamically appends a specific CSS alert class `.alert` to the element wrapper. Since `.alert` carries CSS animation definitions in `style.css`, this causes the target block to pulsate red organically.
