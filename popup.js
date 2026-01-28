document.addEventListener('DOMContentLoaded', async () => {
    const themeBtns = document.querySelectorAll('.theme-btn');
    const langSelect = document.getElementById('lang-select');
    const stars = document.querySelectorAll('.star');
    const ratingText = document.getElementById('rating-text');
    const githubBtn = document.getElementById('github-btn');

    // Load settings
    const settings = await chrome.storage.local.get(['theme', 'lang', 'autoscroll']);

    // Set initial UI
    if (settings.theme) {
        setTheme(settings.theme);
    }
    if (settings.lang) {
        langSelect.value = settings.lang;
        updateLocaleContent(settings.lang);
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

            const msg = langSelect.value === 'tr' ? "Geri bildirim formuna yönlendiriliyorsunuz..." :
                langSelect.value === 'en' ? "Taking you to feedback form..." :
                    langSelect.value === 'es' ? "Redirigiendo al formulario..." :
                        langSelect.value === 'ar' ? "جاري توجيهك إلى نموذج الملاحظات..." :
                            langSelect.value === 'ru' ? "Перенаправление на форму обратной связи..." :
                                langSelect.value === 'fr' ? "Redirection vers le formulaire de commentaires..." :
                                    langSelect.value === 'de' ? "Weiterleitung zum Feedback-Formular..." :
                                        langSelect.value === 'zh' ? "正在转向反馈表单..." :
                                            langSelect.value === 'hi' ? "आपको फीडबैक फॉर्म पर ले जाया जा रहा है..." :
                                                "Taking you to feedback form...";

            ratingText.textContent = msg;
            setTimeout(() => {
                window.open('https://forms.gle/Xfn4FT3jYYEEmgNP7', '_blank');
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
                    madeBy: "Androdom tarafından yapıldı"
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
                    madeBy: "Made by Androdom"
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
                    madeBy: "Hecho por Androdom"
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
                    madeBy: "تم التطوير بواسطة Androdom"
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
                    madeBy: "Создано Androdom"
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
                    madeBy: "Fait par Androdom"
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
                    madeBy: "Von Androdom erstellt"
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
                    madeBy: "由 Androdom 开发"
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
                    madeBy: "Androdom द्वारा निर्मित"
                }
            };

            const t = translations[lang] || translations['en'];

            document.getElementById('header-title').textContent = t.title;
            document.getElementById('label-appearance').textContent = t.appearance;
            document.getElementById('txt-light').textContent = t.light;
            document.getElementById('txt-dark').textContent = t.dark;
            document.getElementById('txt-oled').textContent = t.oled;
            document.getElementById('label-language').textContent = t.language;
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
