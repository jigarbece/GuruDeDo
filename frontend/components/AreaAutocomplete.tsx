import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, Text, TextInput, View } from "react-native";
import { searchPlaces, type PlaceSuggestion } from "../lib/places";
import type { Coords } from "../lib/city";

// Web-only portal: renders the dropdown directly on document.body so it
// can never be clipped or buried by any parent stacking context.
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

interface Props {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  /** When set, suggestions in this city are surfaced first. */
  cityBias?: string;
  /**
   * Lat/lon used to bias Photon results by proximity. When provided, results
   * near these coords win — this is what makes suggestions feel "nearby" even
   * when the city label is a suburb the metro-centroid map doesn't know.
   */
  coordBias?: Coords | null;
  onSubmitEditing?: () => void;
  /** Extra Tailwind classes for the wrapper (e.g. flex sizing). */
  wrapperClassName?: string;
}

/**
 * Google-Maps-style area autocomplete.
 *
 * - Debounces input by 300ms so we don't hammer Photon while the user types.
 * - Aborts in-flight requests when the query changes.
 * - On web the dropdown is rendered into a document.body portal so it is
 *   never clipped by any parent overflow/stacking context.
 * - On native the dropdown is absolutely positioned below the input as before.
 */
export default function AreaAutocomplete({
  value,
  onChangeText,
  placeholder,
  cityBias,
  coordBias,
  onSubmitEditing,
  wrapperClassName,
}: Props) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [justPicked, setJustPicked] = useState(false);

  // Tracks the pixel position of the input so the portal dropdown can be
  // placed directly below it regardless of scroll or parent transforms.
  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const inputRef = useRef<TextInput>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Measure the input's viewport position so the portal dropdown
  // can be placed directly below it. Works with any scroll depth.
  const measureInput = () => {
    if (Platform.OS !== "web") return;
    // react-native-web exposes the DOM node directly on the ref object.
    const domNode = (inputRef.current as any) as HTMLElement | null;
    if (!domNode || typeof domNode.getBoundingClientRect !== "function") return;
    const rect = domNode.getBoundingClientRect();
    setDropdownPos({
      // Use fixed positioning (viewport-relative) so scroll doesn't misalign it.
      top: rect.bottom,
      left: rect.left,
      width: rect.width,
    });
  };

  useEffect(() => {
    if (justPicked) {
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
        const list = await searchPlaces(
          value,
          { cityBias, coordBias },
          controller.signal,
        );
        if (!controller.signal.aborted) {
          setSuggestions(list);
          if (list.length > 0) {
            measureInput();
            setOpen(true);
          } else {
            setOpen(false);
          }
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
  }, [value, cityBias, coordBias?.lat, coordBias?.lon]);

  const pick = (s: PlaceSuggestion) => {
    setJustPicked(true);
    onChangeText(s.name);
    setSuggestions([]);
    setOpen(false);
  };

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
                shadowColor: "#000",
                shadowOpacity: 0.15,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 6 },
                elevation: 20,
                backgroundColor: "#fff",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                overflow: "hidden" as any,
              }
            : {
                position: "absolute",
                top: "100%" as any,
                left: 0,
                right: 0,
                zIndex: 1000,
                marginTop: 4,
                shadowColor: "#000",
                shadowOpacity: 0.12,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: 6,
                backgroundColor: "#fff",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                overflow: "hidden" as any,
              }
        }
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
    ) : null;

  return (
    <View
      style={{ position: "relative", zIndex: 100 }}
      className={wrapperClassName ?? "flex-1"}
    >
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? "Your area or locality"}
        placeholderTextColor="#9CA3AF"
        onFocus={() => {
          if (suggestions.length > 0) {
            measureInput();
            setOpen(true);
          }
        }}
        // Delay blur slightly so taps on suggestions register before close.
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onSubmitEditing={onSubmitEditing}
        className="rounded-xl border border-brand-border px-4 py-3 font-body text-base text-text-dark"
      />

      {/* Spinner at the right edge of the input during fetch */}
      {loading && (
        <View
          pointerEvents="none"
          style={{ position: "absolute", right: 12, top: 14 }}
        >
          <ActivityIndicator size="small" color="#5B2C8C" />
        </View>
      )}

      {/* On web: portal to body so nothing can clip the dropdown.
          On native: render inline (absolute within this wrapper). */}
      {Platform.OS === "web" ? (
        <DropdownPortal>{dropdownContent}</DropdownPortal>
      ) : (
        dropdownContent
      )}
    </View>
  );
}
