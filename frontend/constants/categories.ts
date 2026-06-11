// Fallback skill categories — mirrors the seed data in 001_initial_schema.sql.
// The app fetches live categories from the API; this is used before they load
// and as an offline fallback.

export interface Category {
  id?: string;
  name: string;
  icon: string;
  slug: string;
  sort_order: number;
}

export const CATEGORIES: Category[] = [
  { name: "Academics", icon: "📚", slug: "academics", sort_order: 1 },
  { name: "Music", icon: "🎵", slug: "music", sort_order: 2 },
  { name: "Dance", icon: "💃", slug: "dance", sort_order: 3 },
  { name: "Fitness & Yoga", icon: "🧘", slug: "fitness", sort_order: 4 },
  { name: "Art & Drawing", icon: "🎨", slug: "art", sort_order: 5 },
  { name: "Cooking & Baking", icon: "👨‍🍳", slug: "cooking", sort_order: 6 },
  { name: "Beauty & Salon", icon: "💅", slug: "beauty", sort_order: 7 },
  { name: "Language", icon: "🗣️", slug: "language", sort_order: 8 },
  { name: "Tech & Coding", icon: "💻", slug: "tech", sort_order: 9 },
  { name: "Spiritual & Meditation", icon: "🪷", slug: "spiritual", sort_order: 10 },
  { name: "Photography", icon: "📷", slug: "photography", sort_order: 11 },
  { name: "Other Skills", icon: "⭐", slug: "other", sort_order: 12 },
];

// Locality suggestions for Ahmedabad (registration + search hints).
export const AHMEDABAD_AREAS = [
  "Bopal", "Satellite", "Navrangpura", "Maninagar", "Vastrapur", "Paldi",
  "Thaltej", "Gota", "Chandkheda", "Prahlad Nagar", "Ambawadi", "Ellis Bridge",
];

export const CITIES = ["Ahmedabad"];

export const TEACHING_MODES = [
  { value: "home_visit", label: "Home Visit" },
  { value: "online", label: "Online" },
  { value: "center", label: "Center" },
];

export const FEE_TYPES = [
  { value: "monthly", label: "Monthly" },
  { value: "hourly", label: "Hourly" },
  { value: "per_session", label: "Per Session" },
];

export const LANGUAGES = ["Gujarati", "Hindi", "English"];

export const GENDERS = ["Male", "Female", "Other"];
