import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  searchLocations,
  getInstantLocationSuggestions,
  type LocationSuggestion,
} from "../lib/location";
import type { Coords } from "../lib/city";

// ── Web portal ────────────────────────────────────────────────────────────────
// Renders the dropdown into document.body so no parent stacking context
// can ever clip it.
let DropdownPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
if (Platform.OS === "web" && typeof document !== "undefined") {
  const ReactDOM = require("react-dom");
  DropdownPortal = ({ children }) => {
    const el = useRef<HTMLDivElement | null>(null);
    if (!el.current) {
      el.current = document.createElement("div");
      el.current.style.cssText =
        "position:fixed;top:0;left:0;width:0;height:0;z-index:99999;pointer-events:none;";
      document.body.appendChild(el.current);
    }
    useEffect(
      () => () => {
        if (el.current && document.body.contains(el.current))
          document.body.removeChild(el.current);
      },
      []
    );
    return ReactDOM.createPortal(children, el.current);
  };
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface LocationSelection {
  type: "city" | "area";
  city: string;
  area?: string;
  displayName: string;
}

interface Props {
  value: string;
  onChangeText: (v: string) => void;
  onSelect: (loc: LocationSelection) => void;
  placeholder?: string;
  coordBias?: Coords | null;
  onSubmitEditing?: () => void;
  wrapperClassName?: string;
  /** Restrict suggestions to cities only (used in registration city field). */
  citiesOnly?: boolean;
}

// ── Colours ───────────────────────────────────────────────────────────────────
const CITY_BADGE = { bg: "#EDE9FE", fg: "#5B2C8C" };
const AREA_BADGE = { bg: "#FFF7ED", fg: "#C2410C" };

// ── Dropdown shell styles ─────────────────────────────────────────────────────
function portalStyle(pos: { top: number; left: number; width: number }) {
  return {
    position: "fixed" as const,
    top: pos.top + 6,
    left: pos.left,
    width: pos.width,
    zIndex: 99999,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    overflow: "hidden" as const,
    pointerEvents: "auto" as const,
  };
}

const inlineStyle = {
  position: "absolute" as const,
  top: "100%" as any,
  left: 0,
  right: 0,
  zIndex: 1000,
  marginTop: 6,
  backgroundColor: "#ffffff",
  borderRadius: 14,
  borderWidth: 1,
  borderColor: "#E5E7EB",
  shadowColor: "#000",
  shadowOpacity: 0.10,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  overflow: "hidden" as const,
};

// ── Component ─────────────────────────────────────────────────────────────────
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
  const [activeIdx, setActiveIdx] = useState(-1);

  const justPickedRef = useRef(false);
  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ── measure input position for portal ──────────────────────────────────────
  const measureInput = () => {
    if (Platform.OS !== "web") return;
    const node = (inputRef.current as any) as HTMLElement | null;
    if (!node || typeof node.getBoundingClientRect !== "function") return;
    const r = node.getBoundingClientRect();
    setDropdownPos({ top: r.bottom, left: r.left, width: r.width });
  };

  const filter = (list: LocationSuggestion[]) =>
    citiesOnly ? list.filter((s) => s.type === "city") : list;

  // ── search effect ───────────────────────────────────────────────────────────
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

    // Instant static results — zero latency
    const instant = filter(getInstantLocationSuggestions(q));
    if (instant.length > 0) {
      setSuggestions(instant);
      setActiveIdx(-1);
      measureInput();
      setOpen(true);
    }

    // Live Photon results after debounce
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const live = await searchLocations(q, { bias: coordBias, signal: ctrl.signal });
        if (!ctrl.signal.aborted && !justPickedRef.current) {
          const merged = filter(live.length > 0 ? live : instant);
          setSuggestions(merged);
          setActiveIdx(-1);
          if (merged.length > 0) {
            measureInput();
            setOpen(true);
          }
        }
      } catch {
        /* network/abort — static results remain */
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 280);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, coordBias?.lat, coordBias?.lon]);

  // ── pick a suggestion ───────────────────────────────────────────────────────
  const pick = (s: LocationSuggestion) => {
    justPickedRef.current = true;
    setSuggestions([]);
    setOpen(false);
    setLoading(false);
    setActiveIdx(-1);
    onChangeText(s.displayName);
    onSelect({ type: s.type, city: s.city, area: s.area, displayName: s.displayName });
  };

  // ── highlight matching text ─────────────────────────────────────────────────
  const Hl = ({ text }: { text: string }) => {
    const q = value.trim();
    if (!q) return <Text style={styles.rowTitle}>{text}</Text>;
    const i = text.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return <Text style={styles.rowTitle}>{text}</Text>;
    return (
      <Text style={styles.rowTitle}>
        {text.slice(0, i)}
        <Text style={styles.rowTitleBold}>{text.slice(i, i + q.length)}</Text>
        {text.slice(i + q.length)}
      </Text>
    );
  };

  // ── dropdown ────────────────────────────────────────────────────────────────
  const dropdown =
    open && suggestions.length > 0 ? (
      <View style={dropdownPos && Platform.OS === "web" ? portalStyle(dropdownPos) : inlineStyle}>
        {/* Header */}
        <View style={styles.dropHeader}>
          <Text style={styles.dropHeaderText}>Suggestions</Text>
          {loading && <ActivityIndicator size="small" color="#5B2C8C" style={{ marginLeft: 6 }} />}
        </View>

        {suggestions.map((s, i) => {
          const badge = s.type === "city" ? CITY_BADGE : AREA_BADGE;
          const isLast = i === suggestions.length - 1;
          return (
            <Pressable
              key={`${s.displayName}-${i}`}
              onPress={() => pick(s)}
              style={({ pressed }) => [
                styles.row,
                i === activeIdx && styles.rowActive,
                pressed && styles.rowPressed,
                !isLast && styles.rowBorder,
              ]}
            >
              {/* Left: icon + text */}
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: badge.bg }]}>
                  <Text style={styles.iconText}>
                    {s.type === "city" ? "🏙️" : "📍"}
                  </Text>
                </View>
                <View style={styles.rowTextCol}>
                  <Hl text={s.type === "area" ? (s.area ?? s.displayName) : s.displayName} />
                  {s.type === "area" && s.city ? (
                    <Text style={styles.rowSub}>{s.city}</Text>
                  ) : null}
                </View>
              </View>

              {/* Right: badge pill */}
              <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                <Text style={[styles.badgeText, { color: badge.fg }]}>
                  {s.badge}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    ) : null;

  return (
    <View
      style={{ position: "relative", zIndex: 100 }}
      className={wrapperClassName ?? "flex-1"}
    >
      {/* Input */}
      <View style={styles.inputWrap}>
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
          onBlur={() => setTimeout(() => setOpen(false), 160)}
          onSubmitEditing={onSubmitEditing}
          style={styles.input}
        />
        {loading && (
          <View pointerEvents="none" style={styles.spinner}>
            <ActivityIndicator size="small" color="#5B2C8C" />
          </View>
        )}
      </View>

      {Platform.OS === "web" ? (
        <DropdownPortal>{dropdown}</DropdownPortal>
      ) : (
        dropdown
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  inputWrap: {
    position: "relative" as const,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#fff",
    fontFamily: undefined, // uses system font — NativeWind classes handle web
  },
  spinner: {
    position: "absolute" as const,
    right: 12,
    top: 13,
  },
  dropHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dropHeaderText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: "#6B7280",
    letterSpacing: 0.5,
    textTransform: "uppercase" as const,
  },
  row: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: "#fff",
  },
  rowActive: { backgroundColor: "#F5F3FF" },
  rowPressed: { backgroundColor: "#EDE9FE" },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  rowLeft: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    flex: 1,
    gap: 10,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    flexShrink: 0,
  },
  iconText: { fontSize: 16 },
  rowTextCol: { flex: 1 },
  rowTitle: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500" as const,
    lineHeight: 20,
  },
  rowTitleBold: {
    fontWeight: "700" as const,
    color: "#E63946",
  },
  rowSub: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 1,
    lineHeight: 16,
  },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 3,
    marginLeft: 10,
    flexShrink: 0,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
};
