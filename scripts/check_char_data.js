const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../public/data/ja/characters.json');

try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    // Find "ba" - usually "ば" or in romaji "ba"
    // Based on previous file reads, it has "char" and "romaji"/"romanization"

    console.log("Searching for 'ba' (ば)...");

    const results = data.filter(c =>
        c.char === 'ば' ||
        c.romaji === 'ba' ||
        c.romanization === 'ba'
    );

    if (results.length === 0) {
        console.log("No entry found for 'ba'!");
    } else {
        results.forEach(c => {
            console.log('--- FOUND ---');
            console.log(`Char: ${c.char}`);
            console.log(`Romaji: ${c.romaji || c.romanization}`);
            console.log(`AudioURL (camel): ${c.audioUrl}`);
            console.log(`AudioURL (snake): ${c.audio_url}`);
            console.log('Full entry:', JSON.stringify(c, null, 2));
        });
    }
} catch (err) {
    console.error("Error reading file:", err);
}
