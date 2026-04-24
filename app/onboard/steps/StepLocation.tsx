"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, CheckCircle2, Loader2 } from "lucide-react";
import { useJsApiLoader } from "@react-google-maps/api";
import { useRestaurantStore } from "@/lib/stores/restaurant.store";
import { isApiError } from "@/lib/api/client";
import StepShell from "../_components/StepShell";

const LIBRARIES: ("places")[] = ["places"];

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
 * Uses the NEW Places Autocomplete API (`AutocompleteSuggestion` /
 * `Place.fetchFields`), which works on both legacy and "Places API (New)"
 * projects. The old `AutocompleteService` + `PlacesService` classes are
 * unavailable for new GCP projects created after March 2025.
 *
 * If the new API isn't on the Maps library bundle we received, we fall back
 * to the old one so older projects still work.
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
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
  });

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

  // Session token for cost optimization — one token per autocomplete session.
  const sessionTokenRef = useRef<unknown>(null);
  useEffect(() => {
    if (!isLoaded) return;
    const g = google as unknown as {
      maps: { places: { AutocompleteSessionToken: new () => unknown } };
    };
    sessionTokenRef.current = new g.maps.places.AutocompleteSessionToken();
  }, [isLoaded]);

  // Debounced fetch as the user types.
  useEffect(() => {
    if (!isLoaded) return;
    const text = query.trim();
    if (text.length < 2 || (selected && text === selected.formatted_address)) {
      setSuggestions([]);
      setShowDropdown(false);
      setSearchError(null);
      return;
    }
    setSearching(true);
    const handle = setTimeout(async () => {
      try {
        const rows = await fetchSuggestions(text, sessionTokenRef.current);
        setSuggestions(rows);
        setShowDropdown(true);
        setSearchError(null);
      } catch (err) {
        console.error("[places] fetchSuggestions failed:", err);
        setSuggestions([]);
        setSearchError(
          err instanceof Error ? err.message : "Address search failed."
        );
      } finally {
        setSearching(false);
      }
    }, 200);
    return () => clearTimeout(handle);
  }, [query, isLoaded, selected]);

  const pickSuggestion = async (row: SuggestionRow) => {
    setShowDropdown(false);
    setSearching(true);
    try {
      const place = await fetchPlaceDetails(row.placeId, sessionTokenRef.current);
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
      const g = google as unknown as {
        maps: { places: { AutocompleteSessionToken: new () => unknown } };
      };
      sessionTokenRef.current = new g.maps.places.AutocompleteSessionToken();
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

  const placesUnavailable = !apiKey || !!loadError;

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
          disabled={submitting || !!error || !!loadError}
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

      {loadError && (
        <div
          className="text-xs px-3.5 py-2.5"
          style={{
            backgroundColor: "#FEF3C7",
            color: "#92400E",
            border: "1px solid #FDE68A",
            borderRadius: 4,
          }}
        >
          Google Maps couldn&apos;t load. You can still type your address — we&apos;ll
          skip coordinates for now and refine later from Settings.
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

/* ─── Places API helpers ──────────────────────────────────────────────── */

// Narrow cast to skirt the missing typings for the new Places API classes.
type GMaps = typeof google & {
  maps: typeof google.maps & {
    places: typeof google.maps.places & {
      AutocompleteSuggestion?: {
        fetchAutocompleteSuggestions: (req: {
          input: string;
          sessionToken?: unknown;
        }) => Promise<{ suggestions: NewSuggestion[] }>;
      };
      Place?: new (opts: { id: string; requestedLanguage?: string }) => NewPlace;
    };
  };
};

type NewSuggestion = {
  placePrediction: {
    placeId: string;
    text: { text: string };
    mainText?: { text: string };
    secondaryText?: { text: string };
    toPlace: () => NewPlace;
  } | null;
};

type NewPlace = {
  id: string;
  formattedAddress?: string;
  location?: { lat: () => number; lng: () => number };
  fetchFields: (req: { fields: string[] }) => Promise<{ place: NewPlace }>;
};

async function fetchSuggestions(
  input: string,
  sessionToken: unknown
): Promise<SuggestionRow[]> {
  const g = (google as unknown) as GMaps;

  // Try NEW API first.
  const NewSuggestionAPI = g.maps.places.AutocompleteSuggestion;
  if (NewSuggestionAPI) {
    const { suggestions } = await NewSuggestionAPI.fetchAutocompleteSuggestions({
      input,
      sessionToken,
    });
    const rows: SuggestionRow[] = [];
    for (const s of suggestions) {
      const pred = s.placePrediction;
      if (!pred) continue;
      rows.push({
        placeId: pred.placeId,
        mainText: pred.mainText?.text ?? pred.text.text,
        secondaryText: pred.secondaryText?.text ?? "",
      });
    }
    return rows;
  }

  // Fall back to legacy AutocompleteService.
  return new Promise((resolve, reject) => {
    const svc = new google.maps.places.AutocompleteService();
    svc.getPlacePredictions(
      {
        input,
        sessionToken: sessionToken as google.maps.places.AutocompleteSessionToken | undefined,
      },
      (results, status) => {
        if (
          status !== google.maps.places.PlacesServiceStatus.OK &&
          status !== google.maps.places.PlacesServiceStatus.ZERO_RESULTS
        ) {
          return reject(new Error(`Places legacy API status: ${status}`));
        }
        resolve(
          (results ?? []).map((p) => ({
            placeId: p.place_id,
            mainText: p.structured_formatting?.main_text ?? p.description,
            secondaryText: p.structured_formatting?.secondary_text ?? "",
          }))
        );
      }
    );
  });
}

async function fetchPlaceDetails(
  placeId: string,
  sessionToken: unknown
): Promise<{
  place_id: string;
  formatted_address: string;
  latitude: number;
  longitude: number;
}> {
  const g = (google as unknown) as GMaps;

  // Try NEW API first.
  const NewPlaceCtor = g.maps.places.Place;
  if (NewPlaceCtor) {
    const place = new NewPlaceCtor({ id: placeId });
    await place.fetchFields({ fields: ["formattedAddress", "location", "id"] });
    const lat = place.location?.lat?.() ?? 0;
    const lng = place.location?.lng?.() ?? 0;
    return {
      place_id: place.id ?? placeId,
      formatted_address: place.formattedAddress ?? "",
      latitude: lat,
      longitude: lng,
    };
  }

  // Legacy fallback via PlacesService.
  return new Promise((resolve, reject) => {
    const anchor = document.createElement("div");
    const svc = new google.maps.places.PlacesService(anchor);
    svc.getDetails(
      {
        placeId,
        fields: ["formatted_address", "geometry", "place_id"],
        sessionToken: sessionToken as google.maps.places.AutocompleteSessionToken | undefined,
      },
      (place, status) => {
        if (
          status !== google.maps.places.PlacesServiceStatus.OK ||
          !place ||
          !place.geometry?.location
        ) {
          return reject(new Error(`PlacesService status: ${status}`));
        }
        resolve({
          place_id: place.place_id ?? placeId,
          formatted_address: place.formatted_address ?? "",
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
        });
      }
    );
  });
}
