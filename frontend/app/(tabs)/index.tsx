import { useEffect, useState } from "react";
import { Image, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import SearchBar from "../../components/SearchBar";
import CategoryGrid from "../../components/CategoryGrid";
import CoachCard from "../../components/CoachCard";
import HowItWorks from "../../components/HowItWorks";
import Footer from "../../components/Footer";
import { CategoryApi, CoachApi, buildWhatsAppLink } from "../../lib/api";
import { CATEGORIES } from "../../constants/categories";
import { useCity } from "../../lib/city";
import type { Category, Coach } from "../../lib/types";

export default function Home() {
  const router = useRouter();
  const city = useCity();
  const [categories, setCategories] = useState<Category[]>(CATEGORIES as Category[]);
  const [featured, setFeatured] = useState<Coach[]>([]);

  useEffect(() => {
    CategoryApi.list().then(setCategories).catch(() => {});
    CoachApi.list({ featured: true, city, pageSize: 8 })
      .then((r) => setFeatured(r.items))
      .catch(() => {});
  }, [city]);

  const goSearch = (skill: string, location: import("../../components/LocationAutocomplete").LocationSelection | null) =>
    router.push({
      pathname: "/search",
      params: {
        skill: skill || undefined,
        city: location?.city || undefined,
        area: location?.area || undefined,
        locationType: location?.type || undefined,
      },
    });

  const onWhatsApp = async (coach: Coach) => {
    const skill = coach.sub_skills?.[0] ?? coach.categories?.name ?? "skill";
    const msg = `Namaste! Aapko Gurudedo pe dekha. Mujhe ${skill} seekhni hai. Kya aap available hain?`;
    CoachApi.logEnquiry(coach.id, { skillNeeded: skill, area: coach.area }).catch(() => {});
    Linking.openURL(buildWhatsAppLink(coach.whatsapp_number, msg));
  };

  return (
    <ScrollView className="flex-1 bg-cream" contentContainerStyle={{ paddingBottom: 0 }}>
      {/* B. Hero */}
      <View className="items-center px-4 pb-10 pt-10">
        <View className="w-full max-w-3xl items-center">
          <Image
            source={require("../../assets/logo-main.png")}
            style={{ width: 320, height: 160 }}
            resizeMode="contain"
          />
          <Text className="mt-3 text-center font-heading text-base font-semibold text-teal md:text-lg">
            Find the Right Teacher. Learn Any Skill.
          </Text>
          <Text className="mt-2 text-center font-body text-sm text-text-muted md:text-base">
            Search coaches for any skill — near you, right now.
          </Text>
          <View className="mt-6 w-full">
            <SearchBar onSearch={goSearch} />
          </View>
          <Text className="mt-3 font-body text-sm text-text-muted">
            Showing coaches in {city} · Trusted across India 🇮🇳
          </Text>
        </View>
      </View>

      {/* C. Category grid */}
      <Section title="Kya seekhna hai? (What do you want to learn?)">
        <View className="w-full max-w-4xl">
          <CategoryGrid
            categories={categories}
            onCategorySelect={(c) =>
              router.push({ pathname: "/search", params: { category: c.slug } })
            }
          />
        </View>
      </Section>

      {/* D. Featured coaches */}
      {featured.length > 0 && (
        <Section title="Featured Coaches ⭐">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 16, paddingHorizontal: 4 }}
            className="w-full max-w-5xl"
          >
            {featured.map((c) => (
              <View key={c.id} className="w-72">
                <CoachCard coach={c} onWhatsAppClick={onWhatsApp} />
              </View>
            ))}
          </ScrollView>
          <Pressable onPress={() => router.push("/search")} className="mt-4">
            <Text className="font-heading font-semibold text-red">View All →</Text>
          </Pressable>
        </Section>
      )}

      {/* E. How it works */}
      <Section title="Kaise kaam karta hai? (How does it work?)">
        <View className="w-full max-w-4xl">
          <HowItWorks />
        </View>
      </Section>

      {/* F. Stats bar */}
      <View className="mt-6 w-full bg-purple px-4 py-10">
        <View className="mx-auto w-full max-w-5xl flex-row flex-wrap justify-around gap-6">
          <Stat number="500+" label="Coaches" />
          <Stat number="12" label="Skill Categories" />
          <Stat number="All India" label="🇮🇳 & Growing" />
          <Stat number="Free" label="to Join" />
        </View>
      </View>

      {/* G. CTA banner */}
      <View className="items-center px-4 py-12">
        <View className="w-full max-w-3xl items-center rounded-3xl bg-red px-6 py-10">
          <Text className="text-center font-heading text-2xl font-bold text-white md:text-3xl">
            Aap bhi coach hain? 🎓
          </Text>
          <Text className="mt-2 text-center font-body text-base text-white/90">
            Register free aur apne students dhundho!
          </Text>
          <Pressable
            onPress={() => router.push("/register")}
            className="mt-5 rounded-full bg-white px-8 py-3 active:opacity-80"
          >
            <Text className="font-heading text-base font-bold text-red">Register Now →</Text>
          </Pressable>
        </View>
      </View>

      {/* H. Footer */}
      <Footer />
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="items-center px-4 py-8">
      <Text className="mb-6 text-center font-heading text-2xl font-bold text-purple md:text-3xl">
        {title}
      </Text>
      <View className="w-full items-center">{children}</View>
    </View>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <View className="items-center">
      <Text className="font-heading text-3xl font-extrabold text-pink">{number}</Text>
      <Text className="mt-1 font-body text-sm text-white/80">{label}</Text>
    </View>
  );
}
