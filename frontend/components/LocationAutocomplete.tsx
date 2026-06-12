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
let DropdownPortal: React.FC<{
  children: React.ReactNode;
  onMouseDown?: () => void;
}> = ({ children }) => <>{children}</>;

if (Platform.OS === "web" && typeof document !== "undefined") {
  const ReactDOM = require("react-dom");

  DropdownPortal = ({ children, onMouseDown }) => {
    const el = useRef<HTMLDivElement | null>(null);
    if (!el.current) {
      el.current = document.createElement("div");
      el.current.style.cssText =
        "position:fixed;top:0;left:0;width:0;height:0;z-index:99999;";
      document.body.appendChild(el.current);
    }
    useEffect(
      () => () => {
        if (el.current && document.body.contains(el.current))
          document.body.removeChild(el.current);
      },
      []
    );

    // Wrap children in a div that intercepts mousedown so the input doesn't
    // blur before the click on a suggestion registers.
    const wrapper = (
      <div
        onMouseDown={(e) => {
          e.preventDefault(); // prevent input blur
          onMouseDown?.();
        }}
      >
        {children}
      </div>
    );

    return ReactDOM.createPortal(wrapper, el.current);
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
  citiesOnly?: boolean;
  /** Called by parent (SearchBar) to force-close this dropdown */
  closeRef?: React.MutableRefObject<(() => void) | null>;
}

// ── Colours ───────────────────────────────────────────────────────────────────
const CITY_BADGE = { bg: "#EDE9FE", fg: "#5B2C8C" };
const AREA_BADGE = { bg: "#FFF7ED", fg: "#C2410C" };

// ── Styles ────────────────────────────────────────────────────────────────────
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
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    overflow: "hidden" as const,
  };
}

const inlineStyle: object = {
  position: "absolute",
  top: "100%",
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
  overflow: "hidden",
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
  closeRef,
}: Props) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const justPickedRef = useRef(false);
  // Tracks whether the mouse is currently pressed inside the dropdown.
  // Used to prevent onBlur from closing the dropdown mid-click.
  const mouseInDropdownRef = useRef(false);

  const [dropdownPos, setDropdownPos] = useState<{
    top: number; left: number; width: number;
  } | null>(null);

  const inputRef = useRef<TextInput>(null);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Expose close() to parent so SearchBar can close on submit
  useEffect(() => {
    if (closeRef) {
      closeRef.current = () => {
        setOpen(false);
        setSuggestions([]);
      };
    }
  }, [closeRef]);

  const measureInput = () => {
    if (Platform.OS !== "web") return;
    const node = (inputRef.current as any) as HTMLElement | null;
    if (!node || typeof node.getBoundingClientRect !== "function") return;
    const r = node.getBoundingClientRect();
    setDropdownPos({ top: r.bottom, left: r.left, width: r.width });
  };

  const filter = (list: LocationSuggestion[]) =>
    citiesOnly ? list.filter((s) => s.type === "city") : list;

  // ── search effect ──────────────────────────────────────────────────────────
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

    const instant = filter(getInstantLocationSuggestions(q));
    if (instant.length > 0) {
      setSuggestions(instant);
      measureInput();
      setOpen(true);
    }

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
          if (merged.length > 0) { measureInput(); setOpen(true); }
        }
      } catch { /* abort/network — static shown */ }
      finally { if (!ctrl.signal.aborted) setLoading(false); }
    }, 280);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, coordBias?.lat, coordBias?.lon]);

  // ── pick ───────────────────────────────────────────────────────────────────
  const pick = (s: LocationSuggestion) => {
    justPickedRef.current = true;
    mouseInDropdownRef.current = false;
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    setSuggestions([]);
    setOpen(false);
    setLoading(false);
    onChangeText(s.displayName);
    onSelect({ type: s.type, city: s.city, area: s.area, displayName: s.displayName });
  };

  // ── highlight ─────────────────────────────────────────────────────────────
  const Hl = ({ text }: { text: string }) => {
    const q = value.trim();
    if (!q) return <Text style={S.rowTitle}>{text}</Text>;
    const i = text.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return <Text style={S.rowTitle}>{text}</Text>;
    return (
      <Text style={S.rowTitle}>
        {text.slice(0, i)}
        <Text style={S.rowBold}>{text.slice(i, i + q.length)}</Text>
        {text.slice(i + q.length)}
      </Text>
    );
  };

  // ── dropdown content ───────────────────────────────────────────────────────
  const dropdownContent =
    open && suggestions.length > 0 ? (
      <View style={dropdownPos && Platform.OS === "web" ? portalStyle(dropdownPos) : inlineStyle}>
        {/* Header row */}
        <View style={S.header}>
          <Text style={S.headerText}>SUGGESTIONS</Text>
          {loading && <ActivityIndicator size="small" color="#5B2C8C" style={{ marginLeft: 6 }} />}
        </View>

        {suggestions.map((s, i) => {
          const badge = s.type === "city" ? CITY_BADGE : AREA_BADGE;
          return (
            <Pressable
              key={`${s.displayName}-${i}`}
              onPress={() => pick(s)}
              style={({ pressed }) => [
                S.row,
                i < suggestions.length - 1 && S.rowBorder,
                pressed && S.rowPressed,
              ]}
            >
              <View style={S.rowLeft}>
                <View style={[S.iconWrap, { backgroundColor: badge.bg }]}>
                  <Text style={S.icon}>{s.type === "city" ? "🏙️" : "📍"}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Hl text={s.type === "area" ? (s.area ?? s.displayName) : s.displayName} />
                  {s.type === "area" && s.city
                    ? <Text style={S.rowSub}>{s.city}</Text>
                    : null}
                </View>
              </View>
              <View style={[S.pill, { backgroundColor: badge.bg }]}>
                <Text style={[S.pillText, { color: badge.fg }]}>{s.badge}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    ) : null;

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <View style={{ position: "relative", zIndex: 100 }} className={wrapperClassName ?? "flex-1"}>
      <View style={{ position: "relative" }}>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder ?? "City or area…"}
          placeholderTextColor="#9CA3AF"
          onFocus={() => {
            if (suggestions.length > 0) { measureInput(); setOpen(true); }
          }}
          onBlur={() => {
            // Delay close so a tap/click on a suggestion can fire first.
            // If mouseInDropdownRef is true we cancel the close entirely.
            blurTimerRef.current = setTimeout(() => {
              if (!mouseInDropdownRef.current) setOpen(false);
            }, 200);
          }}
          onSubmitEditing={onSubmitEditing}
          style={S.input}
        />
        {loading && (
          <View pointerEvents="none" style={S.spinner}>
            <ActivityIndicator size="small" color="#5B2C8C" />
          </View>
        )}
      </View>

      {Platform.OS === "web" ? (
        <DropdownPortal
          onMouseDown={() => {
            // mousedown fires before blur — set flag so blur doesn't close dropdown
            mouseInDropdownRef.current = true;
            if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
            // Reset the flag after a short window (in case click doesn't register)
            setTimeout(() => { mouseInDropdownRef.current = false; }, 500);
          }}
        >
          {dropdownContent}
        </DropdownPortal>
      ) : (
        dropdownContent
      )}
    </View>
  );
}

// ── StyleSheet ────────────────────────────────────────────────────────────────
const S = {
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#fff",
  } as object,
  spinner: { position: "absolute" as const, right: 12, top: 13 },
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerText: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: "#9CA3AF",
    letterSpacing: 0.8,
  },
  row: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: "#fff",
    cursor: "pointer" as any,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  rowPressed: { backgroundColor: "#EDE9FE" },
  rowLeft: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    flex: 1,
    gap: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  icon: { fontSize: 16 },
  rowTitle: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500" as const,
    lineHeight: 20,
  },
  rowBold: { fontWeight: "700" as const, color: "#E63946" },
  rowSub: { fontSize: 12, color: "#6B7280", marginTop: 1, lineHeight: 16 },
  pill: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 10,
  },
  pillText: { fontSize: 10, fontWeight: "700" as const, letterSpacing: 0.3 },
};
