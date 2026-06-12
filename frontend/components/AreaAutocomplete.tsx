import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, Text, TextInput, View } from "react-native";
import { searchPlaces, type PlaceSuggestion } from "../lib/places";
import type { Coords } from "../lib/city";

// Web-only portal: renders the dropdown directly on document.body so no
// parent overflow/stacking context can ever clip or bury it.
let DropdownPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
if (Platform.OS === "web" && typeof document !== "undefined") {
  const ReactDOM = require("react-dom");
  DropdownPortal = ({ children }) => {
    const el = useRef<HTMLDivElement | null>(null);
    if (!el.current) {
      el.current = document.createElement("div");
      el.current.style.cssText =
        "position:fixed;top:0;left:0;width:0;height:0;z-index:99999;";
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
  cityBias?: string;
  coordBias?: Coords | null;
  onSubmitEditing?: () => void;
  wrapperClassName?: string;
}

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

  // Use a ref (not state) for the "just picked" flag so it never triggers a
  // re-render and cannot be overwritten by an async state flush mid-effect.
  const justPickedRef = useRef(false);

  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const inputRef = useRef<TextInput>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const measureInput = () => {
    if (Platform.OS !== "web") return;
    const domNode = (inputRef.current as any) as HTMLElement | null;
    if (!domNode || typeof domNode.getBoundingClientRect !== "function") return;
    const rect = domNode.getBoundingClientRect();
    setDropdownPos({ top: rect.bottom, left: rect.left, width: rect.width });
  };

  useEffect(() => {
    // If a suggestion was just picked, skip this run and clear the flag.
    if (justPickedRef.current) {
      justPickedRef.current = false;
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
        const list = await searchPlaces(value, { cityBias, coordBias }, controller.signal);
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
        /* aborted or network error — allow free typing */
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
    // Set the ref BEFORE calling onChangeText so the value-change effect
    // sees it immediately and skips the re-query.
    justPickedRef.current = true;
    setSuggestions([]);
    setOpen(false);
    onChangeText(s.name);
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
              <Text className="mt-0.5 font-body text-xs text-text-muted">{s.fullLabel}</Text>
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
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onSubmitEditing={onSubmitEditing}
        className="rounded-xl border border-brand-border px-4 py-3 font-body text-base text-text-dark"
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
