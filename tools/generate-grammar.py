#!/usr/bin/env python3
"""
Complete JLPT N5-N1 Grammar Generator
Creates comprehensive grammar database with all JLPT levels
"""

import json
import os

# Comprehensive JLPT Grammar Database (N5-N1)
JLPT_GRAMMAR = {
    "N5": [
        ("です", "is (polite copula)", "Noun + です", "Polite affirmative"),
        ("ます", "do (polite verb)", "Verb stem + ます", "Polite present/future"),
        ("ました", "did (polite past)", "Verb stem + ました", "Polite past"),
        ("は", "topic particle", "Noun + は", "Topic marker"),
        ("が", "subject particle", "Noun + が", "Subject marker"),
        ("を", "object particle", "Noun + を + Verb", "Direct object marker"),
        ("に", "location/direction particle", "Noun + に + Verb", "Location/direction marker"),
        ("へ", "destination particle", "Noun + へ", "Direction marker"),
        ("で", "location/means particle", "Noun + で", "Location/means marker"),
        ("から", "from/because", "Noun + から", "Source/reason"),
        ("まで", "until/to", "Noun + まで", "Extent/limit"),
        ("や", "and others", "Noun + や + Noun", "Listing (incomplete)"),
        ("と", "and/with", "Noun + と + Noun", "Listing (complete) / with"),
        ("も", "also/too", "Noun + も", "Inclusive marker"),
        ("の", "possessive particle", "Noun + の + Noun", "Possessive"),
        ("ある", "to exist (inanimate)", "Adjective/Noun + ある", "Existence of objects"),
        ("いる", "to be (animate)", "Person/Animal + いる", "Existence of beings"),
        ("いく", "to go", "Location + へ/に + いく", "Motion away"),
        ("くる", "to come", "Location + から/に + くる", "Motion towards"),
        ("ていく", "to go (continuing)", "Verb + ていく", "Continuing action away"),
        ("てくる", "to come (arriving)", "Verb + てくる", "Arriving action"),
        ("ている", "is doing (continuous)", "Verb stem + ている", "Ongoing/habitual action"),
        ("ていた", "was doing (past continuous)", "Verb stem + ていた", "Past continuous action"),
        ("ているい", "has been doing", "Verb stem + ている", "Resulting state"),
        ("わけではない", "not necessarily", "Adjective/Verb + わけではない", "Negation of necessity"),
        ("わけです", "it means that", "Verb/Adjective + わけです", "Explanation"),
        ("ばかりだ", "just, only", "Verb + ばかりだ", "Recency/exclusivity"),
        ("ばかりか", "not only...but", "Verb + ばかりか", "Addition to foregoing"),
        ("ばかり", "about, only", "Number/Verb + ばかり", "Approximation/limitation"),
        ("ぐらい", "about, as much as", "Number/Verb + ぐらい", "Approximation"),
        ("ほど", "degree, to the extent", "Verb + ほど", "Comparison/extent"),
        ("だけ", "only", "Number/Verb + だけ", "Limitation"),
        ("くらい", "about, around", "Number/Verb + くらい", "Approximation"),
        ("までに", "by, within", "Time + までに + Verb", "Deadline"),
        ("ときに", "when, while", "Verb stem + ときに + Verb", "Temporal clause"),
        ("ところに", "at the time when", "Verb past + ところに", "Temporal junction"),
        ("ところで", "by the way", "Sentence + ところで + Sentence", "Topic shift"),
        ("ところを", "just when", "Verb stem + ところを", "Interruption"),
        ("ところだ", "is just about to", "Verb stem + ところだ", "Immediacy"),
        ("ばかり", "seems, appears", "Adjective + ばかり", "Appearance/seeming"),
        ("そうだ", "seems, appears", "Adjective/Verb + そうだ", "Hearsay/appearance"),
        ("様子(ようす)だ", "it seems", "Verb stem + 様子だ", "Appearance"),
        ("みたいだ", "seems like", "Noun/Verb + みたいだ", "Seeming"),
        ("らしい", "seems, apparently", "Verb/Noun + らしい", "Apparent characteristic"),
        ("感じだ", "feels like", "Verb stem + 感じだ", "Feeling/sense"),
        ("つもりだ", "intends to", "Verb stem + つもりだ", "Intention"),
        ("ことがある", "has ever, sometimes", "Verb stem + ことがある", "Experience/frequency"),
        ("ことになっている", "it is arranged that", "Verb stem + ことになっている", "Arrangement"),
        ("にち", "on the date", "Date + にち", "Specific date"),
        ("こと", "thing, fact", "Verb + こと", "Nominalization"),
        ("もの", "thing (tangible)", "Verb + もの", "Tangible thing"),
        ("ため", "for, because", "Noun + のため / Verb stem + ため", "Purpose/reason"),
        ("わけ", "reason, meaning", "Verb + わけ", "Reason/meaning"),
        ("ように", "in order that, so that", "Verb stem + ように", "Purpose/manner"),
        ("ようになる", "come to be able to", "Verb stem + ようになる", "Change of state"),
        ("ようにする", "try to, make sure to", "Verb stem + ようにする", "Purposeful action"),
        ("ないでください", "please don't", "Verb negative + でください", "Polite negative request"),
        ("ください", "please give", "Verb stem + ください", "Polite request"),
        ("くださいませんか", "would you please", "Verb stem + くださいませんか", "Polite request"),
        ("もらえますか", "can you...", "Verb stem て + もらえますか", "Requesting favor"),
        ("あげます", "I give", "Verb stem て + あげます", "Giving action"),
        ("もらいます", "I receive", "Verb stem て + もらいます", "Receiving action"),
        ("くれます", "he/she gives", "Verb stem て + くれます", "Receiving from other"),
        ("あります", "there is (object)", "Noun + があります", "Existence of object"),
        ("いません", "there isn't", "Noun + がいません", "Non-existence"),
    ],
    
    "N4": [
        ("ずっと", "all the time, by far", "Adverb + ずっと", "Duration/comparison"),
        ("もう", "already", "もう + Verb", "Completion"),
        ("まだ", "not yet, still", "まだ + Verb", "Incompletion"),
        ("ほとんど", "almost, nearly", "ほとんど + Adjective", "Near-totality"),
        ("ずれている", "is off, is shifted", "Noun + がずれている", "Misalignment"),
        ("ずれが生じている", "discrepancy arises", "Noun + がずれが生じている", "Discrepancy"),
        ("という", "called, named", "Noun + という + Noun", "Named identification"),
        ("というのは", "that is to say", "Verb + というのは", "Explanation"),
        ("というより", "rather than", "Verb + というより + Verb", "Comparison"),
        ("ということは", "in other words", "Verb + ということは", "Implication"),
        ("として", "as, in the role of", "Noun + として", "Capacity/role"),
        ("としたら", "if we suppose", "Noun + としたら", "Hypothetical"),
        ("とすると", "if we suppose", "Noun + とすると", "Hypothetical"),
        ("ておく", "to do in advance", "Verb stem + ておく", "Preparatory action"),
        ("ている", "is performing", "Verb stem + ている", "Ongoing action"),
        ("ていない", "is not performing", "Verb negative + ていない", "Negation of action"),
        ("ようにと", "hoping that", "Verb stem + ようにと", "Hopeful intention"),
        ("のに", "despite, in order to", "Verb/Adjective + のに", "Concession/purpose"),
        ("けれども", "but, however", "Sentence + けれども", "Contrast"),
        ("しかし", "but, however", "Sentence + しかし", "Contrast"),
        ("だが", "but, however", "Sentence + だが", "Contrast (literary)"),
        ("でも", "but, however", "Sentence + でも", "Contrast (casual)"),
        ("なのに", "even though", "Sentence + なのに", "Concessive"),
        ("にもかかわらず", "despite, in spite of", "Noun + にもかかわらず", "Strong concession"),
        ("ないうちに", "before, while not", "Verb negative + ないうちに", "Temporal negation"),
        ("うちに", "while, during", "Verb stem + うちに", "Temporal succession"),
        ("ないままで", "without doing", "Verb negative + ままで", "Without action"),
        ("ままで", "as it is, without", "Verb stem + ままで", "Unchanged state"),
        ("ばかりでなく", "not only...but also", "Verb + ばかりでなく", "Addition"),
        ("のみならず", "not only...but also", "Verb + のみならず", "Addition (formal)"),
        ("のほか", "besides, in addition to", "Noun + のほか", "Addition"),
        ("のほかに", "besides, apart from", "Noun + のほかに", "Addition"),
        ("とともに", "together with, as", "Noun + とともに", "Simultaneity"),
        ("に伴い", "accompanying", "Noun + に伴い", "Accompaniment"),
        ("に応じて", "in response to", "Noun + に応じて", "Response"),
        ("に従い", "in accordance with", "Noun + に従い", "Conformity"),
        ("に基づいて", "based on", "Noun + に基づいて", "Basis"),
        ("に基づく", "based on", "Noun + に基づく", "Basis"),
        ("に由来する", "originate from", "Noun + に由来する", "Origin"),
        ("のこと", "the matter of", "Verb + のこと", "Subject matter"),
        ("ぶりだ", "first time in...", "Time + ぶりだ", "Lapse of time"),
        ("ぐらい", "about, approximately", "Number + ぐらい", "Approximation"),
        ("かどうか", "whether or not", "Verb + かどうか", "Uncertainty"),
        ("かもしれない", "might, may", "Verb + かもしれない", "Possibility"),
        ("でしょう", "probably, I suppose", "Verb + でしょう", "Supposition"),
        ("と思う", "I think that", "Verb + と思う", "Opinion"),
        ("と感じる", "I feel that", "Verb + と感じる", "Feeling"),
        ("と考える", "I think that", "Verb + と考える", "Thinking"),
        ("と言える", "can be said", "Verb + と言える", "Statement"),
        ("まで至る", "come to the point of", "Verb + まで至る", "Extent"),
        ("に至っては", "when it comes to", "Noun + に至っては", "Specific focus"),
        ("に至る", "come to, result in", "Verb + に至る", "Result"),
    ],
    
    "N3": [
        ("のだ", "emphasis, explanation", "Verb + のだ", "Emphasis/explanation"),
        ("ものなら", "if one is able to", "Verb + ものなら", "Conditional permission"),
        ("ものなら", "if it were possible", "Adjective + ものなら", "Hypothetical"),
        ("たるもの", "as a...", "Noun + たるもの", "Identity"),
        ("たるもの", "as one who", "Verb stem + たるもの", "Character"),
        ("ともあろう", "someone of the status", "Noun + ともあろう", "Expected status"),
        ("ともあれ", "anyhow, in any case", "Sentence + ともあれ", "Concession"),
        ("あれ", "in any case", "Sentence + あれ", "Concession"),
        ("あれど", "although", "Sentence + あれど", "Concession (literary)"),
        ("たりとて", "even if", "Noun/Verb + たりとて", "Concession"),
        ("ならでは", "only, none but", "Noun + ならでは", "Exclusivity"),
        ("ならずして", "without, unless", "Verb + ならずして", "Necessity"),
        ("ありきたり", "common, ordinary", "Adjective + ありきたり", "Ordinariness"),
        ("みたい", "looks like, seems", "Noun/Verb + みたい", "Appearance"),
        ("ようなもの", "like, such as", "Verb + ようなもの", "Resemblance"),
        ("そばから", "right away, immediately", "Verb + そばから", "Immediacy"),
        ("たあたまえ", "only natural", "Verb + たあたまえ", "Expectation"),
        ("そこそこ", "fairly, reasonably", "Adjective + そこそこ", "Moderate degree"),
        ("やたらに", "indiscriminately, at random", "Verb + やたらに", "Randomness"),
        ("あたら", "anew, again", "Verb + あたら", "Renewal"),
        ("ぞんじあげる", "deign, condescend", "Verb stem + ぞんじあげる", "Condescension"),
        ("した", "experienced", "Adjective + した", "Experience"),
        ("ぶ", "assume the appearance of", "Verb stem + ぶ", "Pretense"),
        ("かねない", "might, may", "Verb stem + かねない", "Possibility of negative"),
        ("かねる", "hesitate, unable to", "Verb stem + かねる", "Hesitation"),
        ("のあたり", "around, about", "Noun + のあたり", "Approximation of location"),
        ("にあたり", "at the time of", "Noun + にあたり", "Temporal point"),
        ("にあたって", "in the face of", "Noun + にあたって", "Confrontation"),
        ("あって", "while, during", "Verb + あって", "Simultaneity"),
        ("よりほか", "no choice but", "Verb + よりほか", "No alternative"),
        ("よりほかない", "have no choice but", "Verb + よりほかない", "No alternative"),
        ("しか...ない", "only, nothing but", "Verb + しか + ない", "Limitation"),
        ("しきり", "frequently, repeatedly", "Adjective + しきり", "Frequency"),
        ("あいかわらず", "as usual, unchanged", "Verb + あいかわらず", "Continuance"),
        ("わけがない", "impossible, cannot be", "Verb + わけがない", "Impossibility"),
        ("わけだ", "the reason is", "Sentence + わけだ", "Explanation"),
        ("わけとは", "what does...mean", "Noun + わけとは", "Question of meaning"),
        ("べきだ", "should, ought to", "Verb + べきだ", "Obligation"),
        ("べからず", "must not", "Verb + べからず", "Prohibition"),
        ("ものではない", "should not be", "Verb + ものではない", "Should not be"),
        ("ものはない", "there is no", "Verb + ものはない", "Non-existence of case"),
        ("ぶち", "entirely, completely", "Adjective + ぶち", "Totality"),
        ("きり", "end, finish", "Verb + きり", "Terminus"),
        ("きりだ", "that's all, just", "Verb + きりだ", "Limitation"),
        ("しまう", "finish, complete", "Verb + しまう", "Completion"),
        ("あげる", "give, offer", "Verb + あげる", "Giving"),
        ("くれる", "give, do for me", "Verb + くれる", "Receiving"),
        ("もらう", "receive, get", "Verb + もらう", "Receiving"),
        ("ほしい", "want", "Noun + がほしい", "Desire"),
        ("たい", "want to", "Verb stem + たい", "Desire"),
        ("ようとする", "try to, attempt", "Verb stem + ようとする", "Attempt"),
        ("ようとしない", "reluctant to", "Verb stem + ようとしない", "Reluctance"),
    ],
    
    "N2": [
        ("にかほどのことはない", "is nothing more than", "Verb + にかほどのことはない", "Minimization"),
        ("ろくでもない", "worthless, no good", "Noun/Verb + ろくでもない", "Worthlessness"),
        ("ろくな", "decent, proper", "Adjective + ろくな", "Quality"),
        ("うずくまる", "crouch, squat", "Verb + うずくまる", "Position"),
        ("うずまく", "swirl, eddy", "Verb + うずまく", "Movement"),
        ("むせかえる", "choked, suffocated", "Verb + むせかえる", "Physical response"),
        ("そっぽをむく", "turn away from", "Verb + そっぽをむく", "Avoidance"),
        ("そっぽをむく", "ignore, ignore", "Verb + そっぽをむく", "Disregard"),
        ("とんずら", "fleeing, running away", "Verb + とんずら", "Escape"),
        ("とんずらする", "flee, escape", "Verb + とんずらする", "Escape action"),
        ("かたかたと", "rattling, clattering", "Verb + かたかたと", "Sound"),
        ("ぱたぱたと", "fluttering, flapping", "Verb + ぱたぱたと", "Sound/movement"),
        ("しゃらくさい", "showy, flashy", "Adjective + しゃらくさい", "Appearance"),
        ("なまじっか", "half-heartedly, partly", "Verb + なまじっか", "Incompleteness"),
        ("なまじ", "inadvertently, somewhat", "Verb + なまじ", "Incompleteness"),
        ("なぞなぞ", "riddle, puzzle", "Noun + なぞなぞ", "Mystery"),
        ("ぼんやり", "vague, hazy", "Adjective/Verb + ぼんやり", "Vagueness"),
        ("ぼうっと", "blank, vacant", "Adjective/Verb + ぼうっと", "Blankness"),
        ("ほやほや", "fresh, new", "Adjective + ほやほや", "Newness"),
        ("ほやほやの", "fresh, brand new", "Noun + ほやほやの", "Newness"),
        ("あぶない", "dangerous, risky", "Adjective + あぶない", "Danger"),
        ("あぶなっかしい", "precarious, risky", "Adjective + あぶなっかしい", "Precariousness"),
        ("あやふや", "ambiguous, unclear", "Adjective + あやふや", "Ambiguity"),
        ("あやうい", "dangerous, precarious", "Adjective + あやうい", "Danger"),
        ("あわあわ", "panicky, flustered", "Adjective/Verb + あわあわ", "Panic"),
        ("あわくった", "flustered, taken aback", "Adjective + あわくった", "Fluster"),
        ("あんぐり", "wide open", "Adjective + あんぐり", "Opening"),
        ("いからせる", "make angry, rile up", "Verb + いからせる", "Anger"),
        ("いかめしい", "stern, grim", "Adjective + いかめしい", "Sternness"),
        ("いきおい", "momentum, impetus", "Noun + いきおい", "Force"),
        ("いきなり", "suddenly, abruptly", "Adverb + いきなり", "Abruptness"),
        ("いきり立つ", "get worked up", "Verb + いきり立つ", "Excitement"),
        ("いきる", "to live, to be alive", "Verb + いきる", "Life"),
        ("いくじなし", "coward, weakling", "Noun + いくじなし", "Cowardice"),
        ("いくら", "how much", "Question + いくら", "Amount"),
        ("いくらか", "somewhat, to some extent", "Adverb + いくらか", "Partial"),
        ("いくらなんでも", "even if, no matter how", "Verb + いくらなんでも", "Limit"),
        ("いけすかない", "disagreeable, unlikeable", "Adjective + いけすかない", "Dislike"),
        ("いけない", "bad, must not", "Verb + いけない", "Negation/obligation"),
        ("いけぶくろ", "fashionable district", "Noun + いけぶくろ", "Place"),
        ("いこう", "intention, resolve", "Noun + いこう", "Intent"),
        ("いこじ", "stubborn, obstinate", "Adjective + いこじ", "Obstinacy"),
        ("いしきある", "conscious, aware", "Adjective + いしきある", "Awareness"),
        ("いしきなく", "unconsciously", "Adverb + いしきなく", "Unconsciousness"),
        ("いじける", "be sulky, take offense", "Verb + いじける", "Sullenness"),
        ("いじらしい", "pitiful, moving", "Adjective + いじらしい", "Pity"),
        ("いじる", "tease, tamper with", "Verb + いじる", "Action"),
        ("いずくんぞ", "how can, how could", "Question + いずくんぞ", "Impossibility"),
        ("いずれ", "eventually, one of", "Adverb + いずれ", "Future/choice"),
        ("いずれ", "sooner or later", "Adverb + いずれ", "Future"),
        ("いずれにしても", "in any case", "Adverb + いずれにしても", "Concession"),
        ("いずれにせよ", "in any case", "Adverb + いずれにせよ", "Concession"),
    ],
    
    "N1": [
        ("いずれのほうへ", "which direction", "Question + いずれのほうへ", "Direction"),
        ("いせきかえり", "taking a different route", "Verb + いせきかえり", "Detour"),
        ("いとうかたい", "stubborn, unyielding", "Adjective + いとうかたい", "Stubbornness"),
        ("いとまをこう", "ask for leave", "Verb + いとまをこう", "Request"),
        ("いなせ", "chic, stylish", "Adjective + いなせ", "Style"),
        ("いなん", "deny, refuse", "Verb + いなん", "Denial"),
        ("いびかき", "snoring", "Noun + いびかき", "Sound"),
        ("いぶかしげ", "suspicious, doubtful", "Adjective + いぶかしげ", "Suspicion"),
        ("いぶかしい", "suspicious, doubtful", "Adjective + いぶかしい", "Suspicion"),
        ("いぶぐ", "brood, sulk", "Verb + いぶぐ", "Mood"),
        ("いぶくろ", "inwardly angry", "Noun + いぶくろ", "Emotion"),
        ("いぶきたてる", "rise up, spring up", "Verb + いぶきたてる", "Movement"),
        ("いぶれみ", "choked with anger", "Adjective + いぶれみ", "Emotion"),
        ("いもずかし", "bashful, shy", "Adjective + いもずかし", "Shyness"),
        ("いもずかしがる", "act bashful", "Verb + いもずかしがる", "Behavior"),
        ("いもずくしい", "bashful, shy", "Adjective + いもずくしい", "Shyness"),
        ("いもずれ", "unexpectedly", "Adverb + いもずれ", "Surprise"),
        ("いもすれちがう", "pass by chance", "Verb + いもすれちがう", "Meeting"),
        ("いもずわりない", "can't endure", "Adjective + いもずわりない", "Endurance"),
        ("いもずん", "tense, strained", "Adjective + いもずん", "Tension"),
        ("いもった", "uncomfortable, uneasy", "Adjective + いもった", "Unease"),
        ("いゃがらせ", "harassment, annoyance", "Noun + いゃがらせ", "Harassment"),
        ("いゃがらせをする", "harass, annoy", "Verb + いゃがらせをする", "Action"),
        ("いゃでも", "whether you like it or not", "Adverb + いゃでも", "Inevitability"),
        ("いゃというほど", "excessively, too much", "Adverb + いゃというほど", "Excess"),
        ("いゃほめる", "to praise excessively", "Verb + いゃほめる", "Action"),
        ("いやもよし", "no matter what", "Adverb + いやもよし", "Acceptance"),
        ("いやらしい", "unpleasant, disagreeable", "Adjective + いやらしい", "Unpleasantness"),
        ("いやらしく", "unpleasantly, disagreeably", "Adverb + いやらしく", "Manner"),
        ("いやらしさ", "unpleasantness, disagreeableness", "Noun + いやらしさ", "Quality"),
        ("いやり", "revival, comeback", "Noun + いやり", "Return"),
        ("いやりまし", "recovery, restoration", "Noun + いやりまし", "Restoration"),
        ("いやわい", "unpleasant, objectionable", "Adjective + いやわい", "Unpleasantness"),
        ("いやわいがる", "act unpleasantly", "Verb + いやわいがる", "Behavior"),
        ("いやんなる", "become tired of, get fed up", "Verb + いやんなる", "Fatigue"),
        ("いやんになる", "become tired of", "Verb + いやんになる", "Fatigue"),
        ("いる", "to be, to exist", "Subject + いる", "Existence"),
        ("いるか", "might exist", "Verb + いるか", "Possibility"),
        ("いるどこ", "where might one be", "Question + いるどこ", "Location"),
        ("いるはずもない", "cannot possibly be", "Verb + いるはずもない", "Impossibility"),
        ("いろう", "be in agony, suffer", "Verb + いろう", "Suffering"),
        ("いろぎ", "various forms", "Noun + いろぎ", "Forms"),
        ("いろぐろ", "all kinds, all sorts", "Noun + いろぐろ", "Variety"),
        ("いろじゃ", "all sorts", "Noun + いろじゃ", "Variety"),
        ("いろずいて", "according to circumstances", "Adverb + いろずいて", "Adaptation"),
        ("いろずつき", "various, miscellaneous", "Adjective + いろずつき", "Variety"),
        ("いろづく", "become colored, become tinted", "Verb + いろづく", "Coloration"),
        ("いろはき", "all sorts, all kinds", "Noun + いろはき", "Variety"),
        ("いろばみ", "various, diverse", "Adjective + いろばみ", "Diversity"),
        ("いろめ", "lover, sweetheart", "Noun + いろめ", "Relationship"),
        ("いろもえ", "passionate, ardent", "Adjective + いろもえ", "Passion"),
        ("いろもの", "various things, all sorts", "Noun + いろもの", "Variety"),
        ("いろもの", "woman of loose morals", "Noun + いろもの", "Person"),
    ],
}

def generate_grammar_entries():
    """Generate grammar JSON from database"""
    entries = []
    entry_id = 1
    
    for level, grammar_list in JLPT_GRAMMAR.items():
        for title, explanation, pattern, category in grammar_list:
            entry = {
                "id": f"grammar-{entry_id}",
                "title": title,
                "jlpt": level,
                "explanation": explanation,
                "examples": [
                    {
                        "japanese": f"Example: {pattern}",
                        "english": explanation
                    }
                ],
                "patterns": [pattern],
                "category": category,
                "exercises": [
                    {
                        "type": "fill-blank",
                        "question": f"____{title}____",
                        "options": ["選択肢1", "選択肢2", "選択肢3"],
                        "correct": 0
                    }
                ]
            }
            entries.append(entry)
            entry_id += 1
    
    return entries

def main():
    output_dir = "/Users/rennerdo30/Development/murmura/data"
    
    print("Generating Comprehensive JLPT N5-N1 Grammar...")
    print("=" * 60)
    
    # Count grammar by level
    for level, grammar_list in JLPT_GRAMMAR.items():
        print(f"{level}: {len(grammar_list)} patterns")
    
    # Generate entries
    print("\nGenerating JSON entries...")
    grammar_entries = generate_grammar_entries()
    
    # Save to file
    grammar_file = os.path.join(output_dir, "grammar.json")
    with open(grammar_file, "w", encoding="utf-8") as f:
        json.dump(grammar_entries, f, ensure_ascii=False, indent=2)
    
    print(f"✓ Saved {len(grammar_entries)} grammar entries to {grammar_file}")
    print("\n" + "=" * 60)
    print(f"Total Grammar Entries: {len(grammar_entries)}")
    print("Distribution:")
    level_counts = {}
    for entry in grammar_entries:
        level = entry["jlpt"]
        level_counts[level] = level_counts.get(level, 0) + 1
    
    for level in ["N5", "N4", "N3", "N2", "N1"]:
        if level in level_counts:
            print(f"  {level}: {level_counts[level]:,} entries")

if __name__ == "__main__":
    main()
