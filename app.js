/**
 * Telly - webOS IPTV Player
 */

(function() {
    'use strict';

    // State
    let channels = [];
    let filteredChannels = [];
    let currentFocusIndex = 0;
    let focusableElements = [];
    let currentScreen = 'settings';

    // DOM Elements
    const screens = {
        settings: document.getElementById('settings-screen'),
        channels: document.getElementById('channels-screen'),
        player: document.getElementById('player-screen')
    };

    const m3uUrlInput = document.getElementById('m3u-url');
    const saveBtn = document.getElementById('save-btn');
    const searchBox = document.getElementById('search-box');
    const settingsBtn = document.getElementById('settings-btn');
    const channelGrid = document.getElementById('channel-grid');
    const videoPlayer = document.getElementById('video-player');
    const playerChannelName = document.getElementById('player-channel-name');
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const settingsError = document.getElementById('settings-error');

    // Initialize
    function init() {
        // Load saved URL
        const savedUrl = localStorage.getItem('telly_m3u_url');
        if (savedUrl) {
            m3uUrlInput.value = savedUrl;
            loadM3U(savedUrl);
        }

        // Event listeners
        saveBtn.addEventListener('click', onSaveClick);
        settingsBtn.addEventListener('click', showSettings);
        searchBox.addEventListener('input', onSearchInput);

        // Keyboard/Remote navigation
        document.addEventListener('keydown', onKeyDown);

        // Initialize focus
        updateFocusableElements();
        updateFocus();
    }

    // Screen management
    function showScreen(screenName) {
        Object.values(screens).forEach(s => s.classList.remove('active'));
        screens[screenName].classList.add('active');
        currentScreen = screenName;
        updateFocusableElements();
        updateFocus();
    }

    function showSettings() {
        videoPlayer.pause();
        videoPlayer.src = '';
        showScreen('settings');
    }

    // M3U Loading
    async function loadM3U(url) {
        showScreen('channels');
        loading.classList.remove('hidden');
        error.classList.add('hidden');
        channelGrid.innerHTML = '';

        try {
            const response = await fetch(url, {
                headers: { 'User-Agent': 'Telly/1.0' }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const text = await response.text();
            channels = parseM3U(text);
            filteredChannels = [...channels];
            renderChannels();
            
        } catch (err) {
            error.textContent = `Failed to load: ${err.message}`;
            error.classList.remove('hidden');
        } finally {
            loading.classList.add('hidden');
        }
    }

    function onSaveClick() {
        const url = m3uUrlInput.value.trim();
        if (!url) {
            settingsError.textContent = 'Please enter a URL';
            return;
        }
        
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            settingsError.textContent = 'URL must start with http:// or https://';
            return;
        }

        settingsError.textContent = '';
        localStorage.setItem('telly_m3u_url', url);
        loadM3U(url);
    }

    // M3U Parser
    function parseM3U(text) {
        const lines = text.split('\n');
        const parsed = [];
        let current = null;

        for (const line of lines) {
            const trimmed = line.trim();
            
            if (trimmed.startsWith('#EXTINF:')) {
                current = {};
                // Parse attributes
                const nameMatch = trimmed.match(/,(.+)$/);
                if (nameMatch) {
                    current.name = nameMatch[1].trim();
                }
                
                const groupMatch = trimmed.match(/group-title="([^"]+)"/);
                if (groupMatch) {
                    current.group = groupMatch[1];
                }
                
                const logoMatch = trimmed.match(/tvg-logo="([^"]+)"/);
                if (logoMatch) {
                    current.logo = logoMatch[1];
                }
            } else if (trimmed && !trimmed.startsWith('#') && current) {
                current.url = trimmed;
                parsed.push(current);
                current = null;
            }
        }

        return parsed;
    }

    // Channel Grid
    function renderChannels() {
        channelGrid.innerHTML = '';
        
        if (filteredChannels.length === 0) {
            channelGrid.innerHTML = '<div class="no-results">No channels found</div>';
            return;
        }

        filteredChannels.forEach((channel, index) => {
            const btn = document.createElement('button');
            btn.className = 'channel-btn focusable';
            btn.dataset.index = index;
            
            const name = document.createElement('div');
            name.className = 'channel-name';
            name.textContent = channel.name || 'Unknown Channel';
            
            const group = document.createElement('div');
            group.className = 'channel-group';
            group.textContent = channel.group || '';
            
            btn.appendChild(name);
            if (channel.group) {
                btn.appendChild(group);
            }
            
            btn.addEventListener('click', () => playChannel(channel));
            channelGrid.appendChild(btn);
        });

        updateFocusableElements();
        currentFocusIndex = 0;
        updateFocus();
    }

    function onSearchInput(e) {
        const query = e.target.value.toLowerCase();
        filteredChannels = channels.filter(ch => 
            (ch.name || '').toLowerCase().includes(query) ||
            (ch.group || '').toLowerCase().includes(query)
        );
        renderChannels();
    }

    // Video Player
    function playChannel(channel) {
        playerChannelName.textContent = channel.name || 'Unknown';
        videoPlayer.src = channel.url;
        videoPlayer.play().catch(err => {
            console.error('Playback failed:', err);
        });
        showScreen('player');
        
        // Hide player info after 3 seconds
        setTimeout(() => {
            playerChannelName.parentElement.classList.add('fade-out');
        }, 3000);
    }

    // TV Remote Navigation
    function onKeyDown(e) {
        const key = e.key;
        
        // Player screen - BACK returns to channels
        if (currentScreen === 'player') {
            if (key === 'Back' || key === 'Escape' || key === 'Backspace') {
                e.preventDefault();
                videoPlayer.pause();
                videoPlayer.src = '';
                showScreen('channels');
                return;
            }
            return;
        }

        // Grid navigation for channels screen
        if (currentScreen === 'channels' && focusableElements.length > 0) {
            const cols = getGridColumns();
            
            switch(key) {
                case 'ArrowRight':
                    e.preventDefault();
                    if (currentFocusIndex < focusableElements.length - 1) {
                        currentFocusIndex++;
                        updateFocus();
                    }
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    if (currentFocusIndex > 0) {
                        currentFocusIndex--;
                        updateFocus();
                    }
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    if (currentFocusIndex + cols < focusableElements.length) {
                        currentFocusIndex += cols;
                        updateFocus();
                    }
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    if (currentFocusIndex - cols >= 0) {
                        currentFocusIndex -= cols;
                    } else if (currentFocusIndex > 0) {
                        // Jump to search box if at top
                        currentFocusIndex = 0;
                    }
                    updateFocus();
                    break;
                case 'Enter':
                    e.preventDefault();
                    focusableElements[currentFocusIndex].click();
                    break;
                case 'Back':
                case 'Escape':
                    if (currentScreen === 'channels') {
                        // Do nothing or go to settings
                    }
                    break;
            }
        } else if (currentScreen === 'settings') {
            // Settings screen navigation
            switch(key) {
                case 'ArrowDown':
                case 'ArrowRight':
                    e.preventDefault();
                    currentFocusIndex = (currentFocusIndex + 1) % focusableElements.length;
                    updateFocus();
                    break;
                case 'ArrowUp':
                case 'ArrowLeft':
                    e.preventDefault();
                    currentFocusIndex = (currentFocusIndex - 1 + focusableElements.length) % focusableElements.length;
                    updateFocus();
                    break;
                case 'Enter':
                    e.preventDefault();
                    focusableElements[currentFocusIndex].click();
                    break;
            }
        }
    }

    function getGridColumns() {
        const width = window.innerWidth;
        if (width >= 1920) return 6;
        if (width >= 1280) return 5;
        if (width >= 960) return 4;
        if (width >= 640) return 3;
        return 2;
    }

    function updateFocusableElements() {
        const activeScreen = screens[currentScreen];
        focusableElements = Array.from(activeScreen.querySelectorAll('.focusable'));
    }

    function updateFocus() {
        focusableElements.forEach((el, i) => {
            el.classList.toggle('focused', i === currentFocusIndex);
        });
        
        if (focusableElements[currentFocusIndex]) {
            focusableElements[currentFocusIndex].scrollIntoView({ block: 'nearest' });
        }
    }

    // Start
    init();
})();
