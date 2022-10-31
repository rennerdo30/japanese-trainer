const characters = [
    {
        romaji: "a",
        hiragana: "あ",
        katakana: ""
    },
    {
        romaji: "i",
        hiragana: "い",
        katakana: ""
    },
    {
        romaji: "u",
        hiragana: "う",
        katakana: ""
    },
    {
        romaji: "e",
        hiragana: "え",
        katakana: ""
    },
    {
        romaji: "o",
        hiragana: "お",
        katakana: ""
    },
    {
        romaji: "ka",
        hiragana: "か",
        katakana: ""
    },
    {
        romaji: "ki",
        hiragana: "き",
        katakana: ""
    },
    {
        romaji: "ku",
        hiragana: "く",
        katakana: ""
    },
    {
        romaji: "ke",
        hiragana: "け",
        katakana: ""
    },
    {
        romaji: "ko",
        hiragana: "こ",
        katakana: ""
    },
    {
        romaji: "kya",
        hiragana: "きゃ",
        katakana: ""
    },
    {
        romaji: "kyu",
        hiragana: "きゅ",
        katakana: ""
    },
    {
        romaji: "kyo",
        hiragana: "きょ",
        katakana: ""
    },
    {
        romaji: "sa",
        hiragana: "さ",
        katakana: ""
    },
    {
        romaji: "shi",
        hiragana: "し",
        katakana: ""
    },
    {
        romaji: "su",
        hiragana: "す",
        katakana: ""
    },
    {
        romaji: "se",
        hiragana: "せ",
        katakana: ""
    },
    {
        romaji: "so",
        hiragana: "そ",
        katakana: ""
    },
    {
        romaji: "sha",
        hiragana: "しゃ",
        katakana: ""
    },
    {
        romaji: "shu",
        hiragana: "しゅ",
        katakana: ""
    },
    {
        romaji: "sho",
        hiragana: "しょ",
        katakana: ""
    },
    {
        romaji: "sho",
        hiragana: "しょ",
        katakana: ""
    },
    {
        romaji: "ta",
        hiragana: "た",
        katakana: ""
    },
    {
        romaji: "chi",
        hiragana: "ち",
        katakana: ""
    },
    {
        romaji: "tsu",
        hiragana: "つ",
        katakana: ""
    },
    {
        romaji: "te",
        hiragana: "て",
        katakana: ""
    },
    {
        romaji: "to",
        hiragana: "と",
        katakana: ""
    },
    {
        romaji: "cha",
        hiragana: "ちゃ",
        katakana: ""
    },
    {
        romaji: "chu",
        hiragana: "ちゅ",
        katakana: ""
    },
    {
        romaji: "cho",
        hiragana: "ちょ",
        katakana: ""
    },
    {
        romaji: "na",
        hiragana: "な",
        katakana: ""
    },
    {
        romaji: "ni",
        hiragana: "に",
        katakana: ""
    },
    {
        romaji: "nu",
        hiragana: "ぬ",
        katakana: ""
    },
    {
        romaji: "ne",
        hiragana: "ね",
        katakana: ""
    },
    {
        romaji: "no",
        hiragana: "の",
        katakana: ""
    },
    {
        romaji: "nya",
        hiragana: "にゃ",
        katakana: ""
    },
    {
        romaji: "nyu",
        hiragana: "にゅ",
        katakana: ""
    },
    {
        romaji: "nyo",
        hiragana: "にょ",
        katakana: ""
    },
    {
        romaji: "ha",
        hiragana: "は",
        katakana: ""
    },
    {
        romaji: "hi",
        hiragana: "ひ",
        katakana: ""
    },
    {
        romaji: "fu",
        hiragana: "ふ",
        katakana: ""
    },
    {
        romaji: "he",
        hiragana: "へ",
        katakana: ""
    },
    {
        romaji: "ho",
        hiragana: "ほ",
        katakana: ""
    },
    {
        romaji: "hya",
        hiragana: "ひゃ",
        katakana: ""
    },
    {
        romaji: "hyu",
        hiragana: "ひゅ",
        katakana: ""
    },
    {
        romaji: "hyo",
        hiragana: "ひょ",
        katakana: ""
    },
    {
        romaji: "ma",
        hiragana: "ま",
        katakana: ""
    },
    {
        romaji: "mi",
        hiragana: "み",
        katakana: ""
    },
    {
        romaji: "mu",
        hiragana: "む",
        katakana: ""
    },
    {
        romaji: "me",
        hiragana: "め",
        katakana: ""
    },
    {
        romaji: "mo",
        hiragana: "も",
        katakana: ""
    },
    {
        romaji: "mya",
        hiragana: "みゃ",
        katakana: ""
    },
    {
        romaji: "myu",
        hiragana: "みゅ",
        katakana: ""
    },
    {
        romaji: "myo",
        hiragana: "みょ",
        katakana: ""
    },
    {
        romaji: "ya",
        hiragana: "や",
        katakana: ""
    },
    {
        romaji: "yu",
        hiragana: "ゆ",
        katakana: ""
    },
    {
        romaji: "yo",
        hiragana: "よ",
        katakana: ""
    },
    {
        romaji: "ra",
        hiragana: "ら",
        katakana: ""
    },
    {
        romaji: "ri",
        hiragana: "り",
        katakana: ""
    },
    {
        romaji: "ru",
        hiragana: "る",
        katakana: ""
    },
    {
        romaji: "re",
        hiragana: "れ",
        katakana: ""
    },
    {
        romaji: "ro",
        hiragana: "ろ",
        katakana: ""
    },
    {
        romaji: "rya",
        hiragana: "りゃ",
        katakana: ""
    },
    {
        romaji: "ryu",
        hiragana: "りゅ",
        katakana: ""
    },
    {
        romaji: "ryo",
        hiragana: "りょ",
        katakana: ""
    },
    {
        romaji: "wa",
        hiragana: "わ",
        katakana: ""
    },
    {
        romaji: "wi",
        hiragana: "ゐ",
        katakana: ""
    },
    {
        romaji: "we",
        hiragana: "ゑ",
        katakana: ""
    },
    {
        romaji: "o",
        hiragana: "を",
        katakana: ""
    },
    {
        romaji: "ga",
        hiragana: "が",
        katakana: ""
    },
    {
        romaji: "gi",
        hiragana: "ぎ",
        katakana: ""
    },
    {
        romaji: "gu",
        hiragana: "ぐ",
        katakana: ""
    },
    {
        romaji: "ge",
        hiragana: "げ",
        katakana: ""
    },
    {
        romaji: "go",
        hiragana: "ご",
        katakana: ""
    },
    {
        romaji: "gya",
        hiragana: "ぎゃ",
        katakana: ""
    },
    {
        romaji: "gyu",
        hiragana: "ぎゅ",
        katakana: ""
    },
    {
        romaji: "gyo",
        hiragana: "ぎょ",
        katakana: ""
    },
    {
        romaji: "za",
        hiragana: "ざ",
        katakana: ""
    },
    {
        romaji: "ji",
        hiragana: "じ",
        katakana: ""
    },
    {
        romaji: "zu",
        hiragana: "ず",
        katakana: ""
    },
    {
        romaji: "ze",
        hiragana: "ぜ",
        katakana: ""
    },
    {
        romaji: "zo",
        hiragana: "ぞ",
        katakana: ""
    },
    {
        romaji: "ja",
        hiragana: "じゃ",
        katakana: ""
    },
    {
        romaji: "ju",
        hiragana: "じゅ",
        katakana: ""
    },
    {
        romaji: "jo",
        hiragana: "じょ",
        katakana: ""
    },
    {
        romaji: "da",
        hiragana: "だ",
        katakana: ""
    },
    {
        romaji: "ji",
        hiragana: "ぢ",
        katakana: ""
    },
    {
        romaji: "zu",
        hiragana: "づ",
        katakana: ""
    },
    {
        romaji: "de",
        hiragana: "で",
        katakana: ""
    },
    {
        romaji: "do",
        hiragana: "ど",
        katakana: ""
    },
    {
        romaji: "ja",
        hiragana: "ぢゃ",
        katakana: ""
    },
    {
        romaji: "ju",
        hiragana: "ぢゅ",
        katakana: ""
    },
    {
        romaji: "jo",
        hiragana: "ぢょ",
        katakana: ""
    },
    {
        romaji: "ba",
        hiragana: "ば",
        katakana: ""
    },
    {
        romaji: "bi",
        hiragana: "び",
        katakana: ""
    },
    {
        romaji: "bu",
        hiragana: "ぶ",
        katakana: ""
    },
    {
        romaji: "be",
        hiragana: "べ",
        katakana: ""
    },
    {
        romaji: "bo",
        hiragana: "ぼ",
        katakana: ""
    },
    {
        romaji: "bya",
        hiragana: "びゃ",
        katakana: ""
    },
    {
        romaji: "byu",
        hiragana: "びゅ",
        katakana: ""
    },
    {
        romaji: "byo",
        hiragana: "びょ",
        katakana: ""
    },
    {
        romaji: "pa",
        hiragana: "ぱ",
        katakana: ""
    },
    {
        romaji: "pi",
        hiragana: "ぴ",
        katakana: ""
    },
    {
        romaji: "pu",
        hiragana: "ぷ",
        katakana: ""
    },
    {
        romaji: "pe",
        hiragana: "ぺ",
        katakana: ""
    },
    {
        romaji: "po",
        hiragana: "ぽ",
        katakana: ""
    },
    {
        romaji: "pya",
        hiragana: "ぴゃ",
        katakana: ""
    },
    {
        romaji: "pyu",
        hiragana: "ぴゅ",
        katakana: ""
    },
    {
        romaji: "pyo",
        hiragana: "ぴょ",
        katakana: ""
    },
];

const timePerCharakter = 5;

let correct = 0;
let totoal = 0;
let character = null;
let countdown = 0;

function checkInput() {
    var inputField = document.getElementById("romaji-input");
    let inputValue = inputField.value.toUpperCase();

    if (character && character.romaji.toUpperCase() == inputValue) {
        correct += 1;
        totoal += 1;
        next();
    }
}

function next() {
    let rnd = Math.floor(Math.random() * characters.length);

    character = characters[rnd];

    let characterPreview = document.getElementById("character-preview");
    characterPreview.innerText = character.hiragana;

    let stats = document.getElementById("stats");
    stats.innerText = correct + " / " + totoal;

    let romajiInput = document.getElementById("romaji-input");
    romajiInput.className = "romaji-input";
    romajiInput.value = "";
    romajiInput.disabled = false;
    romajiInput.focus();

    countdown = timePerCharakter;
}

var x = setInterval(function () {

    let countdownText = document.getElementById("countdown");

    if (countdown > 0) {
        countdown -= 1;
        countdownText.innerText = countdown + " seconds left";
    }

    if (countdown == 0) {
        countdown -= 1;
        totoal += 1;

        let romajiInput = document.getElementById("romaji-input");
        romajiInput.value = character.romaji;
        romajiInput.className = "romaji-input input-error";
        romajiInput.disabled = true;

        setTimeout(function () {
            next();
        }, 2500);
    }

}, 1000);