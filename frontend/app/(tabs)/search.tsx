import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
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
import { useCity } from "../../lib/city";
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

// ---- Mobile filter sections (for the dropdown accordion) --------------------
type FilterSection = "category" | "mode" | "fee" | "demo" | "sort" | null;

export default function Search() {
  const router = useRouter();
  const params = useLocalSearchParams<{ skill?: string; area?: string; category?: string }>();
  const city = useCity();

  const [categories, setCategories] = useState<Category[]>(CATEGORIES as Category[]);
  const [skill, setSkill] = useState(params.skill ?? "");
  const [area, setArea] = useState(params.area ?? "");
  const [category, setCategory] = useState<string | undefined>(params.category);
  const [teachingMode, setTeachingMode] = useState<string>("all");
  const [feeIdx, setFeeIdx] = useState(0);
  const [demoOnly, setDemoOnly] = useState(false);
  const [sort, setSort] = useState("featured");

  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Mobile filter panel open/close
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
        area: area || undefined,
        city,
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
    [skill, area, city, category, teachingMode, feeIdx, demoOnly, sort]
  );

  const load = useCallback(
    async (nextPage: number, append: boolean) => {
      setLoading(true);
      try {
        const res = await CoachApi.search(buildFilters(nextPage));
        setTotal(res.total);
        setPage(res.page);
        setCoaches((prev) => (append ? [...prev, ...res.items] : res.items));
      } catch {
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

  // Count active filters for the badge
  const activeFilterCount =
    (category ? 1 : 0) +
    (teachingMode !== "all" ? 1 : 0) +
    (feeIdx !== 0 ? 1 : 0) +
    (demoOnly ? 1 : 0) +
    (sort !== "featured" ? 1 : 0);

  const toggleSection = (s: FilterSection) =>
    setOpenSection((prev) => (prev === s ? null : s));

  return (
    <ScrollView className="flex-1 bg-cream">
      {/* ── Search bar ── */}
      <View className="border-b border-brand-border bg-cream px-3 py-3">
        <View className="mx-auto w-full max-w-6xl">
          <SearchBar
            initialSkill={skill}
            initialArea={area}
            onSearch={(sk, ar) => {
              setSkill(sk);
              setArea(ar);
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
          {/* Filter toggle button */}
          <Pressable
            onPress={() => setMobileFilterOpen((v) => !v)}
            className={`flex-row items-center gap-1.5 rounded-full border px-3 py-1.5 ${
              mobileFilterOpen || activeFilterCount > 0
                ? "border-red bg-red"
                : "border-brand-border bg-white"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                mobileFilterOpen || activeFilterCount > 0 ? "text-white" : "text-purple"
              }`}
            >
              🎚 Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </Text>
          </Pressable>

          {/* Quick category chips */}
          <Chip active={!category} onPress={() => setCategory(undefined)} text="All" />
          {categories.slice(0, 8).map((c) => (
            <Chip
              key={c.slug}
              active={category === c.slug}
              onPress={() => setCategory(c.slug)}
              text={`${c.icon} ${c.name}`}
            />
          ))}

          {/* Sort quick chips */}
          {SORTS.map((s) => (
            <Chip
              key={s.value}
              active={sort === s.value}
              onPress={() => setSort(s.value)}
              text={s.label}
            />
          ))}
        </ScrollView>
      </View>

      {/* ── Mobile expandable full filter panel ── */}
      {mobileFilterOpen && (
        <View className="border-b border-brand-border bg-white px-4 py-3 md:hidden">
          {/* Category accordion */}
          <AccordionSection
            label={`Category${category ? ` · ${categories.find((c) => c.slug === category)?.name ?? ""}` : ""}`}
            open={openSection === "category"}
            onToggle={() => toggleSection("category")}
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2 pb-1">
                <Chip active={!category} onPress={() => setCategory(undefined)} text="All" />
                {categories.map((c) => (
                  <Chip
                    key={c.slug}
                    active={category === c.slug}
                    onPress={() => { setCategory(c.slug); toggleSection(null); }}
                    text={`${c.icon} ${c.name}`}
                  />
                ))}
              </View>
            </ScrollView>
          </AccordionSection>

          {/* Teaching mode */}
          <AccordionSection
            label={`Mode · ${teachingMode === "all" ? "Any" : TEACHING_MODES.find((m) => m.value === teachingMode)?.label ?? teachingMode}`}
            open={openSection === "mode"}
            onToggle={() => toggleSection("mode")}
          >
            <View className="flex-row flex-wrap gap-2 pb-1">
              <Chip active={teachingMode === "all"} onPress={() => setTeachingMode("all")} text="Any" />
              {TEACHING_MODES.map((m) => (
                <Chip
                  key={m.value}
                  active={teachingMode === m.value}
                  onPress={() => { setTeachingMode(m.value); toggleSection(null); }}
                  text={m.label}
                />
              ))}
            </View>
          </AccordionSection>

          {/* Fee */}
          <AccordionSection
            label={`Fee · ${FEE_PRESETS[feeIdx].label}`}
            open={openSection === "fee"}
            onToggle={() => toggleSection("fee")}
          >
            <View className="flex-row flex-wrap gap-2 pb-1">
              {FEE_PRESETS.map((f, i) => (
                <Chip
                  key={f.label}
                  active={feeIdx === i}
                  onPress={() => { setFeeIdx(i); toggleSection(null); }}
                  text={f.label}
                />
              ))}
            </View>
          </AccordionSection>

          {/* Demo + Sort in one row */}
          <View className="mt-2 flex-row flex-wrap gap-2">
            <Chip
              active={demoOnly}
              onPress={() => setDemoOnly((v) => !v)}
              text={demoOnly ? "✅ Demo only" : "Demo available"}
            />
            {SORTS.map((s) => (
              <Chip key={s.value} active={sort === s.value} onPress={() => setSort(s.value)} text={s.label} />
            ))}
          </View>
        </View>
      )}

      <View className="mx-auto w-full max-w-6xl flex-col gap-6 px-3 py-4 md:flex-row md:px-4 md:py-6">
        {/* ── Desktop sidebar filters ── */}
        <View className="hidden w-64 md:flex">
          <Text className="mb-3 font-heading text-lg font-bold text-purple">Filters</Text>

          <FilterGroup label="Category">
            <Chip active={!category} onPress={() => setCategory(undefined)} text="All" />
            {categories.map((c) => (
              <Chip
                key={c.slug}
                active={category === c.slug}
                onPress={() => setCategory(c.slug)}
                text={`${c.icon} ${c.name}`}
              />
            ))}
          </FilterGroup>

          <FilterGroup label="Teaching Mode">
            <Chip active={teachingMode === "all"} onPress={() => setTeachingMode("all")} text="All" />
            {TEACHING_MODES.map((m) => (
              <Chip
                key={m.value}
                active={teachingMode === m.value}
                onPress={() => setTeachingMode(m.value)}
                text={m.label}
              />
            ))}
          </FilterGroup>

          <FilterGroup label="Fee Range (per month)">
            {FEE_PRESETS.map((f, i) => (
              <Chip key={f.label} active={feeIdx === i} onPress={() => setFeeIdx(i)} text={f.label} />
            ))}
          </FilterGroup>

          <FilterGroup label="Demo">
            <Chip
              active={demoOnly}
              onPress={() => setDemoOnly((v) => !v)}
              text={demoOnly ? "✅ Demo available" : "Demo available"}
            />
          </FilterGroup>

          <FilterGroup label="Sort By">
            {SORTS.map((s) => (
              <Chip key={s.value} active={sort === s.value} onPress={() => setSort(s.value)} text={s.label} />
            ))}
          </FilterGroup>
        </View>

        {/* ── Results ── */}
        <View className="flex-1">
          <Text className="mb-3 font-body text-sm text-text-muted">
            {loading && coaches.length === 0
              ? "Searching…"
              : `${total} coach${total === 1 ? "" : "es"} found`}
          </Text>

          {coaches.length === 0 && !loading ? (
            <View className="items-center rounded-2xl border border-brand-border bg-white p-8">
              <Text className="text-4xl">🔍</Text>
              <Text className="mt-3 text-center font-heading text-lg font-bold text-purple">
                Koi coach nahi mila. Register karo!
              </Text>
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

// ── Shared primitives ─────────────────────────────────────────────────────────

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="mb-5">
      <Text className="mb-2 font-heading text-sm font-semibold text-purple">{label}</Text>
      <View className="flex-row flex-wrap gap-2">{children}</View>
    </View>
  );
}

function AccordionSection({
  label,
  open,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
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
      className={`rounded-full border px-3 py-1.5 ${
        active ? "border-red bg-red" : "border-brand-border bg-white"
      }`}
    >
      <Text className={`text-xs ${active ? "font-semibold text-white" : "text-purple"}`}>
        {text}
      </Text>
    </Pressable>
  );
}
