document.addEventListener('DOMContentLoaded', async () => {
    const themeBtns = document.querySelectorAll('.theme-btn');
    const langSelect = document.getElementById('lang-select');
    const playlistSpeedInfoToggle = document.getElementById('playlist-speed-info-toggle');
    const resumeWhereLeftOffToggle = document.getElementById('resume-where-left-off-toggle');
    const syncStartWithResumeToggle = document.getElementById('sync-start-with-resume-toggle');
    const stars = document.querySelectorAll('.star');
    const ratingText = document.getElementById('rating-text');
    const githubBtn = document.getElementById('github-btn');

    // Load settings
    const settings = await chrome.storage.local.get(['theme', 'lang', 'autoscroll', 'playlistSpeedInfo', 'resumeWhereLeftOff', 'syncStartWithResume']);

    // Set initial UI
    if (settings.theme) {
        setTheme(settings.theme);
    }
    // Auto-detect browser language if not set, fallback to 'en'
    const supportedLangs = Array.from(langSelect.options).map(opt => opt.value);
    const browserLang = (chrome.i18n.getUILanguage && chrome.i18n.getUILanguage().split('-')[0]) || 'en';
    const activeLang = settings.lang || (supportedLangs.includes(browserLang) ? browserLang : 'en');

    langSelect.value = activeLang;
    updateLocaleContent(activeLang);
    if (playlistSpeedInfoToggle) {
        playlistSpeedInfoToggle.checked = settings.playlistSpeedInfo !== false;
        playlistSpeedInfoToggle.onchange = () => {
            chrome.storage.local.set({ playlistSpeedInfo: playlistSpeedInfoToggle.checked });
        };
    }
    if (resumeWhereLeftOffToggle) {
        resumeWhereLeftOffToggle.checked = settings.resumeWhereLeftOff === true;
        resumeWhereLeftOffToggle.onchange = () => {
            chrome.storage.local.set({ resumeWhereLeftOff: resumeWhereLeftOffToggle.checked });
        };
    }
    if (syncStartWithResumeToggle) {
        syncStartWithResumeToggle.checked = settings.syncStartWithResume === true;
        syncStartWithResumeToggle.onchange = () => {
            chrome.storage.local.set({ syncStartWithResume: syncStartWithResumeToggle.checked });
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
                                    langSelect.value === 'it' ? "Reindirizzamento al modulo di feedback..." :
                                        langSelect.value === 'fr' ? "Redirection vers le formulaire de commentaires..." :
                                            langSelect.value === 'hi' ? "आपको फीडबैक फॉर्म पर ले जाया जा रहा है..." :
                                                langSelect.value === 'ja' ? "フィードバックフォームに転送しています..." :
                                                    langSelect.value === 'kk' ? "Pikirler türin ashwğa bağıttap turmyz..." :
                                                        langSelect.value === 'ko' ? "피드백 양식으로 이동 중입니다..." :
                                                            langSelect.value === 'pt' ? "Redirecionando para o formulário de feedback..." :
                                                                langSelect.value === 'ru' ? "Перенаправление на форму обратной связи..." :
                                                                    langSelect.value === 'tr' ? "Geri bildirim formuna yönlendiriliyorsunuz..." :
                                                                        langSelect.value === 'es' ? "Redirigiendo al formulario..." :
                                                                            "Taking you to feedback form...";

            ratingText.textContent = msg;
            setTimeout(() => {
                // 1-2 stars: feedback form, 3-5 stars: Firefox Add-ons store
                const url = val <= 2 ? 'https://forms.gle/Xfn4FT3jYYEEmgNP7' : 'https://addons.mozilla.org/en-US/firefox/addon/watchtime-calc/';
                window.open(url, '_blank');
                updateLocaleContent(langSelect.value); // Reset localized text
            }, 1500);
        };
    });

    // GitHub link
    githubBtn.onclick = () => {
        window.open('https://github.com/Androdom/playlist-watchtime', '_blank');
    };



    // Simple localization for popup itself
    async function updateLocaleContent(lang) {
        try {
            const url = chrome.runtime.getURL(`ek/lang/${lang}/strings.json`);
            const response = await fetch(url);
            const strings = await response.json();

            const translations = {
                ar: {
                    title: "YouTube حاسبة طول ووقت قائمة التشغيل",
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
                    playlistSpeedInfo: "إظهار معلومات السرعة/المدة في لوحة التشغيل",
                    resumeWhereLeftOff: "المتابعة من حيث توقفت",
                    syncStartWithResume: "مزامنة البداية مع آخر فيديو",
                    tipPlaylistSpeedInfo: "يعرض سرعة التشغيل المخصصة والمدة المحسوبة",
                    tipResumeWhereLeftOff: "يقوم بالتمرير تلقائيا إلى آخر فيديو شاهدته",
                    tipSyncStartWithResume: "يضبط شريط البداية تلقائيا إلى آخر فيديو لحساب الوقت المتبقي"
                },
                az: {
                    title: "YouTube Pleylist Uzunluğu və Zaman Kalkulyatoru",
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
                    playlistSpeedInfo: "Pleylist panelində sürət-müddət məlumatını göstər",
                    resumeWhereLeftOff: "Qaldığım yerdən davam et",
                    syncStartWithResume: "Başlanğıcı qaldığım videoya bərabərləşdir",
                    tipPlaylistSpeedInfo: "Pleylist panelində fərdi sürət və hesablanmış müddəti göstərir.",
                    tipResumeWhereLeftOff: "Pleylistə daxil olduqda avtomatik olaraq son izlədiyiniz videoya sürüşdürür.",
                    tipSyncStartWithResume: "Qalan vaxtı hesablamaq üçün 'Başlanğıc'ı birbaşa son videoya təyin edir."
                },
                de: {
                    title: "YouTube Playlist Längen- und Zeitrechner",
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
                    playlistSpeedInfo: "Geschwindigkeits-/Dauerinformationen im Playlist-Feld anzeigen",
                    resumeWhereLeftOff: "Dort weitermachen, wo ich aufgehört habe",
                    syncStartWithResume: "Start auf zuletzt angesehen setzen",
                    tipPlaylistSpeedInfo: "Zeigt die Wiedergabegeschwindigkeit und berechnete Dauer an.",
                    tipResumeWhereLeftOff: "Scrollt automatisch zu dem Video, das Sie zuletzt angesehen haben.",
                    tipSyncStartWithResume: "Setzt den 'Start'-Schieberegler auf Ihr letztes Video."
                },
                en: {
                    title: "YouTube Playlist Length & Time Calculator",
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
                    playlistSpeedInfo: "Show speed/duration info in playlist panel",
                    resumeWhereLeftOff: "Resume where I left off",
                    syncStartWithResume: "Auto-sync Start to last watched",
                    tipPlaylistSpeedInfo: "Displays custom playback speed and calculated duration.",
                    tipResumeWhereLeftOff: "Automatically scrolls to the last video you watched when opening a playlist.",
                    tipSyncStartWithResume: "Automatically sets the 'Start' slider to your last watched video."
                },
                es: {
                    title: "YouTube Calculadora de Longitud y Tiempo",
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
                    playlistSpeedInfo: "Mostrar información de velocidad/duración en el panel de lista de reproducción",
                    resumeWhereLeftOff: "Reanudar donde lo dejé",
                    syncStartWithResume: "Sincronizar Inicio con el último visto",
                    tipPlaylistSpeedInfo: "Muestra la velocidad de reproducción y la duración calculada.",
                    tipResumeWhereLeftOff: "Se desplaza automáticamente al último video que vistió.",
                    tipSyncStartWithResume: "Configura automáticamente el 'Inicio' al último video visto."
                },
                fr: {
                    title: "YouTube Calculateur de Longueur et Temps",
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
                    playlistSpeedInfo: "Afficher les informations de vitesse/durée dans le panneau de la playlist",
                    resumeWhereLeftOff: "Reprendre là où je m'étais arrêté",
                    syncStartWithResume: "Sync. du début avec la dernière vidéo",
                    tipPlaylistSpeedInfo: "Affiche la vitesse de lecture et la durée calculée.",
                    tipResumeWhereLeftOff: "Fait défiler automatiquement vers la dernière vidéo regardée.",
                    tipSyncStartWithResume: "Règle automatiquement le curseur de début sur la dernière vidéo."
                },
                hi: {
                    title: "YouTube प्लेलिस्ट लंबाई और समय कैलकुलेटर",
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
                    playlistSpeedInfo: "प्लेलिस्ट पैनल में गति/अवधि की जानकारी दिखाएं",
                    resumeWhereLeftOff: "जहां मैंने छोड़ा था वहीं से फिर से शुरू करें",
                    syncStartWithResume: "प्रारंभ को अंतिम देखे गए वीडियो से सिंक करें",
                    tipPlaylistSpeedInfo: "कस्टम प्लेबैक गति और गणना की गई अवधि प्रदर्शित करता है।",
                    tipResumeWhereLeftOff: "स्वचालित रूप से आपके द्वारा देखे गए अंतिम वीडियो पर स्क्रॉल करता है।",
                    tipSyncStartWithResume: "स्वचालित रूप से 'प्रारंभ' स्लाइडर को आपके अंतिम वीडियो पर सेट करता है।"
                },
                id: {
                    title: "Kalkulator Panjang & Waktu Playlist YouTube",
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
                    playlistSpeedInfo: "Tampilkan informasi kecepatan/durasi di panel playlist",
                    resumeWhereLeftOff: "Lanjutkan di mana saya tinggalkan",
                    syncStartWithResume: "Otomatis sinkronkan Awal ke yang terakhir ditonton",
                    tipPlaylistSpeedInfo: "Menampilkan kecepatan pemutaran dan durasi yang dikalkulasi.",
                    tipResumeWhereLeftOff: "Otomatis menggulir ke video terakhir yang Anda tonton.",
                    tipSyncStartWithResume: "Otomatis mengatur penggeser 'Awal' ke video terakhir Anda yang ditonton."
                },
                it: {
                    title: "Calcolatore Durata e Tempo Playlist YouTube",
                    appearance: "ASPETTO",
                    light: "Chiaro",
                    dark: "Scuro",
                    oled: "OLED",
                    language: "LINGUA",
                    rate: "VALUTA L'APP",
                    hope: "Speriamo ti piaccia!",
                    github: "🛠️ GitHub",
                    madeBy: "Creato da Androdom",
                    features: "FUNZIONALITÀ",
                    playlistSpeedInfo: "Mostra info velocità/durata nel pannello playlist",
                    resumeWhereLeftOff: "Riprendi dove ero rimasto",
                    syncStartWithResume: "Sincronizza Inizio con l'ultimo visto",
                    tipPlaylistSpeedInfo: "Mostra la velocità di riproduzione personalizzata e la durata calcolata.",
                    tipResumeWhereLeftOff: "Scorre automaticamente all'ultimo video che stavi guardando.",
                    tipSyncStartWithResume: "Imposta automaticamente lo slider di Inizio sull'ultimo video che hai guardato."
                },
                ja: {
                    title: "YouTubeプレイリストの長さと時間計算機",
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
                    playlistSpeedInfo: "プレイリストパネルに速度/期間情報を表示",
                    resumeWhereLeftOff: "前回停止したところから再開",
                    syncStartWithResume: "開始を最後に視聴した動画と同期する",
                    tipPlaylistSpeedInfo: "カスタム再生速度と計算された表示時間を表示します。",
                    tipResumeWhereLeftOff: "最後に視聴した動画に自動的にスクロールします。",
                    tipSyncStartWithResume: "『開始』スライダーを最後に視聴した動画に自動的に設定します。"
                },
                kk: {
                    title: "YouTube Oynatw Tiziminiñ Uzaqtığı jäne Waaqyt Eseptegishi",
                    appearance: "KÖRÏNISÏ",
                    light: "Jarıq",
                    dark: "Qaraññğy",
                    oled: "OLED",
                    language: "TÏL",
                    rate: "QOSYMSHANY BAĞALAÑYZ",
                    hope: "Unağany dep oylaymyz!",
                    github: "🛠️ GitHub",
                    madeBy: "Androdom ishinde jasalgan",
                    features: "EREKSHELIKTER",
                    playlistSpeedInfo: "Oynaw tizimi panelinde jyldamdyq/uzaqtyq mälimetin körset",
                    resumeWhereLeftOff: "Toqtağan jerden jalğastyrw",
                    syncStartWithResume: "Bastaudı soñğı videoğa sinhronda",
                    tipPlaylistSpeedInfo: "Jyldamdyqty jäne eseptegen uzaqtyqty körsetedi.",
                    tipResumeWhereLeftOff: "Oynatw tizimin aşqan kezde soñğı videoga avtomatty türde aynaldyrady.",
                    tipSyncStartWithResume: "'Bastaw' jyljyqpasyn soñğı videoğa avtomatty türde belgileydi."
                },
                ko: {
                    title: "YouTube 재생목록 길이 및 시간 계산기",
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
                    playlistSpeedInfo: "재생목록 패널에서 속도/시청시간 정보 표시",
                    resumeWhereLeftOff: "중단한 부분부터 다시 시작",
                    syncStartWithResume: "시작을 마지막 시청 동기화",
                    tipPlaylistSpeedInfo: "사용자 지정 재생 속도와 계산된 지속 시간을 표시합니다.",
                    tipResumeWhereLeftOff: "재생 목록을 열 때 마지막으로 시청한 동영상으로 자동 스크롤합니다.",
                    tipSyncStartWithResume: "'시작' 슬라이더를 마지막으로 시청한 동영상에 자동으로 설정합니다."
                },
                pt: {
                    title: "Calculadora de Tempo e Duração de Playlist do YouTube",
                    appearance: "APARÊNCIA",
                    light: "Claro",
                    dark: "Escuro",
                    oled: "OLED",
                    language: "IDIOMA",
                    rate: "AVALIE O APP",
                    hope: "Esperamos que você goste!",
                    github: "🛠️ GitHub",
                    madeBy: "Feito por Androdom",
                    features: "RECURSOS",
                    playlistSpeedInfo: "Mostrar info de velocidade/duração no painel da playlist",
                    resumeWhereLeftOff: "Retomar de onde parei",
                    syncStartWithResume: "Sincronizar Início com o último visto",
                    tipPlaylistSpeedInfo: "Exibe a velocidade de reprodução personalizada e a duração calculada.",
                    tipResumeWhereLeftOff: "Rola automaticamente para o último vídeo que você estava assistindo.",
                    tipSyncStartWithResume: "Define automaticamente o controle deslizante 'Início' para o último vídeo assistido."
                },
                ru: {
                    title: "YouTube Калькулятор длины и времени плейлиста",
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
                    playlistSpeedInfo: "Показать информацию о скорости/продолжительности на панели плейлиста",
                    resumeWhereLeftOff: "Продолжить с того места, где остановился",
                    syncStartWithResume: "Синхронизировать начало с последним просмотренным",
                    tipPlaylistSpeedInfo: "Отображает пользовательскую скорость воспроизведения и рассчитанную продолжительность.",
                    tipResumeWhereLeftOff: "Автоматически прокручивает к последнему просмотренному видео.",
                    tipSyncStartWithResume: "Автоматически устанавливает ползунок 'Начало' на последнее видео."
                },
                tr: {
                    title: "YouTube Oynatma Listesi Uzunluk ve Zaman Hesaplayıcı",
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
                    playlistSpeedInfo: "Oynatma listesinde hız-süre bilgisini göster",
                    resumeWhereLeftOff: "Kaldığım yerden devam et",
                    syncStartWithResume: "Başlangıcı Son İzlenene Eşitle",
                    tipPlaylistSpeedInfo: "Oynatma listesi menüsünde dinamik hız ve süre bilgisini hesaplayarak gösterir.",
                    tipResumeWhereLeftOff: "Bir oynatma listesini açtığınızda listeyi otomatik olarak en son izlediğiniz videoya kaydırır.",
                    tipSyncStartWithResume: "Kalan toplam süreyi ölçebilmeniz için 'Başlangıç' kaydırıcısını otomatik olarak izlediğiniz son videoya ayarlar."
                },
                zh: {
                    title: "YouTube 播放列表长度和时间计算器",
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
                    playlistSpeedInfo: "在播放列表面板中显示速度/时长信息",
                    resumeWhereLeftOff: "从上次停下的地方继续",
                    syncStartWithResume: "将开始同步到上次观看",
                    tipPlaylistSpeedInfo: "显示自定义播放速度和计算出的持续时间。",
                    tipResumeWhereLeftOff: "打开播放列表时自动滚动到您观看的最后一个视频。",
                    tipSyncStartWithResume: "自动将“开始”滑块设置为您观看的最后一个视频。"
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
            const resumeTextEl = document.getElementById('txt-resume-where-left-off');
            if (resumeTextEl) resumeTextEl.textContent = t.resumeWhereLeftOff;
            const syncStartTextEl = document.getElementById('txt-sync-start-with-resume');
            if (syncStartTextEl) syncStartTextEl.textContent = t.syncStartWithResume || t.resumeWhereLeftOff;
            const labelRateEl = document.getElementById('label-rate');
            if (labelRateEl) labelRateEl.textContent = t.rate;
            
            const ratingTextEl = document.getElementById('rating-text');
            if (ratingTextEl) ratingTextEl.textContent = t.hope;
            
            const txtGithubEl = document.getElementById('txt-github');
            if (txtGithubEl) txtGithubEl.textContent = t.github;
            const githubBtnEl = document.getElementById('github-btn');
            if (githubBtnEl) githubBtnEl.textContent = t.github;
            const speedInfoToggle = document.getElementById('playlist-speed-info-toggle');
            if (speedInfoToggle && speedInfoToggle.parentElement) speedInfoToggle.parentElement.title = t.tipPlaylistSpeedInfo || '';
            const resumeToggle = document.getElementById('resume-where-left-off-toggle');
            if (resumeToggle && resumeToggle.parentElement) resumeToggle.parentElement.title = t.tipResumeWhereLeftOff || '';
            const syncToggle = document.getElementById('sync-start-with-resume-toggle');
            if (syncToggle && syncToggle.parentElement) syncToggle.parentElement.title = t.tipSyncStartWithResume || '';


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
