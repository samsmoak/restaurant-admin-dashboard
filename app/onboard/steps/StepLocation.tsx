"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, CheckCircle2, Loader2 } from "lucide-react";
import { useRestaurantStore } from "@/lib/stores/restaurant.store";
import { isApiError } from "@/lib/api/client";
import StepShell from "../_components/StepShell";

type Selected = {
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
 * Wizard step 3 — location.
 *
 * Talks to the Places API (New) REST endpoints directly with fetch + an API
 * key in the `X-Goog-Api-Key` header. We deliberately avoid the JS Maps SDK
 * (`@react-google-maps/api` / `useJsApiLoader`) because the SDK adds a heavy
 * runtime, requires HTTP-referrer-restricted keys, and depends on the
 * `AutocompleteSuggestion` class which silently fails on some GCP projects.
 * The same REST flow already powers the customer-side Flutter app.
 */
export default function StepLocation({
  onDone,
  onBack,
  initial,
}: {
  onDone: () => void;
  onBack?: () => void;
  initial?: Partial<Selected>;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  const update = useRestaurantStore((s) => s.update);

  const [query, setQuery] = useState(initial?.formatted_address ?? "");
  const [selected, setSelected] = useState<Selected | null>(
    initial?.formatted_address && initial.latitude !== undefined
      ? {
          formatted_address: initial.formatted_address,
          latitude: initial.latitude,
          longitude: initial.longitude ?? 0,
          place_id: initial.place_id ?? "",
        }
      : null
  );
  const [suggestions, setSuggestions] = useState<SuggestionRow[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Session token for cost optimization — a fresh UUID per autocomplete
  // session, regenerated after each successful selection. Plain string is all
  // the REST API needs.
  const sessionTokenRef = useRef<string>(newSessionToken());

  // Debounced fetch as the user types. All state changes happen inside the
  // deferred timer body so the effect itself never calls setState
  // synchronously.
  useEffect(() => {
    if (!apiKey) return;
    const text = query.trim();
    let cancelled = false;
    const handle = window.setTimeout(async () => {
      if (cancelled) return;
      if (text.length < 2 || (selected && text === selected.formatted_address)) {
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
  }, [query, apiKey, selected]);

  const pickSuggestion = async (row: SuggestionRow) => {
    setShowDropdown(false);
    setSearching(true);
    try {
      const place = await fetchPlaceDetails(row.placeId, apiKey);
      const sel: Selected = {
        formatted_address: place.formatted_address || row.mainText,
        latitude: place.latitude,
        longitude: place.longitude,
        place_id: place.place_id || row.placeId,
      };
      setSelected(sel);
      setQuery(sel.formatted_address);
      setError(null);
      setSearchError(null);
      // Start a fresh session token for the next search.
      sessionTokenRef.current = newSessionToken();
    } catch (err) {
      console.error("[places] fetchPlaceDetails failed:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't fetch details for that address. Try another one."
      );
    } finally {
      setSearching(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const text = query.trim();
    if (text.length < 4) {
      return setError("Enter your restaurant address.");
    }
    setSubmitting(true);
    try {
      const timezone =
        typeof Intl !== "undefined"
          ? Intl.DateTimeFormat().resolvedOptions().timeZone || ""
          : "";
      const body = selected
        ? {
            formatted_address: selected.formatted_address,
            latitude: selected.latitude,
            longitude: selected.longitude,
            place_id: selected.place_id,
            timezone,
            completed_step: "location",
          }
        : {
            formatted_address: text,
            latitude: 0,
            longitude: 0,
            place_id: "",
            timezone,
            completed_step: "location",
          };
      await update(body);
      onDone();
    } catch (e) {
      setError(isApiError(e) ? e.error : "Could not save location.");
    } finally {
      setSubmitting(false);
    }
  };

  const placesUnavailable = !apiKey;

  return (
    <StepShell
      eyebrow="Step 3 of 5"
      title="Where are you located?"
      description={
        placesUnavailable
          ? "Type your full address. (Google Places is unavailable — coordinates won't be saved.)"
          : "Start typing and pick your restaurant from the suggestions — we'll save the exact coordinates for delivery math."
      }
      onBack={onBack}
      footer={
        <button
          form="step-location"
          type="submit"
          disabled={submitting || !!error}
          className="inline-flex items-center justify-center px-5 py-2 font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
          style={{
            backgroundColor: "#0F2B4D",
            color: "#FFFFFF",
            borderRadius: 6,
            minWidth: 132,
          }}
        >
          {submitting ? "Saving…" : "Continue"}
        </button>
      }
    >
      {error && (
        <div
          className="text-sm px-3.5 py-2.5"
          style={{
            backgroundColor: "#FEF2F2",
            color: "#DC2626",
            border: "1px solid #DC2626",
            borderRadius: 4,
          }}
        >
          {error}
        </div>
      )}

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
          type your full address — we&apos;ll skip coordinates for now and
          refine them later from Settings.
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
          {searchError} — check the browser console for details.
        </div>
      )}

      <form id="step-location" onSubmit={submit} className="space-y-2">
        <label
          htmlFor="step-location-address"
          className="block text-xs font-semibold uppercase tracking-wide"
          style={{ color: "#4A4A4A" }}
        >
          Restaurant address
        </label>

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
              id="step-location-address"
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (error) setError(null);
                if (selected && e.target.value !== selected.formatted_address) {
                  setSelected(null);
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
              aria-invalid={!!error}
              aria-describedby={error ? "step-location-error" : undefined}
            />
            {searching && (
              <Loader2
                size={14}
                className="animate-spin"
                style={{ color: "#6B7280" }}
              />
            )}
          </div>
          {error && (
            <p
              id="step-location-error"
              className="mt-1.5 text-xs"
              style={{ color: "#DC2626" }}
            >
              {error}
            </p>
          )}

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

        {selected && (
          <div
            className="flex items-start gap-2 text-xs px-3 py-2.5 mt-2"
            style={{
              backgroundColor: "#F0FDF4",
              color: "#166534",
              border: "1px solid #BBF7D0",
            }}
          >
            <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold">{selected.formatted_address}</p>
              <p className="font-mono text-[11px]" style={{ color: "#15803D" }}>
                {selected.latitude.toFixed(5)},{" "}
                {selected.longitude.toFixed(5)}
              </p>
            </div>
          </div>
        )}
      </form>
    </StepShell>
  );
}

/* ─── Places API (New) — REST helpers ─────────────────────────────────── */

const PLACES_BASE = "https://places.googleapis.com/v1";

function newSessionToken(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Cheap fallback for older browsers.
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
