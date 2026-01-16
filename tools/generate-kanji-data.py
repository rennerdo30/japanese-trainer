#!/usr/bin/env python3
"""
Generate complete JLPT kanji data using kotobase database.

Usage:
    source .venv/bin/activate
    python tools/generate-kanji-data.py

This script queries the kotobase SQLite database to generate a comprehensive
kanji.json file with all JLPT N5-N1 kanji, including:
- Kanji character
- Meanings (English)
- Onyomi readings (katakana)
- Kunyomi readings (hiragana)
- Stroke count
- JLPT level (N5-N1)
- Example words
"""

import sqlite3
import os
import json
import kotobase

def get_db_connection():
    """Get connection to kotobase SQLite database."""
    db_path = os.path.join(os.path.dirname(kotobase.__file__), 'db', 'kotobase.db')
    return sqlite3.connect(db_path)

def parse_readings(readings_str):
    """Parse comma-separated readings into a list."""
    if not readings_str:
        return []
    return [r.strip() for r in readings_str.split(',') if r.strip()]

def get_example_words(cursor, kanji):
    """Get example vocabulary words containing this kanji."""
    examples = []

    # Query jmdict for words containing this kanji
    cursor.execute("""
        SELECT DISTINCT jk.text, jkn.text, js.gloss
        FROM jmdict_kanji jk
        JOIN jmdict_kana jkn ON jk.entry_id = jkn.entry_id
        JOIN jmdict_senses js ON jk.entry_id = js.entry_id
        WHERE jk.text LIKE ?
        AND length(jk.text) >= 2
        AND length(jk.text) <= 4
        AND js.gloss IS NOT NULL
        LIMIT 3
    """, (f'%{kanji}%',))

    for row in cursor.fetchall():
        word, reading, meaning = row
        if word and reading and meaning:
            # Take first meaning (before semicolon or comma)
            meaning_text = meaning.split(';')[0].split(',')[0].strip()
            examples.append({
                "word": word,
                "reading": reading,
                "meaning": meaning_text
            })

    # If no examples found, create a basic one
    if not examples:
        examples.append({
            "word": kanji,
            "reading": "",
            "meaning": ""
        })

    return examples[:2]  # Return max 2 examples

def generate_kanji_json():
    """Generate kanji JSON data from kotobase database."""
    conn = get_db_connection()
    cursor = conn.cursor()

    kanji_list = []
    seen_kanji = set()  # Track kanji we've already added
    entry_id = 1

    # Strategy:
    # 1. For N5 and N4: Use kanjidic (jlpt=4 and jlpt=3) as primary source
    # 2. For N3, N2, N1: Use jlpt_kanji table as primary source
    # This gives us the most complete and accurate data

    # === N5 kanji from kanjidic (jlpt=4) ===
    print("Processing N5 (from kanjidic)...")
    cursor.execute("""
        SELECT literal, meanings, on_readings, kun_readings, stroke_count, grade
        FROM kanjidic
        WHERE jlpt = 4
        ORDER BY stroke_count, literal
    """)
    rows = cursor.fetchall()
    print(f"  Found {len(rows)} kanji")

    for row in rows:
        kanji_char, meanings, on_readings, kun_readings, strokes, grade = row
        if kanji_char in seen_kanji:
            continue
        seen_kanji.add(kanji_char)

        examples = get_example_words(cursor, kanji_char)
        entry = {
            "id": f"kanji-{entry_id}",
            "kanji": kanji_char,
            "meaning": meanings if meanings else "",
            "onyomi": parse_readings(on_readings),
            "kunyomi": parse_readings(kun_readings),
            "strokes": strokes if strokes else 0,
            "jlpt": "N5",
            "radicals": [],
            "examples": examples,
            "audioUrl": ""
        }
        kanji_list.append(entry)
        entry_id += 1

    # === N4 kanji from kanjidic (jlpt=3) ===
    print("Processing N4 (from kanjidic)...")
    cursor.execute("""
        SELECT literal, meanings, on_readings, kun_readings, stroke_count, grade
        FROM kanjidic
        WHERE jlpt = 3
        ORDER BY stroke_count, literal
    """)
    rows = cursor.fetchall()
    print(f"  Found {len(rows)} kanji")

    for row in rows:
        kanji_char, meanings, on_readings, kun_readings, strokes, grade = row
        if kanji_char in seen_kanji:
            continue
        seen_kanji.add(kanji_char)

        examples = get_example_words(cursor, kanji_char)
        entry = {
            "id": f"kanji-{entry_id}",
            "kanji": kanji_char,
            "meaning": meanings if meanings else "",
            "onyomi": parse_readings(on_readings),
            "kunyomi": parse_readings(kun_readings),
            "strokes": strokes if strokes else 0,
            "jlpt": "N4",
            "radicals": [],
            "examples": examples,
            "audioUrl": ""
        }
        kanji_list.append(entry)
        entry_id += 1

    # === N3, N2, N1 from jlpt_kanji table ===
    level_map = {3: "N3", 2: "N2", 1: "N1"}

    for jlpt_level in [3, 2, 1]:
        jlpt_name = level_map[jlpt_level]
        print(f"Processing {jlpt_name} (from jlpt_kanji)...")

        # Get kanji from jlpt_kanji table, join with kanjidic for details
        cursor.execute("""
            SELECT DISTINCT
                j.kanji,
                k.meanings,
                k.on_readings,
                k.kun_readings,
                k.stroke_count,
                k.grade
            FROM jlpt_kanji j
            LEFT JOIN kanjidic k ON j.kanji = k.literal
            WHERE j.level = ?
            AND j.kanji IS NOT NULL
            AND length(j.kanji) = 1
            ORDER BY COALESCE(k.stroke_count, 99), j.kanji
        """, (jlpt_level,))

        rows = cursor.fetchall()
        print(f"  Found {len(rows)} kanji")

        for row in rows:
            kanji_char, meanings, on_readings, kun_readings, strokes, grade = row

            # Skip if not a valid single kanji character
            if not kanji_char or len(kanji_char) != 1:
                continue

            # Skip if already added (from N5/N4)
            if kanji_char in seen_kanji:
                continue
            seen_kanji.add(kanji_char)

            # Parse meanings
            meaning_text = meanings if meanings else ""

            # Parse readings
            onyomi = parse_readings(on_readings)
            kunyomi = parse_readings(kun_readings)

            # Get example words
            examples = get_example_words(cursor, kanji_char)

            entry = {
                "id": f"kanji-{entry_id}",
                "kanji": kanji_char,
                "meaning": meaning_text,
                "onyomi": onyomi,
                "kunyomi": kunyomi,
                "strokes": strokes if strokes else 0,
                "jlpt": jlpt_name,
                "radicals": [],
                "examples": examples,
                "audioUrl": ""
            }

            kanji_list.append(entry)
            entry_id += 1

    conn.close()
    return kanji_list

def main():
    print("=" * 60)
    print("Generating JLPT Kanji Data from Kotobase")
    print("=" * 60)

    kanji_data = generate_kanji_json()

    # Count by level
    level_counts = {}
    for k in kanji_data:
        level = k['jlpt']
        level_counts[level] = level_counts.get(level, 0) + 1

    print("\n" + "=" * 60)
    print("Summary:")
    for level in ["N5", "N4", "N3", "N2", "N1"]:
        count = level_counts.get(level, 0)
        print(f"  {level}: {count} kanji")
    print(f"  Total: {len(kanji_data)} kanji")

    # Verify no duplicates
    kanji_chars = [k['kanji'] for k in kanji_data]
    unique_chars = set(kanji_chars)
    if len(kanji_chars) != len(unique_chars):
        print(f"\n  WARNING: Found {len(kanji_chars) - len(unique_chars)} duplicates!")
        # Remove duplicates, keeping first occurrence
        seen = set()
        unique_data = []
        for k in kanji_data:
            if k['kanji'] not in seen:
                seen.add(k['kanji'])
                unique_data.append(k)
        kanji_data = unique_data
        print(f"  After dedup: {len(kanji_data)} kanji")

        # Reassign IDs
        for i, k in enumerate(kanji_data, 1):
            k['id'] = f"kanji-{i}"

    # Save to file
    output_path = "src/data/ja/kanji.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(kanji_data, f, ensure_ascii=False, indent=2)

    print(f"\nSaved to: {output_path}")
    print("=" * 60)

if __name__ == "__main__":
    main()
