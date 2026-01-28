const panelId = 'yt-calc-fixed-panel';

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
        return document.querySelectorAll('ytd-playlist-video-renderer, ytd-playlist-panel-video-renderer');
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
                    if (count > 0) return count;
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
                    if (count > 0) return count;
                }
            }
        }
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
    }
};

const YTCalculator = {
    calculateTotal(min, max) {
        let totalSeconds = 0;
        let selectedCount = 0;
        const rows = YTParser.getPlaylistRows();

        rows.forEach((row, index) => {
            const videoIndex = index + 1;
            const inRange = videoIndex >= min && videoIndex <= max;

            const checkbox = row.querySelector('.yt-calc-checkbox');
            if (checkbox) {
                checkbox.checked = inRange;
                if (inRange) {
                    const timeEl = row.querySelector('span#text.ytd-thumbnail-overlay-time-status-renderer') ||
                        row.querySelector('.ytd-thumbnail-overlay-time-status-renderer #text');
                    const duration = YTParser.parseTime(timeEl?.textContent || '0:00');
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
        const container = row.querySelector('#index-container') || row.querySelector('#content');
        if (container) {
            container.style.display = 'flex';
            container.style.alignItems = 'center';
            container.prepend(cb);
        }
    }
};

const MainApp = {
    isFirstScan: true,

    async init() {
        // Fix 1: Explicitly check URL to prevent appearing on profile or other pages
        const isPlaylist = location.href.includes('list=');
        const isWatchPage = location.href.includes('watch?v=');

        if (!isPlaylist && !isWatchPage) {
            const existingPanel = document.getElementById(panelId);
            if (existingPanel) existingPanel.remove();
            return;
        }

        if (!YTi18n.strings.header) await YTi18n.init();

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

            chrome.storage.local.get('autoscroll', (data) => {
                const autoScrollEnabled = data.autoscroll !== false;

                // Fix 2: Prevent infinite loop when hidden/private videos exist
                const hasNewVideos = current > (this.lastVideoCount || 0);
                if (hasNewVideos) {
                    this.lastVideoCount = current;
                    this.noGrowthCounter = 0;
                } else {
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

                    // Scroll back to top only if we actually did some scrolling
                    if (autoScrollEnabled && !isStuck) window.scrollTo({ top: 0, behavior: 'smooth' });
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
                }
            });
            this.hasStorageListener = true;
        }
    },

    findTarget() {
        const selectors = [
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
            if (visibleEl) return visibleEl;
        }
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
            // Scroll the main window container
            const windowScroll = document.scrollingElement || document.documentElement;
            if (windowScroll) {
                windowScroll.scrollTop = windowScroll.scrollHeight;
            }

            // Scroll the specific playlist container if it exists (for watch page)
            const playlistItems = document.querySelector('#playlist-items, #items.ytd-playlist-panel-renderer');
            if (playlistItems) {
                playlistItems.scrollTop = playlistItems.scrollHeight;
            }
        }
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
        i1.oninput = () => syncFromInput(i1, true);
        i2.oninput = () => syncFromInput(i2, false);
        speedSlider.oninput = () => this.update();
    },

    scan() {
        this.ensurePanel();
        const rows = YTParser.getPlaylistRows();
        const r1 = document.getElementById('range-1');
        const r2 = document.getElementById('range-2');
        const i1 = document.getElementById('range-input-1');
        const i2 = document.getElementById('range-input-2');

        if (rows.length > 0 && r1 && r2 && i2) {
            const count = rows.length;
            const currentMax = parseInt(r2.max) || 0;
            const wasAtMax = parseInt(r2.value) === currentMax || this.isFirstScan;

            r1.max = r2.max = count;
            i1.max = i2.max = count;

            if (wasAtMax) {
                r2.value = i2.value = count;
            }
            this.isFirstScan = false;
        }
        rows.forEach(row => YTUI.createCheckbox(row));

        // Trigger auto-scroll if needed
        this.autoScroll();

        const panel = document.getElementById(panelId);
        const target = panel?.parentElement?.querySelector('.yt-page-header-view-model__page-header-content')
            || panel?.parentElement?.querySelector('.metadata-action-bar')
            || panel?.parentElement?.querySelector('ytd-playlist-sidebar-primary-info-renderer #stats');

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
                    node.nodeType === 1 && (node.matches('ytd-playlist-video-renderer, ytd-playlist-panel-video-renderer') || node.querySelector('ytd-playlist-video-renderer, ytd-playlist-panel-video-renderer'))
                )
            );
            if (hasNewRows) this.scan();
        });

        const list = document.querySelector('ytd-section-list-renderer #contents')
            || document.querySelector('ytd-playlist-video-list-renderer #contents')
            || document.querySelector('#playlist-items')
            || document.body;

        observer.observe(list, { childList: true, subtree: true });
    }
};

document.addEventListener('yt-navigate-finish', () => MainApp.init());
if (location.href.includes('list=')) MainApp.init();