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

// Major Indian cities — shown as quick-pick chips in the city picker
// and the registration form. Users can also type any other city.
export const MAJOR_INDIAN_CITIES = [
  "Ahmedabad",
  "Mumbai",
  "Pune",
  "Bangalore",
  "Hyderabad",
  "Chennai",
  "Delhi",
  "Gurgaon",
  "Noida",
  "Kolkata",
  "Jaipur",
  "Surat",
  "Vadodara",
  "Rajkot",
  "Indore",
  "Bhopal",
  "Nagpur",
  "Lucknow",
  "Chandigarh",
  "Kochi",
];

// Locality suggestions per city (used to hint registrants and searchers).
// For cities not in this map, the form falls back to a plain free-text input.
export const AREAS_BY_CITY: Record<string, string[]> = {
  Ahmedabad: [
    "Bopal", "Satellite", "Navrangpura", "Maninagar", "Vastrapur", "Paldi",
    "Thaltej", "Gota", "Chandkheda", "Prahlad Nagar", "Ambawadi", "Ellis Bridge",
  ],
  Mumbai: [
    "Andheri", "Bandra", "Powai", "Borivali", "Thane", "Dadar",
    "Worli", "Juhu", "Goregaon", "Vile Parle", "Malad", "Kandivali",
  ],
  Pune: [
    "Koregaon Park", "Viman Nagar", "Hinjewadi", "Baner", "Aundh", "Kothrud",
    "Hadapsar", "Wakad", "Magarpatta", "Kalyani Nagar",
  ],
  Bangalore: [
    "Indiranagar", "Koramangala", "Whitefield", "HSR Layout", "BTM Layout",
    "Jayanagar", "Marathahalli", "Electronic City", "Hebbal", "JP Nagar",
  ],
  Hyderabad: [
    "HITEC City", "Gachibowli", "Jubilee Hills", "Banjara Hills", "Madhapur",
    "Kondapur", "Kukatpally", "Begumpet", "Secunderabad",
  ],
  Chennai: [
    "T Nagar", "Adyar", "Anna Nagar", "Velachery", "Tambaram", "OMR",
    "Nungambakkam", "Mylapore", "Porur",
  ],
  Delhi: [
    "Connaught Place", "Karol Bagh", "Lajpat Nagar", "Saket", "Dwarka",
    "Rohini", "Vasant Kunj", "Greater Kailash", "Janakpuri",
  ],
  Gurgaon: [
    "DLF Phase 1", "DLF Phase 2", "DLF Phase 3", "Sector 14", "Sector 29",
    "Sohna Road", "Golf Course Road", "MG Road",
  ],
  Noida: [
    "Sector 18", "Sector 62", "Sector 137", "Greater Noida", "Sector 50",
    "Sector 76",
  ],
  Kolkata: [
    "Salt Lake", "Park Street", "New Town", "Howrah", "Ballygunge",
    "Gariahat", "Behala",
  ],
  Surat: [
    "Adajan", "Vesu", "Piplod", "Citylight", "Athwa Lines", "Varachha",
    "Pal", "Katargam",
  ],
  Vadodara: [
    "Alkapuri", "Karelibaug", "Gotri", "Sayajigunj", "Akota", "Manjalpur",
  ],
  Jaipur: [
    "Vaishali Nagar", "Malviya Nagar", "C Scheme", "Mansarovar", "Tonk Road",
    "Jagatpura",
  ],
  Indore: [
    "Vijay Nagar", "Palasia", "Bhawarkua", "AB Road", "Sudama Nagar",
  ],
  Chandigarh: [
    "Sector 17", "Sector 22", "Sector 35", "Sector 8", "Mohali", "Panchkula",
  ],
};

/** Returns area suggestions for the given city, or [] if we have none. */
export function getAreasForCity(city: string): string[] {
  return AREAS_BY_CITY[city] ?? [];
}

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

export const LANGUAGES = ["Gujarati", "Hindi", "English", "Marathi", "Tamil", "Telugu", "Kannada", "Bengali", "Punjabi"];

export const GENDERS = ["Male", "Female", "Other"];

// ---- Backwards-compat (older imports referenced these names) -----------------
/** @deprecated use MAJOR_INDIAN_CITIES */
export const CITIES = MAJOR_INDIAN_CITIES;
/** @deprecated use getAreasForCity('Ahmedabad') */
export const AHMEDABAD_AREAS = AREAS_BY_CITY.Ahmedabad;
