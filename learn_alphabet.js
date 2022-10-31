const characters = [
    {
        romaji: "a",
        hiragana: "あ",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "i",
        hiragana: "い",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "u",
        hiragana: "う",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "e",
        hiragana: "え",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "o",
        hiragana: "お",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "ka",
        hiragana: "か",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "ki",
        hiragana: "き",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "ku",
        hiragana: "く",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "ke",
        hiragana: "け",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "ko",
        hiragana: "こ",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "kya",
        hiragana: "きゃ",
        katakana: "",
        type: "yoon"
    },
    {
        romaji: "kyu",
        hiragana: "きゅ",
        katakana: "",
        type: "yoon"
    },
    {
        romaji: "kyo",
        hiragana: "きょ",
        katakana: "",
        type: "yoon"
    },
    {
        romaji: "sa",
        hiragana: "さ",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "shi",
        hiragana: "し",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "su",
        hiragana: "す",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "se",
        hiragana: "せ",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "so",
        hiragana: "そ",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "sha",
        hiragana: "しゃ",
        katakana: "",
        type: "yoon"
    },
    {
        romaji: "shu",
        hiragana: "しゅ",
        katakana: "",
        type: "yoon"
    },
    {
        romaji: "sho",
        hiragana: "しょ",
        katakana: "",
        type: "yoon"
    },
    {
        romaji: "sho",
        hiragana: "しょ",
        katakana: "",
        type: "yoon"
    },
    {
        romaji: "ta",
        hiragana: "た",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "chi",
        hiragana: "ち",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "tsu",
        hiragana: "つ",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "te",
        hiragana: "て",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "to",
        hiragana: "と",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "cha",
        hiragana: "ちゃ",
        katakana: "",
        type: "yoon"
    },
    {
        romaji: "chu",
        hiragana: "ちゅ",
        katakana: "",
        type: "yoon"
    },
    {
        romaji: "cho",
        hiragana: "ちょ",
        katakana: "",
        type: "yoon"
    },
    {
        romaji: "na",
        hiragana: "な",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "ni",
        hiragana: "に",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "nu",
        hiragana: "ぬ",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "ne",
        hiragana: "ね",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "no",
        hiragana: "の",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "nya",
        hiragana: "にゃ",
        katakana: "",
        type: "yoon"
    },
    {
        romaji: "nyu",
        hiragana: "にゅ",
        katakana: "",
        type: "yoon"
    },
    {
        romaji: "nyo",
        hiragana: "にょ",
        katakana: "",
        type: "yoon"
    },
    {
        romaji: "ha",
        hiragana: "は",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "hi",
        hiragana: "ひ",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "fu",
        hiragana: "ふ",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "he",
        hiragana: "へ",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "ho",
        hiragana: "ほ",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "hya",
        hiragana: "ひゃ",
        katakana: "",
        type: "yoon"
    },
    {
        romaji: "hyu",
        hiragana: "ひゅ",
        katakana: "",
        type: "yoon"
    },
    {
        romaji: "hyo",
        hiragana: "ひょ",
        katakana: "",
        type: "yoon"
    },
    {
        romaji: "ma",
        hiragana: "ま",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "mi",
        hiragana: "み",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "mu",
        hiragana: "む",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "me",
        hiragana: "め",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "mo",
        hiragana: "も",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "mya",
        hiragana: "みゃ",
        katakana: "",
        type: "yoon"
    },
    {
        romaji: "myu",
        hiragana: "みゅ",
        katakana: "",
        type: "yoon"
    },
    {
        romaji: "myo",
        hiragana: "みょ",
        katakana: "",
        type: "yoon"
    },
    {
        romaji: "ya",
        hiragana: "や",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "yu",
        hiragana: "ゆ",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "yo",
        hiragana: "よ",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "ra",
        hiragana: "ら",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "ri",
        hiragana: "り",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "ru",
        hiragana: "る",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "re",
        hiragana: "れ",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "ro",
        hiragana: "ろ",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "rya",
        hiragana: "りゃ",
        katakana: "",
        type: "yoon"
    },
    {
        romaji: "ryu",
        hiragana: "りゅ",
        katakana: "",
        type: "yoon"
    },
    {
        romaji: "ryo",
        hiragana: "りょ",
        katakana: "",
        type: "yoon"
    },
    {
        romaji: "wa",
        hiragana: "わ",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "wi",
        hiragana: "ゐ",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "we",
        hiragana: "ゑ",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "o",
        hiragana: "を",
        katakana: "",
        type: "gojuon"
    },
    {
        romaji: "ga",
        hiragana: "が",
        katakana: "",
        type: "dakuten"
    },
    {
        romaji: "gi",
        hiragana: "ぎ",
        katakana: "",
        type: "dakuten"
    },
    {
        romaji: "gu",
        hiragana: "ぐ",
        katakana: "",
        type: "dakuten"
    },
    {
        romaji: "ge",
        hiragana: "げ",
        katakana: "",
        type: "dakuten"
    },
    {
        romaji: "go",
        hiragana: "ご",
        katakana: "",
        type: "dakuten"
    },
    {
        romaji: "gya",
        hiragana: "ぎゃ",
        katakana: "",
        type: "dakuten"
    },
    {
        romaji: "gyu",
        hiragana: "ぎゅ",
        katakana: "",
        type: "dakuten"
    },
    {
        romaji: "gyo",
        hiragana: "ぎょ",
        katakana: "",
        type: "dakuten"
    },
    {
        romaji: "za",
        hiragana: "ざ",
        katakana: "",
        type: "dakuten"
    },
    {
        romaji: "ji",
        hiragana: "じ",
        katakana: "",
        type: "dakuten"
    },
    {
        romaji: "zu",
        hiragana: "ず",
        katakana: "",
        type: "dakuten"
    },
    {
        romaji: "ze",
        hiragana: "ぜ",
        katakana: "",
        type: "dakuten"
    },
    {
        romaji: "zo",
        hiragana: "ぞ",
        katakana: "",
        type: "dakuten"
    },
    {
        romaji: "ja",
        hiragana: "じゃ",
        katakana: "",
        type: "dakuten"
    },
    {
        romaji: "ju",
        hiragana: "じゅ",
        katakana: "",
        type: "dakuten"
    },
    {
        romaji: "jo",
        hiragana: "じょ",
        katakana: "",
        type: "dakuten"
    },
    {
        romaji: "da",
        hiragana: "だ",
        katakana: "",
        type: "dakuten"
    },
    {
        romaji: "ji",
        hiragana: "ぢ",
        katakana: "",
        type: "dakuten"
    },
    {
        romaji: "zu",
        hiragana: "づ",
        katakana: "",
        type: "dakuten"
    },
    {
        romaji: "de",
        hiragana: "で",
        katakana: "",
        type: "dakuten"
    },
    {
        romaji: "do",
        hiragana: "ど",
        katakana: "",
        type: "dakuten"
    },
    {
        romaji: "ja",
        hiragana: "ぢゃ",
        katakana: "",
        type: "dakuten"
    },
    {
        romaji: "ju",
        hiragana: "ぢゅ",
        katakana: "",
        type: "dakuten"
    },
    {
        romaji: "jo",
        hiragana: "ぢょ",
        katakana: "",
        type: "dakuten"
    },
    {
        romaji: "ba",
        hiragana: "ば",
        katakana: "",
        type: "dakuten"
    },
    {
        romaji: "bi",
        hiragana: "び",
        katakana: "",
        type: "dakuten"
    },
    {
        romaji: "bu",
        hiragana: "ぶ",
        katakana: "",
        type: "dakuten"
    },
    {
        romaji: "be",
        hiragana: "べ",
        katakana: "",
        type: "dakuten"
    },
    {
        romaji: "bo",
        hiragana: "ぼ",
        katakana: "",
        type: "dakuten"
    },
    {
        romaji: "bya",
        hiragana: "びゃ",
        katakana: "",
        type: "dakuten"
    },
    {
        romaji: "byu",
        hiragana: "びゅ",
        katakana: "",
        type: "dakuten"
    },
    {
        romaji: "byo",
        hiragana: "びょ",
        katakana: "",
        type: "dakuten"
    },
    {
        romaji: "pa",
        hiragana: "ぱ",
        katakana: "",
        type: "dakuten"
    },
    {
        romaji: "pi",
        hiragana: "ぴ",
        katakana: "",
        type: "dakuten"
    },
    {
        romaji: "pu",
        hiragana: "ぷ",
        katakana: "",
        type: "dakuten"
    },
    {
        romaji: "pe",
        hiragana: "ぺ",
        katakana: "",
        type: "dakuten"
    },
    {
        romaji: "po",
        hiragana: "ぽ",
        katakana: "",
        type: "dakuten"
    },
    {
        romaji: "pya",
        hiragana: "ぴゃ",
        katakana: "",
        type: "dakuten"
    },
    {
        romaji: "pyu",
        hiragana: "ぴゅ",
        katakana: "",
        type: "dakuten"
    },
    {
        romaji: "pyo",
        hiragana: "ぴょ",
        katakana: "",
        type: "dakuten"
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
        say(character.hiragana);
        next();
    }
}

function say(m) {
    var msg = new SpeechSynthesisUtterance();
    var voices = window.speechSynthesis.getVoices();
    //msg.voice = voices[10];
    msg.voiceURI = "native";
    msg.volume = 0.33;
    //msg.rate = 1;
    //msg.pitch = 0.8;
    msg.text = m;
    msg.lang = 'ja-JP';
    window.speechSynthesis.speak(msg);
}

function next() {

    let gojuon = document.getElementById("gojuon");
    let yoon = document.getElementById("yoon");
    let dakuten = document.getElementById("dakuten");

    var availableCharacters = characters.filter(function (el) {
        if (!el.type)
        {
            console.debug("missing type for: " + el.romaji);
        }
        if (gojuon.checked && el.type == "gojuon") {
            return true;
        }
        if (yoon.checked && el.type == "yoon") {
            return true;
        }
        if (dakuten.checked && el.type == "dakuten") {
            return true;
        }
        return false;
    });
    let rnd = Math.floor(Math.random() * availableCharacters.length);
    character = availableCharacters[rnd];

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

        say(character.hiragana);

        setTimeout(function () {
            next();
        }, 2500);
    }

}, 1000);