"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, CheckCircle2, Loader2 } from "lucide-react";

export type LocationValue = {
  formatted_address: string;
  latitude: number;
  longitude: number;
  place_id: string;
};

type SuggestionRow = {
  placeId: string;
  mainText: string;
  secondaryText: string;
};

/**
 * Address picker backed by Places API (New) REST endpoints. Used by the
 * onboarding wizard's location step and the settings page so admins can
 * change their saved address with the same autocomplete UX.
 */
export default function LocationPicker({
  value,
  onChange,
}: {
  value: LocationValue | null;
  onChange: (v: LocationValue | null) => void;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const placesUnavailable = !apiKey;

  const [query, setQuery] = useState(value?.formatted_address ?? "");
  const [suggestions, setSuggestions] = useState<SuggestionRow[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const sessionTokenRef = useRef<string>(newSessionToken());

  // Keep input in sync if parent updates the value (eg. async fetch landed).
  useEffect(() => {
    setQuery(value?.formatted_address ?? "");
  }, [value?.formatted_address]);

  useEffect(() => {
    if (!apiKey) return;
    const text = query.trim();
    let cancelled = false;
    const handle = window.setTimeout(async () => {
      if (cancelled) return;
      if (text.length < 2 || (value && text === value.formatted_address)) {
        setSuggestions([]);
        setShowDropdown(false);
        setSearchError(null);
        return;
      }
      setSearching(true);
      try {
        const rows = await fetchSuggestions(text, sessionTokenRef.current, apiKey);
        if (cancelled) return;
        setSuggestions(rows);
        setShowDropdown(rows.length > 0);
        setSearchError(rows.length === 0 ? "No matches found." : null);
      } catch (err) {
        if (cancelled) return;
        console.error("[places] fetchSuggestions failed:", err);
        setSuggestions([]);
        setShowDropdown(false);
        setSearchError(
          err instanceof Error ? err.message : "Address search failed."
        );
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [query, apiKey, value]);

  const pickSuggestion = async (row: SuggestionRow) => {
    setShowDropdown(false);
    setSearching(true);
    try {
      const place = await fetchPlaceDetails(row.placeId, apiKey);
      const sel: LocationValue = {
        formatted_address: place.formatted_address || row.mainText,
        latitude: place.latitude,
        longitude: place.longitude,
        place_id: place.place_id || row.placeId,
      };
      onChange(sel);
      setQuery(sel.formatted_address);
      setSearchError(null);
      sessionTokenRef.current = newSessionToken();
    } catch (err) {
      console.error("[places] fetchPlaceDetails failed:", err);
      setSearchError(
        err instanceof Error
          ? err.message
          : "Couldn't fetch details for that address."
      );
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-2">
      {placesUnavailable && (
        <div
          className="text-xs px-3.5 py-2.5"
          style={{
            backgroundColor: "#FEF3C7",
            color: "#92400E",
            border: "1px solid #FDE68A",
            borderRadius: 4,
          }}
        >
          Address autocomplete is unavailable (missing API key). You can still
          type your address manually.
        </div>
      )}

      {searchError && (
        <div
          className="text-xs px-3.5 py-2.5"
          style={{
            backgroundColor: "#FEF3C7",
            color: "#92400E",
            border: "1px solid #FDE68A",
            borderRadius: 4,
          }}
        >
          {searchError}
        </div>
      )}

      <div className="relative">
        <div
          className="flex items-center gap-2 px-3 transition-colors focus-within:border-[#0F2B4D]"
          style={{
            border: "1px solid #E5E7EB",
            backgroundColor: "#FFFFFF",
            borderRadius: 4,
          }}
        >
          <MapPin size={16} style={{ color: "#6B7280" }} />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (value && e.target.value !== value.formatted_address) {
                onChange(null);
              }
            }}
            onFocus={() => {
              if (suggestions.length > 0) setShowDropdown(true);
            }}
            onBlur={() => {
              window.setTimeout(() => setShowDropdown(false), 150);
            }}
            placeholder={
              placesUnavailable
                ? "e.g. 123 Main St, Springfield, IL 62701"
                : "Start typing your address…"
            }
            className="w-full py-2.5 text-sm outline-none"
            style={{ backgroundColor: "#FFFFFF", color: "#1E1E1E" }}
            autoComplete="off"
          />
          {searching && (
            <Loader2
              size={14}
              className="animate-spin"
              style={{ color: "#6B7280" }}
            />
          )}
        </div>

        {showDropdown && suggestions.length > 0 && (
          <div
            className="absolute left-0 right-0 mt-1 overflow-hidden"
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E7EB",
              zIndex: 50,
            }}
          >
            {suggestions.map((row) => (
              <button
                key={row.placeId}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  void pickSuggestion(row);
                }}
                className="w-full text-left px-3 py-2.5 text-sm transition-colors hover:bg-slate-50 flex items-start gap-2"
                style={{ color: "#1E1E1E" }}
              >
                <MapPin
                  size={13}
                  className="mt-0.5 shrink-0"
                  style={{ color: "#0F2B4D" }}
                />
                <span className="min-w-0">
                  <span className="font-medium block truncate">
                    {row.mainText}
                  </span>
                  <span
                    className="text-xs truncate block"
                    style={{ color: "#4A4A4A" }}
                  >
                    {row.secondaryText}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {value && (
        <div
          className="flex items-start gap-2 text-xs px-3 py-2.5"
          style={{
            backgroundColor: "#F0FDF4",
            color: "#166534",
            border: "1px solid #BBF7D0",
          }}
        >
          <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold">{value.formatted_address}</p>
            {(value.latitude !== 0 || value.longitude !== 0) && (
              <p className="font-mono text-[11px]" style={{ color: "#15803D" }}>
                {value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Hidden value mirror so the current query is also exposed if the user
          typed a free-form address without picking a suggestion. */}
      <input type="hidden" value={query} readOnly />
    </div>
  );
}

/* ─── Places API (New) — REST helpers ─────────────────────────────────── */

const PLACES_BASE = "https://places.googleapis.com/v1";

function newSessionToken(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

type AutocompleteResponse = {
  suggestions?: Array<{
    placePrediction?: {
      placeId: string;
      text?: { text?: string };
      structuredFormat?: {
        mainText?: { text?: string };
        secondaryText?: { text?: string };
      };
    };
  }>;
};

type PlaceDetailsResponse = {
  id?: string;
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
};

async function fetchSuggestions(
  input: string,
  sessionToken: string,
  apiKey: string
): Promise<SuggestionRow[]> {
  const res = await fetch(`${PLACES_BASE}/places:autocomplete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
    },
    body: JSON.stringify({ input, sessionToken }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Places autocomplete ${res.status}: ${body || res.statusText}`);
  }
  const data = (await res.json()) as AutocompleteResponse;
  const rows: SuggestionRow[] = [];
  for (const s of data.suggestions ?? []) {
    const p = s.placePrediction;
    if (!p) continue;
    const main = p.structuredFormat?.mainText?.text ?? p.text?.text ?? "";
    const secondary = p.structuredFormat?.secondaryText?.text ?? "";
    rows.push({
      placeId: p.placeId,
      mainText: main,
      secondaryText: secondary,
    });
  }
  return rows;
}

async function fetchPlaceDetails(
  placeId: string,
  apiKey: string
): Promise<{
  place_id: string;
  formatted_address: string;
  latitude: number;
  longitude: number;
}> {
  const res = await fetch(`${PLACES_BASE}/places/${encodeURIComponent(placeId)}`, {
    method: "GET",
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "id,formattedAddress,location",
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Place details ${res.status}: ${body || res.statusText}`);
  }
  const data = (await res.json()) as PlaceDetailsResponse;
  return {
    place_id: data.id ?? placeId,
    formatted_address: data.formattedAddress ?? "",
    latitude: data.location?.latitude ?? 0,
    longitude: data.location?.longitude ?? 0,
  };
}
