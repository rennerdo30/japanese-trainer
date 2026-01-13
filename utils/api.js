// External API integration for Japanese learning resources
// Jisho API, Tatoeba API, etc.

const JISHO_API = 'https://jisho.org/api/v1/search/words?keyword=';
const TATOEBA_API = 'https://tatoeba.org/en/api_v0/search?from=jpn&to=eng&query=';

// Cache for API responses
const apiCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Fetch with caching
async function fetchWithCache(url, cacheKey) {
    const cached = apiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const data = await response.json();
        apiCache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
    } catch (error) {
        console.error('API fetch error:', error);
        return null;
    }
}

// Search Jisho for word/kanji information
async function searchJisho(query) {
    const url = `${JISHO_API}${encodeURIComponent(query)}`;
    const cacheKey = `jisho_${query}`;
    
    const data = await fetchWithCache(url, cacheKey);
    if (!data || !data.data || data.data.length === 0) return null;
    
    const result = data.data[0];
    return {
        word: result.japanese[0]?.word || '',
        reading: result.japanese[0]?.reading || '',
        meanings: result.senses.map(sense => ({
            english: sense.english_definitions,
            partOfSpeech: sense.parts_of_speech
        })),
        common: result.is_common || false
    };
}

// Search Tatoeba for example sentences
async function searchTatoeba(query, limit = 5) {
    const url = `${TATOEBA_API}${encodeURIComponent(query)}&limit=${limit}`;
    const cacheKey = `tatoeba_${query}_${limit}`;
    
    const data = await fetchWithCache(url, cacheKey);
    if (!data || !data.results) return [];
    
    return data.results.map(result => ({
        japanese: result.text,
        english: result.translations?.[0]?.text || ''
    }));
}

// Get word details (combines Jisho + Tatoeba)
async function getWordDetails(word) {
    const [jishoData, tatoebaData] = await Promise.all([
        searchJisho(word),
        searchTatoeba(word)
    ]);
    
    return {
        ...jishoData,
        examples: tatoebaData
    };
}

// Get kanji information from Jisho
async function getKanjiInfo(kanji) {
    // Jisho doesn't have a dedicated kanji API, but we can search for it
    const data = await searchJisho(kanji);
    if (!data) return null;
    
    // Try to extract kanji-specific info from the search
    return {
        kanji: kanji,
        meanings: data.meanings,
        reading: data.reading,
        common: data.common
    };
}

// Fallback: return null if API unavailable
function isApiAvailable() {
    return typeof fetch !== 'undefined';
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        searchJisho,
        searchTatoeba,
        getWordDetails,
        getKanjiInfo,
        isApiAvailable
    };
}
