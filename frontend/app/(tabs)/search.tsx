import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import SearchBar from "../../components/SearchBar";
import CoachCard from "../../components/CoachCard";
import Footer from "../../components/Footer";
import { CategoryApi, CoachApi, buildWhatsAppLink, type CoachFilters } from "../../lib/api";
import { CATEGORIES, TEACHING_MODES } from "../../constants/categories";
import type { LocationSelection } from "../../components/LocationAutocomplete";
import type { Category, Coach } from "../../lib/types";

const FEE_PRESETS = [
  { label: "Any fee", min: undefined, max: undefined },
  { label: "≤ ₹1k", min: undefined, max: 1000 },
  { label: "₹1k–₹3k", min: 1000, max: 3000 },
  { label: "₹3k–₹6k", min: 3000, max: 6000 },
  { label: "₹6k+", min: 6000, max: undefined },
];

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "fee_asc", label: "Fee ↑" },
];

const PAGE_SIZE = 12;
type FilterSection = "category" | "mode" | "fee" | "demo" | "sort" | null;

export default function Search() {
  const router = useRouter();
  const params = useLocalSearchParams<{ skill?: string; city?: string; area?: string; locationType?: string; category?: string }>();

  const [categories, setCategories] = useState<Category[]>(CATEGORIES as Category[]);
  const [skill, setSkill] = useState(params.skill ?? "");

  // Build a proper LocationSelection from URL params.
  // Supports both the new format (city+area+locationType) and
  // the legacy format where area was a plain string.
  function buildInitialLocation(): LocationSelection | null {
    if (params.city) {
      if (params.locationType === "area" && params.area) {
        return { type: "area", city: params.city, area: params.area, displayName: `${params.area}, ${params.city}` };
      }
      return { type: "city", city: params.city, displayName: params.city };
    }
    // Legacy: area-only string from old home page format
    if (params.area) {
      return { type: "city", city: params.area, displayName: params.area };
    }
    return null;
  }

  const [location, setLocation] = useState<LocationSelection | null>(buildInitialLocation);
  const [category, setCategory] = useState<string | undefined>(params.category ?? undefined);
  const [teachingMode, setTeachingMode] = useState<string>("all");
  const [feeIdx, setFeeIdx] = useState(0);
  const [demoOnly, setDemoOnly] = useState(false);
  const [sort, setSort] = useState("featured");

  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [openSection, setOpenSection] = useState<FilterSection>(null);

  useEffect(() => {
    CategoryApi.list().then(setCategories).catch(() => {});
  }, []);

  const buildFilters = useCallback(
    (nextPage: number): CoachFilters => {
      const fee = FEE_PRESETS[feeIdx];
      return {
        skill: skill || undefined,
        city: location?.city || undefined,
        area: location?.type === "area" ? (location.area || undefined) : undefined,
        locationType: location?.type || undefined,
        category,
        teachingMode: teachingMode === "all" ? undefined : teachingMode,
        minFee: fee.min,
        maxFee: fee.max,
        demoAvailable: demoOnly || undefined,
        sort,
        page: nextPage,
        pageSize: PAGE_SIZE,
      };
    },
    [skill, location, category, teachingMode, feeIdx, demoOnly, sort]
  );

  const load = useCallback(
    async (nextPage: number, append: boolean) => {
      setLoading(true);
      setSearchError(null);
      try {
        const res = await CoachApi.search(buildFilters(nextPage));
        setTotal(res.total);
        setPage(res.page);
        setCoaches((prev) => (append ? [...prev, ...res.items] : res.items));
      } catch {
        setSearchError("Could not load coaches. Please try again.");
        if (!append) setCoaches([]);
      } finally {
        setLoading(false);
      }
    },
    [buildFilters]
  );

  useEffect(() => {
    load(1, false);
  }, [load]);

  const onWhatsApp = async (coach: Coach) => {
    const s = coach.sub_skills?.[0] ?? coach.categories?.name ?? "skill";
    const msg = `Namaste! Aapko Gurudedo pe dekha. Mujhe ${s} seekhni hai. Kya aap available hain?`;
    CoachApi.logEnquiry(coach.id, { skillNeeded: s, area: coach.area }).catch(() => {});
    Linking.openURL(buildWhatsAppLink(coach.whatsapp_number, msg));
  };

  const canLoadMore = coaches.length < total;

  const activeFilterCount =
    (category ? 1 : 0) +
    (teachingMode !== "all" ? 1 : 0) +
    (feeIdx !== 0 ? 1 : 0) +
    (demoOnly ? 1 : 0) +
    (sort !== "featured" ? 1 : 0);

  const toggleSection = (s: FilterSection) =>
    setOpenSection((prev) => (prev === s ? null : s));

  // Human-readable location label for the results header
  const locationLabel = location
    ? location.type === "area"
      ? location.displayName
      : location.city
    : "All India";

  return (
    <ScrollView className="flex-1 bg-cream">
      {/* ── Search bar ── */}
      <View className="border-b border-brand-border bg-cream px-3 py-3">
        <View className="mx-auto w-full max-w-6xl">
          <SearchBar
            key={location?.displayName ?? "none"}
            initialSkill={skill}
            initialLocation={location}
            onSearch={(sk, loc) => {
              setSkill(sk);
              setLocation(loc);
            }}
          />
        </View>
      </View>

      {/* ── Mobile filter toggle bar ── */}
      <View className="border-b border-brand-border bg-white px-3 py-2 md:hidden">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, alignItems: "center", paddingVertical: 2 }}
        >
          <Pressable
            onPress={() => setMobileFilterOpen((v) => !v)}
            className={`flex-row items-center gap-1.5 rounded-full border px-3 py-1.5 ${
              mobileFilterOpen || activeFilterCount > 0
                ? "border-red bg-red"
                : "border-brand-border bg-white"
            }`}
          >
            <Text className={`text-xs font-semibold ${mobileFilterOpen || activeFilterCount > 0 ? "text-white" : "text-purple"}`}>
              🎚 Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </Text>
          </Pressable>
          <Chip active={!category} onPress={() => setCategory(undefined)} text="All" />
          {categories.slice(0, 8).map((c) => (
            <Chip key={c.slug} active={category === c.slug} onPress={() => setCategory(c.slug)} text={`${c.icon} ${c.name}`} />
          ))}
          {SORTS.map((s) => (
            <Chip key={s.value} active={sort === s.value} onPress={() => setSort(s.value)} text={s.label} />
          ))}
        </ScrollView>
      </View>

      {/* ── Mobile expandable filter panel ── */}
      {mobileFilterOpen && (
        <View className="border-b border-brand-border bg-white px-4 py-3 md:hidden">
          <AccordionSection
            label={`Category${category ? ` · ${categories.find((c) => c.slug === category)?.name ?? ""}` : ""}`}
            open={openSection === "category"}
            onToggle={() => toggleSection("category")}
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2 pb-1">
                <Chip active={!category} onPress={() => setCategory(undefined)} text="All" />
                {categories.map((c) => (
                  <Chip key={c.slug} active={category === c.slug}
                    onPress={() => { setCategory(c.slug); toggleSection(null); }}
                    text={`${c.icon} ${c.name}`} />
                ))}
              </View>
            </ScrollView>
          </AccordionSection>

          <AccordionSection
            label={`Mode · ${teachingMode === "all" ? "Any" : TEACHING_MODES.find((m) => m.value === teachingMode)?.label ?? teachingMode}`}
            open={openSection === "mode"}
            onToggle={() => toggleSection("mode")}
          >
            <View className="flex-row flex-wrap gap-2 pb-1">
              <Chip active={teachingMode === "all"} onPress={() => setTeachingMode("all")} text="Any" />
              {TEACHING_MODES.map((m) => (
                <Chip key={m.value} active={teachingMode === m.value}
                  onPress={() => { setTeachingMode(m.value); toggleSection(null); }}
                  text={m.label} />
              ))}
            </View>
          </AccordionSection>

          <AccordionSection
            label={`Fee · ${FEE_PRESETS[feeIdx].label}`}
            open={openSection === "fee"}
            onToggle={() => toggleSection("fee")}
          >
            <View className="flex-row flex-wrap gap-2 pb-1">
              {FEE_PRESETS.map((f, i) => (
                <Chip key={f.label} active={feeIdx === i}
                  onPress={() => { setFeeIdx(i); toggleSection(null); }}
                  text={f.label} />
              ))}
            </View>
          </AccordionSection>

          <View className="mt-2 flex-row flex-wrap gap-2">
            <Chip active={demoOnly} onPress={() => setDemoOnly((v) => !v)}
              text={demoOnly ? "✅ Demo only" : "Demo available"} />
            {SORTS.map((s) => (
              <Chip key={s.value} active={sort === s.value} onPress={() => setSort(s.value)} text={s.label} />
            ))}
          </View>
        </View>
      )}

      <View className="mx-auto w-full max-w-6xl flex-col gap-6 px-3 py-4 md:flex-row md:px-4 md:py-6">
        {/* ── Desktop sidebar ── */}
        <View className="hidden w-64 md:flex">
          <Text className="mb-3 font-heading text-lg font-bold text-purple">Filters</Text>

          <FilterGroup label="Category">
            <Chip active={!category} onPress={() => setCategory(undefined)} text="All" />
            {categories.map((c) => (
              <Chip key={c.slug} active={category === c.slug} onPress={() => setCategory(c.slug)} text={`${c.icon} ${c.name}`} />
            ))}
          </FilterGroup>

          <FilterGroup label="Teaching Mode">
            <Chip active={teachingMode === "all"} onPress={() => setTeachingMode("all")} text="All" />
            {TEACHING_MODES.map((m) => (
              <Chip key={m.value} active={teachingMode === m.value} onPress={() => setTeachingMode(m.value)} text={m.label} />
            ))}
          </FilterGroup>

          <FilterGroup label="Fee Range (per month)">
            {FEE_PRESETS.map((f, i) => (
              <Chip key={f.label} active={feeIdx === i} onPress={() => setFeeIdx(i)} text={f.label} />
            ))}
          </FilterGroup>

          <FilterGroup label="Demo">
            <Chip active={demoOnly} onPress={() => setDemoOnly((v) => !v)}
              text={demoOnly ? "✅ Demo available" : "Demo available"} />
          </FilterGroup>

          <FilterGroup label="Sort By">
            {SORTS.map((s) => (
              <Chip key={s.value} active={sort === s.value} onPress={() => setSort(s.value)} text={s.label} />
            ))}
          </FilterGroup>
        </View>

        {/* ── Results ── */}
        <View className="flex-1">
          {/* Result count + location context */}
          <View className="mb-3 flex-row flex-wrap items-center gap-2">
            <Text className="font-body text-sm text-text-muted">
              {loading && coaches.length === 0
                ? "Searching…"
                : `${total} coach${total === 1 ? "" : "es"} found`}
            </Text>
            {location && (
              <View className="flex-row items-center gap-1 rounded-full bg-purple/10 px-3 py-1">
                <Text className="text-xs font-semibold text-purple">
                  {location.type === "city" ? "🏙️" : "📍"} {locationLabel}
                </Text>
                <Pressable onPress={() => setLocation(null)}>
                  <Text className="ml-1 text-xs text-purple/60">✕</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Error state */}
          {searchError && !loading && (
            <View className="mb-4 rounded-xl bg-red/10 px-4 py-3">
              <Text className="font-body text-sm text-red">{searchError}</Text>
            </View>
          )}

          {/* Empty state */}
          {coaches.length === 0 && !loading ? (
            <View className="items-center rounded-2xl border border-brand-border bg-white p-8">
              <Text className="text-4xl">🔍</Text>
              <Text className="mt-3 text-center font-heading text-lg font-bold text-purple">
                {location
                  ? `No coaches found in ${locationLabel}`
                  : "No coaches found"}
              </Text>
              <Text className="mt-1 text-center font-body text-sm text-text-muted">
                {location?.type === "area"
                  ? `Try searching for all of ${location.city} instead`
                  : "Try a different skill or location"}
              </Text>
              {location?.type === "area" && (
                <Pressable
                  onPress={() =>
                    setLocation({ type: "city", city: location.city, displayName: location.city })
                  }
                  className="mt-3 rounded-full border border-purple px-5 py-2"
                >
                  <Text className="font-heading text-sm font-semibold text-purple">
                    Search all of {location.city}
                  </Text>
                </Pressable>
              )}
              <Pressable
                onPress={() => router.push("/register")}
                className="mt-4 rounded-full bg-red px-6 py-3"
              >
                <Text className="font-heading font-semibold text-white">Register as Coach</Text>
              </Pressable>
            </View>
          ) : (
            <View className="flex-row flex-wrap gap-3">
              {coaches.map((c) => (
                <View key={c.id} className="w-full md:w-[48%] lg:w-[31.5%]">
                  <CoachCard coach={c} onWhatsAppClick={onWhatsApp} />
                </View>
              ))}
            </View>
          )}

          {loading && coaches.length > 0 && (
            <View className="py-6">
              <ActivityIndicator color="#5B2C8C" />
            </View>
          )}

          {canLoadMore && !loading && (
            <Pressable
              onPress={() => load(page + 1, true)}
              className="mt-6 items-center self-center rounded-full border-2 border-red px-8 py-3"
            >
              <Text className="font-heading font-semibold text-red">Load More</Text>
            </Pressable>
          )}
        </View>
      </View>

      <Footer />
    </ScrollView>
  );
}

// ── Shared primitives ────────────────────────────────────────────────────────

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="mb-5">
      <Text className="mb-2 font-heading text-sm font-semibold text-purple">{label}</Text>
      <View className="flex-row flex-wrap gap-2">{children}</View>
    </View>
  );
}

function AccordionSection({ label, open, onToggle, children }: {
  label: string; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <View className="mb-1 border-b border-brand-border">
      <Pressable onPress={onToggle} className="flex-row items-center justify-between py-2.5">
        <Text className="font-heading text-sm font-semibold text-purple">{label}</Text>
        <Text className="text-purple">{open ? "▲" : "▼"}</Text>
      </Pressable>
      {open && <View className="pb-3">{children}</View>}
    </View>
  );
}

function Chip({ text, active, onPress }: { text: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full border px-3 py-1.5 ${active ? "border-red bg-red" : "border-brand-border bg-white"}`}
    >
      <Text className={`text-xs ${active ? "font-semibold text-white" : "text-purple"}`}>{text}</Text>
    </Pressable>
  );
}
