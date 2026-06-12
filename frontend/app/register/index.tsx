import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import Footer from "../../components/Footer";
import { CategoryApi, CoachApi } from "../../lib/api";
import {
  MAJOR_INDIAN_CITIES,
  getAreasForCity,
  FEE_TYPES,
  GENDERS,
  LANGUAGES,
  TEACHING_MODES,
  CATEGORIES,
} from "../../constants/categories";
import { useCity } from "../../lib/city";
import { formatFee, teachingModeLabel } from "../../lib/format";
import type { Category } from "../../lib/types";

interface FormState {
  fullName: string;
  phone: string;
  whatsappNumber: string;
  sameAsPhone: boolean;
  email: string;
  gender: string;
  city: string;
  area: string;
  pincode: string;
  categoryId: string;
  subSkills: string[];
  experienceYears: string;
  teachingModes: string[];
  feeMin: string;
  feeMax: string;
  feeType: string;
  demoAvailable: boolean;
  languages: string[];
  bio: string;
}

const initial: FormState = {
  fullName: "",
  phone: "",
  whatsappNumber: "",
  sameAsPhone: true,
  email: "",
  gender: "",
  city: "Ahmedabad",
  area: "",
  pincode: "",
  categoryId: "",
  subSkills: [],
  experienceYears: "",
  teachingModes: ["home_visit"],
  feeMin: "",
  feeMax: "",
  feeType: "monthly",
  demoAvailable: true,
  languages: [],
  bio: "",
};

const STEPS = ["Basic Info", "Location", "Skill & Teaching", "Preview & Submit"];

export default function Register() {
  const router = useRouter();
  const currentCity = useCity();
  const [categories, setCategories] = useState<Category[]>(CATEGORIES as Category[]);
  const [step, setStep] = useState(0);
  // Default the registration's city to whatever the user has selected globally,
  // so a Mumbai user doesn't have to retype it.
  const [form, setForm] = useState<FormState>({ ...initial, city: currentCity });
  const [skillInput, setSkillInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ id: string } | null>(null);

  useEffect(() => {
    CategoryApi.list().then(setCategories).catch(() => {});
  }, []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleInArray = (key: "teachingModes" | "languages", value: string) =>
    setForm((f) => {
      const arr = f[key];
      return { ...f, [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] };
    });

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.subSkills.includes(s)) set("subSkills", [...form.subSkills, s]);
    setSkillInput("");
  };

  const validateStep = (): string | null => {
    if (step === 0) {
      if (!form.fullName.trim()) return "Full name is required.";
      if (form.phone.replace(/\D/g, "").length !== 10) return "Phone must be 10 digits.";
      const wa = (form.sameAsPhone ? form.phone : form.whatsappNumber).replace(/\D/g, "");
      if (wa.length !== 10) return "WhatsApp number must be 10 digits.";
    }
    if (step === 1) {
      if (!form.city.trim()) return "City is required.";
      if (!form.area.trim()) return "Area / locality is required.";
    }
    if (step === 2) {
      if (!form.categoryId) return "Select a skill category.";
      if (form.subSkills.length === 0) return "Add at least one sub-skill.";
      if (!form.experienceYears.trim()) return "Years of experience is required.";
      if (form.teachingModes.length === 0) return "Select at least one teaching mode.";
      const min = Number(form.feeMin);
      const max = Number(form.feeMax);
      if (!form.feeMin || !form.feeMax) return "Fee min and max are required.";
      if (min > max) return "Fee min must be less than fee max.";
      if (form.bio.trim().length < 50) return "Bio must be at least 50 characters.";
    }
    return null;
  };

  const next = () => {
    const err = validateStep();
    setError(err);
    if (!err) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const coach = await CoachApi.register({
        fullName: form.fullName.trim(),
        phone: form.phone.replace(/\D/g, ""),
        whatsappNumber: (form.sameAsPhone ? form.phone : form.whatsappNumber).replace(/\D/g, ""),
        email: form.email.trim() || undefined,
        city: form.city,
        area: form.area.trim(),
        pincode: form.pincode.trim() || undefined,
        categoryId: form.categoryId,
        subSkills: form.subSkills,
        experienceYears: Number(form.experienceYears) || 0,
        feeMin: Number(form.feeMin) || 0,
        feeMax: Number(form.feeMax) || 0,
        feeType: form.feeType,
        teachingMode: form.teachingModes.length === 1 ? form.teachingModes[0] : "all",
        demoAvailable: form.demoAvailable,
        bio: form.bio.trim(),
        gender: form.gender || undefined,
        languages: form.languages,
      });
      setDone({ id: coach.id });
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Could not submit. Check your details and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const categoryName = categories.find((c) => c.id === form.categoryId)?.name ?? "";

  if (done) {
    return (
      <ScrollView className="flex-1 bg-cream">
        <View className="mx-auto w-full max-w-2xl items-center px-4 py-16">
          <Text className="text-6xl">🎉</Text>
          <Text className="mt-4 text-center font-heading text-2xl font-bold text-purple">
            Profile submitted!
          </Text>
          <Text className="mt-2 text-center font-body text-base text-text-muted">
            Hum 24 ghante mein review karenge. WhatsApp pe confirmation bhej diya hai.
          </Text>
          <Pressable
            onPress={() => router.push(`/coach/${done.id}`)}
            className="mt-6 rounded-full border-2 border-red px-6 py-3"
          >
            <Text className="font-heading font-semibold text-red">
              Share your profile link (pending)
            </Text>
          </Pressable>
          <Pressable onPress={() => router.push("/")} className="mt-3">
            <Text className="font-body text-text-muted">← Back to Home</Text>
          </Pressable>
        </View>
        <Footer />
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-cream">
      <View className="mx-auto w-full max-w-2xl px-4 py-8">
        <Text className="font-heading text-3xl font-bold text-purple">Register as Coach 🎓</Text>
        <Text className="mt-1 font-body text-text-muted">
          Free registration. Approval in ~24 hours.
        </Text>

        {/* Progress */}
        <View className="mt-6 flex-row items-center gap-2">
          {STEPS.map((label, i) => (
            <View key={label} className="flex-1">
              <View className={`h-1.5 rounded-full ${i <= step ? "bg-red" : "bg-brand-border"}`} />
              <Text
                className={`mt-1.5 text-center text-xs ${
                  i === step ? "font-semibold text-red" : "text-text-muted"
                }`}
              >
                {label}
              </Text>
            </View>
          ))}
        </View>

        <View className="mt-6 rounded-2xl border border-brand-border bg-white p-5">
          {step === 0 && (
            <View className="gap-4">
              <Field label="Full Name *">
                <Input value={form.fullName} onChangeText={(v) => set("fullName", v)} placeholder="Your name" />
              </Field>
              <Field label="Phone Number * (+91)">
                <Input
                  value={form.phone}
                  onChangeText={(v) => set("phone", v)}
                  placeholder="10-digit number"
                  keyboardType="phone-pad"
                />
              </Field>
              <Pressable
                onPress={() => set("sameAsPhone", !form.sameAsPhone)}
                className="flex-row items-center gap-2"
              >
                <View
                  className={`h-5 w-5 items-center justify-center rounded border ${
                    form.sameAsPhone ? "border-red bg-red" : "border-brand-border bg-white"
                  }`}
                >
                  {form.sameAsPhone && <Text className="text-xs text-white">✓</Text>}
                </View>
                <Text className="font-body text-sm text-text-dark">WhatsApp same as phone</Text>
              </Pressable>
              {!form.sameAsPhone && (
                <Field label="WhatsApp Number *">
                  <Input
                    value={form.whatsappNumber}
                    onChangeText={(v) => set("whatsappNumber", v)}
                    placeholder="10-digit WhatsApp number"
                    keyboardType="phone-pad"
                  />
                </Field>
              )}
              <Field label="Email (optional)">
                <Input
                  value={form.email}
                  onChangeText={(v) => set("email", v)}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                />
              </Field>
              <Field label="Gender">
                <ChipRow
                  options={GENDERS.map((g) => ({ value: g, label: g }))}
                  selected={[form.gender]}
                  onToggle={(v) => set("gender", v)}
                />
              </Field>
            </View>
          )}

          {step === 1 && (
            <View className="gap-4">
              <Field label="City *">
                <Input
                  value={form.city}
                  onChangeText={(v) => set("city", v)}
                  placeholder="Your city"
                />
                <Text className="mt-2 font-body text-xs text-text-muted">
                  Popular — tap to pick:
                </Text>
                <View className="mt-1 flex-row flex-wrap gap-2">
                  {MAJOR_INDIAN_CITIES.map((c) => (
                    <Pressable
                      key={c}
                      onPress={() => set("city", c)}
                      className={`rounded-full border px-3 py-1 ${
                        form.city === c ? "border-purple bg-purple" : "border-brand-border bg-white"
                      }`}
                    >
                      <Text
                        className={`text-xs ${form.city === c ? "font-semibold text-white" : "text-purple"}`}
                      >
                        {c}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </Field>
              <Field label="Area / Locality *">
                <Input
                  value={form.area}
                  onChangeText={(v) => set("area", v)}
                  placeholder="Your area or locality"
                />
                {getAreasForCity(form.city).length > 0 && (
                  <>
                    <Text className="mt-2 font-body text-xs text-text-muted">
                      Popular areas in {form.city}:
                    </Text>
                    <View className="mt-1 flex-row flex-wrap gap-2">
                      {getAreasForCity(form.city).map((a) => (
                        <Pressable
                          key={a}
                          onPress={() => set("area", a)}
                          className="rounded-full bg-surface px-3 py-1"
                        >
                          <Text className="text-xs text-purple">{a}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </>
                )}
              </Field>
              <Field label="Pincode">
                <Input
                  value={form.pincode}
                  onChangeText={(v) => set("pincode", v)}
                  placeholder="e.g. 380001"
                  keyboardType="number-pad"
                />
              </Field>
            </View>
          )}

          {step === 2 && (
            <View className="gap-4">
              <Field label="Skill Category *">
                <View className="flex-row flex-wrap gap-2">
                  {categories.map((c) => (
                    <Pressable
                      key={c.slug}
                      onPress={() => set("categoryId", c.id ?? "")}
                      className={`rounded-full border px-3 py-1.5 ${
                        form.categoryId === c.id
                          ? "border-red bg-red"
                          : "border-brand-border bg-white"
                      }`}
                    >
                      <Text
                        className={`text-xs ${
                          form.categoryId === c.id ? "font-semibold text-white" : "text-purple"
                        }`}
                      >
                        {c.icon} {c.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </Field>

              <Field label="Sub-skills * (type & add)">
                <View className="flex-row gap-2">
                  <Input
                    value={skillInput}
                    onChangeText={setSkillInput}
                    placeholder="e.g. Guitar"
                    onSubmitEditing={addSkill}
                    style={{ flex: 1 }}
                  />
                  <Pressable onPress={addSkill} className="justify-center rounded-xl bg-purple px-4">
                    <Text className="font-heading font-semibold text-white">Add</Text>
                  </Pressable>
                </View>
                <View className="mt-2 flex-row flex-wrap gap-2">
                  {form.subSkills.map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => set("subSkills", form.subSkills.filter((x) => x !== s))}
                      className="flex-row items-center gap-1 rounded-full bg-red/15 px-3 py-1"
                    >
                      <Text className="text-xs font-semibold text-red">{s}</Text>
                      <Text className="text-xs text-red">✕</Text>
                    </Pressable>
                  ))}
                </View>
              </Field>

              <Field label="Years of Experience *">
                <Input
                  value={form.experienceYears}
                  onChangeText={(v) => set("experienceYears", v.replace(/\D/g, ""))}
                  placeholder="e.g. 5"
                  keyboardType="number-pad"
                />
              </Field>

              <Field label="Teaching Mode * (multi-select)">
                <ChipRow
                  multi
                  options={TEACHING_MODES}
                  selected={form.teachingModes}
                  onToggle={(v) => toggleInArray("teachingModes", v)}
                />
              </Field>

              <View className="flex-row gap-3">
                <Field label="Fee Min * (₹)" style={{ flex: 1 }}>
                  <Input
                    value={form.feeMin}
                    onChangeText={(v) => set("feeMin", v.replace(/\D/g, ""))}
                    placeholder="500"
                    keyboardType="number-pad"
                  />
                </Field>
                <Field label="Fee Max * (₹)" style={{ flex: 1 }}>
                  <Input
                    value={form.feeMax}
                    onChangeText={(v) => set("feeMax", v.replace(/\D/g, ""))}
                    placeholder="3000"
                    keyboardType="number-pad"
                  />
                </Field>
              </View>

              <Field label="Fee Type">
                <ChipRow options={FEE_TYPES} selected={[form.feeType]} onToggle={(v) => set("feeType", v)} />
              </Field>

              <Pressable
                onPress={() => set("demoAvailable", !form.demoAvailable)}
                className="flex-row items-center gap-2"
              >
                <View
                  className={`h-6 w-11 justify-center rounded-full px-0.5 ${
                    form.demoAvailable ? "bg-success" : "bg-brand-border"
                  }`}
                >
                  <View
                    className={`h-5 w-5 rounded-full bg-white ${form.demoAvailable ? "self-end" : "self-start"}`}
                  />
                </View>
                <Text className="font-body text-sm text-text-dark">Demo class available</Text>
              </Pressable>

              <Field label="Languages you teach in">
                <ChipRow
                  multi
                  options={LANGUAGES.map((l) => ({ value: l, label: l }))}
                  selected={form.languages}
                  onToggle={(v) => toggleInArray("languages", v)}
                />
              </Field>

              <Field label="About yourself / Teaching style (min 50 chars)">
                <Input
                  value={form.bio}
                  onChangeText={(v) => set("bio", v.slice(0, 500))}
                  placeholder="Tell students about your teaching style, achievements..."
                  multiline
                  numberOfLines={4}
                  style={{ minHeight: 96, textAlignVertical: "top" }}
                />
                <Text className="mt-1 text-right text-xs text-text-muted">{form.bio.length}/500</Text>
              </Field>
            </View>
          )}

          {step === 3 && (
            <View className="gap-3">
              <Text className="font-heading text-lg font-bold text-purple">Preview</Text>
              <PreviewRow label="Name" value={form.fullName} />
              <PreviewRow label="Category" value={categoryName} />
              <PreviewRow label="Sub-skills" value={form.subSkills.join(", ")} />
              <PreviewRow label="Location" value={`${form.area}, ${form.city}`} />
              <PreviewRow
                label="Fee"
                value={formatFee({
                  fee_min: Number(form.feeMin),
                  fee_max: Number(form.feeMax),
                  fee_type: form.feeType,
                })}
              />
              <PreviewRow label="Experience" value={`${form.experienceYears || 0} years`} />
              <PreviewRow
                label="Teaching Mode"
                value={form.teachingModes.map(teachingModeLabel).join(", ")}
              />
              <PreviewRow label="Demo" value={form.demoAvailable ? "Available" : "Not available"} />
              <PreviewRow label="Languages" value={form.languages.join(", ") || "—"} />
              <PreviewRow label="Phone" value={form.phone} />
              <View className="mt-1">
                <Text className="font-body text-sm text-text-muted">About</Text>
                <Text className="mt-1 font-body text-sm text-text-dark">{form.bio}</Text>
              </View>
            </View>
          )}

          {error && (
            <View className="mt-4 rounded-xl bg-red/10 px-4 py-3">
              <Text className="font-body text-sm text-red">{error}</Text>
            </View>
          )}

          {/* Nav buttons */}
          <View className="mt-6 flex-row gap-3">
            {step > 0 && (
              <Pressable onPress={back} className="flex-1 items-center rounded-xl border border-purple py-3">
                <Text className="font-heading font-semibold text-purple">Back</Text>
              </Pressable>
            )}
            {step < STEPS.length - 1 ? (
              <Pressable onPress={next} className="flex-1 items-center rounded-xl bg-red py-3">
                <Text className="font-heading font-semibold text-white">Continue</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={submit}
                disabled={submitting}
                className={`flex-1 items-center rounded-xl py-3 ${submitting ? "bg-red/60" : "bg-red"}`}
              >
                <Text className="font-heading font-semibold text-white">
                  {submitting ? "Submitting…" : "Submit for Approval"}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
      <Footer />
    </ScrollView>
  );
}

// ---- Small form primitives ----------------------------------------------------

function Field({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: object;
}) {
  return (
    <View style={style}>
      <Text className="mb-1.5 font-heading text-sm font-semibold text-purple">{label}</Text>
      {children}
    </View>
  );
}

function Input(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      placeholderTextColor="#9CA3AF"
      {...props}
      className="rounded-xl border border-brand-border bg-white px-4 py-3 font-body text-base text-text-dark"
    />
  );
}

function ChipRow({
  options,
  selected,
  onToggle,
  multi = false,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
  multi?: boolean;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((o) => {
        const active = selected.includes(o.value);
        return (
          <Pressable
            key={o.value}
            onPress={() => onToggle(o.value)}
            className={`rounded-full border px-3 py-1.5 ${
              active ? "border-red bg-red" : "border-brand-border bg-white"
            }`}
          >
            <Text className={`text-xs ${active ? "font-semibold text-white" : "text-purple"}`}>
              {multi && active ? "✓ " : ""}
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between border-b border-brand-border py-2">
      <Text className="font-body text-sm text-text-muted">{label}</Text>
      <Text className="ml-3 flex-1 text-right font-body text-sm font-semibold text-text-dark">
        {value || "—"}
      </Text>
    </View>
  );
}
