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
  getInstantLocationSuggestions,
  searchLocations,
  type LocationSelection,
  type LocationSuggestion,
} from "../lib/location";
import type { Coords } from "../lib/city";

// ── Web portal (same pattern as LocationAutocomplete) ────────────────────────
let DropdownPortal: React.FC<{
  children: React.ReactNode;
  onMouseDown?: () => void;
}> = ({ children }) => <>{children}</>;

if (Platform.OS === "web" && typeof document !== "undefined") {
  const ReactDOM = require("react-dom");
  DropdownPortal = ({ children, onMouseDown }) => {
    const elRef = useRef<HTMLDivElement | null>(null);
    if (!elRef.current) {
      const div = document.createElement("div");
      div.style.cssText = "position:fixed;top:0;left:0;width:0;height:0;z-index:99999;";
      document.body.appendChild(div);
      elRef.current = div;
    }
    useEffect(
      () => () => {
        const el = elRef.current;
        if (el && document.body.contains(el)) document.body.removeChild(el);
      },
      [],
    );
    return ReactDOM.createPortal(
      <div
        onMouseDown={(e: any) => {
          // Prevent the input from blurring before the click registers
          e.preventDefault();
          onMouseDown?.();
        }}
      >
        {children}
      </div>,
      elRef.current,
    );
  };
}

// ── Props / helpers ──────────────────────────────────────────────────────────
interface Props {
  values: LocationSelection[];
  onChange: (values: LocationSelection[]) => void;
  coordBias?: Coords | null;
  placeholder?: string;
  /** Pressing Enter on an empty input fires this — used by SearchBar's submit. */
  onSubmitEditing?: () => void;
  wrapperClassName?: string;
  /** Parent can force-close the dropdown via this ref (used on submit). */
  closeRef?: React.MutableRefObject<(() => void) | null>;
}

function keyFor(s: LocationSelection): string {
  return s.type === "area"
    ? `area:${(s.area ?? "").toLowerCase()}@${s.city.toLowerCase()}`
    : `city:${s.city.toLowerCase()}`;
}

function alreadyHas(values: LocationSelection[], s: LocationSelection): boolean {
  const k = keyFor(s);
  return values.some((v) => keyFor(v) === k);
}

// ── Component ────────────────────────────────────────────────────────────────
export default function MultiLocationSelector({
  values,
  onChange,
  coordBias,
  placeholder,
  onSubmitEditing,
  wrapperClassName,
  closeRef,
}: Props) {
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const inputRef = useRef<TextInput>(null);
  const wrapperRef = useRef<View>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mouseInDropdownRef = useRef(false);

  // Expose close() to the parent
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
    const node = (wrapperRef.current as any) as HTMLElement | null;
    if (!node || typeof node.getBoundingClientRect !== "function") return;
    const r = node.getBoundingClientRect();
    setDropdownPos({ top: r.bottom, left: r.left, width: r.width });
  };

  // ── Search effect ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = text.trim();
    if (q.length < 1) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    // Instant static results
    const instant = getInstantLocationSuggestions(q).filter(
      (s) => !alreadyHas(values, s),
    );
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
        if (!ctrl.signal.aborted) {
          const merged = (live.length > 0 ? live : instant).filter(
            (s) => !alreadyHas(values, s),
          );
          setSuggestions(merged);
          if (merged.length > 0) {
            measureInput();
            setOpen(true);
          }
        }
      } catch {
        /* aborted or network — instant is still shown */
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, coordBias?.lat, coordBias?.lon, values.length]);

  // ── Add / remove ──────────────────────────────────────────────────────────
  const add = (s: LocationSuggestion) => {
    if (alreadyHas(values, s)) return;
    const next = [
      ...values,
      { type: s.type, city: s.city, area: s.area, displayName: s.displayName },
    ];
    onChange(next);
    setText(""); // clear input, dropdown stays open for next pick
    setSuggestions([]);
    // Refocus input so user can keep typing
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const removeAt = (i: number) => {
    const next = values.filter((_, idx) => idx !== i);
    onChange(next);
  };

  const onKeyDown = (e: any) => {
    if (Platform.OS !== "web") return;
    if (e.nativeEvent?.key === "Backspace" && text === "" && values.length > 0) {
      removeAt(values.length - 1);
    }
  };

  // ── Highlight match ───────────────────────────────────────────────────────
  const Hl = ({ str }: { str: string }) => {
    const q = text.trim();
    if (!q) return <Text style={S.rowTitle}>{str}</Text>;
    const i = str.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return <Text style={S.rowTitle}>{str}</Text>;
    return (
      <Text style={S.rowTitle}>
        {str.slice(0, i)}
        <Text style={S.rowBold}>{str.slice(i, i + q.length)}</Text>
        {str.slice(i + q.length)}
      </Text>
    );
  };

  // ── Dropdown content ──────────────────────────────────────────────────────
  const dropdownContent =
    open && suggestions.length > 0 ? (
      <View style={dropdownPos && Platform.OS === "web" ? portalStyle(dropdownPos) : inlineStyle}>
        <View style={S.header}>
          <Text style={S.headerText}>
            {values.length === 0 ? "PICK YOUR AREAS" : "ADD MORE"}
          </Text>
          {loading && (
            <ActivityIndicator size="small" color="#5B2C8C" style={{ marginLeft: 6 }} />
          )}
        </View>

        {suggestions.map((s, i) => {
          const badge = s.type === "city" ? CITY_BADGE : AREA_BADGE;
          return (
            <Pressable
              key={`${s.displayName}-${i}`}
              onPress={() => add(s)}
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
                  <Hl str={s.type === "area" ? s.area ?? s.displayName : s.displayName} />
                  {s.type === "area" && s.city ? (
                    <Text style={S.rowSub}>{s.city}</Text>
                  ) : null}
                </View>
              </View>
              <View style={[S.pill, { backgroundColor: badge.bg }]}>
                <Text style={[S.pillText, { color: badge.fg }]}>{s.badge}</Text>
              </View>
            </Pressable>
          );
        })}

        {values.length > 0 && (
          <Pressable
            onPress={() => {
              setOpen(false);
              setText("");
              inputRef.current?.blur();
              onSubmitEditing?.();
            }}
            style={S.doneBar}
          >
            <Text style={S.doneText}>Done · {values.length} selected</Text>
          </Pressable>
        )}
      </View>
    ) : null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View
      ref={wrapperRef}
      style={{ position: "relative", zIndex: 100 }}
      className={wrapperClassName ?? "flex-1"}
    >
      {/* Chip-and-input container */}
      <View style={S.fieldOuter}>
        <Text style={S.leadingIcon}>📍</Text>
        <View style={S.chipsWrap}>
          {values.map((v, i) => (
            <View key={`${keyFor(v)}-${i}`} style={S.chip}>
              <Text style={S.chipText} numberOfLines={1}>
                {v.type === "city" ? "🏙️" : "📍"} {v.displayName}
              </Text>
              <Pressable onPress={() => removeAt(i)} hitSlop={6} style={S.chipClose}>
                <Text style={S.chipCloseText}>×</Text>
              </Pressable>
            </View>
          ))}

          <TextInput
            ref={inputRef}
            value={text}
            onChangeText={setText}
            placeholder={
              values.length === 0
                ? placeholder ?? "Add cities or areas…"
                : "Add another…"
            }
            placeholderTextColor="#9CA3AF"
            onFocus={() => {
              if (suggestions.length > 0) {
                measureInput();
                setOpen(true);
              }
            }}
            onBlur={() => {
              blurTimerRef.current = setTimeout(() => {
                if (!mouseInDropdownRef.current) setOpen(false);
              }, 200);
            }}
            onKeyPress={onKeyDown}
            onSubmitEditing={() => {
              // Enter on an empty input → submit search.
              // Enter while typing → pick the first suggestion.
              if (text.trim() === "" && onSubmitEditing) {
                onSubmitEditing();
              } else if (suggestions[0]) {
                add(suggestions[0]);
              }
            }}
            style={S.input}
          />
        </View>

        {loading && (
          <View pointerEvents="none" style={S.spinner}>
            <ActivityIndicator size="small" color="#5B2C8C" />
          </View>
        )}
      </View>

      {Platform.OS === "web" ? (
        <DropdownPortal
          onMouseDown={() => {
            mouseInDropdownRef.current = true;
            if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
            setTimeout(() => {
              mouseInDropdownRef.current = false;
            }, 500);
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

// ── Style ────────────────────────────────────────────────────────────────────
const CITY_BADGE = { bg: "#EDE9FE", fg: "#5B2C8C" };
const AREA_BADGE = { bg: "#FFF7ED", fg: "#C2410C" };

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
  shadowOpacity: 0.1,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  overflow: "hidden",
};

const S = {
  fieldOuter: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingLeft: 12,
    paddingRight: 12,
    paddingVertical: 6,
    backgroundColor: "#fff",
    minHeight: 46,
  },
  leadingIcon: { fontSize: 14, marginRight: 8, opacity: 0.6 },
  chipsWrap: {
    flex: 1,
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    alignItems: "center" as const,
    gap: 6,
  },
  chip: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: "#F3E8FF",
    borderRadius: 999,
    paddingLeft: 10,
    paddingRight: 4,
    paddingVertical: 4,
    maxWidth: 220,
  },
  chipText: {
    fontSize: 13,
    color: "#5B2C8C",
    fontWeight: "600" as const,
    marginRight: 4,
  },
  chipClose: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "#FFFFFF",
  },
  chipCloseText: { fontSize: 14, color: "#5B2C8C", lineHeight: 14, fontWeight: "700" as const },
  input: {
    flex: 1,
    minWidth: 140,
    paddingVertical: 6,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "transparent",
    outlineStyle: "none" as any,
    borderWidth: 0,
  } as object,
  spinner: { marginLeft: 8 },

  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerText: { fontSize: 10, fontWeight: "700" as const, color: "#9CA3AF", letterSpacing: 0.8 },
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
  rowLeft: { flexDirection: "row" as const, alignItems: "center" as const, flex: 1, gap: 10 },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  icon: { fontSize: 16 },
  rowTitle: { fontSize: 14, color: "#111827", fontWeight: "500" as const, lineHeight: 20 },
  rowBold: { fontWeight: "700" as const, color: "#E63946" },
  rowSub: { fontSize: 12, color: "#6B7280", marginTop: 1, lineHeight: 16 },
  pill: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 10 },
  pillText: { fontSize: 10, fontWeight: "700" as const, letterSpacing: 0.3 },
  doneBar: {
    paddingVertical: 12,
    backgroundColor: "#5B2C8C",
    alignItems: "center" as const,
  },
  doneText: { color: "#FFFFFF", fontWeight: "700" as const, fontSize: 14 },
};
