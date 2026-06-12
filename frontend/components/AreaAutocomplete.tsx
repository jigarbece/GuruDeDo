import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { searchPlaces, type PlaceSuggestion } from "../lib/places";

interface Props {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  /** When set, suggestions in this city are surfaced first. */
  cityBias?: string;
  onSubmitEditing?: () => void;
  /** Extra Tailwind classes for the wrapper (e.g. flex sizing). */
  wrapperClassName?: string;
}

/**
 * Google-Maps-style area autocomplete.
 *
 * - Debounces input by 300ms so we don't hammer Photon while the user types.
 * - Aborts in-flight requests when the query changes.
 * - Dropdown is absolutely positioned below the input; the wrapper is the
 *   positioning context, so parents must NOT clip overflow.
 */
export default function AreaAutocomplete({
  value,
  onChangeText,
  placeholder,
  cityBias,
  onSubmitEditing,
  wrapperClassName,
}: Props) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [justPicked, setJustPicked] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (justPicked) {
      // User just selected an entry — don't immediately re-query the same string.
      setJustPicked(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const list = await searchPlaces(value, cityBias, controller.signal);
        if (!controller.signal.aborted) {
          setSuggestions(list);
          setOpen(list.length > 0);
        }
      } catch {
        /* aborted or network — silently fall back to free typing */
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, cityBias]);

  const pick = (s: PlaceSuggestion) => {
    setJustPicked(true);
    onChangeText(s.name);
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <View
      // position: relative + zIndex so the dropdown sits above siblings.
      style={{ position: "relative", zIndex: 50 }}
      className={wrapperClassName ?? "flex-1"}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? "Your area or locality"}
        placeholderTextColor="#9CA3AF"
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        // Delay blur slightly so taps on suggestions register before close.
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onSubmitEditing={onSubmitEditing}
        className="rounded-xl border border-brand-border px-4 py-3 font-body text-base text-text-dark"
      />

      {/* Spinner appears at the right edge of the input during fetch */}
      {loading && (
        <View
          pointerEvents="none"
          style={{ position: "absolute", right: 12, top: 14 }}
        >
          <ActivityIndicator size="small" color="#5B2C8C" />
        </View>
      )}

      {open && suggestions.length > 0 && (
        <View
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 50,
            marginTop: 4,
            // Shadow for visual separation (web-only — RN ignores boxShadow)
            shadowColor: "#000",
            shadowOpacity: 0.12,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 6,
          }}
          className="overflow-hidden rounded-xl border border-brand-border bg-white"
        >
          {suggestions.map((s, i) => (
            <Pressable
              key={`${s.name}-${s.city}-${i}`}
              onPress={() => pick(s)}
              className={`px-4 py-2.5 active:bg-surface ${
                i > 0 ? "border-t border-brand-border" : ""
              }`}
            >
              <Text className="font-body text-sm font-semibold text-text-dark">
                📍 {s.name}
              </Text>
              {s.fullLabel ? (
                <Text className="mt-0.5 font-body text-xs text-text-muted">
                  {s.fullLabel}
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
