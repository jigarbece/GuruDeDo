import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import Footer from "../../components/Footer";
import { CoachApi, buildWhatsAppLink } from "../../lib/api";
import { formatFee, initials, teachingModeLabel } from "../../lib/format";
import type { Coach } from "../../lib/types";

export default function CoachProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [coach, setCoach] = useState<Coach | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    CoachApi.getById(id)
      .then(setCoach)
      .catch(() => setCoach(null))
      .finally(() => setLoading(false));
  }, [id]);

  const onWhatsApp = () => {
    if (!coach) return;
    const skill = coach.sub_skills?.[0] ?? coach.categories?.name ?? "skill";
    const msg = `Namaste! Aapko Gurudedo pe dekha. Mujhe ${skill} seekhni hai. Kya aap available hain?`;
    CoachApi.logEnquiry(coach.id, { skillNeeded: skill, area: coach.area }).catch(() => {});
    Linking.openURL(buildWhatsAppLink(coach.whatsapp_number, msg));
  };

  const onShare = async () => {
    const url =
      Platform.OS === "web" && typeof window !== "undefined"
        ? window.location.href
        : `https://gurudedo.com/coach/${coach?.id}`;
    try {
      if (Platform.OS === "web" && navigator?.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        Linking.openURL(url);
      }
    } catch {
      /* no-op */
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-cream py-20">
        <ActivityIndicator color="#5B2C8C" size="large" />
      </View>
    );
  }

  if (!coach) {
    return (
      <View className="flex-1 items-center justify-center bg-cream py-20">
        <Text className="font-heading text-xl font-bold text-purple">Coach not found 😕</Text>
      </View>
    );
  }

  const skills = coach.sub_skills ?? [];

  return (
    <ScrollView className="flex-1 bg-cream">
      {/* Hero band — multi-color brand gradient (purple → red → teal) */}
      <View className="bg-purple px-4 pb-16 pt-10">
        <View
          className="mx-auto w-full max-w-4xl items-center rounded-3xl px-6 py-10"
          style={{ backgroundColor: "#5B2C8C" }}
        >
          <View
            className="absolute inset-0 rounded-3xl opacity-95"
            style={{
              backgroundColor: "#5B2C8C",
              ...(Platform.OS === "web"
                ? ({ backgroundImage: "linear-gradient(135deg,#5B2C8C 0%,#E63ED4 50%,#E63946 100%)" } as object)
                : {}),
            }}
          />
          <View className="items-center">
            {coach.profile_photo_url ? (
              <Image
                source={{ uri: coach.profile_photo_url }}
                className="h-28 w-28 rounded-full border-4 border-white"
              />
            ) : (
              <View className="h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-red">
                <Text className="font-heading text-3xl font-bold text-white">
                  {initials(coach.full_name)}
                </Text>
              </View>
            )}
            <View className="mt-3 flex-row items-center gap-2">
              <Text className="font-heading text-2xl font-bold text-white md:text-3xl">
                {coach.full_name}
              </Text>
              {coach.status === "approved" && <Text className="text-lg">✅</Text>}
            </View>
            <Text className="mt-1 font-body text-white/90">{coach.categories?.name}</Text>
            <Text className="mt-1 font-body text-sm text-white/80">⭐ New on Gurudedo</Text>

            <View className="mt-3 flex-row flex-wrap justify-center gap-2">
              {skills.map((s) => (
                <View key={s} className="rounded-full bg-white/20 px-3 py-1">
                  <Text className="text-xs font-semibold text-white">{s}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* Body */}
      <View className="mx-auto -mt-8 w-full max-w-4xl flex-col gap-4 px-4 pb-10 md:flex-row">
        {/* Left: info + about */}
        <View className="flex-1 gap-4">
          <Card>
            <InfoRow icon="📍" label="Location" value={`${coach.area}, ${coach.city}`} />
            <InfoRow icon="💰" label="Fee" value={formatFee(coach)} />
            <InfoRow icon="🎓" label="Experience" value={`${coach.experience_years} years`} />
            <InfoRow icon="🏠" label="Teaching Mode" value={teachingModeLabel(coach.teaching_mode)} />
            <InfoRow
              icon="🎯"
              label="Demo Class"
              value={coach.demo_available ? "Available" : "Not Available"}
            />
            {coach.languages && coach.languages.length > 0 && (
              <InfoRow icon="🗣️" label="Languages" value={coach.languages.join(", ")} />
            )}
          </Card>

          {coach.bio ? (
            <Card>
              <Text className="mb-2 font-heading text-lg font-bold text-purple">About</Text>
              <Text className="font-body text-base leading-6 text-text-dark">{coach.bio}</Text>
              {skills.length > 0 && (
                <View className="mt-4 flex-row flex-wrap gap-2">
                  {skills.map((s) => (
                    <View key={s} className="rounded-full bg-cream px-3 py-1.5">
                      <Text className="text-xs font-semibold text-purple">{s}</Text>
                    </View>
                  ))}
                </View>
              )}
            </Card>
          ) : null}

          {coach.teaching_photos && coach.teaching_photos.length > 0 && (
            <Card>
              <Text className="mb-3 font-heading text-lg font-bold text-purple">Teaching Photos</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-3">
                  {coach.teaching_photos.map((url) => (
                    <Image key={url} source={{ uri: url }} className="h-40 w-56 rounded-xl" />
                  ))}
                </View>
              </ScrollView>
            </Card>
          )}
        </View>

        {/* Right: contact card (desktop) */}
        <View className="md:w-72">
          <Card>
            <Pressable
              onPress={onWhatsApp}
              className="items-center rounded-xl bg-success py-3.5 active:opacity-80"
            >
              <Text className="font-heading text-base font-bold text-white">
                WhatsApp pe Baat Karo 💬
              </Text>
            </Pressable>
            <Pressable
              onPress={onShare}
              className="mt-3 items-center rounded-xl border border-purple py-3 active:opacity-80"
            >
              <Text className="font-heading text-sm font-semibold text-purple">
                {copied ? "✅ Link Copied!" : "Share Profile"}
              </Text>
            </Pressable>
          </Card>
        </View>
      </View>

      <Footer />
    </ScrollView>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <View className="rounded-2xl border border-brand-border bg-white p-5">{children}</View>;
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between border-b border-brand-border py-2.5 last:border-b-0">
      <Text className="font-body text-sm text-text-muted">
        {icon} {label}
      </Text>
      <Text className="ml-3 flex-1 text-right font-body text-sm font-semibold text-text-dark">
        {value}
      </Text>
    </View>
  );
}
