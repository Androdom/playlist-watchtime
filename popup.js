document.addEventListener('DOMContentLoaded', async () => {
    const themeBtns = document.querySelectorAll('.theme-btn');
    const langSelect = document.getElementById('lang-select');
    const playlistSpeedInfoToggle = document.getElementById('playlist-speed-info-toggle');
    const stars = document.querySelectorAll('.star');
    const ratingText = document.getElementById('rating-text');
    const githubBtn = document.getElementById('github-btn');

    // Load settings
    const settings = await chrome.storage.local.get(['theme', 'lang', 'autoscroll', 'playlistSpeedInfo']);

    // Set initial UI
    if (settings.theme) {
        setTheme(settings.theme);
    }
    if (settings.lang) {
        langSelect.value = settings.lang;
        updateLocaleContent(settings.lang);
    }
    if (playlistSpeedInfoToggle) {
        playlistSpeedInfoToggle.checked = settings.playlistSpeedInfo !== false;
        playlistSpeedInfoToggle.onchange = () => {
            chrome.storage.local.set({ playlistSpeedInfo: playlistSpeedInfoToggle.checked });
        };
    }

    // Theme changes
    themeBtns.forEach(btn => {
        btn.onclick = () => {
            const theme = btn.dataset.theme;
            setTheme(theme);
            chrome.storage.local.set({ theme });
        };
    });

    function setTheme(theme) {
        document.body.classList.remove('light-theme', 'oled-theme');
        if (theme === 'light') document.body.classList.add('light-theme');
        if (theme === 'oled') document.body.classList.add('oled-theme');

        themeBtns.forEach(b => {
            b.classList.toggle('active', b.dataset.theme === theme);
        });
    }

    // Language changes
    langSelect.onchange = () => {
        const lang = langSelect.value;
        chrome.storage.local.set({ lang });
        updateLocaleContent(lang);
    };



    // Rating system
    stars.forEach(star => {
        star.onclick = () => {
            const val = parseInt(star.dataset.value);
            stars.forEach((s, i) => {
                s.classList.toggle('active', i < val);
            });

            const msg = langSelect.value === 'az' ? "Rəy formasına yönləndirilirsiniz..." :
                langSelect.value === 'de' ? "Weiterleitung zum Feedback-Formular..." :
                    langSelect.value === 'ar' ? "جاري توجيهك إلى نموذج الملاحظات..." :
                        langSelect.value === 'zh' ? "正在转向反馈表单..." :
                            langSelect.value === 'en' ? "Taking you to feedback form..." :
                                langSelect.value === 'id' ? "Membawa Anda ke formulir umpan balik..." :
                                    langSelect.value === 'fr' ? "Redirection vers le formulaire de commentaires..." :
                                        langSelect.value === 'hi' ? "आपको फीडबैक फॉर्म पर ले जाया जा रहा है..." :
                                            langSelect.value === 'ja' ? "フィードバックフォームに転送しています..." :
                                                langSelect.value === 'kk' ? "Пікірлер түрін ашуға бағыттап тұрмыз..." :
                                                    langSelect.value === 'ko' ? "피드백 양식으로 이동 중입니다..." :
                                                        langSelect.value === 'ru' ? "Перенаправление на форму обратной связи..." :
                                                            langSelect.value === 'tr' ? "Geri bildirim formuna yönlendiriliyorsunuz..." :
                                                                langSelect.value === 'es' ? "Redirigiendo al formulario..." :
                                                                    "Taking you to feedback form...";

            ratingText.textContent = msg;
            setTimeout(() => {
                // 1-2 stars: feedback form, 3-5 stars: Firefox Add-ons store
                const url = val <= 2 ? 'https://forms.gle/Xfn4FT3jYYEEmgNP7' : 'https://addons.mozilla.org/en-US/firefox/addon/youtube-playlist-watch-time/';
                window.open(url, '_blank');
                updateLocaleContent(langSelect.value); // Reset localized text
            }, 1500);
        };
    });

    // GitHub link
    githubBtn.onclick = () => {
        window.open('https://github.com/Androdom/youtube-playlist-watchtime/', '_blank');
    };



    // Simple localization for popup itself
    async function updateLocaleContent(lang) {
        try {
            const url = chrome.runtime.getURL(`ek/lang/${lang}/strings.json`);
            const response = await fetch(url);
            const strings = await response.json();

            const translations = {
                az: {
                    title: "YouTube Pleylisti Saatı Kalkulyatoru",
                    appearance: "GÖRÜNÜŞ",
                    light: "Açıq",
                    dark: "Tünd",
                    oled: "OLED",
                    language: "DİL",
                    rate: "UYGULAMANI QİYMƏTLƏNDİR",
                    hope: "Ümid edirik ki, sənə bəyənəcəksən!",
                    github: "🛠️ GitHub",
                    madeBy: "Androdom tərəfindən hazırlanmışdır",
                    features: "XÜSUSIYYƏTLƏR",
                    playlistSpeedInfo: "Pleylist panelində sürət məlumatını göstər"
                },
                de: {
                    title: "YouTube Wiedergabezeit-Rechner",
                    appearance: "AUSSEHEN",
                    light: "Hell",
                    dark: "Dunkel",
                    oled: "OLED",
                    language: "SPRACHE",
                    rate: "APP BEWERTEN",
                    hope: "Hoffentlich gefällt es dir!",
                    github: "🛠️ GitHub",
                    madeBy: "Von Androdom erstellt",
                    features: "FUNKTIONEN",
                    playlistSpeedInfo: "Geschwindigkeitsinformationen im Playlist-Feld anzeigen"
                },
                ar: {
                    title: "YouTube حاسبة وقت التشغيل",
                    appearance: "المظهر",
                    light: "فاتح",
                    dark: "داكن",
                    oled: "OLED",
                    language: "اللغة",
                    rate: "قيم التطبيق",
                    hope: "نأمل أن ينال إعجابكم!",
                    github: "GitHub 🛠️",
                    madeBy: "تم التطوير بواسطة Androdom",
                    features: "الميزات",
                    playlistSpeedInfo: "إظهار معلومات السرعة في لوحة التشغيل"
                },
                zh: {
                    title: "YouTube 播放列表时长计算器",
                    appearance: "外观",
                    light: "浅色",
                    dark: "深色",
                    oled: "OLED",
                    language: "语言",
                    rate: "评价应用",
                    hope: "希望您能喜欢！",
                    github: "🛠️ GitHub",
                    madeBy: "由 Androdom 开发",
                    features: "功能",
                    playlistSpeedInfo: "在播放列表面板中显示速度信息"
                },
                en: {
                    title: "YouTube Playlist Watch Time Calculator",
                    appearance: "APPEARANCE",
                    light: "Light",
                    dark: "Dark",
                    oled: "OLED",
                    language: "LANGUAGE",
                    rate: "RATE THE APP",
                    hope: "Hope you like it!",
                    github: "🛠️ GitHub",
                    madeBy: "Made by Androdom",
                    features: "FEATURES",
                    playlistSpeedInfo: "Show speed info in playlist panel"
                },
                id: {
                    title: "Kalkulator Waktu Putar Playlist YouTube",
                    appearance: "PENAMPILAN",
                    light: "Terang",
                    dark: "Gelap",
                    oled: "OLED",
                    language: "BAHASA",
                    rate: "BERI RATING APLIKASI",
                    hope: "Semoga Anda menyukainya!",
                    github: "🛠️ GitHub",
                    madeBy: "Dibuat oleh Androdom",
                    features: "FITUR",
                    playlistSpeedInfo: "Tampilkan informasi kecepatan di panel playlist"
                },
                fr: {
                    title: "YouTube Calculateur de visionnage",
                    appearance: "APPARENCE",
                    light: "Clair",
                    dark: "Sombre",
                    oled: "OLED",
                    language: "LANGUE",
                    rate: "ÉVALUER L'APP",
                    hope: "On espère que ça vous plaira !",
                    github: "🛠️ GitHub",
                    madeBy: "Fait par Androdom",
                    features: "FONCTIONNALITÉS",
                    playlistSpeedInfo: "Afficher les informations de vitesse dans le panneau de la playlist"
                },
                hi: {
                    title: "YouTube प्लेलिस्ट वॉच टाइम कैलकुलेटर",
                    appearance: "रंग-रूप",
                    light: "हल्का",
                    dark: "गहरा",
                    oled: "OLED",
                    language: "भाषा",
                    rate: "ऐप को रेट करें",
                    hope: "आशा है कि आपको यह पसंद आएगा!",
                    github: "🛠️ GitHub",
                    madeBy: "Androdom द्वारा निर्मित",
                    features: "सुविधाएँ",
                    playlistSpeedInfo: "प्लेलिस्ट पैनल में स्पीड जानकारी दिखाएं"
                },
                ja: {
                    title: "YouTubeプレイリスト再生時間計算機",
                    appearance: "外観",
                    light: "ライト",
                    dark: "ダーク",
                    oled: "OLED",
                    language: "言語",
                    rate: "アプリを評価",
                    hope: "楽しんでいただけたら幸いです！",
                    github: "🛠️ GitHub",
                    madeBy: "Androdomが作成",
                    features: "機能",
                    playlistSpeedInfo: "プレイリストパネルに速度情報を表示"
                },
                kk: {
                    title: "YouTube Oynatw Tiziminiñ Uzaqtığın Eseptew",
                    appearance: "KÖRÏNISÏ",
                    light: "Jarıq",
                    dark: "Qaraññğy",
                    oled: "OLED",
                    language: "TÏL",
                    rate: "QOSYMSHANY BAĞALAÑYZ",
                    hope: "Unağany dep oylaymyz!",
                    github: "🛠️ GitHub",
                    madeBy: "Androdom ishinde jasalgan",
                    features: "ЕРЕКШЕЛІКТЕР",
                    playlistSpeedInfo: "Ойнау тізімі панелінде жылдамдық мәліметін көрсет"
                },
                ko: {
                    title: "YouTube 재생목록 시청 시간 계산기",
                    appearance: "모양",
                    light: "밝음",
                    dark: "어두움",
                    oled: "OLED",
                    language: "언어",
                    rate: "앱 평가",
                    hope: "마음에 드셨기를 바랍니다!",
                    github: "🛠️ GitHub",
                    madeBy: "Androdom이 작성함",
                    features: "기능",
                    playlistSpeedInfo: "재생목록 패널에서 속도 정보 표시"
                },
                ru: {
                    title: "YouTube Калькулятор времени",
                    appearance: "ВНЕШНИЙ ВИД",
                    light: "Светлая",
                    dark: "Темная",
                    oled: "OLED",
                    language: "ЯЗЫК",
                    rate: "ОЦЕНИТЕ ПРИЛОЖЕНИЕ",
                    hope: "Надеемся, вам понравится!",
                    github: "🛠️ GitHub",
                    madeBy: "Создано Androdom",
                    features: "ФУНКЦИИ",
                    playlistSpeedInfo: "Показать информацию о скорости на панели плейлиста"
                },
                tr: {
                    title: "YouTube Oynatma Listesi Hesaplayıcı",
                    appearance: "GÖRÜNÜM",
                    light: "Aydınlık",
                    dark: "Karanlık",
                    oled: "OLED",
                    language: "DİL",
                    rate: "UYGULAMAYI OYLAYIN",
                    hope: "Umarız beğenirsiniz!",
                    github: "GitHub 🛠️",
                    madeBy: "Androdom tarafından yapıldı",
                    features: "ÖZELLİKLER",
                    playlistSpeedInfo: "Oynatma listesinde hız bilgisini göster"
                },
                es: {
                    title: "YouTube Calculadora de Tiempo",
                    appearance: "APARIENCIA",
                    light: "Claro",
                    dark: "Oscuro",
                    oled: "OLED",
                    language: "IDIOMA",
                    rate: "CALIFICA LA APP",
                    hope: "¡Esperamos que te guste!",
                    github: "🛠️ GitHub",
                    madeBy: "Hecho por Androdom",
                    features: "CARACTERÍSTICAS",
                    playlistSpeedInfo: "Mostrar información de velocidad en el panel de lista de reproducción"
                }
            };

            const t = translations[lang] || translations['en'];

            document.getElementById('header-title').textContent = t.title;
            document.getElementById('label-appearance').textContent = t.appearance;
            document.getElementById('txt-light').textContent = t.light;
            document.getElementById('txt-dark').textContent = t.dark;
            document.getElementById('txt-oled').textContent = t.oled;
            document.getElementById('label-language').textContent = t.language;
            document.getElementById('label-features').textContent = t.features;
            document.getElementById('txt-playlist-speed-info').textContent = t.playlistSpeedInfo;
            document.getElementById('label-rate').textContent = t.rate;
            document.getElementById('rating-text').textContent = t.hope;
            document.getElementById('txt-github').textContent = t.github;

            // Insert brand color span into madeBy text (Safe for Firefox Review)
            const madeByEl = document.getElementById('txt-made-by');
            const parts = t.madeBy.split('Androdom');
            madeByEl.textContent = parts[0];
            const span = document.createElement('span');
            span.className = 'brand-color';
            span.textContent = 'Androdom';
            madeByEl.appendChild(span);
            if (parts[1]) madeByEl.appendChild(document.createTextNode(parts[1]));

        } catch (e) {
            console.error("Failed to load strings for popup", e);
        }
    }
});
