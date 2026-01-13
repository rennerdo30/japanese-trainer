// Character database
const characters = [
    // Gojuon - Basic syllables
    { romaji: "a", hiragana: "あ", type: "gojuon" },
    { romaji: "i", hiragana: "い", type: "gojuon" },
    { romaji: "u", hiragana: "う", type: "gojuon" },
    { romaji: "e", hiragana: "え", type: "gojuon" },
    { romaji: "o", hiragana: "お", type: "gojuon" },
    { romaji: "ka", hiragana: "か", type: "gojuon" },
    { romaji: "ki", hiragana: "き", type: "gojuon" },
    { romaji: "ku", hiragana: "く", type: "gojuon" },
    { romaji: "ke", hiragana: "け", type: "gojuon" },
    { romaji: "ko", hiragana: "こ", type: "gojuon" },
    { romaji: "sa", hiragana: "さ", type: "gojuon" },
    { romaji: "shi", hiragana: "し", type: "gojuon" },
    { romaji: "su", hiragana: "す", type: "gojuon" },
    { romaji: "se", hiragana: "せ", type: "gojuon" },
    { romaji: "so", hiragana: "そ", type: "gojuon" },
    { romaji: "ta", hiragana: "た", type: "gojuon" },
    { romaji: "chi", hiragana: "ち", type: "gojuon" },
    { romaji: "tsu", hiragana: "つ", type: "gojuon" },
    { romaji: "te", hiragana: "て", type: "gojuon" },
    { romaji: "to", hiragana: "と", type: "gojuon" },
    { romaji: "na", hiragana: "な", type: "gojuon" },
    { romaji: "ni", hiragana: "に", type: "gojuon" },
    { romaji: "nu", hiragana: "ぬ", type: "gojuon" },
    { romaji: "ne", hiragana: "ね", type: "gojuon" },
    { romaji: "no", hiragana: "の", type: "gojuon" },
    { romaji: "ha", hiragana: "は", type: "gojuon" },
    { romaji: "hi", hiragana: "ひ", type: "gojuon" },
    { romaji: "fu", hiragana: "ふ", type: "gojuon" },
    { romaji: "he", hiragana: "へ", type: "gojuon" },
    { romaji: "ho", hiragana: "ほ", type: "gojuon" },
    { romaji: "ma", hiragana: "ま", type: "gojuon" },
    { romaji: "mi", hiragana: "み", type: "gojuon" },
    { romaji: "mu", hiragana: "む", type: "gojuon" },
    { romaji: "me", hiragana: "め", type: "gojuon" },
    { romaji: "mo", hiragana: "も", type: "gojuon" },
    { romaji: "ya", hiragana: "や", type: "gojuon" },
    { romaji: "yu", hiragana: "ゆ", type: "gojuon" },
    { romaji: "yo", hiragana: "よ", type: "gojuon" },
    { romaji: "ra", hiragana: "ら", type: "gojuon" },
    { romaji: "ri", hiragana: "り", type: "gojuon" },
    { romaji: "ru", hiragana: "る", type: "gojuon" },
    { romaji: "re", hiragana: "れ", type: "gojuon" },
    { romaji: "ro", hiragana: "ろ", type: "gojuon" },
    { romaji: "wa", hiragana: "わ", type: "gojuon" },
    { romaji: "wo", hiragana: "を", type: "gojuon" },
    { romaji: "n", hiragana: "ん", type: "gojuon" },

    // Yoon - Palatalized sounds
    { romaji: "kya", hiragana: "きゃ", type: "yoon" },
    { romaji: "kyu", hiragana: "きゅ", type: "yoon" },
    { romaji: "kyo", hiragana: "きょ", type: "yoon" },
    { romaji: "sha", hiragana: "しゃ", type: "yoon" },
    { romaji: "shu", hiragana: "しゅ", type: "yoon" },
    { romaji: "sho", hiragana: "しょ", type: "yoon" },
    { romaji: "cha", hiragana: "ちゃ", type: "yoon" },
    { romaji: "chu", hiragana: "ちゅ", type: "yoon" },
    { romaji: "cho", hiragana: "ちょ", type: "yoon" },
    { romaji: "nya", hiragana: "にゃ", type: "yoon" },
    { romaji: "nyu", hiragana: "にゅ", type: "yoon" },
    { romaji: "nyo", hiragana: "にょ", type: "yoon" },
    { romaji: "hya", hiragana: "ひゃ", type: "yoon" },
    { romaji: "hyu", hiragana: "ひゅ", type: "yoon" },
    { romaji: "hyo", hiragana: "ひょ", type: "yoon" },
    { romaji: "mya", hiragana: "みゃ", type: "yoon" },
    { romaji: "myu", hiragana: "みゅ", type: "yoon" },
    { romaji: "myo", hiragana: "みょ", type: "yoon" },
    { romaji: "rya", hiragana: "りゃ", type: "yoon" },
    { romaji: "ryu", hiragana: "りゅ", type: "yoon" },
    { romaji: "ryo", hiragana: "りょ", type: "yoon" },

    // Dakuten - Voiced consonants
    { romaji: "ga", hiragana: "が", type: "dakuten" },
    { romaji: "gi", hiragana: "ぎ", type: "dakuten" },
    { romaji: "gu", hiragana: "ぐ", type: "dakuten" },
    { romaji: "ge", hiragana: "げ", type: "dakuten" },
    { romaji: "go", hiragana: "ご", type: "dakuten" },
    { romaji: "za", hiragana: "ざ", type: "dakuten" },
    { romaji: "ji", hiragana: "じ", type: "dakuten" },
    { romaji: "zu", hiragana: "ず", type: "dakuten" },
    { romaji: "ze", hiragana: "ぜ", type: "dakuten" },
    { romaji: "zo", hiragana: "ぞ", type: "dakuten" },
    { romaji: "da", hiragana: "だ", type: "dakuten" },
    { romaji: "de", hiragana: "で", type: "dakuten" },
    { romaji: "do", hiragana: "ど", type: "dakuten" },
    { romaji: "ba", hiragana: "ば", type: "dakuten" },
    { romaji: "bi", hiragana: "び", type: "dakuten" },
    { romaji: "bu", hiragana: "ぶ", type: "dakuten" },
    { romaji: "be", hiragana: "べ", type: "dakuten" },
    { romaji: "bo", hiragana: "ぼ", type: "dakuten" },
    { romaji: "pa", hiragana: "ぱ", type: "dakuten" },
    { romaji: "pi", hiragana: "ぴ", type: "dakuten" },
    { romaji: "pu", hiragana: "ぷ", type: "dakuten" },
    { romaji: "pe", hiragana: "ぺ", type: "dakuten" },
    { romaji: "po", hiragana: "ぽ", type: "dakuten" },

    // Dakuten Yoon combinations
    { romaji: "gya", hiragana: "ぎゃ", type: "dakuten" },
    { romaji: "gyu", hiragana: "ぎゅ", type: "dakuten" },
    { romaji: "gyo", hiragana: "ぎょ", type: "dakuten" },
    { romaji: "ja", hiragana: "じゃ", type: "dakuten" },
    { romaji: "ju", hiragana: "じゅ", type: "dakuten" },
    { romaji: "jo", hiragana: "じょ", type: "dakuten" },
    { romaji: "bya", hiragana: "びゃ", type: "dakuten" },
    { romaji: "byu", hiragana: "びゅ", type: "dakuten" },
    { romaji: "byo", hiragana: "びょ", type: "dakuten" },
    { romaji: "pya", hiragana: "ぴゃ", type: "dakuten" },
    { romaji: "pyu", hiragana: "ぴゅ", type: "dakuten" },
    { romaji: "pyo", hiragana: "ぴょ", type: "dakuten" },
];

// Configuration
const TIME_PER_CHARACTER = 5;
const TIMER_CIRCUMFERENCE = 2 * Math.PI * 22; // r=22 from SVG

// State
let correct = 0;
let total = 0;
let streak = 0;
let character = null;
let countdown = 0;
let timerInterval = null;
let isProcessing = false;

// DOM Elements (cached after load)
let elements = {};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);

function init() {
    // Cache DOM elements
    elements = {
        characterPreview: document.getElementById('character-preview'),
        romajiInput: document.getElementById('romaji-input'),
        correctCount: document.getElementById('correct-count'),
        totalCount: document.getElementById('total-count'),
        timerText: document.getElementById('timer-text'),
        timerProgress: document.getElementById('timer-progress'),
        streakBadge: document.getElementById('streak-badge'),
        streakCount: document.getElementById('streak-count'),
        gojuon: document.getElementById('gojuon'),
        yoon: document.getElementById('yoon'),
        dakuten: document.getElementById('dakuten'),
        hiragana: document.getElementById('hiragana'),
    };

    // Set up input listener
    elements.romajiInput.addEventListener('input', checkInput);

    // Start the game
    next();
    startTimer();
}

function getAvailableCharacters() {
    return characters.filter(char => {
        if (!char.type) {
            console.warn('Missing type for:', char.romaji);
            return false;
        }
        if (elements.gojuon.checked && char.type === 'gojuon') return true;
        if (elements.yoon.checked && char.type === 'yoon') return true;
        if (elements.dakuten.checked && char.type === 'dakuten') return true;
        return false;
    });
}

function getDisplayCharacter(char) {
    const useHiragana = elements.hiragana.checked;
    return useHiragana ? char.hiragana : wanakana.toKatakana(char.hiragana);
}

function checkInput() {
    if (isProcessing || !character) return;

    const inputValue = elements.romajiInput.value.toLowerCase().trim();

    if (inputValue === character.romaji) {
        handleCorrectAnswer();
    }
}

function handleCorrectAnswer() {
    isProcessing = true;
    correct++;
    total++;
    streak++;

    // Update display
    updateStats();
    updateStreak();

    // Visual feedback
    elements.romajiInput.classList.add('input-success');
    elements.characterPreview.classList.add('correct');

    // Speak the character
    speak(getDisplayCharacter(character));

    // Quick transition to next
    setTimeout(() => {
        elements.romajiInput.classList.remove('input-success');
        elements.characterPreview.classList.remove('correct');
        next();
        isProcessing = false;
    }, 300);
}

function handleTimeout() {
    if (isProcessing) return;
    isProcessing = true;

    total++;
    streak = 0;

    // Update display
    updateStats();
    updateStreak();

    // Show correct answer
    elements.romajiInput.value = character.romaji;
    elements.romajiInput.classList.add('input-error');
    elements.romajiInput.disabled = true;

    // Speak the character
    speak(getDisplayCharacter(character));

    // Wait then move to next
    setTimeout(() => {
        elements.romajiInput.classList.remove('input-error');
        elements.romajiInput.disabled = false;
        next();
        isProcessing = false;
    }, 2000);
}

function next() {
    const availableCharacters = getAvailableCharacters();

    if (availableCharacters.length === 0) {
        elements.characterPreview.textContent = '?';
        return;
    }

    // Pick random character (avoid repeating)
    let newChar;
    do {
        const index = Math.floor(Math.random() * availableCharacters.length);
        newChar = availableCharacters[index];
    } while (availableCharacters.length > 1 && newChar === character);

    character = newChar;

    // Update character display with animation
    elements.characterPreview.textContent = getDisplayCharacter(character);
    elements.characterPreview.classList.remove('character-entering');
    void elements.characterPreview.offsetWidth; // Force reflow
    elements.characterPreview.classList.add('character-entering');

    // Reset input
    elements.romajiInput.value = '';
    elements.romajiInput.focus();

    // Reset timer
    countdown = TIME_PER_CHARACTER;
    updateTimerDisplay();
}

function startTimer() {
    timerInterval = setInterval(() => {
        if (isProcessing) return;

        if (countdown > 0) {
            countdown--;
            updateTimerDisplay();
        }

        if (countdown === 0) {
            handleTimeout();
        }
    }, 1000);
}

function updateTimerDisplay() {
    // Update text
    elements.timerText.textContent = countdown;

    // Update circular progress
    const progress = countdown / TIME_PER_CHARACTER;
    const offset = TIMER_CIRCUMFERENCE * (1 - progress);
    elements.timerProgress.style.strokeDashoffset = offset;

    // Warning color when low
    if (countdown <= 2) {
        elements.timerProgress.classList.add('warning');
    } else {
        elements.timerProgress.classList.remove('warning');
    }
}

function updateStats() {
    elements.correctCount.textContent = correct;
    elements.totalCount.textContent = total;
}

function updateStreak() {
    elements.streakCount.textContent = streak;
    if (streak >= 3) {
        elements.streakBadge.classList.add('visible');
    } else {
        elements.streakBadge.classList.remove('visible');
    }
}

function speak(text) {
    if (!('speechSynthesis' in window)) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.volume = 0.5;
    utterance.rate = 0.9;

    window.speechSynthesis.speak(utterance);
}
