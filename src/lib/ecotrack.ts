/**
 * EcoTrack API Service
 * Handles all communication with the EcoTrack delivery platform.
 *
 * Each delivery company has its own subdomain:
 *   - https://dhd.ecotrack.dz/api/v1/
 *   - https://noest.ecotrack.dz/api/v1/
 *   - https://conexlog.ecotrack.dz/api/v1/
 *   etc.
 *
 * The base URL is configured per-account in the settings table.
 */

export interface EcotrackCreateOrderParams {
    nom_client: string;
    telephone: string;
    adresse: string;
    commune: string;
    code_wilaya: string | number;
    montant: number;
    type: number;             // 1=Delivery, 2=Exchange, 3=Pickup, 4=Recovery
    stop_desk: number;        // 0=Home, 1=Stop Desk
    reference?: string;
    telephone_2?: string;
    remarque?: string;
    produit?: string;
    stock?: number;
    quantite?: number;
    produit_a_recuperer?: string;
    boutique?: string;
    weight?: number;
    fragile?: number;
    gps_link?: string;
}

export interface EcotrackUpdateOrderParams {
    tracking: string;
    reference?: string;
    client?: string;
    tel?: string;
    tel2?: string;
    adresse?: string;
    code_postal?: string;
    commune?: string;
    wilaya?: string;
    montant?: number;
    remarque?: string;
    product?: string;
    boutique?: string;
    type?: number;
    stop_desk?: number;
    fragile?: number;
    gps_link?: string;
}

export class EcotrackService {
    private baseUrl: string;
    private token: string;

    constructor(token: string, apiUrl?: string) {
        this.token = token;
        const url = (apiUrl || "https://packers.ecotrack.dz/api/v1").replace(/\/+$/, '');
        this.baseUrl = url.endsWith('/api/v1') ? url : `${url}/api/v1`;
    }

    private async request(endpoint: string, method: string = "GET", body?: unknown) {
        const url = `${this.baseUrl}${endpoint}`;

        console.log(`[EcoTrack API] ${method} ${url}`);

        const headers: Record<string, string> = {
            "Authorization": `Bearer ${this.token}`,
            "Accept": "application/json",
        };

        let fetchBody: string | undefined;
        if (body) {
            headers["Content-Type"] = "application/json";
            fetchBody = JSON.stringify(body);
        }

        const response = await fetch(url, { method, headers, body: fetchBody });

        if (!response.ok) {
            const text = await response.text();
            console.error(`[EcoTrack API] ${response.status} — ${method} ${endpoint}`);

            let parsed: Record<string, unknown> = {};
            try { parsed = JSON.parse(text); } catch { /* ignore */ }

            let msg = '';
            if (parsed.errors && typeof parsed.errors === 'object') {
                const allErrors: string[] = [];
                for (const [field, msgs] of Object.entries(parsed.errors as Record<string, unknown>)) {
                    const fieldMsgs = Array.isArray(msgs) ? msgs.join(', ') : String(msgs);
                    allErrors.push(`${field}: ${fieldMsgs}`);
                }
                msg = allErrors.join(' | ');
            } else {
                msg = (parsed.message as string) ||
                    (parsed.error as string) ||
                    `API ${response.status}: ${text.slice(0, 200)}`;
            }
            throw new Error(msg);
        }

        const text = await response.text();
        try { return JSON.parse(text); } catch { return text; }
    }

    async validateToken() {
        return this.request("/get/wilayas");
    }

    async createOrder(data: EcotrackCreateOrderParams) {
        return this.request("/create/order", "POST", data);
    }

    async createOrders(orders: EcotrackCreateOrderParams[]) {
        const indexed: Record<string, EcotrackCreateOrderParams> = {};
        orders.forEach((o, i) => { indexed[String(i)] = o; });
        return this.request("/create/orders", "POST", { orders: indexed });
    }

    async updateOrder(data: EcotrackUpdateOrderParams) {
        return this.request("/update/order", "POST", data);
    }

    async deleteOrder(tracking: string) {
        return this.request(`/delete/order?tracking=${encodeURIComponent(tracking)}`, "DELETE");
    }

    async validateForPickup(tracking: string, askCollection: number = 1) {
        return this.request(
            `/valid/order?tracking=${encodeURIComponent(tracking)}&ask_collection=${askCollection}`,
            "POST"
        );
    }

    async getLabel(tracking: string) {
        const response = await fetch(
            `${this.baseUrl}/get/order/label?tracking=${encodeURIComponent(tracking)}`,
            { headers: { "Authorization": `Bearer ${this.token}` } }
        );
        if (!response.ok) throw new Error("Could not fetch label");
        return response.arrayBuffer();
    }

    async getTracking(tracking: string) {
        return this.request(`/get/tracking/info?tracking=${encodeURIComponent(tracking)}`);
    }

    async getWilayas() {
        return this.request("/get/wilayas");
    }

    async getCommunes(wilayaId: string) {
        return this.request(`/get/communes?wilaya_id=${encodeURIComponent(wilayaId)}`);
    }

    async getTarifs() {
        return this.request("/get/fees");
    }
}
