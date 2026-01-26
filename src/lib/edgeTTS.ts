/**
 * Edge TTS Integration
 * Uses Microsoft Edge's Read Aloud API for high-quality TTS
 * Supports Japanese, Chinese, Korean, and many other languages
 *
 * This is used as a fallback when:
 * 1. Pre-generated audio is not available
 * 2. Kokoro doesn't support the language (e.g., Japanese voices not in ONNX model)
 *
 * Voice configuration:
 * - Hardcoded defaults are provided for common languages
 * - Dynamic voices can be added via registerDynamicVoices()
 * - Language config API can provide additional voice mappings
 */

// Voice metadata
export interface EdgeVoiceInfo {
    id: string;           // e.g., "ja-JP-NanamiNeural"
    name: string;         // e.g., "Nanami"
    language: string;     // e.g., "ja"
    locale: string;       // e.g., "ja-JP"
    gender: 'Female' | 'Male';
    isDefault?: boolean;  // Default voice for this language
}

// Dynamic voice registry for runtime additions
const dynamicVoices: Record<string, EdgeVoiceInfo[]> = {};

/**
 * Register additional voices dynamically (e.g., from API config)
 * These will be merged with the default voices
 */
export function registerDynamicVoices(lang: string, voices: EdgeVoiceInfo[]): void {
    dynamicVoices[lang] = voices;
}

/**
 * Clear dynamic voices for a language
 */
export function clearDynamicVoices(lang?: string): void {
    if (lang) {
        delete dynamicVoices[lang];
    } else {
        Object.keys(dynamicVoices).forEach(key => delete dynamicVoices[key]);
    }
}

// Default Edge TTS voices organized by language (fallback)
const DEFAULT_EDGE_VOICES: Record<string, EdgeVoiceInfo[]> = {
    // Japanese
    ja: [
        { id: 'ja-JP-NanamiNeural', name: 'Nanami', language: 'ja', locale: 'ja-JP', gender: 'Female', isDefault: true },
        { id: 'ja-JP-KeitaNeural', name: 'Keita', language: 'ja', locale: 'ja-JP', gender: 'Male' },
        { id: 'ja-JP-AoiNeural', name: 'Aoi', language: 'ja', locale: 'ja-JP', gender: 'Female' },
        { id: 'ja-JP-DaichiNeural', name: 'Daichi', language: 'ja', locale: 'ja-JP', gender: 'Male' },
        { id: 'ja-JP-MayuNeural', name: 'Mayu', language: 'ja', locale: 'ja-JP', gender: 'Female' },
        { id: 'ja-JP-NaokiNeural', name: 'Naoki', language: 'ja', locale: 'ja-JP', gender: 'Male' },
        { id: 'ja-JP-ShioriNeural', name: 'Shiori', language: 'ja', locale: 'ja-JP', gender: 'Female' },
    ],

    // Korean
    ko: [
        { id: 'ko-KR-SunHiNeural', name: 'SunHi', language: 'ko', locale: 'ko-KR', gender: 'Female', isDefault: true },
        { id: 'ko-KR-InJoonNeural', name: 'InJoon', language: 'ko', locale: 'ko-KR', gender: 'Male' },
        { id: 'ko-KR-BongJinNeural', name: 'BongJin', language: 'ko', locale: 'ko-KR', gender: 'Male' },
        { id: 'ko-KR-GookMinNeural', name: 'GookMin', language: 'ko', locale: 'ko-KR', gender: 'Male' },
        { id: 'ko-KR-JiMinNeural', name: 'JiMin', language: 'ko', locale: 'ko-KR', gender: 'Female' },
        { id: 'ko-KR-SeoHyeonNeural', name: 'SeoHyeon', language: 'ko', locale: 'ko-KR', gender: 'Female' },
        { id: 'ko-KR-SoonBokNeural', name: 'SoonBok', language: 'ko', locale: 'ko-KR', gender: 'Female' },
        { id: 'ko-KR-YuJinNeural', name: 'YuJin', language: 'ko', locale: 'ko-KR', gender: 'Female' },
    ],

    // Chinese (Mandarin - China)
    zh: [
        { id: 'zh-CN-XiaoxiaoNeural', name: 'Xiaoxiao', language: 'zh', locale: 'zh-CN', gender: 'Female', isDefault: true },
        { id: 'zh-CN-YunxiNeural', name: 'Yunxi', language: 'zh', locale: 'zh-CN', gender: 'Male' },
        { id: 'zh-CN-YunjianNeural', name: 'Yunjian', language: 'zh', locale: 'zh-CN', gender: 'Male' },
        { id: 'zh-CN-XiaoyiNeural', name: 'Xiaoyi', language: 'zh', locale: 'zh-CN', gender: 'Female' },
        { id: 'zh-CN-YunyangNeural', name: 'Yunyang', language: 'zh', locale: 'zh-CN', gender: 'Male' },
        { id: 'zh-CN-XiaochenNeural', name: 'Xiaochen', language: 'zh', locale: 'zh-CN', gender: 'Female' },
        { id: 'zh-CN-XiaohanNeural', name: 'Xiaohan', language: 'zh', locale: 'zh-CN', gender: 'Female' },
        { id: 'zh-CN-XiaomengNeural', name: 'Xiaomeng', language: 'zh', locale: 'zh-CN', gender: 'Female' },
        { id: 'zh-CN-XiaomoNeural', name: 'Xiaomo', language: 'zh', locale: 'zh-CN', gender: 'Female' },
        { id: 'zh-CN-XiaoqiuNeural', name: 'Xiaoqiu', language: 'zh', locale: 'zh-CN', gender: 'Female' },
        { id: 'zh-CN-XiaoruiNeural', name: 'Xiaorui', language: 'zh', locale: 'zh-CN', gender: 'Female' },
        { id: 'zh-CN-XiaoshuangNeural', name: 'Xiaoshuang', language: 'zh', locale: 'zh-CN', gender: 'Female' },
        { id: 'zh-CN-XiaoxuanNeural', name: 'Xiaoxuan', language: 'zh', locale: 'zh-CN', gender: 'Female' },
        { id: 'zh-CN-XiaoyanNeural', name: 'Xiaoyan', language: 'zh', locale: 'zh-CN', gender: 'Female' },
        { id: 'zh-CN-XiaoyouNeural', name: 'Xiaoyou', language: 'zh', locale: 'zh-CN', gender: 'Female' },
        { id: 'zh-CN-XiaozhenNeural', name: 'Xiaozhen', language: 'zh', locale: 'zh-CN', gender: 'Female' },
        { id: 'zh-CN-YunfengNeural', name: 'Yunfeng', language: 'zh', locale: 'zh-CN', gender: 'Male' },
        { id: 'zh-CN-YunhaoNeural', name: 'Yunhao', language: 'zh', locale: 'zh-CN', gender: 'Male' },
        { id: 'zh-CN-YunzeNeural', name: 'Yunze', language: 'zh', locale: 'zh-CN', gender: 'Male' },
    ],

    // English (US)
    en: [
        { id: 'en-US-JennyNeural', name: 'Jenny', language: 'en', locale: 'en-US', gender: 'Female', isDefault: true },
        { id: 'en-US-GuyNeural', name: 'Guy', language: 'en', locale: 'en-US', gender: 'Male' },
        { id: 'en-US-AriaNeural', name: 'Aria', language: 'en', locale: 'en-US', gender: 'Female' },
        { id: 'en-US-DavisNeural', name: 'Davis', language: 'en', locale: 'en-US', gender: 'Male' },
        { id: 'en-US-AmberNeural', name: 'Amber', language: 'en', locale: 'en-US', gender: 'Female' },
        { id: 'en-US-AnaNeural', name: 'Ana', language: 'en', locale: 'en-US', gender: 'Female' },
        { id: 'en-US-AndrewNeural', name: 'Andrew', language: 'en', locale: 'en-US', gender: 'Male' },
        { id: 'en-US-AshleyNeural', name: 'Ashley', language: 'en', locale: 'en-US', gender: 'Female' },
        { id: 'en-US-BrandonNeural', name: 'Brandon', language: 'en', locale: 'en-US', gender: 'Male' },
        { id: 'en-US-BrianNeural', name: 'Brian', language: 'en', locale: 'en-US', gender: 'Male' },
        { id: 'en-US-ChristopherNeural', name: 'Christopher', language: 'en', locale: 'en-US', gender: 'Male' },
        { id: 'en-US-CoraNeural', name: 'Cora', language: 'en', locale: 'en-US', gender: 'Female' },
        { id: 'en-US-ElizabethNeural', name: 'Elizabeth', language: 'en', locale: 'en-US', gender: 'Female' },
        { id: 'en-US-EmmaNeural', name: 'Emma', language: 'en', locale: 'en-US', gender: 'Female' },
        { id: 'en-US-EricNeural', name: 'Eric', language: 'en', locale: 'en-US', gender: 'Male' },
        { id: 'en-US-JacobNeural', name: 'Jacob', language: 'en', locale: 'en-US', gender: 'Male' },
        { id: 'en-US-JaneNeural', name: 'Jane', language: 'en', locale: 'en-US', gender: 'Female' },
        { id: 'en-US-JasonNeural', name: 'Jason', language: 'en', locale: 'en-US', gender: 'Male' },
        { id: 'en-US-MichelleNeural', name: 'Michelle', language: 'en', locale: 'en-US', gender: 'Female' },
        { id: 'en-US-MonicaNeural', name: 'Monica', language: 'en', locale: 'en-US', gender: 'Female' },
        { id: 'en-US-NancyNeural', name: 'Nancy', language: 'en', locale: 'en-US', gender: 'Female' },
        { id: 'en-US-RogerNeural', name: 'Roger', language: 'en', locale: 'en-US', gender: 'Male' },
        { id: 'en-US-SaraNeural', name: 'Sara', language: 'en', locale: 'en-US', gender: 'Female' },
        { id: 'en-US-SteffanNeural', name: 'Steffan', language: 'en', locale: 'en-US', gender: 'Male' },
        { id: 'en-US-TonyNeural', name: 'Tony', language: 'en', locale: 'en-US', gender: 'Male' },
    ],

    // Spanish
    es: [
        { id: 'es-ES-ElviraNeural', name: 'Elvira', language: 'es', locale: 'es-ES', gender: 'Female', isDefault: true },
        { id: 'es-ES-AlvaroNeural', name: 'Alvaro', language: 'es', locale: 'es-ES', gender: 'Male' },
        { id: 'es-MX-DaliaNeural', name: 'Dalia (MX)', language: 'es', locale: 'es-MX', gender: 'Female' },
        { id: 'es-MX-JorgeNeural', name: 'Jorge (MX)', language: 'es', locale: 'es-MX', gender: 'Male' },
    ],

    // French
    fr: [
        { id: 'fr-FR-DeniseNeural', name: 'Denise', language: 'fr', locale: 'fr-FR', gender: 'Female', isDefault: true },
        { id: 'fr-FR-HenriNeural', name: 'Henri', language: 'fr', locale: 'fr-FR', gender: 'Male' },
        { id: 'fr-FR-AlainNeural', name: 'Alain', language: 'fr', locale: 'fr-FR', gender: 'Male' },
        { id: 'fr-FR-BrigitteNeural', name: 'Brigitte', language: 'fr', locale: 'fr-FR', gender: 'Female' },
        { id: 'fr-FR-CelesteNeural', name: 'Celeste', language: 'fr', locale: 'fr-FR', gender: 'Female' },
        { id: 'fr-FR-ClaudeNeural', name: 'Claude', language: 'fr', locale: 'fr-FR', gender: 'Male' },
        { id: 'fr-FR-CoralieNeural', name: 'Coralie', language: 'fr', locale: 'fr-FR', gender: 'Female' },
        { id: 'fr-FR-EloiseNeural', name: 'Eloise', language: 'fr', locale: 'fr-FR', gender: 'Female' },
        { id: 'fr-FR-JacquelineNeural', name: 'Jacqueline', language: 'fr', locale: 'fr-FR', gender: 'Female' },
        { id: 'fr-FR-JeromeNeural', name: 'Jerome', language: 'fr', locale: 'fr-FR', gender: 'Male' },
        { id: 'fr-FR-JosephineNeural', name: 'Josephine', language: 'fr', locale: 'fr-FR', gender: 'Female' },
        { id: 'fr-FR-MauriceNeural', name: 'Maurice', language: 'fr', locale: 'fr-FR', gender: 'Male' },
        { id: 'fr-FR-YvesNeural', name: 'Yves', language: 'fr', locale: 'fr-FR', gender: 'Male' },
        { id: 'fr-FR-YvetteNeural', name: 'Yvette', language: 'fr', locale: 'fr-FR', gender: 'Female' },
    ],

    // German
    de: [
        { id: 'de-DE-KatjaNeural', name: 'Katja', language: 'de', locale: 'de-DE', gender: 'Female', isDefault: true },
        { id: 'de-DE-ConradNeural', name: 'Conrad', language: 'de', locale: 'de-DE', gender: 'Male' },
        { id: 'de-DE-AmalaNeural', name: 'Amala', language: 'de', locale: 'de-DE', gender: 'Female' },
        { id: 'de-DE-BerndNeural', name: 'Bernd', language: 'de', locale: 'de-DE', gender: 'Male' },
        { id: 'de-DE-ChristophNeural', name: 'Christoph', language: 'de', locale: 'de-DE', gender: 'Male' },
        { id: 'de-DE-ElkeNeural', name: 'Elke', language: 'de', locale: 'de-DE', gender: 'Female' },
        { id: 'de-DE-GiselaNeural', name: 'Gisela', language: 'de', locale: 'de-DE', gender: 'Female' },
        { id: 'de-DE-KasperNeural', name: 'Kasper', language: 'de', locale: 'de-DE', gender: 'Male' },
        { id: 'de-DE-KillianNeural', name: 'Killian', language: 'de', locale: 'de-DE', gender: 'Male' },
        { id: 'de-DE-KlarissaNeural', name: 'Klarissa', language: 'de', locale: 'de-DE', gender: 'Female' },
        { id: 'de-DE-KlausNeural', name: 'Klaus', language: 'de', locale: 'de-DE', gender: 'Male' },
        { id: 'de-DE-LouisaNeural', name: 'Louisa', language: 'de', locale: 'de-DE', gender: 'Female' },
        { id: 'de-DE-MajaNeural', name: 'Maja', language: 'de', locale: 'de-DE', gender: 'Female' },
        { id: 'de-DE-RalfNeural', name: 'Ralf', language: 'de', locale: 'de-DE', gender: 'Male' },
        { id: 'de-DE-TanjaNeural', name: 'Tanja', language: 'de', locale: 'de-DE', gender: 'Female' },
    ],

    // Italian
    it: [
        { id: 'it-IT-ElsaNeural', name: 'Elsa', language: 'it', locale: 'it-IT', gender: 'Female', isDefault: true },
        { id: 'it-IT-DiegoNeural', name: 'Diego', language: 'it', locale: 'it-IT', gender: 'Male' },
        { id: 'it-IT-IsabellaNeural', name: 'Isabella', language: 'it', locale: 'it-IT', gender: 'Female' },
        { id: 'it-IT-BenignoNeural', name: 'Benigno', language: 'it', locale: 'it-IT', gender: 'Male' },
        { id: 'it-IT-CalimeroNeural', name: 'Calimero', language: 'it', locale: 'it-IT', gender: 'Male' },
        { id: 'it-IT-CataldoNeural', name: 'Cataldo', language: 'it', locale: 'it-IT', gender: 'Male' },
        { id: 'it-IT-FabiolaNeural', name: 'Fabiola', language: 'it', locale: 'it-IT', gender: 'Female' },
        { id: 'it-IT-FiammaNeural', name: 'Fiamma', language: 'it', locale: 'it-IT', gender: 'Female' },
        { id: 'it-IT-GianniNeural', name: 'Gianni', language: 'it', locale: 'it-IT', gender: 'Male' },
        { id: 'it-IT-ImeldaNeural', name: 'Imelda', language: 'it', locale: 'it-IT', gender: 'Female' },
        { id: 'it-IT-IrmaNeural', name: 'Irma', language: 'it', locale: 'it-IT', gender: 'Female' },
        { id: 'it-IT-LisandroNeural', name: 'Lisandro', language: 'it', locale: 'it-IT', gender: 'Male' },
        { id: 'it-IT-PalmiraNeural', name: 'Palmira', language: 'it', locale: 'it-IT', gender: 'Female' },
        { id: 'it-IT-PierinaNeural', name: 'Pierina', language: 'it', locale: 'it-IT', gender: 'Female' },
        { id: 'it-IT-RinaldoNeural', name: 'Rinaldo', language: 'it', locale: 'it-IT', gender: 'Male' },
    ],

    // Portuguese (Brazil)
    pt: [
        { id: 'pt-BR-FranciscaNeural', name: 'Francisca', language: 'pt', locale: 'pt-BR', gender: 'Female', isDefault: true },
        { id: 'pt-BR-AntonioNeural', name: 'Antonio', language: 'pt', locale: 'pt-BR', gender: 'Male' },
        { id: 'pt-BR-BrendaNeural', name: 'Brenda', language: 'pt', locale: 'pt-BR', gender: 'Female' },
        { id: 'pt-BR-DonatoNeural', name: 'Donato', language: 'pt', locale: 'pt-BR', gender: 'Male' },
        { id: 'pt-BR-ElzaNeural', name: 'Elza', language: 'pt', locale: 'pt-BR', gender: 'Female' },
        { id: 'pt-BR-FabioNeural', name: 'Fabio', language: 'pt', locale: 'pt-BR', gender: 'Male' },
        { id: 'pt-BR-GiovannaNeural', name: 'Giovanna', language: 'pt', locale: 'pt-BR', gender: 'Female' },
        { id: 'pt-BR-HumbertoNeural', name: 'Humberto', language: 'pt', locale: 'pt-BR', gender: 'Male' },
        { id: 'pt-BR-JulioNeural', name: 'Julio', language: 'pt', locale: 'pt-BR', gender: 'Male' },
        { id: 'pt-BR-LeilaNeural', name: 'Leila', language: 'pt', locale: 'pt-BR', gender: 'Female' },
        { id: 'pt-BR-LeticiaNeural', name: 'Leticia', language: 'pt', locale: 'pt-BR', gender: 'Female' },
        { id: 'pt-BR-ManuelaNeural', name: 'Manuela', language: 'pt', locale: 'pt-BR', gender: 'Female' },
        { id: 'pt-BR-NicolauNeural', name: 'Nicolau', language: 'pt', locale: 'pt-BR', gender: 'Male' },
        { id: 'pt-BR-ValerioNeural', name: 'Valerio', language: 'pt', locale: 'pt-BR', gender: 'Male' },
        { id: 'pt-BR-YaraNeural', name: 'Yara', language: 'pt', locale: 'pt-BR', gender: 'Female' },
    ],

    // Hindi
    hi: [
        { id: 'hi-IN-SwaraNeural', name: 'Swara', language: 'hi', locale: 'hi-IN', gender: 'Female', isDefault: true },
        { id: 'hi-IN-MadhurNeural', name: 'Madhur', language: 'hi', locale: 'hi-IN', gender: 'Male' },
    ],
};

// Export for backwards compatibility
export const EDGE_VOICES = DEFAULT_EDGE_VOICES;

/**
 * Get all voices for a language (default + dynamic)
 * Dynamic voices take precedence if they exist
 */
function getAllVoicesForLanguage(lang: string): EdgeVoiceInfo[] {
    const baseLang = normalizeLanguage(lang);
    // Dynamic voices override defaults if present
    if (dynamicVoices[baseLang] && dynamicVoices[baseLang].length > 0) {
        return dynamicVoices[baseLang];
    }
    return DEFAULT_EDGE_VOICES[baseLang] || [];
}

/**
 * Get all supported languages (default + dynamic)
 */
function getAllSupportedLanguages(): string[] {
    const defaultLangs = Object.keys(DEFAULT_EDGE_VOICES);
    const dynamicLangs = Object.keys(dynamicVoices);
    return [...new Set([...defaultLangs, ...dynamicLangs])];
}

// Normalize language code to base language (e.g., "ja-JP" -> "ja")
function normalizeLanguage(lang: string): string {
    const baseLang = lang.toLowerCase().split('-')[0];
    return baseLang;
}

// Storage key for voice preferences
const VOICE_STORAGE_KEY = 'murmura_edge_tts_voices';

// Get saved voice preferences from localStorage
export function getSavedEdgeVoices(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    const saved = localStorage.getItem(VOICE_STORAGE_KEY);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch {
            return {};
        }
    }
    return {};
}

// Save voice preference for a language
export function saveEdgeVoice(lang: string, voiceId: string): void {
    if (typeof window === 'undefined') return;
    const baseLang = normalizeLanguage(lang);
    const saved = getSavedEdgeVoices();
    saved[baseLang] = voiceId;
    localStorage.setItem(VOICE_STORAGE_KEY, JSON.stringify(saved));
}

// Get all saved voice preferences
export function getAllSavedEdgeVoices(): Record<string, string> {
    const saved = getSavedEdgeVoices();
    const result: Record<string, string> = {};

    // For each supported language (default + dynamic), get saved or default
    for (const lang of getAllSupportedLanguages()) {
        result[lang] = saved[lang] || getDefaultEdgeVoice(lang);
    }

    return result;
}

// Default Worker URL if environment variable is not set
const DEFAULT_WORKER_URL = 'https://edge-tts-proxy.rennerdev.workers.dev';

// Check if Edge TTS supports a language
export function isEdgeTTSSupported(lang: string): boolean {
    const baseLang = normalizeLanguage(lang);

    // Check if language is supported (default or dynamic)
    const voices = getAllVoicesForLanguage(baseLang);
    if (voices.length === 0) return false;

    // In browser environment, check if Worker URL is available (env var or default)
    if (typeof window !== 'undefined') {
        const workerUrl = process.env.NEXT_PUBLIC_EDGE_TTS_WORKER_URL || DEFAULT_WORKER_URL;
        return !!workerUrl;
    }

    return true;
}

// Get default voice for a language
export function getDefaultEdgeVoice(lang: string): string {
    const baseLang = normalizeLanguage(lang);
    const voices = getAllVoicesForLanguage(baseLang);
    if (!voices || voices.length === 0) return '';

    const defaultVoice = voices.find(v => v.isDefault);
    return defaultVoice?.id || voices[0].id;
}

// Get the selected voice for a language (user preference or default)
export function getSelectedEdgeVoice(lang: string): string {
    const baseLang = normalizeLanguage(lang);
    const saved = getSavedEdgeVoices();

    if (saved[baseLang]) {
        // Validate that the saved voice still exists
        const voices = getAllVoicesForLanguage(baseLang);
        if (voices.some(v => v.id === saved[baseLang])) {
            return saved[baseLang];
        }
    }

    return getDefaultEdgeVoice(baseLang);
}

// Get all voices for a language (public API)
export function getEdgeVoicesForLanguage(lang: string): EdgeVoiceInfo[] {
    const baseLang = normalizeLanguage(lang);
    return getAllVoicesForLanguage(baseLang);
}

// Get voice info by ID
export function getEdgeVoiceInfo(voiceId: string): EdgeVoiceInfo | undefined {
    // Check all languages (default + dynamic)
    for (const lang of getAllSupportedLanguages()) {
        const voices = getAllVoicesForLanguage(lang);
        const voice = voices.find(v => v.id === voiceId);
        if (voice) return voice;
    }
    return undefined;
}

// List all supported languages
export function listEdgeTTSLanguages(): string[] {
    return getAllSupportedLanguages();
}

// Cache for generated audio blobs
const edgeTTSCache = new Map<string, string>();
const MAX_CACHE_SIZE = 50;

function trimCache() {
    if (edgeTTSCache.size > MAX_CACHE_SIZE) {
        const keysToDelete = Array.from(edgeTTSCache.keys()).slice(0, 10);
        keysToDelete.forEach(key => {
            const url = edgeTTSCache.get(key);
            if (url) URL.revokeObjectURL(url);
            edgeTTSCache.delete(key);
        });
    }
}

/**
 * Generate audio using Edge TTS via Cloudflare Worker proxy
 * Returns a blob URL that can be played
 * 
 * Set EDGE_TTS_WORKER_URL environment variable or update the constant below
 */
const EDGE_TTS_WORKER_URL = process.env.NEXT_PUBLIC_EDGE_TTS_WORKER_URL || DEFAULT_WORKER_URL;

export async function generateEdgeTTSAudio(
    text: string,
    lang: string
): Promise<string> {
    const voice = getSelectedEdgeVoice(lang);
    const cacheKey = `${voice}:${text}`;

    // Check cache first
    if (edgeTTSCache.has(cacheKey)) {
        console.log('[EdgeTTS] Using cached audio');
        return edgeTTSCache.get(cacheKey)!;
    }

    if (!voice) {
        throw new Error(`Edge TTS does not support language: ${lang}`);
    }

    if (!EDGE_TTS_WORKER_URL) {
        throw new Error('Edge TTS Worker URL not configured. Set NEXT_PUBLIC_EDGE_TTS_WORKER_URL environment variable.');
    }

    console.log(`[EdgeTTS] Generating audio for "${text}" with voice ${voice} via Worker`);

    // Call the Cloudflare Worker proxy
    const response = await fetch(`${EDGE_TTS_WORKER_URL}/api/tts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, voice }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Edge TTS Worker error: ${errorData.error || response.statusText}`);
    }

    // Get audio as blob
    const audioBlob = await response.blob();
    const blobUrl = URL.createObjectURL(audioBlob);

    // Cache it
    edgeTTSCache.set(cacheKey, blobUrl);
    trimCache();

    console.log('[EdgeTTS] Audio generated successfully via Worker');
    return blobUrl;
}

/**
 * Speak text using Edge TTS
 */
export async function speakWithEdgeTTS(
    text: string,
    lang: string,
    volume: number = 0.8
): Promise<void> {
    const audioUrl = await generateEdgeTTSAudio(text, lang);

    return new Promise<void>((resolve, reject) => {
        const audio = new Audio(audioUrl);
        audio.volume = volume;

        audio.onended = () => resolve();
        audio.onerror = () => reject(new Error('Failed to play Edge TTS audio'));

        audio.play().catch(reject);
    });
}
