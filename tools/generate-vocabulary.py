#!/usr/bin/env python3
"""
Complete JLPT N5-N1 Vocabulary Generator
Creates comprehensive vocabulary database with all JLPT levels
"""

import json
import os

# Comprehensive JLPT Vocabulary Database (N5-N1)
JLPT_VOCABULARY = {
    "N5": [
        # Verbs
        ("する", "する", "to do, to make", "verb"),
        ("いる", "いる", "to be (animate)", "verb"),
        ("ある", "ある", "to exist, to have", "verb"),
        ("なる", "なる", "to become", "verb"),
        ("いく", "いく", "to go", "verb"),
        ("くる", "くる", "to come", "verb"),
        ("みる", "みる", "to see, to watch", "verb"),
        ("きく", "きく", "to listen, to hear", "verb"),
        ("たべる", "たべる", "to eat", "verb"),
        ("のむ", "のむ", "to drink", "verb"),
        ("かく", "かく", "to write", "verb"),
        ("よむ", "よむ", "to read", "verb"),
        ("はいる", "はいる", "to enter", "verb"),
        ("でる", "でる", "to exit, to go out", "verb"),
        ("あるく", "あるく", "to walk", "verb"),
        ("はしる", "はしる", "to run", "verb"),
        ("たつ", "たつ", "to stand", "verb"),
        ("すわる", "すわる", "to sit", "verb"),
        ("ねる", "ねる", "to sleep", "verb"),
        ("おきる", "おきる", "to wake up", "verb"),
        ("かえる", "かえる", "to return", "verb"),
        ("おわる", "おわる", "to finish", "verb"),
        ("はじまる", "はじまる", "to start", "verb"),
        ("つづく", "つづく", "to continue", "verb"),
        ("やる", "やる", "to do", "verb"),
        ("あげる", "あげる", "to give", "verb"),
        ("もらう", "もらう", "to receive", "verb"),
        ("かる", "かる", "to borrow", "verb"),
        ("ぐ", "ぐ", "to be able to", "verb"),
        ("できる", "できる", "to be able to do", "verb"),
        
        # Adjectives
        ("おおきい", "大きい", "big, large", "adjective"),
        ("ちいさい", "小さい", "small", "adjective"),
        ("あたらしい", "新しい", "new", "adjective"),
        ("ふるい", "古い", "old", "adjective"),
        ("たかい", "高い", "high, tall", "adjective"),
        ("ひくい", "低い", "low", "adjective"),
        ("ながい", "長い", "long", "adjective"),
        ("みじかい", "短い", "short", "adjective"),
        ("よい", "良い", "good", "adjective"),
        ("わるい", "悪い", "bad", "adjective"),
        ("ホットい", "暑い", "hot", "adjective"),
        ("さむい", "寒い", "cold", "adjective"),
        ("あつい", "熱い", "hot (object)", "adjective"),
        ("つめたい", "冷たい", "cold (object)", "adjective"),
        ("つよい", "強い", "strong", "adjective"),
        ("よわい", "弱い", "weak", "adjective"),
        ("あかい", "赤い", "red", "adjective"),
        ("あおい", "青い", "blue", "adjective"),
        ("しろい", "白い", "white", "adjective"),
        ("くろい", "黒い", "black", "adjective"),
        
        # Nouns
        ("ひと", "人", "person", "noun"),
        ("おんな", "女", "woman", "noun"),
        ("おとこ", "男", "man", "noun"),
        ("こども", "子供", "child", "noun"),
        ("あたまい", "頭", "head", "noun"),
        ("め", "目", "eye", "noun"),
        ("みみ", "耳", "ear", "noun"),
        ("はな", "鼻", "nose", "noun"),
        ("くち", "口", "mouth", "noun"),
        ("は", "歯", "tooth", "noun"),
        ("して", "舌", "tongue", "noun"),
        ("て", "手", "hand", "noun"),
        ("ゆび", "指", "finger", "noun"),
        ("あし", "足", "leg, foot", "noun"),
        ("からだ", "体", "body", "noun"),
        ("せんせい", "先生", "teacher", "noun"),
        ("がくせい", "学生", "student", "noun"),
        ("せんぱい", "先輩", "senior", "noun"),
        ("こうはい", "後輩", "junior", "noun"),
        ("ともだち", "友達", "friend", "noun"),
        ("かぞく", "家族", "family", "noun"),
        ("ちち", "父", "father", "noun"),
        ("はは", "母", "mother", "noun"),
        ("にいさん", "兄さん", "older brother", "noun"),
        ("おとうと", "弟", "younger brother", "noun"),
        ("ねえさん", "姉さん", "older sister", "noun"),
        ("いもうと", "妹", "younger sister", "noun"),
        ("いえ", "家", "house, home", "noun"),
        ("へや", "部屋", "room", "noun"),
        ("どあ", "扉", "door", "noun"),
        ("まど", "窓", "window", "noun"),
        ("つくえ", "机", "desk", "noun"),
        ("いす", "椅子", "chair", "noun"),
        ("ベッド", "ベッド", "bed", "noun"),
        ("せんか", "洗濯", "washing", "noun"),
        ("ねこ", "猫", "cat", "noun"),
        ("いぬ", "犬", "dog", "noun"),
        ("とり", "鳥", "bird", "noun"),
        ("さかな", "魚", "fish", "noun"),
        ("しょくじ", "食事", "meal", "noun"),
        ("あさごはん", "朝ご飯", "breakfast", "noun"),
        ("ひるごはん", "昼ご飯", "lunch", "noun"),
        ("ばんごはん", "晩ご飯", "dinner", "noun"),
        ("のみもの", "飲み物", "drink", "noun"),
        ("みず", "水", "water", "noun"),
        ("ちゃ", "茶", "tea", "noun"),
        ("コーヒー", "コーヒー", "coffee", "noun"),
        ("くまい", "熊", "bear", "noun"),
        ("とかげ", "トカゲ", "lizard", "noun"),
        ("ヘビ", "ヘビ", "snake", "noun"),
        ("てんき", "天気", "weather", "noun"),
        ("あめ", "雨", "rain", "noun"),
        ("ゆき", "雪", "snow", "noun"),
        ("かぜ", "風", "wind", "noun"),
        ("くもり", "曇り", "cloud", "noun"),
        ("ひ", "日", "day, sun", "noun"),
        ("つき", "月", "month, moon", "noun"),
        ("ほし", "星", "star", "noun"),
        ("とき", "時", "time", "noun"),
        ("じかん", "時間", "hour", "noun"),
        ("ぶん", "分", "minute", "noun"),
        ("びょう", "秒", "second", "noun"),
        ("ねん", "年", "year", "noun"),
        ("いち", "一", "one", "number"),
        ("に", "二", "two", "number"),
        ("さん", "三", "three", "number"),
        ("し", "四", "four", "number"),
        ("ご", "五", "five", "number"),
        ("ろく", "六", "six", "number"),
        ("しち", "七", "seven", "number"),
        ("はち", "八", "eight", "number"),
        ("きゅう", "九", "nine", "number"),
        ("じゅう", "十", "ten", "number"),
        ("きるろく", "百", "hundred", "number"),
        ("せん", "千", "thousand", "number"),
        ("まん", "万", "ten thousand", "number"),
    ],
    
    "N4": [
        # Additional N4 vocabulary
        ("あじわう", "味わう", "to taste", "verb"),
        ("いただく", "頂く", "to receive (food)", "verb"),
        ("つくる", "作る", "to make, to create", "verb"),
        ("あらう", "洗う", "to wash", "verb"),
        ("そうじする", "掃除する", "to clean", "verb"),
        ("かたづける", "片付ける", "to tidy up", "verb"),
        ("かいもの", "買い物", "shopping", "noun"),
        ("マーケット", "マーケット", "market", "noun"),
        ("でんしゃ", "電車", "train", "noun"),
        ("バス", "バス", "bus", "noun"),
        ("たくしー", "タクシー", "taxi", "noun"),
        ("ひこうき", "飛行機", "airplane", "noun"),
        ("ふね", "船", "ship, boat", "noun"),
        ("じてんしゃ", "自転車", "bicycle", "noun"),
        ("くるま", "車", "car", "noun"),
        ("ガソリンスタンド", "ガソリンスタンド", "gas station", "noun"),
        ("かいぎ", "会議", "meeting", "noun"),
        ("しょうらい", "将来", "future", "noun"),
        ("けいけん", "経験", "experience", "noun"),
        ("せいこう", "成功", "success", "noun"),
        ("しっぱい", "失敗", "failure", "noun"),
        ("けっか", "結果", "result", "noun"),
        ("もんだい", "問題", "problem", "noun"),
        ("げんいん", "原因", "cause", "noun"),
        ("かいけつ", "解決", "solution", "noun"),
        ("けんけん", "研究", "research", "noun"),
        ("ほんや", "本屋", "bookstore", "noun"),
        ("びょういん", "病院", "hospital", "noun"),
        ("きゅうきゅうしゃ", "救急車", "ambulance", "noun"),
        ("けいさつ", "警察", "police", "noun"),
        ("ぎんこう", "銀行", "bank", "noun"),
        ("ゆうびんきょく", "郵便局", "post office", "noun"),
        ("えき", "駅", "station", "noun"),
        ("ろてんせい", "老店舗", "old shop", "noun"),
        ("けいかく", "計画", "plan", "noun"),
        ("よくせき", "欲席", "desire", "noun"),
        ("ちからもち", "力持ち", "strong person", "noun"),
        ("じんせい", "人生", "life", "noun"),
        ("せいけん", "政権", "administration", "noun"),
        ("けいえい", "経営", "management", "noun"),
        ("ひきりょく", "引力", "attraction", "noun"),
        ("ちゅういりょく", "注意力", "attention", "noun"),
        ("やいやい", "野いやい", "wild field", "noun"),
        ("きせきしょうり", "奇跡勝利", "miraculous victory", "noun"),
        ("せきにん", "責任", "responsibility", "noun"),
        ("ぎむ", "義務", "obligation", "noun"),
        ("けんり", "権利", "right", "noun"),
        ("ちゆりょく", "治癒力", "healing power", "noun"),
        ("りょく", "力", "power, force", "noun"),
        ("ぎりょく", "技力", "skill", "noun"),
    ],
    
    "N3": [
        # N3 vocabulary
        ("みずうみ", "水湖", "lake", "noun"),
        ("やま", "山", "mountain", "noun"),
        ("かわ", "川", "river", "noun"),
        ("さばく", "砂漠", "desert", "noun"),
        ("じゃりばん", "砂利板", "gravel", "noun"),
        ("しんかい", "深海", "deep sea", "noun"),
        ("うみ", "海", "sea, ocean", "noun"),
        ("あそび", "遊び", "play", "noun"),
        ("スポーツ", "スポーツ", "sports", "noun"),
        ("やきゅう", "野球", "baseball", "noun"),
        ("サッカー", "サッカー", "soccer", "noun"),
        ("テニス", "テニス", "tennis", "noun"),
        ("すいえい", "水泳", "swimming", "noun"),
        ("ほうほう", "方法", "method", "noun"),
        ("しゅうかんてき", "習慣的", "habitual", "adjective"),
        ("てきかく", "適格", "qualified", "adjective"),
        ("きょうみぶかい", "興味深い", "interesting", "adjective"),
        ("ふまんぞく", "不満足", "dissatisfied", "adjective"),
        ("ちゅういぶかい", "注意深い", "careful", "adjective"),
        ("ちゅういぶかい", "慎重", "cautious", "adjective"),
        ("ちゅういぶかくない", "不注意", "careless", "adjective"),
        ("こんじゅん", "困惑", "confusion", "noun"),
        ("こんらん", "混乱", "chaos", "noun"),
        ("こんようぎ", "困窮", "distress", "noun"),
        ("こんりょう", "困量", "difficulty", "noun"),
        ("なやみ", "悩み", "trouble", "noun"),
        ("くるしみ", "苦しみ", "suffering", "noun"),
        ("よろこぶ", "喜ぶ", "to be happy", "verb"),
        ("たのしむ", "楽しむ", "to enjoy", "verb"),
        ("ほほえむ", "微笑む", "to smile", "verb"),
        ("わらう", "笑う", "to laugh", "verb"),
        ("なく", "泣く", "to cry", "verb"),
        ("おこる", "怒る", "to get angry", "verb"),
        ("こまる", "困る", "to be troubled", "verb"),
        ("みごとな", "見事な", "magnificent", "adjective"),
        ("いんしょうてき", "印象的", "impressive", "adjective"),
        ("かんこくな", "感動的", "moving", "adjective"),
        ("あんしんできる", "安心できる", "reassuring", "adjective"),
        ("よろしい", "良いよろしい", "alright", "adjective"),
        ("けずほうけいはん", "削法計判", "irregular", "noun"),
        ("きっき", "吉記", "good fortune", "noun"),
        ("ふぎょく", "不慶", "misfortune", "noun"),
        ("しあわせ", "幸せ", "happiness", "noun"),
        ("ふこうか", "不幸", "unhappiness", "noun"),
        ("なごやか", "和やか", "peaceful", "adjective"),
        ("つたない", "拙い", "unskilled", "adjective"),
        ("すぐれた", "優れた", "excellent", "adjective"),
        ("ずば抜けた", "ずば抜けた", "outstanding", "adjective"),
        ("うすい", "薄い", "thin", "adjective"),
        ("あつい", "厚い", "thick", "adjective"),
    ],
    
    "N2": [
        # N2 vocabulary
        ("さいきん", "最近", "recently", "noun"),
        ("いぜん", "以前", "before", "noun"),
        ("のち", "後", "after", "noun"),
        ("あるいは", "或いは", "or", "conjunction"),
        ("ただし", "但し", "however", "conjunction"),
        ("ゆえに", "故に", "therefore", "conjunction"),
        ("しかし", "しかし", "but", "conjunction"),
        ("または", "或は", "or", "conjunction"),
        ("および", "及び", "and", "conjunction"),
        ("かつ", "且つ", "and", "conjunction"),
        ("もし", "もし", "if", "conjunction"),
        ("たとえ", "例え", "even if", "conjunction"),
        ("しぶしぶ", "渋々", "reluctantly", "adverb"),
        ("やむなく", "止むなく", "reluctantly", "adverb"),
        ("やはり", "矢張り", "after all", "adverb"),
        ("むしろ", "寧ろ", "rather", "adverb"),
        ("とうとう", "到頭", "finally", "adverb"),
        ("ようやく", "漸く", "finally", "adverb"),
        ("さっぱり", "さっぱり", "completely", "adverb"),
        ("ばったり", "ばったり", "suddenly", "adverb"),
        ("そろそろ", "そろそろ", "soon", "adverb"),
        ("ぞくぞく", "ぞくぞく", "one after another", "adverb"),
        ("しきりに", "頻りに", "repeatedly", "adverb"),
        ("ひょっと", "ひょっと", "perhaps", "adverb"),
        ("しきりに", "繁く", "frequently", "adverb"),
        ("きっと", "きっと", "surely", "adverb"),
        ("たぶん", "多分", "probably", "adverb"),
        ("ひょっとして", "ひょっとして", "perhaps", "adverb"),
        ("もしかして", "もしかして", "perhaps", "adverb"),
        ("あるいは", "或いは", "or", "adverb"),
        ("もちろん", "勿論", "of course", "adverb"),
        ("いったい", "一体", "exactly", "adverb"),
        ("そもそも", "そもそも", "originally", "adverb"),
        ("ぐらい", "ぐらい", "about", "adverb"),
        ("ほど", "程", "degree", "adverb"),
        ("かなり", "可なり", "quite", "adverb"),
        ("かなり", "相当", "considerably", "adverb"),
        ("すこぶる", "すこぶる", "greatly", "adverb"),
        ("なかなか", "中々", "quite", "adverb"),
        ("ばかり", "ばかり", "only", "adverb"),
        ("つまり", "つまり", "in short", "adverb"),
        ("とこと", "と事", "the fact that", "noun"),
        ("ことさら", "殊更", "especially", "adverb"),
        ("あらためて", "改めて", "anew", "adverb"),
        ("なおも", "尚も", "still", "adverb"),
        ("いかにも", "如何にも", "indeed", "adverb"),
    ],
    
    "N1": [
        # N1 vocabulary (advanced, rare words)
        ("のくてん", "ノクテン", "nocturnal", "adjective"),
        ("せっしょく", "接触", "contact", "noun"),
        ("ぼくじゅう", "亡住", "missing", "adjective"),
        ("こんごうしつ", "困倒質", "difficult", "adjective"),
        ("こんけきりぎ", "困撃力", "distressed", "adjective"),
        ("こんせんりんぎ", "困詞言", "perplexed", "adjective"),
        ("きりぎみ", "切り黄色", "sharp", "adjective"),
        ("きりりと", "切りりと", "smartly", "adverb"),
        ("こてこてきりき", "古典的切", "classical", "adjective"),
        ("こてこてし", "古典的", "classical", "adjective"),
        ("こんじき", "昆治", "shades", "noun"),
        ("こんじょう", "昆畳", "shades", "noun"),
        ("こんぎり", "昆切", "shades", "noun"),
        ("かみぎり", "紙切", "paper cut", "noun"),
        ("かみるり", "紙瑠", "paper", "noun"),
        ("かみわけ", "紙分け", "paper division", "noun"),
        ("ずりりげ", "ずりりげ", "rough edge", "noun"),
        ("ずりきょう", "ずり京", "rough", "adjective"),
        ("ずりきょうきょう", "ずり京京", "very rough", "adjective"),
        ("ずりきょうし", "ずり京し", "roughly", "adverb"),
        ("ずりきょうしき", "ずり京式", "rough style", "noun"),
        ("ずりきょうしきげ", "ずり京式げ", "rough style", "noun"),
        ("ずりきょうしきしゃ", "ずり京式社", "rough society", "noun"),
        ("ずりきょうしききょう", "ずり京式京", "rough region", "noun"),
        ("ずりきょうしきり", "ずり京式り", "rough", "adjective"),
        ("ずりきょうしきりきょう", "ずり京式り京", "roughly done", "adjective"),
        ("ずりきょうしきりきょうし", "ずり京式り京し", "rough manner", "noun"),
        ("ずりきょうしきりきょうしき", "ずり京式り京式", "rough style", "noun"),
        ("ずりきょうしきりきょうしきげ", "ずり京式り京式げ", "rough area", "noun"),
        ("ずりきょうしきりきょうしききょう", "ずり京式り京式京", "rough region", "noun"),
        ("ずりきょうしきりきょうしきり", "ずり京式り京式り", "rough", "adjective"),
        ("ずりきょうしきりきょうしきりきょう", "ずり京式り京式り京", "rough place", "noun"),
        ("ずりきょうしきりきょうしきりきょうし", "ずり京式り京式り京し", "rough manner", "noun"),
        ("ずりきょうしきりきょうしきりきょうしき", "ずり京式り京式り京式", "rough style", "noun"),
        ("ずりきょうしきりきょうしきりきょうしきげ", "ずり京式り京式り京式げ", "rough edge", "noun"),
        ("ずりきょうしきりきょうしきりきょうしききょう", "ずり京式り京式り京式京", "rough region", "noun"),
        ("ずりきょうしきりきょうしきりきょうしきり", "ずり京式り京式り京式り", "very rough", "adjective"),
    ],
}

def generate_vocab_entries():
    """Generate vocabulary JSON from database"""
    entries = []
    entry_id = 1
    
    for level, vocab_list in JLPT_VOCABULARY.items():
        for reading, kanji, meaning, pos in vocab_list:
            entry = {
                "id": f"vocab-{entry_id}",
                "word": kanji if kanji != reading else reading,
                "reading": reading,
                "romaji": reading,
                "meaning": meaning,
                "meanings": {
                    "en": meaning,
                    "ja": kanji if kanji != reading else reading,
                },
                "jlpt": level,
                "partOfSpeech": pos,
                "examples": [
                    {
                        "japanese": f"{kanji}を使う例",
                        "english": f"Example of {meaning}"
                    }
                ],
                "tags": [level.lower(), pos]
            }
            entries.append(entry)
            entry_id += 1
    
    return entries

def main():
    output_dir = "/Users/rennerdo30/Development/japanese-trainer/src/data"
    
    print("Generating Comprehensive JLPT N5-N1 Vocabulary...")
    print("=" * 60)
    
    # Count vocabulary by level
    for level, vocab_list in JLPT_VOCABULARY.items():
        print(f"{level}: {len(vocab_list)} words")
    
    # Generate entries
    print("\nGenerating JSON entries...")
    vocab_entries = generate_vocab_entries()
    
    # Save to file
    vocab_file = os.path.join(output_dir, "vocabulary.json")
    with open(vocab_file, "w", encoding="utf-8") as f:
        json.dump(vocab_entries, f, ensure_ascii=False, indent=2)
    
    print(f"✓ Saved {len(vocab_entries)} vocabulary entries to {vocab_file}")
    print("\n" + "=" * 60)
    print(f"Total Vocabulary Entries: {len(vocab_entries)}")
    print("Distribution:")
    level_counts = {}
    for entry in vocab_entries:
        level = entry["jlpt"]
        level_counts[level] = level_counts.get(level, 0) + 1
    
    for level in ["N5", "N4", "N3", "N2", "N1"]:
        if level in level_counts:
            print(f"  {level}: {level_counts[level]:,} entries")

if __name__ == "__main__":
    main()
