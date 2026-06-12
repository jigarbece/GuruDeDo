import axios from "axios";
import { Platform } from "react-native";
import type {
  AdminStats,
  Category,
  Coach,
  CoachRegisterPayload,
  PagedResult,
} from "./types";
import type { LocationSelection } from "./location";

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5000").replace(/\/+$/, "");

/**
 * Repeated-key serializer (e.g. `?loc=city:Ahmedabad&loc=area:Bopal|Ahmedabad`).
 * axios's default serializer emits arrays as `loc[]=…` which ASP.NET model-binds
 * differently. The backend reads `string[]? loc` which expects repeated keys.
 */
function serializeRepeating(params: Record<string, unknown>): string {
  const parts: string[] = [];
  const push = (k: string, v: unknown) => {
    if (v === undefined || v === null || v === "") return;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  };
  for (const [k, v] of Object.entries(params)) {
    if (Array.isArray(v)) v.forEach((item) => push(k, item));
    else push(k, v);
  }
  return parts.join("&");
}

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 15000,
  paramsSerializer: { serialize: serializeRepeating },
});

/** Encode one LocationSelection as the `loc` query value the backend expects. */
export function encodeLocationParam(loc: LocationSelection): string {
  if (loc.type === "area" && loc.area) return `area:${loc.area}|${loc.city}`;
  return `city:${loc.city}`;
}

// ---- Admin token storage (web localStorage; falls back to in-memory) ----------
const TOKEN_KEY = "gurudedo_admin_token";
let memoryToken: string | null = null;

export function getAdminToken(): string | null {
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    return localStorage.getItem(TOKEN_KEY);
  }
  return memoryToken;
}

export function setAdminToken(token: string | null) {
  memoryToken = token;
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }
}

function authHeader() {
  const token = getAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ---- Public ------------------------------------------------------------------

export interface CoachFilters {
  skill?: string;
  /** New multi-location filter — repeated `loc` params. Each entry matches any. */
  locations?: LocationSelection[];
  /** Legacy single-location fields — still honoured by the backend for now. */
  area?: string;
  city?: string;
  locationType?: "city" | "area";
  category?: string;       // slug
  minFee?: number;
  maxFee?: number;
  teachingMode?: string;
  demoAvailable?: boolean;
  featured?: boolean;
  sort?: string;
  page?: number;
  pageSize?: number;
}

/** Flatten a CoachFilters into a plain params object the serializer can handle. */
function flattenFilters(f: CoachFilters): Record<string, unknown> {
  const { locations, ...rest } = f;
  const out: Record<string, unknown> = { ...rest };
  if (locations && locations.length > 0) {
    out.loc = locations.map(encodeLocationParam);
  }
  return out;
}

export const CoachApi = {
  async list(filters: CoachFilters = {}): Promise<PagedResult<Coach>> {
    const { data } = await api.get("/coaches", { params: flattenFilters(filters) });
    return data;
  },

  async search(filters: CoachFilters = {}): Promise<PagedResult<Coach>> {
    const { data } = await api.get("/coaches/search", { params: flattenFilters(filters) });
    return data;
  },

  async getById(id: string): Promise<Coach> {
    const { data } = await api.get(`/coaches/${id}`);
    return data;
  },

  async register(payload: CoachRegisterPayload): Promise<Coach> {
    const { data } = await api.post("/coaches/register", payload);
    return data;
  },

  async logEnquiry(
    coachId: string,
    body: {
      studentName?: string;
      studentPhone?: string;
      skillNeeded?: string;
      area?: string;
      message?: string;
    }
  ): Promise<void> {
    await api.post(`/coaches/${coachId}/enquiry`, body);
  },

  /** Skill/category suggestions for the search box typeahead. */
  async suggest(q: string): Promise<string[]> {
    if (!q || q.trim().length < 1) return [];
    const { data } = await api.get("/coaches/suggest", { params: { q, limit: 10 } });
    return data as string[];
  },
};

export const CategoryApi = {
  async list(): Promise<Category[]> {
    const { data } = await api.get("/categories");
    return data;
  },
};

// ---- Admin -------------------------------------------------------------------

export const AdminApi = {
  async login(password: string): Promise<string> {
    const { data } = await api.post("/admin/login", { password });
    setAdminToken(data.token);
    return data.token;
  },

  logout() {
    setAdminToken(null);
  },

  async stats(): Promise<AdminStats> {
    const { data } = await api.get("/admin/stats", { headers: authHeader() });
    return data;
  },

  async pending(): Promise<PagedResult<Coach>> {
    const { data } = await api.get("/admin/coaches/pending", { headers: authHeader() });
    return data;
  },

  async all(status = "all"): Promise<PagedResult<Coach>> {
    const { data } = await api.get("/admin/coaches/all", {
      params: { status },
      headers: authHeader(),
    });
    return data;
  },

  async approve(id: string): Promise<Coach> {
    const { data } = await api.put(`/admin/coaches/${id}/approve`, null, { headers: authHeader() });
    return data;
  },

  async reject(id: string): Promise<Coach> {
    const { data } = await api.put(`/admin/coaches/${id}/reject`, null, { headers: authHeader() });
    return data;
  },

  async feature(id: string, featured: boolean): Promise<Coach> {
    const { data } = await api.put(`/admin/coaches/${id}/feature`, null, {
      params: { featured },
      headers: authHeader(),
    });
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/admin/coaches/${id}`, { headers: authHeader() });
  },
};

// ---- WhatsApp helpers --------------------------------------------------------

/** Builds a wa.me deep link with a pre-filled message. Number is normalised to 91XXXXXXXXXX. */
export function buildWhatsAppLink(whatsappNumber: string, message: string): string {
  const digits = (whatsappNumber || "").replace(/\D/g, "");
  const withCc = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${withCc}?text=${encodeURIComponent(message)}`;
}
