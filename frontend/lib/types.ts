// Shared types mirroring the backend API responses (PostgREST snake_case).

export interface Category {
  id: string;
  name: string;
  icon: string;
  slug: string;
  sort_order: number;
  is_active?: boolean;
}

export interface Coach {
  id: string;
  full_name: string;
  phone: string;
  whatsapp_number: string;
  email?: string | null;
  city: string;
  area: string;
  pincode?: string | null;
  category_id?: string | null;
  sub_skills?: string[] | null;
  experience_years: number;
  fee_min?: number | null;
  fee_max?: number | null;
  fee_type: string;
  teaching_mode: string;
  demo_available: boolean;
  bio?: string | null;
  profile_photo_url?: string | null;
  teaching_photos?: string[] | null;
  status: "pending" | "approved" | "rejected";
  featured: boolean;
  gender?: string | null;
  languages?: string[] | null;
  created_at?: string;
  categories?: Category | null;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface AdminStats {
  totalCoaches: number;
  pending: number;
  approved: number;
  rejected: number;
  enquiriesToday: number;
}

export interface CoachRegisterPayload {
  fullName: string;
  phone: string;
  whatsappNumber: string;
  email?: string;
  city: string;
  area: string;
  pincode?: string;
  categoryId: string;
  subSkills: string[];
  experienceYears: number;
  feeMin: number;
  feeMax: number;
  feeType: string;
  teachingMode: string;
  demoAvailable: boolean;
  bio: string;
  gender?: string;
  languages: string[];
}
