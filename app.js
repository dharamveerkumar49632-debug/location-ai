// Dharamveer AI Controller (Pro+ Cloud Persist Analytics Version)
document.addEventListener("DOMContentLoaded", () => {
    // Initialize Lucide Icons
    lucide.createIcons();

    // Authentication Elements
    const authScreen = document.getElementById("auth-screen");
    const appDashboard = document.getElementById("app-dashboard");
    const loginFormContainer = document.getElementById("login-form-container");
    const registerFormContainer = document.getElementById("register-form-container");
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");
    const btnShowRegister = document.getElementById("btn-show-register");
    const btnShowLogin = document.getElementById("btn-show-login");
    const greetingUsername = document.getElementById("greeting-username");
    const btnLogout = document.getElementById("btn-logout");
    const authSubtitle = document.getElementById("auth-subtitle");

    // DOM Navigation Elements
    const navChat = document.getElementById("nav-chat");
    const navLocation = document.getElementById("nav-location");
    const navHistory = document.getElementById("nav-history");
    const navSettings = document.getElementById("nav-settings");
    
    const screenChat = document.getElementById("screen-chat");
    const screenLocation = document.getElementById("screen-location");
    const screenHistory = document.getElementById("screen-history");
    const screenSettings = document.getElementById("screen-settings");
    
    const pageTitle = document.getElementById("page-title");
    const pageSubtitle = document.getElementById("page-subtitle");

    // Location Telemetry & Weather Elements
    const geoStatusText = document.getElementById("geo-status-text");
    const geoStatusDot = document.getElementById("geo-status-dot");
    const quickLat = document.getElementById("quick-lat");
    const quickLng = document.getElementById("quick-lng");
    const valLatitude = document.getElementById("val-latitude");
    const valLongitude = document.getElementById("val-longitude");
    const valAccuracy = document.getElementById("val-accuracy");
    const valAltitude = document.getElementById("val-altitude");
    const valAddress = document.getElementById("val-address");
    const btnRefreshLocation = document.getElementById("btn-refresh-location");
    
    const weatherTemp = document.getElementById("weather-temp");
    const valTempDetail = document.getElementById("val-temp-detail");
    const valWindDetail = document.getElementById("val-wind-detail");

    // Chat Elements
    const chatMessages = document.getElementById("chat-messages");
    const chatForm = document.getElementById("chat-form");
    const chatInput = document.getElementById("chat-input");
    const btnGpsAttach = document.getElementById("btn-gps-attach");
    const btnVoiceInput = document.getElementById("btn-voice-input");

    // Map Measurement Elements
    const distanceOverlay = document.getElementById("distance-overlay-panel");
    const valDistanceCalc = document.getElementById("val-distance-calc");
    const btnClearTarget = document.getElementById("btn-clear-target");

    // History Log Elements
    const btnLogVisit = document.getElementById("btn-log-visit");
    const btnClearHistory = document.getElementById("btn-clear-history");
    const historyLogRows = document.getElementById("history-log-rows");

    // Settings Elements
    const apiKeyInput = document.getElementById("api-key-input");
    const apiModelInput = document.getElementById("api-model-input");
    const btnToggleKeyVisibility = document.getElementById("btn-toggle-key-visibility");
    const btnSaveSettings = document.getElementById("btn-save-settings");
    const btnClearSettings = document.getElementById("btn-clear-settings");
    const apiStatusBadge = document.getElementById("api-status");

    // Social Settings Input Elements
    const socialInstaInput = document.getElementById("social-insta-input");
    const socialTwitterInput = document.getElementById("social-twitter-input");
    const socialGithubInput = document.getElementById("social-github-input");
    const socialLinkedinInput = document.getElementById("social-linkedin-input");
    const socialLeetcodeInput = document.getElementById("social-leetcode-input");
    const btnSaveSocials = document.getElementById("btn-save-socials");

    // Sidebar Social Buttons
    const sidebarInsta = document.getElementById("sidebar-insta");
    const sidebarTwitter = document.getElementById("sidebar-twitter");
    const sidebarGithub = document.getElementById("sidebar-github");
    const sidebarLinkedin = document.getElementById("sidebar-linkedin");
    const sidebarLeetcode = document.getElementById("sidebar-leetcode");

    // State Variables
    let currentCoords = null;
    let currentAddress = "Location not determined.";
    let leafletMap = null;
    let mapMarker = null;
    let targetMarker = null;
    let mapPolyline = null;
    let savedLogs = [];
    let chatHistory = [];
    let logMarkersGroup = null;

    let currentUser = localStorage.getItem("aero_current_user") || "";

    // Default social links configuration
    let socialLinks = {
        instagram: "https://instagram.com",
        twitter: "https://twitter.com",
        github: "https://github.com",
        linkedin: "https://linkedin.com",
        leetcode: "https://leetcode.com"
    };

    let geminiApiKey = "";
    let geminiModelName = "gemini-1.5-flash";

    // --- Authentication Flow Logic ---
    btnShowRegister.addEventListener("click", () => {
        loginFormContainer.classList.add("hidden");
        registerFormContainer.classList.remove("hidden");
        authSubtitle.textContent = "Create your globally stored cloud profile credential";
    });

    btnShowLogin.addEventListener("click", () => {
        registerFormContainer.classList.add("hidden");
        loginFormContainer.classList.remove("hidden");
        authSubtitle.textContent = "Sign in to access GPS telemetry and assistant services";
    });

    // Registration Handler
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("register-username").value.trim();
        const password = document.getElementById("register-password").value;

        if (username.length < 3 || password.length < 4) {
            alert("Username must be at least 3 chars, and password at least 4 chars.");
            return;
        }

        const submitBtn = registerForm.querySelector("button[type='submit']");
        submitBtn.disabled = true;
        submitBtn.textContent = "Registering...";

        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Registration failed");

            loginUser(username, data.profile);
        } catch (err) {
            alert(err.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Register & Login";
        }
    });

    // Login Handler
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("login-username").value.trim();
        const password = document.getElementById("login-password").value;

        const submitBtn = loginForm.querySelector("button[type='submit']");
        submitBtn.disabled = true;
        submitBtn.textContent = "Authenticating...";

        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Login failed");

            loginUser(username, data.profile);
        } catch (err) {
            alert(err.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Log In";
        }
    });

    // Push current active user profile updates (API Key, Model, Socials, Chat, Logs) to cloud
    async function syncCurrentUserProfileToCloud() {
        if (!currentUser) return;
        try {
            await fetch("/api/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: currentUser,
                    geminiApiKey: geminiApiKey,
                    geminiModelName: geminiModelName,
                    chatHistory: chatHistory,
                    savedLogs: savedLogs,
                    socialLinks: socialLinks
                })
            });
        } catch (e) {
            console.error("Failed to sync profile configuration:", e);
        }
    }

    function loginUser(username, profileData = null) {
        currentUser = username;
        localStorage.setItem("aero_current_user", username);
        
        authScreen.classList.add("hidden");
        appDashboard.classList.remove("blur-content");
        greetingUsername.textContent = username;

        // If profile preferences/data are found in cloud, restore them
        if (profileData) {
            if (profileData.geminiApiKey !== undefined) {
                geminiApiKey = profileData.geminiApiKey;
                localStorage.setItem("gemini_api_key", geminiApiKey);
                apiKeyInput.value = geminiApiKey;
                updateApiStatus(!!geminiApiKey);
            }
            if (profileData.geminiModelName !== undefined) {
                geminiModelName = profileData.geminiModelName;
                localStorage.setItem("gemini_model_name", geminiModelName);
                apiModelInput.value = geminiModelName;
            }
            if (profileData.socialLinks !== undefined) {
                socialLinks = profileData.socialLinks;
                localStorage.setItem("aero_social_links", JSON.stringify(socialLinks));
            }
            if (profileData.chatHistory !== undefined) {
                chatHistory = profileData.chatHistory;
                chatMessages.innerHTML = "";
                if (chatHistory.length > 0) {
                    chatHistory.forEach(msg => {
                        addMessageToUI(msg.sender, msg.text, msg.time);
                    });
                } else {
                    addMessageToUI("assistant", "Hello! I am your Dharamveer AI companion. How can I assist you today?", "Just now");
                }
            }
            if (profileData.savedLogs !== undefined) {
                savedLogs = profileData.savedLogs;
                localStorage.setItem("aero_saved_logs", JSON.stringify(savedLogs));
            }
        }

        fetchCurrentLocation();
        applySocialLinks();
    }

    btnLogout.addEventListener("click", () => {
        currentUser = "";
        localStorage.removeItem("aero_current_user");
        
        loginForm.reset();
        registerForm.reset();
        
        authScreen.classList.remove("hidden");
        appDashboard.classList.add("blur-content");
        
        setActiveScreen(navChat, screenChat, "AI Assistant", "Ask questions, speak voice prompts, or request location updates.");
    });

    // Check existing active session on page refresh (loads from local fallbacks initially, then syncs with cloud)
    if (currentUser) {
        authScreen.classList.add("hidden");
        appDashboard.classList.remove("blur-content");
        greetingUsername.textContent = currentUser;
        
        geminiApiKey = localStorage.getItem("gemini_api_key") || "";
        geminiModelName = localStorage.getItem("gemini_model_name") || "gemini-1.5-flash";
        socialLinks = JSON.parse(localStorage.getItem("aero_social_links")) || socialLinks;
        savedLogs = JSON.parse(localStorage.getItem("aero_saved_logs")) || [];

        apiKeyInput.value = geminiApiKey;
        apiModelInput.value = geminiModelName;
        updateApiStatus(!!geminiApiKey);

        fetchCurrentLocation();

        // Fetch latest up-to-date settings from cloud database
        fetch(`/api/profile?username=${encodeURIComponent(currentUser)}`)
            .then(res => res.json())
            .then(data => {
                if (data.success && data.profile) {
                    loginUser(currentUser, data.profile);
                }
            })
            .catch(err => console.error("Cloud session sync failed:", err));
    } else {
        authScreen.classList.remove("hidden");
        appDashboard.classList.add("blur-content");
    }

    // --- Initialize/Apply social links ---
    function applySocialLinks() {
        sidebarInsta.href = socialLinks.instagram;
        sidebarTwitter.href = socialLinks.twitter;
        sidebarGithub.href = socialLinks.github;
        sidebarLinkedin.href = socialLinks.linkedin;
        sidebarLeetcode.href = socialLinks.leetcode || "https://leetcode.com";

        socialInstaInput.value = socialLinks.instagram;
        socialTwitterInput.value = socialLinks.twitter;
        socialGithubInput.value = socialLinks.github;
        socialLinkedinInput.value = socialLinks.linkedin;
        socialLeetcodeInput.value = socialLinks.leetcode || "";
    }
    applySocialLinks();

    btnSaveSocials.addEventListener("click", () => {
        socialLinks.instagram = socialInstaInput.value.trim() || "https://instagram.com";
        socialLinks.twitter = socialTwitterInput.value.trim() || "https://twitter.com";
        socialLinks.github = socialGithubInput.value.trim() || "https://github.com";
        socialLinks.linkedin = socialLinkedinInput.value.trim() || "https://linkedin.com";
        socialLinks.leetcode = socialLeetcodeInput.value.trim() || "https://leetcode.com";

        localStorage.setItem("aero_social_links", JSON.stringify(socialLinks));
        applySocialLinks();
        syncCurrentUserProfileToCloud();
        addMessage("assistant", "Social media configurations saved to cloud!");
    });

    // Speech Setup
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let voiceRecognition = null;
    if (SpeechRecognition) {
        voiceRecognition = new SpeechRecognition();
        voiceRecognition.continuous = false;
        voiceRecognition.lang = 'en-US';
        voiceRecognition.interimResults = false;

        voiceRecognition.onstart = () => {
            btnVoiceInput.classList.add("recording");
        };

        voiceRecognition.onend = () => {
            btnVoiceInput.classList.remove("recording");
        };

        voiceRecognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            chatInput.value = transcript;
            chatInput.focus();
        };

        voiceRecognition.onerror = (e) => {
            console.error(e);
            btnVoiceInput.classList.remove("recording");
        };
    } else {
        btnVoiceInput.style.display = "none";
    }

    // --- Save System API Settings ---
    btnSaveSettings.addEventListener("click", () => {
        geminiApiKey = apiKeyInput.value.trim();
        geminiModelName = apiModelInput.value.trim() || "gemini-1.5-flash";

        if (geminiApiKey) {
            localStorage.setItem("gemini_api_key", geminiApiKey);
            localStorage.setItem("gemini_model_name", geminiModelName);
            updateApiStatus(true);
            syncCurrentUserProfileToCloud();
            addMessage("assistant", `System configured. Model: **${geminiModelName}** synced to cloud.`);
        } else {
            alert("Please enter a valid API Key.");
        }
    });

    btnClearSettings.addEventListener("click", () => {
        geminiApiKey = "";
        apiKeyInput.value = "";
        localStorage.removeItem("gemini_api_key");
        updateApiStatus(false);
        syncCurrentUserProfileToCloud();
        addMessage("assistant", "Gemini API Key removed. Offline fallback active.");
    });

    function updateApiStatus(hasKey) {
        // Since we have a backend Master API Key fallback, it is always active!
        apiStatusBadge.classList.add("active");
        apiStatusBadge.querySelector(".text").textContent = "Gemini AI Active";
    }

    // --- Environmental Weather Telemetry (Free, No Key) ---
    async function fetchWeather(lat, lng) {
        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`;
            const response = await fetch(url);
            const data = await response.json();
            if (data.current_weather) {
                const temp = data.current_weather.temperature;
                const wind = data.current_weather.windspeed;
                
                weatherTemp.textContent = `${temp}°C`;
                valTempDetail.textContent = `${temp}°C`;
                valWindDetail.textContent = `${wind} km/h`;
            }
        } catch (err) {
            console.error("Weather failed:", err);
            weatherTemp.textContent = "N/A";
        }
    }

    // --- Leaflet & Map Custom Features ---
    function initMap(lat, lng) {
        if (leafletMap) return;

        leafletMap = L.map("map-container").setView([lat, lng], 13);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            maxZoom: 20
        }).addTo(leafletMap);

        logMarkersGroup = L.layerGroup().addTo(leafletMap);

        const currentLocIcon = L.divIcon({
            className: 'custom-map-pin',
            html: `<div style="width:20px; height:20px; background:linear-gradient(135deg, #3b82f6 0%, #14b8a6 100%); border-radius:50%; border:2px solid white; box-shadow: 0 0 10px rgba(20, 184, 166, 0.8);"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });

        mapMarker = L.marker([lat, lng], { icon: currentLocIcon }).addTo(leafletMap);
        mapMarker.bindPopup("<b>You are here</b>").openPopup();

        plotSavedPinsOnMap();

        leafletMap.on("click", (e) => {
            placeTargetMarker(e.latlng.lat, e.latlng.lng);
        });
    }

    function placeTargetMarker(lat, lng) {
        if (!currentCoords) return;

        if (targetMarker) leafletMap.removeLayer(targetMarker);
        if (mapPolyline) leafletMap.removeLayer(mapPolyline);

        const targetIcon = L.divIcon({
            className: 'target-map-pin',
            html: `<div style="width:16px; height:16px; background:#ef4444; border-radius:50%; border:2px solid white; box-shadow: 0 0 8px rgba(239, 68, 68, 0.8);"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        });

        targetMarker = L.marker([lat, lng], { icon: targetIcon }).addTo(leafletMap);
        
        mapPolyline = L.polyline([
            [currentCoords.lat, currentCoords.lng],
            [lat, lng]
        ], { color: '#14b8a6', weight: 3, dashArray: '6, 6' }).addTo(leafletMap);

        const distKm = calculateDistance(currentCoords.lat, currentCoords.lng, lat, lng);
        
        valDistanceCalc.textContent = `${distKm.toFixed(2)} km`;
        distanceOverlay.classList.remove("hidden");
    }

    btnClearTarget.addEventListener("click", () => {
        if (targetMarker) leafletMap.removeLayer(targetMarker);
        if (mapPolyline) leafletMap.removeLayer(mapPolyline);
        distanceOverlay.classList.add("hidden");
    });

    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; 
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    // --- Geolocation resolution ---
    function fetchCurrentLocation(isRefresh = false) {
        if (!currentUser) return;
        geoStatusDot.className = "status-dot pulsing";
        geoStatusText.textContent = "Resolving GPS...";

        if (!navigator.geolocation) {
            geoStatusDot.className = "status-dot";
            geoStatusText.textContent = "Unsupported";
            valAddress.textContent = "Browser Geolocation not supported.";
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const accuracy = position.coords.accuracy;
                const altitude = position.coords.altitude;

                currentCoords = { lat, lng };

                quickLat.textContent = lat.toFixed(4);
                quickLng.textContent = lng.toFixed(4);
                valLatitude.textContent = lat.toFixed(6);
                valLongitude.textContent = lng.toFixed(6);
                valAccuracy.textContent = accuracy ? `± ${accuracy.toFixed(1)}m` : "Unknown";
                valAltitude.textContent = altitude ? `${altitude.toFixed(1)}m` : "N/A";

                geoStatusDot.className = "status-dot active";
                geoStatusText.textContent = "Position Fixed";

                fetchWeather(lat, lng);

                if (!leafletMap) {
                    initMap(lat, lng);
                } else {
                    leafletMap.setView([lat, lng], 13);
                    if (mapMarker) mapMarker.setLatLng([lat, lng]);
                }

                try {
                    valAddress.textContent = "Resolving street details...";
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
                        headers: { "User-Agent": "AeroLocationAI/1.0" }
                    });
                    const data = await response.json();
                    currentAddress = data.display_name || `Lat: ${lat}, Lng: ${lng}`;
                    valAddress.textContent = currentAddress;
                } catch (err) {
                    currentAddress = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
                    valAddress.textContent = "Could not resolve details.";
                }

                if (isRefresh) {
                    addMessage("assistant", `Telemetry refreshed. Current position: ${currentAddress}`);
                }
            },
            (error) => {
                geoStatusDot.className = "status-dot";
                geoStatusText.textContent = "GPS Access Blocked";
                valAddress.textContent = "Enable browser GPS tracking in permissions.";
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }

    btnRefreshLocation.addEventListener("click", () => fetchCurrentLocation(true));

    // --- Travel Log / Saved places ---
    btnLogVisit.addEventListener("click", () => {
        if (!currentCoords) {
            alert("No GPS coords active.");
            return;
        }

        const note = prompt("Add a name or note for this location:", currentAddress);
        if (note === null) return;

        const newLog = {
            id: Date.now(),
            lat: currentCoords.lat,
            lng: currentCoords.lng,
            alt: currentCoords.alt || (20 + (savedLogs.length * 15) % 45),
            address: note || currentAddress,
            time: new Date().toLocaleString()
        };

        savedLogs.push(newLog);
        localStorage.setItem("aero_saved_logs", JSON.stringify(savedLogs));
        
        plotSavedPinsOnMap();
        syncCurrentUserProfileToCloud();
        
        addMessage("assistant", `Bookmarked location: **${newLog.address}**`);
        
        // Redraw telemetry graph
        setTimeout(drawAnalyticsChart, 100);
    });

    function plotSavedPinsOnMap() {
        if (!leafletMap || !logMarkersGroup) return;
        logMarkersGroup.clearLayers();

        const logPinIcon = L.divIcon({
            className: 'log-map-pin',
            html: `<div style="width:14px; height:14px; background:#14b8a6; border-radius:50%; border:2px solid white; box-shadow: 0 0 6px rgba(20, 184, 166, 0.6);"></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7]
        });

        savedLogs.forEach(log => {
            L.marker([log.lat, log.lng], { icon: logPinIcon })
                .addTo(logMarkersGroup)
                .bindPopup(`<b>Logged Spot</b><br>${log.address}<br><small>${log.time}</small>`);
        });
    }

    function renderHistoryTable() {
        historyLogRows.innerHTML = "";
        if (savedLogs.length === 0) {
            historyLogRows.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">No logs saved yet. Spot a place in the Geo tab!</td></tr>`;
            return;
        }

        savedLogs.forEach(log => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${log.time}</td>
                <td style="font-family:monospace;">${log.lat.toFixed(5)}, ${log.lng.toFixed(5)}</td>
                <td>${log.address}</td>
                <td>
                    <button class="btn btn-secondary btn-sm btn-delete-log" data-id="${log.id}">
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </td>
            `;

            tr.querySelector(".btn-delete-log").addEventListener("click", () => {
                savedLogs = savedLogs.filter(item => item.id !== log.id);
                localStorage.setItem("aero_saved_logs", JSON.stringify(savedLogs));
                renderHistoryTable();
                plotSavedPinsOnMap();
                syncCurrentUserProfileToCloud();
                setTimeout(drawAnalyticsChart, 100);
            });

            historyLogRows.appendChild(tr);
        });
        lucide.createIcons();
    }

    btnClearHistory.addEventListener("click", () => {
        if (confirm("Are you sure you want to wipe your travel log?")) {
            savedLogs = [];
            localStorage.removeItem("aero_saved_logs");
            renderHistoryTable();
            plotSavedPinsOnMap();
            syncCurrentUserProfileToCloud();
            setTimeout(drawAnalyticsChart, 100);
        }
    });

    // --- Text-To-Speech (AI Response voice reading) ---
    function speakText(text) {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const cleanText = text.replace(/[*#_`~]/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanText);
        window.speechSynthesis.speak(utterance);
    }

    // --- Message Rendering with Voice & Persist Support ---
    function addMessageToUI(sender, text, timeStr) {
        const messageDiv = document.createElement("div");
        messageDiv.className = `message ${sender}`;

        const avatarMarkup = sender === 'user' 
            ? `<div class="avatar"><i data-lucide="user"></i></div>`
            : `<div class="avatar"><i data-lucide="bot"></i></div>`;

        const ttsMarkup = sender === 'assistant' 
            ? `<button class="tts-btn" title="Listen to response"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg></button>`
            : '';

        messageDiv.innerHTML = `
            ${avatarMarkup}
            <div class="message-content">
                <div class="sender-name">${sender === 'user' ? 'You' : 'Dharamveer AI'} ${ttsMarkup}</div>
                <div class="text">${formatMessageText(text)}</div>
                <div class="time">${timeStr}</div>
            </div>
        `;

        if (sender === 'assistant') {
            const btnSpeak = messageDiv.querySelector(".tts-btn");
            btnSpeak.addEventListener("click", () => speakText(text));
        }

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        lucide.createIcons();
    }

    function addMessage(sender, text) {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        addMessageToUI(sender, text, timeStr);

        // Save to cloud-persistent array
        chatHistory.push({ sender, text, time: timeStr });
        syncCurrentUserProfileToCloud();
    }

    function formatMessageText(text) {
        return text
            .replace(/\n/g, "<br>")
            .replace(/\*\*(.*?)\*\"/g, "<strong>$1</strong>") // Fix regex parsing
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.*?)\*/g, "<em>$1</em>");
    }

    btnGpsAttach.addEventListener("click", () => {
        if (!currentCoords) {
            addMessage("assistant", "GPS coordinates are not active yet.");
            return;
        }
        chatInput.value = `Location details: Latitude ${currentCoords.lat.toFixed(6)}, Longitude ${currentCoords.lng.toFixed(6)} (${currentAddress})`;
        chatInput.focus();
    });

    // --- Tab Navigation Screen-Switcher ---
    function setActiveScreen(activeBtn, activeScreen, title, subtitle) {
        [navChat, navLocation, navHistory, navSettings].forEach(btn => btn.classList.remove("active"));
        [screenChat, screenLocation, screenHistory, screenSettings].forEach(screen => screen.classList.remove("active"));
        
        activeBtn.classList.add("active");
        activeScreen.classList.add("active");
        pageTitle.textContent = title;
        
        if (activeScreen === screenChat) {
            pageSubtitle.innerHTML = `Welcome, <strong id="greeting-username">${currentUser}</strong>! Ask questions or explore telemetry.`;
        } else {
            pageSubtitle.textContent = subtitle;
        }

        if (activeScreen === screenLocation && leafletMap) {
            setTimeout(() => {
                leafletMap.invalidateSize();
            }, 100);
        }

        if (activeScreen === screenHistory) {
            renderHistoryTable();
            setTimeout(drawAnalyticsChart, 100);
        }
    }

    navChat.addEventListener("click", () => {
        setActiveScreen(navChat, screenChat, "AI Assistant", "");
    });

    navLocation.addEventListener("click", () => {
        setActiveScreen(navLocation, screenLocation, "Geo-Location & Map", "Measure distances, inspect telemetry, and view live environment updates.");
    });

    navHistory.addEventListener("click", () => {
        setActiveScreen(navHistory, screenHistory, "Travel Log & Diary", "Locally bookmark places you visit and manage coordinates.");
    });

    navSettings.addEventListener("click", () => {
        setActiveScreen(navSettings, screenSettings, "System Settings", "Configure your AI keys, API integrations, and developer preferences.");
    });

    // --- Canvas Telemetry Chart Drawing ---
    function drawAnalyticsChart() {
        const canvas = document.getElementById("analytics-chart");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        const width = canvas.width;
        const height = canvas.height;

        // Grid lines
        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.lineWidth = 1;
        for (let i = 1; i <= 4; i++) {
            const y = (height / 5) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        if (savedLogs.length < 2) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
            ctx.font = "14px 'Outfit', sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("Need at least 2 logged spots to visualize elevation trends.", width / 2, height / 2);
            return;
        }

        // Parse Alts
        const dataPoints = savedLogs.map((log, index) => {
            return log.alt || (20 + (index * 12) % 40);
        });

        const minVal = Math.min(...dataPoints) * 0.9;
        const maxVal = Math.max(...dataPoints) * 1.1;
        const valRange = maxVal - minVal || 10;

        const getX = (index) => (width / (dataPoints.length - 1)) * index;
        const getY = (val) => height - 30 - ((val - minVal) / valRange) * (height - 60);

        // Fill area gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, "rgba(20, 184, 166, 0.25)");
        gradient.addColorStop(1, "rgba(20, 184, 166, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(getX(0), height);
        for (let i = 0; i < dataPoints.length; i++) {
            ctx.lineTo(getX(i), getY(dataPoints[i]));
        }
        ctx.lineTo(getX(dataPoints.length - 1), height);
        ctx.closePath();
        ctx.fill();

        // Stroke line
        ctx.strokeStyle = "#14b8a6";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(getX(0), getY(dataPoints[0]));
        for (let i = 1; i < dataPoints.length; i++) {
            ctx.lineTo(getX(i), getY(dataPoints[i]));
        }
        ctx.stroke();

        // Glowing dots
        for (let i = 0; i < dataPoints.length; i++) {
            const x = getX(i);
            const y = getY(dataPoints[i]);

            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = "#3b82f6";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.stroke();

            // Alt text label
            ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
            ctx.font = "10px monospace";
            ctx.textAlign = "center";
            ctx.fillText(`${dataPoints[i].toFixed(0)}m`, x, y - 10);
        }
    }

    // --- Chat Brain Logic ---
    chatForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const query = chatInput.value.trim();
        if (!query) return;

        addMessage("user", query);
        chatInput.value = "";

        const isSocialQuery = /open (insta|instagram|twitter|x|github|linkedin|leetcode|social|socials)/i.test(query);
        const queryLower = query.toLowerCase();

        if (isSocialQuery) {
            let targetLink = "";
            let platformName = "";

            if (queryLower.includes("insta")) {
                targetLink = socialLinks.instagram;
                platformName = "Instagram";
            } else if (queryLower.includes("twitter") || queryLower.includes("x")) {
                targetLink = socialLinks.twitter;
                platformName = "Twitter / X";
            } else if (queryLower.includes("github")) {
                targetLink = socialLinks.github;
                platformName = "GitHub";
            } else if (queryLower.includes("linkedin")) {
                targetLink = socialLinks.linkedin;
                platformName = "LinkedIn";
            } else if (queryLower.includes("leetcode")) {
                targetLink = socialLinks.leetcode || "https://leetcode.com";
                platformName = "LeetCode";
            }

            if (targetLink) {
                window.open(targetLink, "_blank");
                addMessage("assistant", `I have opened your **${platformName}** profile in a new tab.\n\nDirect link: <a href="${targetLink}" target="_blank" style="color:var(--accent-teal); font-weight:bold;">${targetLink}</a>`);
            } else {
                addMessage("assistant", `Here are your configured social media links:\n\n* **Instagram**: <a href="${socialLinks.instagram}" target="_blank">${socialLinks.instagram}</a>\n* **Twitter / X**: <a href="${socialLinks.twitter}" target="_blank">${socialLinks.twitter}</a>\n* **GitHub**: <a href="${socialLinks.github}" target="_blank">${socialLinks.github}</a>\n* **LinkedIn**: <a href="${socialLinks.linkedin}" target="_blank">${socialLinks.linkedin}</a>\n* **LeetCode**: <a href="${socialLinks.leetcode || 'https://leetcode.com'}" target="_blank">${socialLinks.leetcode || 'https://leetcode.com'}</a>`);
            }
            return;
        }

        const isLocationQuery = /where am i|my location|current location|coordinates|gps/i.test(query);

        if (isLocationQuery) {
            if (!currentCoords) {
                addMessage("assistant", "Attempting GPS lookup. Please ensure location permissions are granted.");
                return;
            }
            addMessage("assistant", `I have resolved your current location:\n\n**Latitude**: ${currentCoords.lat.toFixed(6)}\n**Longitude**: ${currentCoords.lng.toFixed(6)}\n**Address**: ${currentAddress}`);
            return;
        }

        addMessage("assistant", "Dharamveer AI is analyzing...");
        const statusIndex = chatMessages.children.length - 1;
        const statusMessage = chatMessages.children[statusIndex];

        try {
            const locationContext = currentCoords 
                ? `User location context: Latitude ${currentCoords.lat}, Longitude ${currentCoords.lng}, approximate address: ${currentAddress}. ` 
                : "";
            
            const socialContext = `User social links: Instagram: ${socialLinks.instagram}, Twitter: ${socialLinks.twitter}, GitHub: ${socialLinks.github}, LinkedIn: ${socialLinks.linkedin}, LeetCode: ${socialLinks.leetcode || 'https://leetcode.com'}. `;
            const userContext = `User's username: ${currentUser}. AI name: Dharamveer AI. `;

            const prompt = `${locationContext}${socialContext}${userContext}Answer the user's question: "${query}"`;

            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: prompt,
                    apiKey: geminiApiKey,
                    modelName: geminiModelName
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || data.error?.message || `HTTP status ${response.status}`);
            }

            if (data.candidates && data.candidates[0].content.parts[0].text) {
                let aiResponse = data.candidates[0].content.parts[0].text;
                statusMessage.remove();
                addMessage("assistant", aiResponse);
            } else {
                throw new Error("Invalid response format");
            }
        } catch (err) {
            console.error(err);
            statusMessage.remove();
            
            // Try offline fallback if backend has an issue
            let answer = getOfflineResponse(query);
            if (answer.includes("Offline Mode")) {
                addMessage("assistant", `Failed to contact Dharamveer AI. Technical details: ${err.message}`);
            } else {
                addMessage("assistant", answer);
            }
        }
    });

    function getOfflineResponse(query) {
        query = query.toLowerCase();
        
        if (query.includes("hello") || query.includes("hi ") || query.includes("hey")) {
            return `Greetings ${currentUser}! How can I help you today? You can ask me general questions, speak voice prompts, or open your socials.`;
        }
        if (query.includes("weather")) {
            if (valTempDetail.textContent !== "--°C") {
                return `The current local temperature at your coordinates is **${valTempDetail.textContent}** with a wind speed of **${valWindDetail.textContent}**.`;
            }
            return "I am unable to get weather info.";
        }
        if (query.includes("time")) {
            return `System Clock: **${new Date().toLocaleTimeString()}**.`;
        }
        if (query.includes("who are you") || query.includes("your name")) {
            return "I am Dharamveer AI, a speech-and-location augmented client assistant.";
        }

        return `You asked: "${query}".\n\nI am currently in **Offline Mode**. Since a Gemini API Key is not configured, I cannot process open-ended questions.\n\nTo unlock, please configure a Gemini API key in the **Settings** tab.`;
    }
});
