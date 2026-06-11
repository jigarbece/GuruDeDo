import { Image, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import type { Coach } from "../lib/types";
import { formatFee, initials, teachingModeLabel } from "../lib/format";

interface Props {
  coach: Coach;
  onWhatsAppClick: (coach: Coach) => void;
}

export default function CoachCard({ coach, onWhatsAppClick }: Props) {
  const router = useRouter();
  const skills = coach.sub_skills ?? [];
  const shownSkills = skills.slice(0, 3);
  const extra = skills.length - shownSkills.length;

  return (
    <View className="w-full overflow-hidden rounded-2xl border border-brand-border bg-white">
      {/* Header */}
      <View className="flex-row items-center gap-3 p-4">
        {coach.profile_photo_url ? (
          <Image
            source={{ uri: coach.profile_photo_url }}
            className="h-14 w-14 rounded-full"
          />
        ) : (
          <View className="h-14 w-14 items-center justify-center rounded-full bg-saffron">
            <Text className="font-heading text-lg font-bold text-white">
              {initials(coach.full_name)}
            </Text>
          </View>
        )}
        <View className="flex-1">
          <View className="flex-row items-center gap-1">
            <Text className="font-heading text-lg font-bold text-navy" numberOfLines={1}>
              {coach.full_name}
            </Text>
            {coach.status === "approved" && <Text className="text-sm">✅</Text>}
          </View>
          <Text className="font-body text-sm text-text-muted">
            {coach.categories?.name ?? "Coach"}
          </Text>
        </View>
        {coach.featured && (
          <View className="rounded-full bg-warning/20 px-2 py-1">
            <Text className="text-xs font-semibold text-warning">⭐ Featured</Text>
          </View>
        )}
      </View>

      {/* Skills */}
      {shownSkills.length > 0 && (
        <View className="flex-row flex-wrap gap-1.5 px-4">
          {shownSkills.map((s) => (
            <View key={s} className="rounded-full bg-cream px-2.5 py-1">
              <Text className="text-xs text-navy">{s}</Text>
            </View>
          ))}
          {extra > 0 && (
            <View className="rounded-full bg-cream px-2.5 py-1">
              <Text className="text-xs text-text-muted">+{extra} more</Text>
            </View>
          )}
        </View>
      )}

      {/* Meta */}
      <View className="gap-1 p-4">
        <Text className="font-body text-sm text-text-dark">
          📍 {coach.area}, {coach.city}
        </Text>
        <Text className="font-body text-sm font-semibold text-text-dark">
          💰 {formatFee(coach)}
        </Text>
        <View className="mt-1 flex-row flex-wrap gap-1.5">
          <View className="rounded-full bg-navy/10 px-2.5 py-1">
            <Text className="text-xs text-navy">🎓 {coach.experience_years} yrs</Text>
          </View>
          <View className="rounded-full bg-navy/10 px-2.5 py-1">
            <Text className="text-xs text-navy">{teachingModeLabel(coach.teaching_mode)}</Text>
          </View>
          {coach.demo_available && (
            <View className="rounded-full bg-success/15 px-2.5 py-1">
              <Text className="text-xs font-semibold text-success">🎯 Demo Available</Text>
            </View>
          )}
        </View>
      </View>

      {/* Actions */}
      <View className="flex-row gap-2 p-4 pt-0">
        <Pressable
          onPress={() => router.push(`/coach/${coach.id}`)}
          className="flex-1 items-center rounded-xl border border-navy py-2.5 active:opacity-80"
        >
          <Text className="font-heading text-sm font-semibold text-navy">View Profile</Text>
        </Pressable>
        <Pressable
          onPress={() => onWhatsAppClick(coach)}
          className="flex-1 items-center rounded-xl bg-success py-2.5 active:opacity-80"
        >
          <Text className="font-heading text-sm font-semibold text-white">💬 WhatsApp</Text>
        </Pressable>
      </View>
    </View>
  );
}
