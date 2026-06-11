import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import SearchBar from "../../components/SearchBar";
import CoachCard from "../../components/CoachCard";
import Footer from "../../components/Footer";
import { CategoryApi, CoachApi, buildWhatsAppLink, type CoachFilters } from "../../lib/api";
import { CATEGORIES, TEACHING_MODES } from "../../constants/categories";
import type { Category, Coach } from "../../lib/types";

const FEE_PRESETS = [
  { label: "Any", min: undefined, max: undefined },
  { label: "≤ ₹1,000", min: undefined, max: 1000 },
  { label: "₹1k–₹3k", min: 1000, max: 3000 },
  { label: "₹3k–₹6k", min: 3000, max: 6000 },
  { label: "₹6k+", min: 6000, max: undefined },
];

const SORTS = [
  { value: "featured", label: "Featured first" },
  { value: "newest", label: "Newest" },
  { value: "fee_asc", label: "Fee: Low to High" },
];

const PAGE_SIZE = 12;

export default function Search() {
  const router = useRouter();
  const params = useLocalSearchParams<{ skill?: string; area?: string; category?: string }>();

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

  useEffect(() => {
    CategoryApi.list().then(setCategories).catch(() => {});
  }, []);

  const buildFilters = useCallback(
    (nextPage: number): CoachFilters => {
      const fee = FEE_PRESETS[feeIdx];
      return {
        skill: skill || undefined,
        area: area || undefined,
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
    [skill, area, category, teachingMode, feeIdx, demoOnly, sort]
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

  // Re-run search when any filter changes.
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

  return (
    <ScrollView className="flex-1 bg-cream">
      {/* Sticky-ish search bar */}
      <View className="border-b border-brand-border bg-cream px-4 py-4">
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

      <View className="mx-auto w-full max-w-6xl flex-col gap-6 px-4 py-6 md:flex-row">
        {/* Filters */}
        <View className="w-full md:w-64">
          <Text className="mb-3 font-heading text-lg font-bold text-navy">Filters</Text>

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

        {/* Results */}
        <View className="flex-1">
          <Text className="mb-4 font-body text-sm text-text-muted">
            {loading && coaches.length === 0 ? "Searching…" : `${total} coach${total === 1 ? "" : "es"} found`}
          </Text>

          {coaches.length === 0 && !loading ? (
            <View className="items-center rounded-2xl border border-brand-border bg-white p-10">
              <Text className="text-4xl">🔍</Text>
              <Text className="mt-3 text-center font-heading text-lg font-bold text-navy">
                Koi coach nahi mila. Register karo!
              </Text>
              <Pressable
                onPress={() => router.push("/register")}
                className="mt-4 rounded-full bg-saffron px-6 py-3"
              >
                <Text className="font-heading font-semibold text-white">Register as Coach</Text>
              </Pressable>
            </View>
          ) : (
            <View className="flex-row flex-wrap gap-4">
              {coaches.map((c) => (
                <View key={c.id} className="w-full md:w-[48%] lg:w-[31.5%]">
                  <CoachCard coach={c} onWhatsAppClick={onWhatsApp} />
                </View>
              ))}
            </View>
          )}

          {loading && coaches.length > 0 && (
            <View className="py-6">
              <ActivityIndicator color="#FF6B35" />
            </View>
          )}

          {canLoadMore && !loading && (
            <Pressable
              onPress={() => load(page + 1, true)}
              className="mt-6 items-center self-center rounded-full border-2 border-saffron px-8 py-3"
            >
              <Text className="font-heading font-semibold text-saffron">Load More</Text>
            </Pressable>
          )}
        </View>
      </View>

      <Footer />
    </ScrollView>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="mb-5">
      <Text className="mb-2 font-heading text-sm font-semibold text-navy">{label}</Text>
      <View className="flex-row flex-wrap gap-2">{children}</View>
    </View>
  );
}

function Chip({ text, active, onPress }: { text: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full border px-3 py-1.5 ${
        active ? "border-saffron bg-saffron" : "border-brand-border bg-white"
      }`}
    >
      <Text className={`text-xs ${active ? "font-semibold text-white" : "text-navy"}`}>{text}</Text>
    </Pressable>
  );
}
