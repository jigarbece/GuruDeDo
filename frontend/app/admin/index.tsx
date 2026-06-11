import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { AdminApi, getAdminToken } from "../../lib/api";
import { formatFee } from "../../lib/format";
import type { AdminStats, Coach } from "../../lib/types";

export default function Admin() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(Boolean(getAdminToken()));
  }, []);

  return authed ? (
    <Dashboard onLogout={() => setAuthed(false)} />
  ) : (
    <Gate onSuccess={() => setAuthed(true)} />
  );
}

// ---- Password gate ------------------------------------------------------------

function Gate({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const shake = useRef(new Animated.Value(0)).current;

  const doShake = () =>
    Animated.sequence([
      Animated.timing(shake, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();

  const login = async () => {
    setLoading(true);
    setError(null);
    try {
      await AdminApi.login(password);
      onSuccess();
    } catch {
      setError("Galat password. Try again.");
      doShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-cream px-4 py-20">
      <Animated.View
        style={{ transform: [{ translateX: shake }] }}
        className="w-full max-w-sm rounded-2xl border border-brand-border bg-white p-6"
      >
        <Text className="text-center font-heading text-2xl font-bold text-navy">Admin Login 🔐</Text>
        <Text className="mt-1 text-center font-body text-sm text-text-muted">
          Enter the admin password to continue.
        </Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
          onSubmitEditing={login}
          className="mt-5 rounded-xl border border-brand-border px-4 py-3 font-body text-base text-text-dark"
        />
        {error && <Text className="mt-2 font-body text-sm text-saffron">{error}</Text>}
        <Pressable
          onPress={login}
          disabled={loading}
          className={`mt-4 items-center rounded-xl py-3 ${loading ? "bg-saffron/60" : "bg-saffron"}`}
        >
          <Text className="font-heading font-semibold text-white">
            {loading ? "Checking…" : "Login"}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ---- Dashboard ----------------------------------------------------------------

type Tab = "pending" | "all";

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [tab, setTab] = useState<Tab>("pending");
  const [statusFilter, setStatusFilter] = useState("all");
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadStats = useCallback(() => {
    AdminApi.stats().then(setStats).catch(() => {});
  }, []);

  const loadCoaches = useCallback(async () => {
    setLoading(true);
    try {
      const res = tab === "pending" ? await AdminApi.pending() : await AdminApi.all(statusFilter);
      setCoaches(res.items);
    } catch {
      setCoaches([]);
    } finally {
      setLoading(false);
    }
  }, [tab, statusFilter]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadCoaches();
  }, [loadCoaches]);

  const act = async (fn: () => Promise<unknown>, id: string) => {
    setBusyId(id);
    try {
      await fn();
      await Promise.all([loadCoaches(), loadStats()]);
    } catch {
      /* surfaced via reload */
    } finally {
      setBusyId(null);
    }
  };

  const logout = () => {
    AdminApi.logout();
    onLogout();
  };

  return (
    <ScrollView className="flex-1 bg-cream">
      <View className="mx-auto w-full max-w-6xl px-4 py-8">
        <View className="flex-row items-center justify-between">
          <Text className="font-heading text-3xl font-bold text-navy">Admin Dashboard</Text>
          <Pressable onPress={logout} className="rounded-full border border-navy px-4 py-2">
            <Text className="font-heading text-sm font-semibold text-navy">Logout</Text>
          </Pressable>
        </View>

        {/* Stats */}
        <View className="mt-6 flex-row flex-wrap gap-3">
          <StatCard label="Total Coaches" value={stats?.totalCoaches} />
          <StatCard label="Pending" value={stats?.pending} accent />
          <StatCard label="Approved" value={stats?.approved} />
          <StatCard label="Today's Enquiries" value={stats?.enquiriesToday} />
        </View>

        {/* Tabs */}
        <View className="mt-8 flex-row gap-2">
          <TabBtn active={tab === "pending"} onPress={() => setTab("pending")} text="Pending" />
          <TabBtn active={tab === "all"} onPress={() => setTab("all")} text="All Coaches" />
        </View>

        {tab === "all" && (
          <View className="mt-4 flex-row flex-wrap gap-2">
            {["all", "pending", "approved", "rejected"].map((s) => (
              <Pressable
                key={s}
                onPress={() => setStatusFilter(s)}
                className={`rounded-full border px-3 py-1.5 ${
                  statusFilter === s ? "border-saffron bg-saffron" : "border-brand-border bg-white"
                }`}
              >
                <Text className={`text-xs capitalize ${statusFilter === s ? "font-semibold text-white" : "text-navy"}`}>
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* List */}
        <View className="mt-5 gap-3">
          {loading ? (
            <ActivityIndicator color="#FF6B35" className="py-8" />
          ) : coaches.length === 0 ? (
            <View className="items-center rounded-2xl border border-brand-border bg-white p-10">
              <Text className="font-heading text-base text-text-muted">No coaches here.</Text>
            </View>
          ) : (
            coaches.map((c) => (
              <View key={c.id} className="rounded-2xl border border-brand-border bg-white p-4">
                <View className="flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="font-heading text-base font-bold text-navy">{c.full_name}</Text>
                      <StatusPill status={c.status} />
                      {c.featured && <Text className="text-xs text-warning">⭐</Text>}
                    </View>
                    <Text className="mt-0.5 font-body text-sm text-text-muted">
                      {c.categories?.name ?? "—"} · {c.area}, {c.city} · {formatFee(c)}
                    </Text>
                    <Text className="font-body text-xs text-text-muted">
                      📞 {c.phone} · {c.created_at ? new Date(c.created_at).toLocaleDateString() : ""}
                    </Text>
                  </View>

                  <View className="flex-row flex-wrap gap-2">
                    <SmallBtn text="👁️ View" onPress={() => router.push(`/coach/${c.id}`)} />
                    {c.status !== "approved" && (
                      <SmallBtn
                        text="✅ Approve"
                        tone="success"
                        busy={busyId === c.id}
                        onPress={() => act(() => AdminApi.approve(c.id), c.id)}
                      />
                    )}
                    {c.status !== "rejected" && (
                      <SmallBtn
                        text="❌ Reject"
                        tone="danger"
                        busy={busyId === c.id}
                        onPress={() => act(() => AdminApi.reject(c.id), c.id)}
                      />
                    )}
                    {tab === "all" && (
                      <>
                        <SmallBtn
                          text={c.featured ? "★ Unfeature" : "☆ Feature"}
                          busy={busyId === c.id}
                          onPress={() => act(() => AdminApi.feature(c.id, !c.featured), c.id)}
                        />
                        <SmallBtn
                          text="🗑️ Delete"
                          tone="danger"
                          busy={busyId === c.id}
                          onPress={() => act(() => AdminApi.remove(c.id), c.id)}
                        />
                      </>
                    )}
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

// ---- Bits ---------------------------------------------------------------------

function StatCard({ label, value, accent }: { label: string; value?: number; accent?: boolean }) {
  return (
    <View className="min-w-[140px] flex-1 rounded-2xl border border-brand-border bg-white p-4">
      <Text className={`font-heading text-3xl font-extrabold ${accent ? "text-saffron" : "text-navy"}`}>
        {value ?? "—"}
      </Text>
      <Text className="mt-1 font-body text-sm text-text-muted">{label}</Text>
    </View>
  );
}

function TabBtn({ active, onPress, text }: { active: boolean; onPress: () => void; text: string }) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full px-5 py-2 ${active ? "bg-navy" : "border border-brand-border bg-white"}`}
    >
      <Text className={`font-heading text-sm font-semibold ${active ? "text-white" : "text-navy"}`}>
        {text}
      </Text>
    </Pressable>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved: "bg-success/15 text-success",
    pending: "bg-warning/15 text-warning",
    rejected: "bg-saffron/15 text-saffron",
  };
  return (
    <View className={`rounded-full px-2 py-0.5 ${map[status] ?? "bg-cream"}`}>
      <Text className={`text-xs font-semibold capitalize ${map[status]?.split(" ")[1] ?? "text-navy"}`}>
        {status}
      </Text>
    </View>
  );
}

function SmallBtn({
  text,
  onPress,
  tone = "neutral",
  busy = false,
}: {
  text: string;
  onPress: () => void;
  tone?: "neutral" | "success" | "danger";
  busy?: boolean;
}) {
  const cls =
    tone === "success"
      ? "bg-success"
      : tone === "danger"
      ? "bg-saffron"
      : "border border-brand-border bg-white";
  const textCls = tone === "neutral" ? "text-navy" : "text-white";
  return (
    <Pressable onPress={onPress} disabled={busy} className={`rounded-lg px-3 py-2 ${cls} ${busy ? "opacity-50" : ""}`}>
      <Text className={`text-xs font-semibold ${textCls}`}>{text}</Text>
    </Pressable>
  );
}
