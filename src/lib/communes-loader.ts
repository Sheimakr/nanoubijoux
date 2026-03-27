import fs from 'fs';
import path from 'path';

/**
 * Load all communes from the local algeria_cities.json file.
 * Returns a map: { wilayaCode: ["Commune Name (French)", ...] }
 *
 * JSON format (from github.com/othmanus/algeria-cities):
 * { id, commune_name_ascii, commune_name, daira_name_ascii, daira_name, wilaya_code, wilaya_name_ascii, wilaya_name }
 *
 * We use commune_name_ascii (French/Latin) for display.
 */

interface CityEntry {
    id: number;
    commune_name_ascii: string;
    commune_name: string;
    daira_name_ascii: string;
    daira_name: string;
    wilaya_code: string;
    wilaya_name_ascii: string;
    wilaya_name: string;
}

export async function fetchAllCommunes(): Promise<Record<number, string[]>> {
    const communes: Record<number, string[]> = {};

    try {
        // Try multiple possible locations for the data file
        let jsonPath = path.join(process.cwd(), 'src', 'lib', 'algeria_cities.json');
        if (!fs.existsSync(jsonPath)) {
            jsonPath = path.join(process.cwd(), 'src', 'data', 'algeria-cities.json');
        }
        const raw = fs.readFileSync(jsonPath, 'utf8');
        const cities: CityEntry[] = JSON.parse(raw);

        for (const city of cities) {
            const communeName = city.commune_name_ascii?.trim();
            const wilayaCode = parseInt(city.wilaya_code, 10);

            if (!communeName || isNaN(wilayaCode)) continue;

            if (!communes[wilayaCode]) communes[wilayaCode] = [];
            // Avoid duplicates
            if (!communes[wilayaCode].includes(communeName)) {
                communes[wilayaCode].push(communeName);
            }
        }

        // Sort each wilaya's communes alphabetically
        for (const wid of Object.keys(communes)) {
            communes[Number(wid)].sort((a, b) => a.localeCompare(b, 'fr'));
        }

        const total = Object.values(communes).reduce((s, a) => s + a.length, 0);
        console.log(`[communes-loader] Loaded ${total} communes across ${Object.keys(communes).length} wilayas (French names)`);
    } catch (e) {
        console.error('[communes-loader] Failed to load algeria_cities.json:', e);
    }

    return communes;
}
