import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, Text, TextInput, View } from "react-native";
import { CoachApi } from "../lib/api";
import { CATEGORIES } from "../constants/categories";

// ---- Web portal (same pattern as LocationAutocomplete) ----------------------
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
    useEffect(() => {
      return () => {
        if (el.current && document.body.contains(el.current)) {
          document.body.removeChild(el.current);
        }
      };
    }, []);
    const wrapper = (
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          onMouseDown?.();
        }}
      >
        {children}
      </div>
    );
    return ReactDOM.createPortal(wrapper, el.current);
  };
}

// ---- Static skill seed list -------------------------------------------------
// Categories + common sub-skills as a local fallback / instant first-keystroke results.
const STATIC_SKILLS: Array<{ label: string; sub?: string }> = [
  // Categories
  ...CATEGORIES.map((c) => ({ label: c.name })),
  // Common sub-skills per category
  { label: "Mathematics", sub: "Academics" },
  { label: "Science", sub: "Academics" },
  { label: "Physics", sub: "Academics" },
  { label: "Chemistry", sub: "Academics" },
  { label: "Biology", sub: "Academics" },
  { label: "English", sub: "Academics" },
  { label: "Hindi", sub: "Academics" },
  { label: "History", sub: "Academics" },
  { label: "Geography", sub: "Academics" },
  { label: "Computer Science", sub: "Academics" },
  { label: "Guitar", sub: "Music" },
  { label: "Keyboard", sub: "Music" },
  { label: "Piano", sub: "Music" },
  { label: "Violin", sub: "Music" },
  { label: "Tabla", sub: "Music" },
  { label: "Singing", sub: "Music" },
  { label: "Classical Music", sub: "Music" },
  { label: "Bharatanatyam", sub: "Dance" },
  { label: "Kathak", sub: "Dance" },
  { label: "Bollywood Dance", sub: "Dance" },
  { label: "Zumba", sub: "Dance" },
  { label: "Western Dance", sub: "Dance" },
  { label: "Yoga", sub: "Fitness & Yoga" },
  { label: "Gym Training", sub: "Fitness & Yoga" },
  { label: "Zumba Fitness", sub: "Fitness & Yoga" },
  { label: "Meditation", sub: "Spiritual & Meditation" },
  { label: "Sketching", sub: "Art & Drawing" },
  { label: "Painting", sub: "Art & Drawing" },
  { label: "Watercolor", sub: "Art & Drawing" },
  { label: "Baking", sub: "Cooking & Baking" },
  { label: "Cooking", sub: "Cooking & Baking" },
  { label: "Cake Decoration", sub: "Cooking & Baking" },
  { label: "Hair Styling", sub: "Beauty & Salon" },
  { label: "Makeup", sub: "Beauty & Salon" },
  { label: "Mehendi", sub: "Beauty & Salon" },
  { label: "Spoken English", sub: "Language" },
  { label: "French", sub: "Language" },
  { label: "German", sub: "Language" },
  { label: "Japanese", sub: "Language" },
  { label: "Spanish", sub: "Language" },
  { label: "Python", sub: "Tech & Coding" },
  { label: "Web Development", sub: "Tech & Coding" },
  { label: "JavaScript", sub: "Tech & Coding" },
  { label: "Mobile App Development", sub: "Tech & Coding" },
  { label: "Portrait Photography", sub: "Photography" },
  { label: "Wedding Photography", sub: "Photography" },
];

/** Local fuzzy filter — scores by position of match (start > contains). */
function filterStatic(q: string): Array<{ label: string; sub?: string }> {
  const lower = q.toLowerCase();
  return STATIC_SKILLS.filter((s) => s.label.toLowerCase().includes(lower))
    .sort((a, b) => {
      const ai = a.label.toLowerCase().indexOf(lower);
      const bi = b.label.toLowerCase().indexOf(lower);
      return ai - bi; // earlier match = higher rank
    })
    .slice(0, 8);
}

// ---- Component ---------------------------------------------------------------

interface Props {
  value: string;
  onChangeText: (v: string) => void;
  onSelect: (skill: string) => void;
  onSubmitEditing?: () => void;
  placeholder?: string;
  closeRef?: React.MutableRefObject<(() => void) | null>;
}

export default function SkillAutocomplete({
  value,
  onChangeText,
  onSelect,
  onSubmitEditing,
  placeholder = "Guitar, Yoga, Math...",
  closeRef,
}: Props) {
  const [suggestions, setSuggestions] = useState<Array<{ label: string; sub?: string }>>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const justPickedRef = useRef(false);
  const mouseInDropdownRef = useRef(false);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [dropdownPos, setDropdownPos] = useState<{
    top: number; left: number; width: number;
  } | null>(null);
  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (closeRef) {
      closeRef.current = () => { setOpen(false); setSuggestions([]); };
    }
  }, [closeRef]);

  const measureInput = () => {
    if (Platform.OS !== "web") return;
    const domNode = (inputRef.current as any) as HTMLElement | null;
    if (!domNode || typeof domNode.getBoundingClientRect !== "function") return;
    const rect = domNode.getBoundingClientRect();
    setDropdownPos({ top: rect.bottom, left: rect.left, width: rect.width });
  };

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

    // Show static suggestions immediately (no latency).
    const staticHits = filterStatic(q);
    setSuggestions(staticHits);
    if (staticHits.length > 0) {
      measureInput();
      setOpen(true);
    }

    // Then fetch live suggestions from the API and merge.
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const live = await CoachApi.suggest(q);
        if (!justPickedRef.current) {
          // Merge live results with static, deduplicate by label (case-insensitive).
          const seen = new Set(staticHits.map((s) => s.label.toLowerCase()));
          const merged = [
            ...staticHits,
            ...live
              .filter((l) => !seen.has(l.toLowerCase()))
              .map((l) => ({ label: l })),
          ].slice(0, 10);
          setSuggestions(merged);
          if (merged.length > 0) {
            measureInput();
            setOpen(true);
          }
        }
      } catch {
        /* network error — static suggestions already shown */
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const pick = (label: string) => {
    justPickedRef.current = true;
    mouseInDropdownRef.current = false;
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    setSuggestions([]);
    setOpen(false);
    setLoading(false);
    onChangeText(label);
    onSelect(label);
  };

  // Highlight the matching portion of the label.
  function Highlighted({ text, query }: { text: string; query: string }) {
    if (!query.trim()) return <Text>{text}</Text>;
    const idx = text.toLowerCase().indexOf(query.toLowerCase().trim());
    if (idx === -1) return <Text>{text}</Text>;
    return (
      <Text>
        <Text>{text.slice(0, idx)}</Text>
        <Text style={{ fontWeight: "700", color: "#E63946" }}>
          {text.slice(idx, idx + query.trim().length)}
        </Text>
        <Text>{text.slice(idx + query.trim().length)}</Text>
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
        {suggestions.map((s, i) => (
          <Pressable
            key={`${s.label}-${i}`}
            onPress={() => pick(s.label)}
            style={({ pressed }) => ({
              backgroundColor: pressed ? "#F5F3FF" : "#fff",
              borderTopWidth: i > 0 ? 1 : 0,
              borderTopColor: "#E5E7EB",
              paddingHorizontal: 16,
              paddingVertical: 10,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            })}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
              <Text style={{ fontSize: 14 }}>🔍</Text>
              <Text style={{ fontSize: 14, color: "#111827", fontWeight: "500", flex: 1 }}>
                <Highlighted text={s.label} query={value} />
              </Text>
            </View>
            {s.sub && (
              <Text style={{ fontSize: 11, color: "#9CA3AF", marginLeft: 8 }}>{s.sub}</Text>
            )}
          </Pressable>
        ))}
      </View>
    ) : null;

  return (
    <View style={{ position: "relative", zIndex: 110, flex: 1 }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
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
          onSubmitEditing={onSubmitEditing}
          style={{ flex: 1 }}
          className="rounded-xl border border-brand-border bg-white px-4 py-3 font-body text-base text-text-dark"
        />
        {loading && (
          <View style={{ position: "absolute", right: 12, top: 14 }} pointerEvents="none">
            <ActivityIndicator size="small" color="#5B2C8C" />
          </View>
        )}
      </View>

      {Platform.OS === "web" ? (
        <DropdownPortal
          onMouseDown={() => {
            mouseInDropdownRef.current = true;
            if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
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
