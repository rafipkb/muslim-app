// --- Initial State & LocalStorage ---
const savedTheme = localStorage.getItem('theme') || 'dark';
const savedCalcMethod = localStorage.getItem('calcMethod') ? parseInt(localStorage.getItem('calcMethod')) : 2;

let state = {
    currentView: 'home',
    location: { city: 'London', country: 'UK', lat: 51.5074, lng: -0.1278 }, // Default
    prayerTimes: null,
    tasbeeh: 0,
    tasbeehTarget: 33,
    surahs: [],
    currentSurah: null,
    arabicFontSize: 2.2, // rem
    theme: savedTheme,
    calcMethod: savedCalcMethod
};

// Apply Initial Theme
if (state.theme === 'light') {
    document.body.classList.add('light-mode');
}
// Lucide Icons removed - using custom SVGs

// --- View Switching ---
function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const targetView = document.getElementById(`${viewId}-view`);
    if (targetView) targetView.classList.add('active');

    // Update nav active state
    const navItems = document.querySelectorAll('.nav-item');
    if (viewId === 'home') navItems[0].classList.add('active');
    if (viewId === 'prayers') navItems[1].classList.add('active');
    if (viewId === 'quran') {
        navItems[2].classList.add('active');
        if (state.surahs.length === 0) fetchSurahList();
    }
    if (viewId === 'tasbeeh') navItems[3].classList.add('active');
    if (viewId === 'settings') navItems[4].classList.add('active');

    state.currentView = viewId;
}

// --- Settings & Personalization ---
const themeSwitch = document.getElementById('theme-switch');
if (themeSwitch) {
    themeSwitch.checked = state.theme === 'dark';
    themeSwitch.addEventListener('change', (e) => {
        state.theme = e.target.checked ? 'dark' : 'light';
        localStorage.setItem('theme', state.theme);

        if (state.theme === 'light') {
            document.body.classList.add('light-mode');
        } else {
            document.body.classList.remove('light-mode');
        }
    });
}

const methodSelect = document.getElementById('calc-method');
if (methodSelect) {
    methodSelect.value = state.calcMethod;
    methodSelect.addEventListener('change', (e) => {
        state.calcMethod = parseInt(e.target.value);
        localStorage.setItem('calcMethod', state.calcMethod);
        fetchPrayerTimes(); // Refresh times automatically
    });
}

// --- Prayer Times ---
async function fetchPrayerTimes() {
    try {
        const response = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${state.location.city}&country=${state.location.country}&method=${state.calcMethod}`);
        const data = await response.json();
        state.prayerTimes = data.data.timings;
        updatePrayerUI(data.data);
    } catch (error) {
        console.error("Error fetching prayer times:", error);
    }
}

function updatePrayerUI(data) {
    const timings = data.timings;
    const date = data.date;

    const hijriEl = document.getElementById('hijri-date');
    const gregEl = document.getElementById('gregorian-date');
    const cityEl = document.getElementById('current-city');

    if (hijriEl) hijriEl.innerText = `${date.hijri.day} ${date.hijri.month.en} ${date.hijri.year}`;
    if (gregEl) gregEl.innerText = date.readable;
    if (cityEl) cityEl.innerText = state.location.city;

    // Find next prayer
    const now = new Date();
    const prayerList = [
        { name: 'Fajr', time: timings.Fajr, icon: 'icon-sunrise' },
        { name: 'Dhuhr', time: timings.Dhuhr, icon: 'icon-sun' },
        { name: 'Asr', time: timings.Asr, icon: 'icon-afternoon' },
        { name: 'Maghrib', time: timings.Maghrib, icon: 'icon-sunset' },
        { name: 'Isha', time: timings.Isha, icon: 'icon-moon' }
    ];

    let next = prayerList.find(p => {
        const [h, m] = p.time.split(':');
        const pDate = new Date();
        pDate.setHours(h, m, 0);
        return pDate > now;
    }) || prayerList[0];

    const nextNameEl = document.getElementById('next-prayer-name');
    const nextTimeEl = document.getElementById('next-prayer-time');
    if (nextNameEl) nextNameEl.innerText = `Next: ${next.name}`;
    if (nextTimeEl) nextTimeEl.innerText = next.time;

    // Full List Injection
    const fullList = document.getElementById('full-prayers-list');
    if (fullList) {
        fullList.innerHTML = prayerList.map(p => `
            <div class="prayer-row ${p.name === next.name ? 'highlight' : ''}">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <svg class="icon" style="width: 20px; height: 20px; color: var(--primary-gold);"><use href="#${p.icon}"></use></svg>
                    <span>${p.name}</span>
                </div>
                <span>${p.time}</span>
            </div>
        `).join('');
    }
}

// --- Quran Functionality ---
async function fetchSurahList() {
    try {
        const response = await fetch('https://api.alquran.cloud/v1/surah');
        const data = await response.json();
        state.surahs = data.data;
        renderSurahList(state.surahs);
    } catch (e) {
        console.error("Error fetching surahs", e);
    }
}

function renderSurahList(list) {
    const container = document.getElementById('surah-list');
    container.innerHTML = list.map(s => `
        <div class="surah-item" onclick="openSurah(${s.number}, '${s.englishName}')">
            <div class="surah-number">${s.number}</div>
            <div class="surah-info">
                <span class="surah-name-en">${s.englishName}</span>
                <span class="surah-detail">${s.englishNameTranslation} • ${s.numberOfAyahs} Verses</span>
            </div>
            <div class="surah-name-ar">${s.name}</div>
        </div>
    `).join('');
}

async function openSurah(number, name) {
    document.getElementById('quran-list-container').classList.add('hidden');
    document.getElementById('quran-reader-container').classList.remove('hidden');
    document.getElementById('current-surah-name').innerText = name;
    document.getElementById('verse-list').innerHTML = '<p style="text-align:center; padding:20px;">Loading verses...</p>';

    try {
        const arResponse = await fetch(`https://api.alquran.cloud/v1/surah/${number}`);
        const arData = await arResponse.json();

        // Universal Bismillah (Excluded from Surah 9)
        let bismillah = number === 9 ? null : "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

        let verses = arData.data.ayahs.map((ayah, index) => {
            let text = ayah.text;

            // Detect Bismillah at start of first verse and strip it for Surahs > 1
            if (index === 0 && number !== 1 && number !== 9) {
                // Al Quran Cloud Uthmani Basmala string (using exact Unicode from API, including Farsi Yeh variant)
                const bismValAPI = "\u0628\u0650\u0633\u06e1\u0645\u0650 \u0671\u0644\u0644\u0651\u064e\u0647\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u06e1\u0645\u064e\u0640\u0670\u0646\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0650\u06cc\u0645\u0650";
                const bismValArabic = "\u0628\u0650\u0633\u06e1\u0645\u0650 \u0671\u0644\u0644\u0651\u064e\u0647\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u06e1\u0645\u064e\u0640\u0670\u0646\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0650\u064a\u0645\u0650";

                if (text.startsWith(bismValAPI)) {
                    text = text.substring(bismValAPI.length).trim();
                } else if (text.startsWith(bismValArabic)) {
                    text = text.substring(bismValArabic.length).trim();
                } else if (text.includes("بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ")) {
                    text = text.replace("بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", "").trim();
                }
            }

            return {
                ar: text,
                number: ayah.numberInSurah
            };
        });

        renderVerses(verses, bismillah);
    } catch (e) {
        console.error("Error opening surah", e);
    }
}

function renderVerses(verses, bismillah) {
    const list = document.getElementById('verse-list');
    list.innerHTML = `
        ${bismillah ? `<div class="basmala-header">${bismillah}</div>` : ''}
        <div class="mushaf-container">
            ${verses.map(v => `
                <span class="verse-text">${v.ar}</span>
                <span class="ayah-marker">${v.number}</span>
            `).join(' ')}
        </div>
    `;
}

document.getElementById('back-to-list')?.addEventListener('click', () => {
    document.getElementById('quran-list-container').classList.remove('hidden');
    document.getElementById('quran-reader-container').classList.add('hidden');
});

document.getElementById('font-increase')?.addEventListener('click', () => {
    if (state.arabicFontSize < 4.0) {
        state.arabicFontSize += 0.2;
        document.documentElement.style.setProperty('--arabic-font-size', `${state.arabicFontSize}rem`);
    }
});

document.getElementById('font-decrease')?.addEventListener('click', () => {
    if (state.arabicFontSize > 1.4) {
        state.arabicFontSize -= 0.2;
        document.documentElement.style.setProperty('--arabic-font-size', `${state.arabicFontSize}rem`);
    }
});

document.getElementById('surah-search')?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = state.surahs.filter(s =>
        s.englishName.toLowerCase().includes(query) ||
        s.number.toString().includes(query)
    );
    renderSurahList(filtered);
});

// --- Verse of the Day (Home) ---
async function fetchVerse() {
    try {
        const randomAyah = Math.floor(Math.random() * 6236) + 1;
        const arResponse = await fetch(`https://api.alquran.cloud/v1/ayah/${randomAyah}`);
        const arData = await arResponse.json();

        const enResponse = await fetch(`https://api.alquran.cloud/v1/ayah/${randomAyah}/en.asad`);
        const enData = await enResponse.json();

        const arEl = document.getElementById('verse-arabic');
        const enEl = document.getElementById('verse-translation');
        const refEl = document.getElementById('verse-reference');

        if (arEl) arEl.innerText = arData.data.text;
        if (enEl) enEl.innerText = enData.data.text;
        if (refEl) refEl.innerText = `${enData.data.surah.englishName} ${enData.data.surah.number}:${enData.data.numberInSurah}`;
    } catch (error) {
        console.error("Error fetching verse:", error);
    }
}

// --- Tasbeeh ---
const tapArea = document.getElementById('tasbeeh-tap');
const countDisplay = document.getElementById('tasbeeh-count');
const targetDisplay = document.getElementById('tasbeeh-target');
const resetBtn = document.getElementById('reset-tasbeeh');
const presetSelect = document.getElementById('dhikr-preset');

tapArea?.addEventListener('click', () => {
    state.tasbeeh++;
    countDisplay.innerText = state.tasbeeh;

    if (state.tasbeehTarget > 0 && state.tasbeeh % state.tasbeehTarget === 0) {
        if (navigator.vibrate) navigator.vibrate(200);
        tapArea.style.background = 'radial-gradient(circle, var(--primary-gold) 0%, transparent 70%)';
        setTimeout(() => {
            tapArea.style.background = 'radial-gradient(circle, var(--primary-emerald) 0%, transparent 70%)';
        }, 500);
    } else {
        if (navigator.vibrate) navigator.vibrate(50);
    }
});

resetBtn?.addEventListener('click', () => {
    state.tasbeeh = 0;
    countDisplay.innerText = 0;
});

presetSelect?.addEventListener('change', (e) => {
    state.tasbeehTarget = parseInt(e.target.value);
    targetDisplay.innerText = state.tasbeehTarget > 0 ? `/ ${state.tasbeehTarget}` : '';
    state.tasbeeh = 0;
    countDisplay.innerText = 0;
});

// --- Location Detection ---
function detectLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
            state.location.lat = pos.coords.latitude;
            state.location.lng = pos.coords.longitude;
            try {
                const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=en`);
                const data = await response.json();
                state.location.city = data.city || data.locality || 'Unknown';
                state.location.country = data.countryName;
                fetchPrayerTimes();
                initQibla();
            } catch (e) {
                fetchPrayerTimes();
                initQibla();
            }
        }, () => {
            fetchPrayerTimes();
            initQibla();
        });
    } else {
        fetchPrayerTimes();
        initQibla();
    }
}

// --- Duas ---
const duaData = {
    morning: {
        title: "Morning & Evening",
        icon: "icon-sun",
        duas: [
            { arabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ", transliteration: "Asbahna wa asbahal mulku lillah", translation: "We have reached the morning and at this very time unto Allah belongs all sovereignty.", reference: "Muslim" },
            { arabic: "اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ", transliteration: "Allahumma bika asbahna wa bika amsayna, wa bika nahya wa bika namut wa ilaykan-nushur", translation: "O Allah, by You we enter the morning and by You we enter the evening, by You we live and by You we die, and to You is the Final Return.", reference: "Abu Dawud" },
            { arabic: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ", transliteration: "Bismillahil-ladhi la yadurru ma'as-mihi shai'un fil-ardi wa la fis-sama'i, wa Huwas-Sami'ul-'Alim", translation: "In the Name of Allah with Whose Name there is protection against every kind of harm in the earth or in the heaven, and He is the All-Hearing and All-Knowing. (3x)", reference: "Abu Dawud" },
            { arabic: "رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا", transliteration: "Raditu billahi Rabban, wa bil-Islami dinan, wa bi-Muhammadin (sallallahu 'alayhi wa sallam) Nabiyyan", translation: "I am pleased with Allah as my Lord, with Islam as my religion and with Muhammad (peace and blessings of Allah be upon him) as my Prophet. (3x)", reference: "Tirmidhi" },
            { arabic: "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ أَصْلِحْ لِي شَأْنِي كُلَّهُ وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ", transliteration: "Ya Hayyu ya Qayyum! Bi-rahmatika astaghith, aslih li sha'ni kullahu, wa la takilni ila nafsi tarfata 'ayn", translation: "O Ever Living One, O Sustainer! By Your mercy I call on You to set right all my affairs. Do not place me in charge of my soul even for the blinking of an eye.", reference: "Al-Hakim" }
        ]
    },
    prayer: {
        title: "After Prayer",
        icon: "icon-mosque",
        duas: [
            { arabic: "أَسْتَغْفِرُ اللَّهَ", transliteration: "Astaghfirullah", translation: "I seek the forgiveness of Allah (three times).", reference: "Muslim" },
            { arabic: "اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ", transliteration: "Allahumma antas-salam wa minkas-salam, tabarakta ya dhal-jalali wal-ikram", translation: "O Allah, You are Peace and from You comes peace. Blessed are You, O Owner of majesty and honor.", reference: "Muslim" },
            { arabic: "اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ، وَشُكْرِكَ، وَحُسْنِ عِبَادَتِكَ", transliteration: "Allahumma a'inni 'ala dhikrika, wa shukrika, wa husni 'ibadatik", translation: "O Allah, help me remember You, to be grateful to You, and to worship You in an excellent manner.", reference: "Abu Dawud" },
            { arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا", transliteration: "Allahumma inni as'aluka 'ilman nafi'an, wa rizqan tayyiban, wa 'amalan mutaqabbalan", translation: "O Allah, I ask You for knowledge that is of benefit, a good provision, and deeds that will be accepted. (After Fajr)", reference: "Ibn Majah" }
        ]
    },
    travel: {
        title: "Travel",
        icon: "icon-quran",
        duas: [
            { arabic: "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ، وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ", transliteration: "Subhanal-ladhi sakh-khara lana hadha wa ma kunna lahu muqrinin. Wa inna ila Rabbina lamunqalibun.", translation: "Glory be to Him Who has brought this under our control, for we were unable to control it. And to our Lord we will surely return.", reference: "Quran 43:13-14" },
            { arabic: "اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَذَا الْبِرَّ وَالتَّقْوَى، وَمِنَ الْعَمَلِ مَا تَرْضَى", transliteration: "Allahumma inna nas'aluka fi safarina hadhal-birra wat-taqwa, wa minal-'amali ma tarda", translation: "O Allah, we ask You for goodness and piety in this journey of ours, and we ask You for deeds which please You.", reference: "Muslim" },
            { arabic: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ", transliteration: "A'udhu bikalimatil-lahit-tammati min sharri ma khalaq", translation: "I seek refuge in the perfect words of Allah from the evil of that which He has created. (When stopping at a place)", reference: "Muslim" }
        ]
    },
    hardship: {
        title: "Hardship & Sorrow",
        icon: "icon-tasbeeh",
        duas: [
            { arabic: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ", transliteration: "Hasbunallahu wa ni'mal-wakil", translation: "Allah is sufficient for us and He is the Best Disposer of affairs.", reference: "Quran 3:173" },
            { arabic: "لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ", transliteration: "La ilaha illa anta subhanaka inni kuntu minaz-zalimin", translation: "There is none worthy of worship but You, glory is to You. Surely, I was among the wrongdoers.", reference: "Tirmidhi" },
            { arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْبُخْلِ وَالْجُبْنِ، وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ", transliteration: "Allahumma inni a'udhu bika minal-hammi wal-hazan, wal-'ajzi wal-kasal, wal-bukhli wal-jubn, wa dala'id-dayni wa ghalabatir-rijal", translation: "O Allah, I seek refuge in you from grief and sadness, from weakness and from laziness, from miserliness and from cowardice, from being overcome by debt and overpowered by men.", reference: "Bukhari" },
            { arabic: "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ", transliteration: "Ya Hayyu Ya Qayyum, bi-rahmatika astaghith", translation: "O Living, O Sustaining, in Your Mercy I seek relief!", reference: "Tirmidhi" }
        ]
    },
    forgiveness: {
        title: "Forgiveness",
        icon: "icon-tasbeeh",
        duas: [
            { arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ", transliteration: "Allahumma anta Rabbi la ilaha illa anta, khalaqtani wa ana 'abduka, wa ana 'ala 'ahdika wa wa'dika mastata'tu... faghfir li, fa innahu la yaghfirudh-dhunuba illa anta", translation: "O Allah, You are my Lord, there is none worthy of worship but You. You created me and I am Your slave. I keep Your covenant, and my pledge to You so far as I am able. I seek refuge in You from the evil of what I have done. I admit to Your blessings upon me, and I admit to my misdeeds. Forgive me, for there is none who may forgive sins but You.", reference: "Bukhari" },
            { arabic: "رَبَّنَا ظَلَمْنَا أَنْفُسَنَا وَإِنْ لَمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ", transliteration: "Rabbana zhalamna anfusana wa in lam taghfir lana wa tarhamna lanakunanna minal-khasirin", translation: "Our Lord, we have wronged ourselves, and if You do not forgive us and have mercy upon us, we will surely be among the losers.", reference: "Quran 7:23" },
            { arabic: "رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ", transliteration: "Rabbighfir li wa tub 'alayya innaka antat-Tawwabur-Rahim", translation: "My Lord, forgive me and accept my repentance, You are the Ever-Relenting, the All-Merciful.", reference: "Ibn Majah" }
        ]
    },
    knowledge: {
        title: "Knowledge",
        icon: "icon-quran",
        duas: [
            { arabic: "رَبِّ زِدْنِي عِلْمًا", transliteration: "Rabbi zidni 'ilma", translation: "My Lord, increase me in knowledge.", reference: "Quran 20:114" },
            { arabic: "اللَّهُمَّ انْفَعْنِي بِمَا عَلَّمْتَنِي وَعَلِّمْنِي مَا يَنْفَعُنِي وَزِدْنِي عِلْمًا", transliteration: "Allahumman-fa'ni bima 'allamtani, wa 'allimni ma yanfa'uni, wa zidni 'ilma", translation: "O Allah, benefit me from that which You taught me, and teach me that which will benefit me, and increase me in knowledge.", reference: "Ibn Majah" }
        ]
    },
    eating: {
        title: "Food & Drink",
        icon: "icon-sun",
        duas: [
            { arabic: "بِسْمِ اللَّهِ", transliteration: "Bismillah", translation: "In the name of Allah. (Before eating)", reference: "Abu Dawud" },
            { arabic: "بِسْمِ اللَّهِ فِي أَوَّلِهِ وَآخِرِهِ", transliteration: "Bismillahi fi awwalihi wa akhirihi", translation: "In the name of Allah, in its beginning and its end. (If you forget to say Bismillah at the beginning)", reference: "Abu Dawud" },
            { arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا الطَّعَامَ وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ", transliteration: "Alhamdulillahil-ladhi at'amani hadhat-ta'ama wa razaqanihi min ghayri hawlin minni wa la quwwah", translation: "All praise is to Allah Who has fed me this food and provided it for me without any strength or power on my part. (After eating)", reference: "Abu Dawud" }
        ]
    },
    sleep: {
        title: "Sleep & Waking",
        icon: "icon-moon",
        duas: [
            { arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا", transliteration: "Bismik-Allahumma amutu wa ahya", translation: "In Your name O Allah, I live and die. (Before sleeping)", reference: "Bukhari" },
            { arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ", transliteration: "Alhamdulillahil-ladhi ahyana ba'da ma amatana wa ilayhin-nushur", translation: "All praise is to Allah Who gave us life after having taken it from us and unto Him is the resurrection. (Upon waking)", reference: "Bukhari" }
        ]
    }
};

function initDuas() {
    const categoryList = document.getElementById('duas-category-list');
    categoryList.innerHTML = '';

    Object.keys(duaData).forEach(key => {
        const cat = duaData[key];
        const card = document.createElement('div');
        card.className = 'dua-category-card';
        card.innerHTML = `
            <svg class="icon"><use href="#${cat.icon}"></use></svg>
            <h3>${cat.title}</h3>
            <p>${cat.duas.length} Duas</p>
        `;
        card.onclick = () => openDuaCategory(key);
        categoryList.appendChild(card);
    });
}

function openDuaCategory(key) {
    const cat = duaData[key];
    document.getElementById('duas-category-list').classList.add('hidden');
    document.querySelector('.duas-header').classList.add('hidden');
    document.getElementById('dua-detail-container').classList.remove('hidden');
    document.getElementById('current-dua-category').innerText = cat.title;

    const duaList = document.getElementById('dua-list');
    duaList.innerHTML = '';

    cat.duas.forEach(dua => {
        duaList.innerHTML += `
            <div class="dua-card">
                <p class="arabic">${dua.arabic}</p>
                <p class="transliteration">${dua.transliteration}</p>
                <p class="translation">${dua.translation}</p>
                <p class="reference">${dua.reference}</p>
            </div>
        `;
    });
}

document.getElementById('back-to-duas')?.addEventListener('click', () => {
    document.getElementById('dua-detail-container').classList.add('hidden');
    document.getElementById('duas-category-list').classList.remove('hidden');
    document.querySelector('.duas-header').classList.remove('hidden');
});

// --- Zakat Calculator ---
document.getElementById('calculate-zakat-btn')?.addEventListener('click', () => {
    const cash = parseFloat(document.getElementById('zakat-cash').value) || 0;
    const gold = parseFloat(document.getElementById('zakat-gold').value) || 0;
    const invest = parseFloat(document.getElementById('zakat-invest').value) || 0;
    const business = parseFloat(document.getElementById('zakat-business').value) || 0;
    const liabilities = parseFloat(document.getElementById('zakat-liabilities').value) || 0;

    const totalAssets = (cash + gold + invest + business) - liabilities;
    const zakatPayable = totalAssets > 0 ? totalAssets * 0.025 : 0;

    document.getElementById('zakat-total-assets').innerText = totalAssets > 0 ? totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
    document.getElementById('zakat-payable').innerText = zakatPayable > 0 ? zakatPayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';

    const resultCard = document.getElementById('zakat-result');
    resultCard.classList.remove('hidden');

    // Smooth scroll to result
    setTimeout(() => {
        resultCard.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
});

// Boot
detectLocation();
fetchVerse();
initDuas();

// --- Qibla Compass ---
let qiblaDirection = 0;

function initQibla() {
    if (state.location.lat && state.location.lng) {
        qiblaDirection = calculateQibla(state.location.lat, state.location.lng);
        const statusEl = document.getElementById('qibla-status');
        if (statusEl) statusEl.innerText = `Qibla is ${Math.round(qiblaDirection)}° from North`;
        const degreesEl = document.getElementById('qibla-degrees');
        if (degreesEl) degreesEl.innerText = `${Math.round(qiblaDirection)}°`;
    }

    const calibrateBtn = document.getElementById('calibrate-btn');
    if (calibrateBtn) {
        // remove existing listeners if re-initialized
        const clone = calibrateBtn.cloneNode(true);
        calibrateBtn.parentNode.replaceChild(clone, calibrateBtn);
        clone.addEventListener('click', requestCompassPermission);
    }
}

function requestCompassPermission() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
            .then(permissionState => {
                if (permissionState === 'granted') {
                    startCompass();
                } else {
                    document.getElementById('qibla-status').innerText = 'Compass permission denied';
                }
            })
            .catch(console.error);
    } else {
        startCompass(); // Non-iOS 13+ devices
    }
}

function startCompass() {
    document.getElementById('calibrate-btn').classList.add('hidden');
    document.getElementById('qibla-status').innerText = 'Compass active';

    if (window.DeviceOrientationAbsoluteEvent) {
        window.addEventListener("deviceorientationabsolute", handleOrientation);
    } else if (window.DeviceOrientationEvent) {
        window.addEventListener("deviceorientation", handleOrientation);
    } else {
        document.getElementById('qibla-status').innerText = 'Compass not supported on this device';
    }
}

function handleOrientation(event) {
    let compassHeading = event.webkitCompassHeading;

    // Fallback for Android
    // alpha is 0 when pointing west in Android sometimes? No, alpha is 0 when pointing North IF AbsoluteEvent.
    if (compassHeading === undefined || compassHeading === null) {
        if (event.absolute) {
            compassHeading = 360 - event.alpha; // Android Chrome
        } else {
            // Not absolute, meaning it's relative to initial orientation. Unusable for compass.
            // But we'll fallback to alpha directly.
            compassHeading = 360 - event.alpha;
        }
    }

    if (compassHeading === null || compassHeading === undefined) return;

    // Rotate the pointer
    // Point to Qibla: difference between Qibla direction and device heading
    let pointerDegree = qiblaDirection - compassHeading;

    const pointerEl = document.getElementById('qibla-pointer');
    if (pointerEl) {
        pointerEl.style.transform = `translate(-50%, -50%) rotate(${pointerDegree}deg)`;
    }

    // Also rotate the outer ring slightly for realism (optional, maybe just keep it static or rotate opposite)
    const outerEl = document.getElementById('compass-outer');
    if (outerEl) {
        outerEl.style.transform = `rotate(${-compassHeading}deg)`;
    }
}

function calculateQibla(lat, lng) {
    const kaabaLat = 21.422487 * Math.PI / 180;
    const kaabaLng = 39.826206 * Math.PI / 180;
    const userLat = lat * Math.PI / 180;
    const userLng = lng * Math.PI / 180;

    const y = Math.sin(kaabaLng - userLng);
    const x = Math.cos(userLat) * Math.tan(kaabaLat) - Math.sin(userLat) * Math.cos(kaabaLng - userLng);

    let qibla = Math.atan2(y, x) * 180 / Math.PI;
    return (qibla + 360) % 360;
}
