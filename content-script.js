const panelId = 'yt-calc-fixed-panel';

const YTDebug = {
    log(msg, data) {
        console.log(`[YT Playlist Calc Debug] ${msg}`, data !== undefined ? data : '');
    },
    checkProgressBar() {
        this.log("--- START PROGRESS BAR DIAGNOSTICS ---");
        const rows = YTParser.getPlaylistRows();
        if (rows.length > 0) {
            this.log("Row HTML for Video 1:\n", rows[0].outerHTML);
            
            if (rows.length >= 99) {
                this.log("Row HTML for Video 99:\n", rows[98].outerHTML);
            } else {
                this.log("Video 99 not found. Total rows:", rows.length);
            }
        } else {
            this.log("No rows found yet.");
        }
        this.log("--- END DIAGNOSTICS ---");
    }
};

const YTi18n = {
    strings: {},
    async init() {
        const stored = await chrome.storage.local.get('lang');
        let lang = stored.lang;
        if (!lang) {
            const nl = navigator.language.toLowerCase();
            if (nl.startsWith('tr')) lang = 'tr';
            else if (nl.startsWith('es')) lang = 'es';
            else lang = 'en';
        }
        try {
            const url = chrome.runtime.getURL(`ek/lang/${lang}/strings.json`);
            const response = await fetch(url);
            this.strings = await response.json();
        } catch (e) {
            const response = await fetch(chrome.runtime.getURL('ek/lang/en/strings.json'));
            this.strings = await response.json();
        }
    },
    t(key) {
        return this.strings[key] || key;
    },
    async updateLanguage(lang) {
        try {
            const url = chrome.runtime.getURL(`ek/lang/${lang}/strings.json`);
            const response = await fetch(url);
            this.strings = await response.json();

            // Update all tracked elements
            document.querySelectorAll('[data-i18n-key]').forEach(el => {
                const key = el.getAttribute('data-i18n-key');
                el.textContent = this.t(key);
            });

            // Re-run calculations for units (h, m, s)
            MainApp.update();
        } catch (e) {
            console.error("Language update failed:", e);
        }
    }
};

const YTParser = {
    parseTime(timeStr) {
        if (!timeStr) return 0;
        const parts = timeStr.trim().split(':').map(Number);
        if (parts.length === 3) return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
        if (parts.length === 2) return (parts[0] * 60) + parts[1];
        return parts[0] || 0;
    },
    getPlaylistRows() {
        let rows = Array.from(document.querySelectorAll('ytd-playlist-video-renderer, ytd-playlist-panel-video-renderer, ytd-rich-item-renderer'));
        
        // In SPA, old hidden pages might still be in DOM. Filter them out first.
        rows = rows.filter(row => this.isElementVisible(row));

        if (rows.length === 0) {
            const timeOverlays = document.querySelectorAll('ytd-thumbnail-overlay-time-status-renderer, yt-thumbnail-badge-view-model, badge-shape, .badge-shape-wiz__text, ytd-thumbnail-overlay-playback-status-renderer');
            const rowSet = new Set();
            timeOverlays.forEach(el => {
                let current = el;
                let levels = 0;
                while (current && current !== document.body && levels < 20) {
                    if (current.parentElement && (
                        current.parentElement.id === 'contents' || 
                        current.parentElement.classList.contains('contents') || 
                        current.parentElement.id === 'items' ||
                        current.parentElement.tagName.toLowerCase() === 'ytd-item-section-renderer' ||
                        current.parentElement.tagName.toLowerCase() === 'ytd-playlist-video-list-renderer'
                    )) {
                        rowSet.add(current);
                        break;
                    }
                    current = current.parentElement;
                    levels++;
                }
            });
            rows = Array.from(rowSet);
            YTDebug.log("getPlaylistRows() raw rowSet size:", rows.length);
        }

        const urlParams = new URLSearchParams(window.location.search);
        const currentListId = urlParams.get('list');

        let rejectedByVisibility = 0;
        let rejectedByShelf = 0;
        let rejectedByLink = 0;
        let rejectedByListId = 0;

        rows = rows.filter(row => {
            if (!this.isElementVisible(row)) { rejectedByVisibility++; return false; }
            
            const videoLink = row.querySelector('a[href*="/watch?v="], a[href*="/shorts/"]');
            if (!videoLink) { rejectedByLink++; return false; }

            if (currentListId && videoLink.href.includes('list=') && !videoLink.href.includes(`list=${currentListId}`)) {
                rejectedByListId++;
                return false;
            }

            return true;
        });

        YTDebug.log(`getPlaylistRows() after filtering: ${rows.length}. Rejected: invis=${rejectedByVisibility}, shelf=${rejectedByShelf}, link=${rejectedByLink}, listId=${rejectedByListId}`);
        return rows;
    },
    getVideoDuration(row) {
        const elements = row.querySelectorAll('span#text.ytd-thumbnail-overlay-time-status-renderer, .ytd-thumbnail-overlay-time-status-renderer #text, badge-shape, .badge-shape-wiz__text');
        for (let el of elements) {
            const text = el.textContent || '';
            const match = text.match(/\b(\d{1,2}:\d{2}(?::\d{2})?)\b/);
            if (match) {
                const duration = this.parseTime(match[1]);
                if (duration > 0) return duration;
            }
        }
        return 0;
    },
    isElementVisible(element) {
        if (!element) return false;
        return (
            element.offsetParent !== null ||
            (element.checkVisibility && element.checkVisibility({
                contentVisibilityAuto: true,
                opacityProperty: true,
                visibilityProperty: true,
            }))
        );
    },
    getTotalVideoCount() {
        const isWatchPage = location.href.includes('watch?v=');
        
        if (isWatchPage) {
            const watchPagePanelIndex = document.querySelector('ytd-watch-flexy .publisher-container .index-message-wrapper, ytd-playlist-panel-renderer .index-message-wrapper, ytd-watch-flexy .yt-playlist-panel-header-view-model-wiz__index');
            if (watchPagePanelIndex && watchPagePanelIndex.textContent) {
                const match = watchPagePanelIndex.textContent.match(/\/\s*(\d+)/);
                if (match) {
                    YTDebug.log("getTotalVideoCount() found count via watch page index:", match[1]);
                    return parseInt(match[1]);
                }
            }
        }

        const statsSelectors = [
            'ytd-playlist-sidebar-primary-info-renderer #stats',
            'ytd-playlist-header-renderer #stats',
            '.yt-pl-header-metadata-view-model-wiz__stat-row',
            '.metadata-stats yt-formatted-string',
            '#stats yt-formatted-string', 
            'ytd-playlist-byline-renderer #stats',
            '#playlist-header-copy #stats'
        ];

        for (const selector of statsSelectors) {
            const elements = document.querySelectorAll(selector);
            // Find the visible one
            const el = Array.from(elements).find(this.isElementVisible);

            if (el && el.textContent) {
                const text = el.textContent;
                // Improved regex to catch numbers reliably
                const match = text.match(/(\d[\d.,\s]*)/);
                if (match) {
                    const count = parseInt(match[1].replace(/[.,\s]/g, ''));
                    if (count > 0) {
                        YTDebug.log("getTotalVideoCount() found count via stats:", count, "selector:", selector);
                        return count;
                    }
                }
            }
        }

        const allSpans = document.querySelectorAll('span, yt-formatted-string');
        for (let span of allSpans) {
            if (!this.isElementVisible(span)) continue;
            const text = span.textContent;
            if (text.includes('video') || text.includes('videolar')) {
                const match = text.match(/(\d[\d.,\s]*)/);
                if (match) {
                    const count = parseInt(match[1].replace(/[.,\s]/g, ''));
                    if (count > 0) {
                        YTDebug.log("getTotalVideoCount() found count via fallback span:", count);
                        return count;
                    }
                }
            }
        }
        YTDebug.log("getTotalVideoCount() returning: 0");
        return 0;
    }
};

const YTTheme = {
    getBrightness(color) {
        if (!color || color === 'transparent') return 0;
        const rgb = color.match(/\d+/g);
        if (!rgb || rgb.length < 3) return 0;
        if (rgb.length === 4 && parseFloat(rgb[3]) === 0) return 0;
        return (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
    },
    getEffectiveBgColor(el) {
        let color = window.getComputedStyle(el).backgroundColor;
        let current = el;
        while (current && (color === 'rgba(0, 0, 0, 0)' || color === 'transparent')) {
            current = current.parentElement;
            if (current) color = window.getComputedStyle(current).backgroundColor;
            else break;
        }
        return color;
    },
    async updatePanelTheme(panel, target) {
        if (!panel) return;

        const settings = await chrome.storage.local.get('theme');
        if (settings.theme && settings.theme !== 'auto') {
            panel.classList.remove('light-theme', 'oled-theme');
            if (settings.theme === 'light') panel.classList.add('light-theme');
            if (settings.theme === 'oled') panel.classList.add('oled-theme');
            return;
        }

        const reference = target || panel.parentElement;
        if (!reference) return;

        const bgColor = this.getEffectiveBgColor(reference);
        const brightness = this.getBrightness(bgColor);

        if (brightness > 170) {
            panel.classList.add('light-theme');
        } else {
            panel.classList.remove('light-theme', 'oled-theme');
        }
    },

    async updatePlaylistPanelTheme(panel) {
        if (!panel) return;

        const settings = await chrome.storage.local.get('theme');
        if (settings.theme && settings.theme !== 'auto') {
            panel.classList.remove('light-theme', 'oled-theme');
            if (settings.theme === 'light') panel.classList.add('light-theme');
            if (settings.theme === 'oled') panel.classList.add('oled-theme');
            return;
        }

        const bgColor = this.getEffectiveBgColor(panel.parentElement);
        const brightness = this.getBrightness(bgColor);

        if (brightness > 170) {
            panel.classList.add('light-theme');
        } else {
            panel.classList.remove('light-theme', 'oled-theme');
        }
    }
};

const YTCalculator = {
    calculateTotal(min, max) {
        let totalSeconds = 0;
        let selectedCount = 0;
        const rows = YTParser.getPlaylistRows();

        const progressSelector = 'ytd-thumbnail-overlay-resume-playback-renderer, yt-thumbnail-overlay-resume-playback-view-model, #progress, #progress-bar, [class*="resume-playback"], [id*="resume-playback"], [class*="progress-bar"]';

        rows.forEach((row, index) => {
            const videoIndex = index + 1;
            const inRange = videoIndex >= min && videoIndex <= max;

            const checkbox = row.querySelector('.yt-calc-checkbox');
            if (checkbox) {
                checkbox.checked = inRange;
                if (inRange) {
                    let duration = YTParser.getVideoDuration(row);
                    
                    if (window._ytCalcResumeWhereLeftOff) {
                        const progressEl = row.querySelector(progressSelector);
                        if (progressEl) {
                            const styleWidth = progressEl.style.width || '';
                            const match = styleWidth.match(/([\d.]+)%/);
                            if (match) {
                                const percent = parseFloat(match[1]);
                                if (percent > 0 && percent <= 100) {
                                    duration = duration * (1 - (percent / 100));
                                }
                            }
                        }
                    }
                    
                    totalSeconds += duration;
                    selectedCount++;
                }
            }
        });
        return { totalSeconds, selectedCount };
    },
    formatDuration(s) {
        if (!s || s <= 0) return `0${YTi18n.t('s')}`;
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = Math.floor(s % 60);
        const res = [];
        if (h > 0) res.push(`${h}${YTi18n.t('h')}`);
        if (m > 0 || h > 0) res.push(`${m}${YTi18n.t('m')}`);
        res.push(`${sec}${YTi18n.t('s')}`);
        return res.join(' ');
    },
    calculatePlaylistDuration() {
        let totalSeconds = 0;
        const rows = YTParser.getPlaylistRows();
        rows.forEach(row => {
            const duration = YTParser.getVideoDuration(row);
            totalSeconds += duration;
        });
        return totalSeconds;
    },
    formatDurationShort(s) {
        if (!s || s <= 0) return '0s';
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = Math.floor(s % 60);
        if (h > 0) return `${h}h ${m}m`;
        if (m > 0) return `${m}m ${sec}s`;
        return `${sec}s`;
    }
};

const YTUI = {
    createElement(tag, attrs, children = []) {
        const el = document.createElement(tag);
        const finalAttrs = attrs || {};
        Object.entries(finalAttrs).forEach(([key, value]) => {
            if (key === 'className') el.className = value;
            else if (key === 'textContent') el.textContent = value;
            else if (key === 'style' && typeof value === 'object') Object.assign(el.style, value);
            else el.setAttribute(key, value);
        });
        children.forEach(child => {
            if (typeof child === 'string') el.appendChild(document.createTextNode(child));
            else if (child) el.appendChild(child);
        });
        return el;
    },
    createCheckbox(row) {
        if (row.querySelector('.yt-calc-checkbox')) return;
        const cb = this.createElement('input', { type: 'checkbox', className: 'yt-calc-checkbox', checked: true });
        cb.onclick = (e) => { e.stopPropagation(); MainApp.update(); };
        
        let container = row.querySelector('#index-container');
        if (container) {
            container.style.display = 'flex';
            container.style.alignItems = 'center';
            container.prepend(cb);
        } else {
            // New fallback for modern generic <div> rows
            const fallbackContainer = this.createElement('div', { className: 'yt-calc-checkbox-container', style: { display: 'flex', alignItems: 'center', padding: '0 8px', minWidth: '40px', justifyContent: 'center' }});
            fallbackContainer.appendChild(cb);
            row.style.display = 'flex';
            row.prepend(fallbackContainer);
        }
    }
};

const PlaylistPanelInfo = {
    infoId: 'yt-playlist-speed-info',

    async init() {
        const settings = await chrome.storage.local.get('playlistSpeedInfo');
        if (settings.playlistSpeedInfo === false) return;

        const isWatchPage = location.href.includes('watch?v=') && location.href.includes('list=');
        if (!isWatchPage) return;

        // Wait a bit for the playlist panel to load
        setTimeout(() => this.render(), 500);
        this.setupObserver();
    },

    findPlaylistHeaderContainer() {
        // Return the playlist panel renderer if present
        const playlistPanel = document.querySelector('ytd-playlist-panel-renderer, yt-playlist-panel-view-model, .yt-playlist-panel-view-model-wiz');
        if (playlistPanel) return playlistPanel;

        // Fallback: look for any playlist panel-like container
        const alt = document.querySelector('ytd-playlist-sidebar-renderer, #playlist-items, #items, .yt-playlist-panel-view-model-wiz__header');
        if (alt) return alt;

        // Debug logs to help diagnose
        console.log('PlaylistPanelInfo.findPlaylistHeaderContainer: no panel found. Counts:', {
            panels: document.querySelectorAll('ytd-playlist-panel-renderer').length,
            panelHeaders: document.querySelectorAll('ytd-playlist-panel-header-renderer').length,
            sidebarHeaders: document.querySelectorAll('ytd-playlist-sidebar-primary-info-renderer').length,
            playlistItems: document.querySelectorAll('ytd-playlist-panel-video-renderer, ytd-playlist-video-renderer').length
        });

        return null;
    },

    render() {
        const headerContainer = this.findPlaylistHeaderContainer();
        if (!headerContainer) {
            console.log('Playlist panel header not found');
            return;
        }

        console.log('PlaylistPanelInfo.render: headerContainer found', headerContainer);

        // Remove existing to avoid duplicates
        let infoContainer = document.getElementById(this.infoId);
        if (infoContainer && infoContainer.parentElement) {
            infoContainer.parentElement.removeChild(infoContainer);
            infoContainer = null;
        }

        infoContainer = document.createElement('div');
        infoContainer.id = this.infoId;
        infoContainer.className = 'yt-playlist-speed-info';

        const totalSeconds = YTCalculator.calculatePlaylistDuration();
        const speeds = [1, 1.5, 1.75, 2];

        infoContainer.textContent = '';
        speeds.forEach(speed => {
            const duration = YTCalculator.formatDurationShort(totalSeconds / speed);
            const label = speed === 1 ? '1x' : speed.toFixed(2) + 'x';
            
            const box = document.createElement('div');
            box.className = 'speed-info-box';
            
            const labelSpan = document.createElement('span');
            labelSpan.className = 'speed-label';
            labelSpan.textContent = label;
            
            const durationSpan = document.createElement('span');
            durationSpan.className = 'speed-duration';
            durationSpan.textContent = duration;
            
            box.appendChild(labelSpan);
            box.appendChild(durationSpan);
            
            infoContainer.appendChild(box);
        });

        // Force visible styling in case YouTube CSS hides it
        try {
            infoContainer.style.setProperty('display', 'flex', 'important');
            infoContainer.style.setProperty('flex-wrap', 'wrap', 'important');
            infoContainer.style.setProperty('gap', '6px', 'important');
            infoContainer.style.setProperty('width', '100%', 'important');
            infoContainer.style.setProperty('box-sizing', 'border-box', 'important');
            infoContainer.style.setProperty('z-index', '9999', 'important');
            infoContainer.style.setProperty('position', 'relative', 'important');
            infoContainer.style.setProperty('background', 'transparent', 'important');
            infoContainer.style.setProperty('color', 'var(--yt-spec-text-primary, #fff)', 'important');
        } catch (e) {
            // ignore if setProperty not allowed
        }

        // Prefer inserting before the items list if available, otherwise append to the panel
        const itemsEl = headerContainer.querySelector('#items, #contents, ytd-playlist-video-list-renderer, ytd-section-list-renderer, .yt-playlist-panel-view-model-wiz__video-list')
            || headerContainer.parentElement && headerContainer.parentElement.querySelector('#items, #contents, .yt-playlist-panel-view-model-wiz__video-list');

        if (itemsEl && itemsEl.parentElement) {
            itemsEl.parentElement.insertBefore(infoContainer, itemsEl);
            console.log('PlaylistPanelInfo: inserted before itemsEl');
        } else if (headerContainer.appendChild) {
            headerContainer.appendChild(infoContainer);
            console.log('PlaylistPanelInfo: appended to headerContainer');
        } else if (headerContainer.parentElement) {
            headerContainer.parentElement.appendChild(infoContainer);
            console.log('PlaylistPanelInfo: appended to parent');
        } else {
            document.body.appendChild(infoContainer);
            console.log('PlaylistPanelInfo: appended to body as last resort');
        }

        // Debug
        console.log('PlaylistPanelInfo: inserted infoContainer, totalSeconds=', totalSeconds);

        // Update theme
        YTTheme.updatePlaylistPanelTheme(infoContainer);
    },

    setupObserver() {
        const observer = new MutationObserver((mutations) => {
            const hasVideoChanges = mutations.some(m =>
                Array.from(m.addedNodes).some(node =>
                    node.nodeType === 1 && node.querySelector && (
                        node.matches('ytd-playlist-panel-video-renderer, yt-playlist-panel-video-view-model, .yt-playlist-panel-video-view-model-wiz') || 
                        node.querySelector('ytd-playlist-panel-video-renderer, yt-playlist-panel-video-view-model, .yt-playlist-panel-video-view-model-wiz')
                    )
                )
            );
            if (hasVideoChanges) {
                setTimeout(() => this.render(), 300);
            }
        });

        const targetNode = document.querySelector('ytd-page-manager') || document.body;
        if (targetNode) {
            observer.observe(targetNode, { childList: true, subtree: true });
        }
    }
};

const MainApp = {
    isFirstScan: true,
    lastPlaylistId: '',
    lastPageType: '',

    async init() {
        const urlParams = new URLSearchParams(window.location.search);
        const currentListId = urlParams.get('list');
        const isPlaylist = location.href.includes('list=');
        const isWatchPage = location.href.includes('watch?v=');
        const currentPageType = isWatchPage ? 'watch' : (isPlaylist ? 'playlist' : 'other');

        if (!isPlaylist && !isWatchPage) return;

        // Reset state only on different playlist OR when transitioning between watch/playlist modes
        if (this.lastPlaylistId !== currentListId || this.lastPageType !== currentPageType) {
            this.isFirstScan = true;
            this.lastPlaylistId = currentListId;
            this.lastPageType = currentPageType;
            this.lastVideoCount = 0;
            this.noGrowthCounter = 0;
            const existingPanel = document.getElementById(panelId);
            if (existingPanel) existingPanel.remove();
        }

        if (!YTi18n.strings.header) await YTi18n.init();

        if (isWatchPage && isPlaylist) {
            PlaylistPanelInfo.init();
        }

        const target = this.findTarget();
        if (!target) {
            if (location.href.includes('list=') || location.href.includes('watch?v=')) {
                this.retryCount = (this.retryCount || 0) + 1;
                if (this.retryCount < 20) {
                    setTimeout(() => this.init(), 1000);
                }
            }
            return;
        }

        this.retryCount = 0;

        // Create or ensure the panel is there
        this.ensurePanel(target);

        if (this.isFirstScan) {
            this.isFirstScan = false;
            [500, 2000, 5000, 8000].forEach(ms => setTimeout(() => {
                this.scan();
                if (ms === 5000) YTDebug.checkProgressBar();
            }, ms));
            this.setupScrollObserver();
        } else {
            // Ensure we scan again if navigating within the same playlist
            setTimeout(() => {
                this.scan();
                YTDebug.checkProgressBar();
            }, 500);
        }

        const panel = document.getElementById(panelId);
        if (panel) YTTheme.updatePanelTheme(panel, target);

        [500, 2000, 5000, 8000].forEach(ms => setTimeout(() => this.scan(), ms));

        this.setupScrollObserver();

        // Ensure auto-scroll keeps working if the observer doesn't catch everything
        if (this.scrollInterval) clearInterval(this.scrollInterval);
        this.scrollInterval = setInterval(() => {
            const total = YTParser.getTotalVideoCount();
            const current = YTParser.getPlaylistRows().length;

            const panel = document.getElementById(panelId);
            const loader = document.getElementById('calc-loading-status');

            // Periodically ensure the panel hasn't been nuked by YouTube's DOM updates
            this.ensurePanel();

            chrome.storage.local.get(['autoscroll', 'resumeWhereLeftOff'], (data) => {
                window._ytCalcResumeWhereLeftOff = data.resumeWhereLeftOff === true;
                const autoScrollEnabled = data.autoscroll !== false;
                const resumeWhereLeftOff = data.resumeWhereLeftOff === true;

                const hasNewVideos = current > (this.lastVideoCount || 0);

                if (hasNewVideos) {
                    this.lastVideoCount = current;
                    this.noGrowthCounter = 0;
                    // Failsafe: if new videos are found but observer missed them, trigger scan
                    this.scan();
                } else if (current > 0 && current < total && total > 100) {
                    this.noGrowthCounter = (this.noGrowthCounter || 0) + 1;
                }

                // If no new videos found for 3 consecutive checks (6 seconds), stop loading
                const isStuck = this.noGrowthCounter >= 3;

                if (total > current && total > 100 && autoScrollEnabled && !isStuck) {
                    if (panel) panel.style.opacity = '0.7';
                    if (loader) {
                        loader.style.display = 'block';
                        loader.textContent = `${YTi18n.t('loading')}... (${current}/${total})`;
                    }
                    this.autoScroll();
                } else if ((total > 0 && current >= total) || isStuck) {
                    clearInterval(this.scrollInterval);
                    this.scrollInterval = null;
                    if (panel) {
                        panel.style.opacity = '1';
                        panel.classList.add('calc-ready');
                    }
                    if (loader) loader.style.display = 'none';

                    const rows = YTParser.getPlaylistRows();
                    const progressSelector = 'ytd-thumbnail-overlay-resume-playback-renderer, yt-thumbnail-overlay-resume-playback-view-model, #progress, #progress-bar, [class*="resume-playback"], [id*="resume-playback"], [class*="progress-bar"]';
                    
                    let lastWatchedRow = null;
                    let lastWatchedIndex = -1;

                    for (let i = rows.length - 1; i >= 0; i--) {
                        if (rows[i].querySelector(progressSelector)) {
                            lastWatchedRow = rows[i];
                            lastWatchedIndex = i + 1;
                            break;
                        }
                    }

                    // Scroll back to top only if we actually did some scrolling
                    if (autoScrollEnabled && !isStuck) {
                        if (resumeWhereLeftOff) {
                            if (lastWatchedRow) {
                                lastWatchedRow.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            } else {
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                        } else {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                    }
                }
            });
        }, 2000);

        // Listen for internal setting changes
        if (!this.hasStorageListener) {
            chrome.storage.onChanged.addListener((changes) => {
                if (changes.lang) {
                    YTi18n.updateLanguage(changes.lang.newValue);
                }
                if (changes.theme) {
                    const panel = document.getElementById(panelId);
                    YTTheme.updatePanelTheme(panel);
                    const playlistInfo = document.getElementById(PlaylistPanelInfo.infoId);
                    if (playlistInfo) YTTheme.updatePlaylistPanelTheme(playlistInfo);
                }
                if (changes.playlistSpeedInfo !== undefined) {
                    if (changes.playlistSpeedInfo.newValue === false) {
                        const playlistInfo = document.getElementById(PlaylistPanelInfo.infoId);
                        if (playlistInfo) playlistInfo.remove();
                    } else {
                        PlaylistPanelInfo.render();
                    }
                }
                if (changes.resumeWhereLeftOff !== undefined) {
                    window._ytCalcResumeWhereLeftOff = changes.resumeWhereLeftOff.newValue === true;
                    MainApp.applyResumeSettings();
                }
            });
            this.hasStorageListener = true;
        }
    },

    findTarget() {
        const selectors = [
            'yt-flexible-actions-view-model',
            'yt-page-header-view-model',
            '.yt-page-header-view-model__page-header-content',
            '.metadata-action-bar',
            '.yt-flexible-actions-view-model-wiz__action-row',
            'ytd-playlist-header-renderer #stats',
            'ytd-playlist-sidebar-primary-info-renderer #stats',
            'ytd-playlist-sidebar-renderer #items',
            'ytd-playlist-header-renderer .metadata-action-bar',
            'ytd-playlist-header-renderer #playlist-header-copy'
        ];

        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            const visibleEl = Array.from(elements).find(el => YTParser.isElementVisible(el));
            if (visibleEl) {
                YTDebug.log("findTarget() found visible target with selector:", selector);
                return visibleEl;
            }
        }
        YTDebug.log("findTarget() failed to find any target.");
        return null;
    },

    ensurePanel(targetHint) {
        let panel = document.getElementById(panelId);
        const target = targetHint || this.findTarget();
        if (!target) return;

        if (!panel) {
            this.renderPanel(target);
        } else {
            // Check if it's still attached to the correct place
            if (panel.parentNode !== target.parentNode) {
                target.parentNode.insertBefore(panel, target.nextSibling);
            }
        }
    },

    autoScroll() {
        const total = YTParser.getTotalVideoCount();
        const current = YTParser.getPlaylistRows().length;

        if (total > current && total > 100) {
            // Ensure window scroll fires for playlist pages
            window.scrollTo(0, document.body.scrollHeight || document.documentElement.scrollHeight);
            window.dispatchEvent(new Event('scroll'));

            // Scroll ytd-app just in case
            const app = document.querySelector('ytd-app');
            if (app) app.scrollTop = app.scrollHeight;

            // Scroll the specific playlist container if it exists and is visible (for watch page)
            const playlistItems = document.querySelector('#playlist-items, #items.ytd-playlist-panel-renderer');
            if (playlistItems && YTParser.isElementVisible(playlistItems)) {
                playlistItems.scrollTop = playlistItems.scrollHeight;
            }
        }
    },

    applyResumeSettings() {
        chrome.storage.local.get(['resumeWhereLeftOff'], (data) => {
            const rows = YTParser.getPlaylistRows();
            let lastWatchedRow = null;
            let lastWatchedIndex = -1;
            
            const progressSelector = 'ytd-thumbnail-overlay-resume-playback-renderer, yt-thumbnail-overlay-resume-playback-view-model, #progress, #progress-bar, [class*="resume-playback"], [id*="resume-playback"], [class*="progress-bar"]';

            for (let i = rows.length - 1; i >= 0; i--) {
                if (rows[i].querySelector(progressSelector)) {
                    lastWatchedRow = rows[i];
                    lastWatchedIndex = i + 1;
                    break;
                }
            }

            if (data.resumeWhereLeftOff && lastWatchedRow) {
                lastWatchedRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    },

    renderPanel(target) {
        const panel = YTUI.createElement('div', { id: panelId }, [
            YTUI.createElement('div', {
                id: 'calc-loading-status', style: {
                    background: 'rgba(62, 166, 255, 0.1)',
                    color: '#3ea6ff',
                    padding: '8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    marginBottom: '10px',
                    textAlign: 'center',
                    display: 'none',
                    fontWeight: 'bold'
                }
            }),
            YTUI.createElement('div', { className: 'calc-header', textContent: YTi18n.t('header'), 'data-i18n-key': 'header' }),
            this.createStatRow('selected', 'calc-count'),
            this.createStatRow('videosCounted', 'calc-loaded-count', { fontSize: '11px', opacity: '0.8' }),
            this.createStatRow('videosNotCounted', 'calc-not-loaded-count', { fontSize: '11px', opacity: '0.8', marginBottom: '12px' }),
            this.createStatRow('duration1x', 'calc-1x'),
            this.createStatRow('duration15x', 'calc-15x'),
            this.createStatRow('duration2x', 'calc-2x', { color: '#ff4e45', fontWeight: 'bold' }),

            // 1. Range Slider Container
            YTUI.createElement('div', { className: 'slider-container' }, [
                YTUI.createElement('div', { className: 'slider-header' }, [
                    YTUI.createElement('span', { textContent: YTi18n.t('rangeSelection'), 'data-i18n-key': 'rangeSelection' }),
                    YTUI.createElement('strong', { id: 'range-display', textContent: '-' })
                ]),
                YTUI.createElement('div', { className: 'dual-slider-wrapper' }, [
                    YTUI.createElement('input', { type: 'range', id: 'range-1', min: '1', value: '1', className: 'dual-range' }),
                    YTUI.createElement('input', { type: 'range', id: 'range-2', min: '1', value: '1', className: 'dual-range' })
                ]),
                YTUI.createElement('div', { className: 'range-input-row' }, [
                    YTUI.createElement('div', { className: 'input-box' }, [
                        YTUI.createElement('span', { textContent: YTi18n.t('start'), 'data-i18n-key': 'start' }),
                        YTUI.createElement('input', { type: 'number', id: 'range-input-1', value: '1', className: 'range-number-input' })
                    ]),
                    YTUI.createElement('div', { className: 'input-box' }, [
                        YTUI.createElement('span', { textContent: YTi18n.t('end'), 'data-i18n-key': 'end' }),
                        YTUI.createElement('input', { type: 'number', id: 'range-input-2', value: '1', className: 'range-number-input' })
                    ])
                ])
            ]),

            // 2. Speed Slider Row
            YTUI.createElement('div', { className: 'slider-container speed-container' }, [
                YTUI.createElement('div', { className: 'slider-header' }, [
                    YTUI.createElement('span', { textContent: YTi18n.t('customSpeed'), 'data-i18n-key': 'customSpeed' }),
                    YTUI.createElement('strong', { id: 'speed-display', textContent: '1.00x' })
                ]),
                YTUI.createElement('div', { className: 'speed-slider-wrapper' }, [
                    YTUI.createElement('input', {
                        type: 'range',
                        id: 'speed-slider',
                        min: '0.25',
                        max: '4',
                        step: '0.05',
                        value: '1.00',
                        className: 'single-range'
                    })
                ]),
                this.createStatRow('customDuration', 'calc-speed', { marginTop: '10px', borderTop: '1px solid var(--calc-border)', paddingTop: '8px' })
            ])
        ]);

        if (target.parentNode) {
            target.parentNode.insertBefore(panel, target.nextSibling);
        }
        this.attachEvents();
    },

    createStatRow(key, id, style = {}) {
        return YTUI.createElement('div', { className: 'stat-row', style: style }, [
            YTUI.createElement('span', { textContent: YTi18n.t(key), 'data-i18n-key': key }),
            YTUI.createElement('strong', { id: id, textContent: '-' })
        ]);
    },

    attachEvents() {
        const r1 = document.getElementById('range-1');
        const r2 = document.getElementById('range-2');
        const i1 = document.getElementById('range-input-1');
        const i2 = document.getElementById('range-input-2');
        const speedSlider = document.getElementById('speed-slider');

        if (!r1 || !r2 || !i1 || !i2 || !speedSlider) return;

        [i1, i2].forEach(input => {
            input.addEventListener('focus', () => input.select());
            input.addEventListener('click', () => input.select());
        });

        const syncAll = (source) => {
            let v1 = parseInt(r1.value);
            let v2 = parseInt(r2.value);
            if (source === 'r1' && v1 > v2) { r1.value = v2; v1 = v2; }
            else if (source === 'r2' && v2 < v1) { r2.value = v1; v2 = v1; }
            i1.value = v1; i2.value = v2;
            this.update();
        };

        const syncFromInput = (input, isStart) => {
            let val = parseInt(input.value) || 1;
            const maxVal = parseInt(r1.max) || 100;
            if (val < 1) val = 1;
            if (val > maxVal) val = maxVal;
            if (isStart) { if (val > parseInt(r2.value)) val = parseInt(r2.value); r1.value = val; }
            else { if (val < parseInt(r1.value)) val = parseInt(r1.value); r2.value = val; }
            input.value = val;
            this.update();
        };

        r1.oninput = () => syncAll('r1');
        r2.oninput = () => syncAll('r2');
        i1.onblur = () => syncFromInput(i1, true);
        i2.onblur = () => syncFromInput(i2, false);
        i1.onkeypress = (e) => { if (e.key === 'Enter') syncFromInput(i1, true); };
        i2.onkeypress = (e) => { if (e.key === 'Enter') syncFromInput(i2, false); };
        speedSlider.oninput = () => this.update();
    },

    scan() {
        YTDebug.log("MainApp.scan() called.");
        this.ensurePanel();
        const rows = YTParser.getPlaylistRows();
        const r1 = document.getElementById('range-1');
        const r2 = document.getElementById('range-2');
        const i1 = document.getElementById('range-input-1');
        const i2 = document.getElementById('range-input-2');

        if (rows.length > 0 && r1 && r2 && i2) {
            const count = rows.length;
            const currentMax = parseInt(r2.max);
            const isInitial = isNaN(currentMax) || currentMax <= 1;
            const wasAtMax = parseInt(r2.value) === currentMax || isInitial;

            r1.max = r2.max = count;
            i1.max = i2.max = count;

            if (wasAtMax) {
                r2.value = i2.value = count;
            }
        }
        rows.forEach(row => YTUI.createCheckbox(row));

        // Trigger auto-scroll if needed
        this.autoScroll();

        const panel = document.getElementById(panelId);
        const target = this.findTarget();

        if (panel && target) {
            YTTheme.updatePanelTheme(panel, target);
        }

        this.update();
    },

    update() {
        const r1 = document.getElementById('range-1');
        const r2 = document.getElementById('range-2');
        const speedSlider = document.getElementById('speed-slider');
        if (!r1 || !r2 || !speedSlider) return;

        const v1 = parseInt(r1.value);
        const v2 = parseInt(r2.value);
        const speed = parseFloat(speedSlider.value);
        const stats = YTCalculator.calculateTotal(Math.min(v1, v2), Math.max(v1, v2));

        const current = YTParser.getPlaylistRows().length;
        const total = YTParser.getTotalVideoCount();
        const notLoaded = Math.max(0, total - current);

        const displays = {
            'calc-count': stats.selectedCount + ' ' + YTi18n.t('video'),
            'calc-loaded-count': current + ' / ' + total,
            'calc-not-loaded-count': notLoaded > 0 ? notLoaded + ' ' + YTi18n.t('loading') + '...' : '0',
            'calc-1x': YTCalculator.formatDuration(stats.totalSeconds),
            'calc-15x': YTCalculator.formatDuration(stats.totalSeconds / 1.5),
            'calc-2x': YTCalculator.formatDuration(stats.totalSeconds / 2),
            'calc-speed': YTCalculator.formatDuration(stats.totalSeconds / speed),
            'speed-display': speed.toFixed(2) + 'x',
            'range-display': `${Math.min(v1, v2)} - ${Math.max(v1, v2)}`
        };

        Object.entries(displays).forEach(([id, val]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        });
    },

    setupScrollObserver() {
        const observer = new MutationObserver((mutations) => {
            const hasNewRows = mutations.some(m =>
                Array.from(m.addedNodes).some(node =>
                    node.nodeType === 1 && (
                        node.matches('ytd-playlist-video-renderer, ytd-playlist-panel-video-renderer, ytd-thumbnail') || 
                        node.querySelector('ytd-playlist-video-renderer, ytd-playlist-panel-video-renderer, ytd-thumbnail')
                    )
                )
            );
            if (hasNewRows) this.scan();
        });

        const targetNode = document.querySelector('ytd-page-manager') || document.body;
        if (targetNode) {
            observer.observe(targetNode, { childList: true, subtree: true });
        }
    }
};

const VideoSpeedInfo = {
    currentVideo: null,

    init() {
        this.setupObserver();
        const video = document.querySelector('video.html5-main-video');
        if (video) this.attachToVideo(video);
    },

    setupObserver() {
        if (this.observer) return;
        this.observer = new MutationObserver(() => {
            const video = document.querySelector('video.html5-main-video');
            if (video && video !== this.currentVideo) {
                this.attachToVideo(video);
            }
        });
        
        const playerContainer = document.getElementById('movie_player') || document.body;
        this.observer.observe(playerContainer, { childList: true, subtree: true });
    },

    attachToVideo(video) {
        if (this.currentVideo === video) return;
        this.currentVideo = video;
        
        const updateFn = () => this.updateDisplay();
        
        video.addEventListener('ratechange', updateFn);
        video.addEventListener('timeupdate', updateFn);
        video.addEventListener('loadedmetadata', updateFn);
        
        this.updateDisplay();
    },

    updateDisplay() {
        if (!this.currentVideo) return;
        const video = this.currentVideo;
        const speed = video.playbackRate;
        
        let container = document.getElementById('yt-speed-remaining-time');
        
        if (!container) {
            const timeDisplay = document.querySelector('.ytp-time-display:not(.ytp-live)');
            if (timeDisplay) {
                // timeDisplay is typically a flex or block container. We insert the pill directly inside.
                container = YTUI.createElement('span', {
                    id: 'yt-speed-remaining-time',
                    style: {
                        marginLeft: '8px',
                        color: '#fff',
                        backgroundColor: 'rgba(3, 0, 0, 0.3)', // Matches YouTube's semi-transparent badges ("Bu videoda" etc).
                        padding: '12px 8px',
                        borderRadius: '20px', // Fully rounded pill
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'none',
                        verticalAlign: 'middle',
                        position: 'relative',
                        top: '-16px', // Nudge up to align better with text
                        cursor: 'default',
                        whiteSpace: 'nowrap',
                        lineHeight: 'normal'
                    }
                });
                timeDisplay.appendChild(container);
            } else {
                return;
            }
        }
        
        if (speed === 1) {
            container.style.display = 'none';
            return;
        }
        
        container.style.display = 'inline-block';
        
        const remainingSeconds = (video.duration - video.currentTime) / speed;
        if (isNaN(remainingSeconds) || !isFinite(remainingSeconds) || remainingSeconds < 0) {
            container.textContent = '';
            return;
        }
        
        // Custom colon formatter to display 1:02 instead of 1m 2s
        const formatColon = (s) => {
            if (!s || s <= 0) return '0:00';
            const h = Math.floor(s / 3600);
            const m = Math.floor((s % 3600) / 60);
            const sec = Math.floor(s % 60);
            const pad = (num) => num.toString().padStart(2, '0');
            if (h > 0) return `${h}:${pad(m)}:${pad(sec)}`;
            return `${m}:${pad(sec)}`;
        };
        
        const formatted = formatColon(remainingSeconds);
        const prefix = YTi18n.t('remainingTime') || 'Remaining';
        // E.g. "1.5x Kalan: 30:40"
        container.textContent = `${speed}x ${prefix}: ${formatted}`;
    }
};

document.addEventListener('yt-navigate-finish', () => {
    MainApp.init();
    if (location.href.includes('watch?v=')) {
        if (location.href.includes('list=')) PlaylistPanelInfo.init();
        VideoSpeedInfo.init();
    }
});
if (location.href.includes('list=')) {
    MainApp.init();
}
if (location.href.includes('watch?v=')) {
    if (location.href.includes('list=')) PlaylistPanelInfo.init();
    VideoSpeedInfo.init();
}