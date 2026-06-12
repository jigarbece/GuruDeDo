/**
 * LocationAutocomplete
 *
 * A unified city + area/locality autocomplete used in both the search bar
 * and the registration form.
 *
 * Suggestions are labelled "City" or "Area" so the user always knows what
 * they are selecting. Selecting a city returns a LocationSelection with
 * type="city"; selecting an area returns type="area" with both city and area
 * fields populated.
 *
 * Dropdown is rendered into a document.body portal on web (same pattern as
 * AreaAutocomplete) so it is never clipped by any parent stacking context.
 */

import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, Text, TextInput, View } from "react-native";
import {
  searchLocations,
  getInstantLocationSuggestions,
  type LocationSuggestion,
} from "../lib/location";
import type { Coords } from "../lib/city";

// ---- Web portal -------------------------------------------------------------
let DropdownPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
if (Platform.OS === "web" && typeof document !== "undefined") {
  const ReactDOM = require("react-dom");
  DropdownPortal = ({ children }) => {
    const el = useRef<HTMLDivElement | null>(null);
    if (!el.current) {
      el.current = document.createElement("div");
      el.current.style.cssText = "position:fixed;top:0;left:0;width:0;height:0;z-index:99999;";
      document.body.appendChild(el.current);
    }
    useEffect(() => {
      return () => {
        if (el.current && document.body.contains(el.current)) {
          document.body.removeChild(el.current);
        }
      };
    }, []);
    return ReactDOM.createPortal(children, el.current);
  };
}

// ---- Types ------------------------------------------------------------------
export interface LocationSelection {
  type: "city" | "area";
  city: string;
  area?: string;
  displayName: string;
}

interface Props {
  /** The text currently shown in the input box. */
  value: string;
  /** Called every time the raw text changes (typing). */
  onChangeText: (v: string) => void;
  /** Called when the user selects a suggestion. Gives back a structured location. */
  onSelect: (loc: LocationSelection) => void;
  placeholder?: string;
  coordBias?: Coords | null;
  onSubmitEditing?: () => void;
  wrapperClassName?: string;
  /** If true, only show city-level suggestions (for the registration city field). */
  citiesOnly?: boolean;
}

// ---- Badge colours ----------------------------------------------------------
const BADGE_STYLES = {
  City: { bg: "#EDE9FE", text: "#5B2C8C" },   // purple tint
  Area: { bg: "#FEF3C7", text: "#92400E" },   // amber tint
};

// ---- Component --------------------------------------------------------------
export default function LocationAutocomplete({
  value,
  onChangeText,
  onSelect,
  placeholder,
  coordBias,
  onSubmitEditing,
  wrapperClassName,
  citiesOnly = false,
}: Props) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const justPickedRef = useRef(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const measureInput = () => {
    if (Platform.OS !== "web") return;
    const domNode = (inputRef.current as any) as HTMLElement | null;
    if (!domNode || typeof domNode.getBoundingClientRect !== "function") return;
    const rect = domNode.getBoundingClientRect();
    setDropdownPos({ top: rect.bottom, left: rect.left, width: rect.width });
  };

  const filterSuggestions = (list: LocationSuggestion[]) =>
    citiesOnly ? list.filter((s) => s.type === "city") : list;

  useEffect(() => {
    if (justPickedRef.current) {
      justPickedRef.current = false;
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    const q = value.trim();
    if (q.length < 1) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    // Show instant static results immediately (zero latency).
    const instant = filterSuggestions(getInstantLocationSuggestions(q));
    if (instant.length > 0) {
      setSuggestions(instant);
      measureInput();
      setOpen(true);
    }

    // Then fetch live Photon results and merge.
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const live = await searchLocations(q, { bias: coordBias, signal: controller.signal });
        if (!controller.signal.aborted && !justPickedRef.current) {
          const filtered = filterSuggestions(live);
          setSuggestions(filtered.length > 0 ? filtered : instant);
          if (filtered.length > 0 || instant.length > 0) {
            measureInput();
            setOpen(true);
          }
        }
      } catch {
        // aborted or network error — static results still shown
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, coordBias?.lat, coordBias?.lon]);

  const pick = (s: LocationSuggestion) => {
    justPickedRef.current = true;
    setSuggestions([]);
    setOpen(false);
    setLoading(false);
    onChangeText(s.displayName);
    onSelect({ type: s.type, city: s.city, area: s.area, displayName: s.displayName });
  };

  // Highlighted text helper
  function Highlighted({ text, query }: { text: string; query: string }) {
    const q = query.trim();
    if (!q) return <Text style={{ fontSize: 14, color: "#111827" }}>{text}</Text>;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return <Text style={{ fontSize: 14, color: "#111827" }}>{text}</Text>;
    return (
      <Text style={{ fontSize: 14, color: "#111827" }}>
        {text.slice(0, idx)}
        <Text style={{ fontWeight: "700", color: "#E63946" }}>{text.slice(idx, idx + q.length)}</Text>
        {text.slice(idx + q.length)}
      </Text>
    );
  }

  const dropdownContent =
    open && suggestions.length > 0 ? (
      <View
        style={
          Platform.OS === "web" && dropdownPos
            ? {
                position: "fixed" as any,
                top: dropdownPos.top + 4,
                left: dropdownPos.left,
                width: dropdownPos.width,
                zIndex: 99999,
                backgroundColor: "#fff",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                shadowColor: "#000",
                shadowOpacity: 0.15,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 6 },
                overflow: "hidden" as any,
              }
            : {
                position: "absolute",
                top: "100%" as any,
                left: 0,
                right: 0,
                zIndex: 1000,
                marginTop: 4,
                backgroundColor: "#fff",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                shadowColor: "#000",
                shadowOpacity: 0.12,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                overflow: "hidden" as any,
              }
        }
      >
        {suggestions.map((s, i) => {
          const badge = BADGE_STYLES[s.badge as keyof typeof BADGE_STYLES] ?? BADGE_STYLES.Area;
          return (
            <Pressable
              key={`${s.displayName}-${i}`}
              onPress={() => pick(s)}
              style={({ pressed }) => ({
                backgroundColor: pressed ? "#F5F3FF" : "#fff",
                borderTopWidth: i > 0 ? 1 : 0,
                borderTopColor: "#F3F4F6",
                paddingHorizontal: 16,
                paddingVertical: 10,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              })}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                <Text style={{ fontSize: 15 }}>
                  {s.type === "city" ? "🏙️" : "📍"}
                </Text>
                <View style={{ flex: 1 }}>
                  <Highlighted
                    text={s.type === "area" ? (s.area ?? s.displayName) : s.displayName}
                    query={value}
                  />
                  {s.type === "area" && s.city ? (
                    <Text style={{ fontSize: 11, color: "#6B7280", marginTop: 1 }}>{s.city}</Text>
                  ) : null}
                </View>
              </View>
              <View
                style={{
                  backgroundColor: badge.bg,
                  borderRadius: 99,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  marginLeft: 8,
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: "600", color: badge.text }}>{s.badge}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    ) : null;

  return (
    <View style={{ position: "relative", zIndex: 100 }} className={wrapperClassName ?? "flex-1"}>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? "City or area…"}
        placeholderTextColor="#9CA3AF"
        onFocus={() => {
          if (suggestions.length > 0) {
            measureInput();
            setOpen(true);
          }
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onSubmitEditing={onSubmitEditing}
        className="rounded-xl border border-brand-border bg-white px-4 py-3 font-body text-base text-text-dark"
      />

      {loading && (
        <View pointerEvents="none" style={{ position: "absolute", right: 12, top: 14 }}>
          <ActivityIndicator size="small" color="#5B2C8C" />
        </View>
      )}

      {Platform.OS === "web" ? (
        <DropdownPortal>{dropdownContent}</DropdownPortal>
      ) : (
        dropdownContent
      )}
    </View>
  );
}
