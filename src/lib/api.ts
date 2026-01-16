// External API integration for Japanese dictionary resources
// Jisho API (Japanese dictionary), Tatoeba API (example sentences)

const JISHO_API = 'https://jisho.org/api/v1/search/words?keyword=';
const TATOEBA_API = 'https://tatoeba.org/en/api_v0/search?from=jpn&to=eng&query=';

interface CacheEntry {
    data: any;
    timestamp: number;
}

// Cache for API responses
const apiCache = new Map<string, CacheEntry>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface JishoResult {
    word: string;
    reading: string;
    meanings: Array<{
        english: string[];
        partOfSpeech: string[];
    }>;
    common: boolean;
}

interface TatoebaResult {
    japanese: string;
    english: string;
}

// Fetch with caching
async function fetchWithCache(url: string, cacheKey: string): Promise<any> {
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
export async function searchJisho(query: string): Promise<JishoResult | null> {
    const url = `${JISHO_API}${encodeURIComponent(query)}`;
    const cacheKey = `jisho_${query}`;
    
    const data = await fetchWithCache(url, cacheKey);
    if (!data || !data.data || data.data.length === 0) return null;
    
    const result = data.data[0];
    return {
        word: result.japanese[0]?.word || '',
        reading: result.japanese[0]?.reading || '',
        meanings: result.senses.map((sense: any) => ({
            english: sense.english_definitions,
            partOfSpeech: sense.parts_of_speech
        })),
        common: result.is_common || false
    };
}

// Search Tatoeba for example sentences
export async function searchTatoeba(query: string, limit: number = 5): Promise<TatoebaResult[]> {
    const url = `${TATOEBA_API}${encodeURIComponent(query)}&limit=${limit}`;
    const cacheKey = `tatoeba_${query}_${limit}`;
    
    const data = await fetchWithCache(url, cacheKey);
    if (!data || !data.results) return [];
    
    return data.results.map((result: any) => ({
        japanese: result.text,
        english: result.translations?.[0]?.text || ''
    }));
}

// Get word details (combines Jisho + Tatoeba)
export async function getWordDetails(word: string): Promise<(JishoResult & { examples: TatoebaResult[] }) | null> {
    const [jishoData, tatoebaData] = await Promise.all([
        searchJisho(word),
        searchTatoeba(word)
    ]);
    
    if (!jishoData) return null;
    
    return {
        ...jishoData,
        examples: tatoebaData
    };
}

// Get kanji information from Jisho
export async function getKanjiInfo(kanji: string): Promise<{
    kanji: string;
    meanings: Array<{ english: string[]; partOfSpeech: string[] }>;
    reading: string;
    common: boolean;
} | null> {
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
export function isApiAvailable(): boolean {
    return typeof fetch !== 'undefined';
}
