/**
 * commune-matcher.ts — Commune name auto-corrector for EcoTrack.
 *
 * Translates Arabic commune names to French names that EcoTrack expects,
 * then fuzzy-matches against EcoTrack's live commune list.
 */

import { EcotrackService } from './ecotrack';

// In-memory cache: wilayaId → { names: string[], ts: number }
const cache = new Map<string, { names: string[]; ts: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function normalizeFrench(s: string): string {
    return s
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[''`\-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function levenshtein(a: string, b: string): number {
    const m = a.length, n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }
    return dp[m][n];
}

function frenchSimilarity(a: string, b: string): number {
    const na = normalizeFrench(a);
    const nb = normalizeFrench(b);
    if (na === nb) return 1.0;
    if (na.startsWith(nb) || nb.startsWith(na)) return 0.9;
    if (na.includes(nb) || nb.includes(na)) return 0.8;
    const len = Math.max(na.length, nb.length);
    if (len === 0) return 1.0;
    return Math.max(0, 1 - levenshtein(na, nb) / len);
}

async function getEcotrackCommunes(ecotrack: EcotrackService, wilayaId: string): Promise<string[]> {
    const cached = cache.get(wilayaId);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
        return cached.names;
    }

    try {
        const response = await ecotrack.getCommunes(wilayaId);
        let names: string[] = [];

        const extractName = (c: unknown): string => {
            if (typeof c === 'string') return c;
            if (c && typeof c === 'object') {
                const obj = c as Record<string, unknown>;
                return (obj.nom || obj.commune || obj.name || obj.commune_name || '') as string;
            }
            return '';
        };

        if (Array.isArray(response)) {
            names = response.map(extractName).filter(Boolean);
        } else if (response && typeof response === 'object') {
            for (const key of ['data', 'communes', 'results', 'items']) {
                const arr = (response as Record<string, unknown>)[key];
                if (Array.isArray(arr) && arr.length > 0) {
                    names = arr.map(extractName).filter(Boolean);
                    break;
                }
            }
        }

        if (names.length > 0) {
            cache.set(wilayaId, { names, ts: Date.now() });
        }
        return names;
    } catch (err) {
        console.error(`[commune-matcher] Failed to fetch communes for wilaya ${wilayaId}:`, err);
        return [];
    }
}

/**
 * Match a commune name against EcoTrack's live commune list for a given wilaya.
 * Handles French input directly or uses fuzzy matching.
 */
export async function matchCommune(
    ecotrack: EcotrackService,
    communeName: string,
    wilayaId: string
): Promise<string> {
    if (!communeName || !wilayaId || wilayaId === '0') return communeName;

    const ecoNames = await getEcotrackCommunes(ecotrack, wilayaId);
    if (ecoNames.length === 0) {
        console.warn(`[commune-matcher] No EcoTrack communes for wilaya ${wilayaId}, using original: "${communeName}"`);
        return communeName;
    }

    // Exact match
    const exactEco = ecoNames.find(n => normalizeFrench(n) === normalizeFrench(communeName));
    if (exactEco) return exactEco;

    // Fuzzy match
    let bestMatch = ecoNames[0];
    let bestScore = 0;
    for (const name of ecoNames) {
        const score = frenchSimilarity(communeName, name);
        if (score > bestScore) {
            bestScore = score;
            bestMatch = name;
        }
    }

    if (bestScore >= 0.4) {
        console.log(`[commune-matcher] Fuzzy: "${communeName}" → "${bestMatch}" (${bestScore.toFixed(2)})`);
        return bestMatch;
    }

    console.warn(`[commune-matcher] No match for "${communeName}" in wilaya ${wilayaId}, using first: "${ecoNames[0]}"`);
    return ecoNames[0];
}
