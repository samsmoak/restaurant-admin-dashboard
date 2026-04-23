"use client";

import { useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";
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

  const [inputValue, setInputValue] = useState(initial?.formatted_address ?? "");
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const acRef = useRef<google.maps.places.Autocomplete | null>(null);

  const onPlaceChanged = () => {
    const place = acRef.current?.getPlace();
    if (!place || !place.geometry?.location) {
      setError("Pick an address from the dropdown.");
      return;
    }
    const sel: Selected = {
      formatted_address: place.formatted_address ?? inputValue,
      latitude: place.geometry.location.lat(),
      longitude: place.geometry.location.lng(),
      place_id: place.place_id ?? "",
    };
    setInputValue(sel.formatted_address);
    setSelected(sel);
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return setError("Select your address from the suggestions.");
    setSubmitting(true);
    try {
      const timezone =
        typeof Intl !== "undefined"
          ? Intl.DateTimeFormat().resolvedOptions().timeZone || ""
          : "";
      await update({
        formatted_address: selected.formatted_address,
        latitude: selected.latitude,
        longitude: selected.longitude,
        place_id: selected.place_id,
        timezone,
        completed_step: "location",
      });
      onDone();
    } catch (e) {
      setError(isApiError(e) ? e.error : "Could not save location.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StepShell
      eyebrow="Step 3 of 5"
      title="Where are you located?"
      description="Search for your address and pick the matching Google suggestion — we'll save the coordinates for delivery."
      onBack={onBack}
      footer={
        <button
          form="step-location"
          type="submit"
          disabled={submitting || !selected}
          className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all disabled:opacity-50"
          style={{ backgroundColor: "#111318", color: "#FFFFFF" }}
        >
          {submitting ? "Saving…" : "Continue"}
        </button>
      }
    >
      {error && (
        <div
          className="text-sm px-4 py-2.5 rounded-lg"
          style={{ backgroundColor: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}
        >
          {error}
        </div>
      )}

      {loadError && (
        <div
          className="text-sm px-4 py-2.5 rounded-lg"
          style={{ backgroundColor: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" }}
        >
          Could not load Google Maps. Check NEXT_PUBLIC_GOOGLE_MAPS_API_KEY and the
          API key's allowed referrers.
        </div>
      )}

      <form id="step-location" onSubmit={submit} className="space-y-3">
        <label className="block text-sm font-medium" style={{ color: "#0F172A" }}>
          Restaurant address *
        </label>
        <div
          className="flex items-center gap-2 px-3 rounded-lg"
          style={{ border: "1px solid #E2E8F0", backgroundColor: "#FFFFFF" }}
        >
          <MapPin size={16} style={{ color: "#94A3B8" }} />
          {isLoaded ? (
            <Autocomplete
              onLoad={(ac) => (acRef.current = ac)}
              onPlaceChanged={onPlaceChanged}
              fields={["formatted_address", "geometry", "place_id", "name"]}
              options={{ types: ["establishment", "geocode"] }}
              className="flex-1"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  // Invalidate the previously selected place if the user types.
                  if (selected && e.target.value !== selected.formatted_address) {
                    setSelected(null);
                  }
                }}
                placeholder="Start typing your address…"
                className="w-full py-2.5 text-sm outline-none"
                style={{ backgroundColor: "#FFFFFF", color: "#0F172A" }}
                required
              />
            </Autocomplete>
          ) : (
            <input
              type="text"
              disabled
              placeholder="Loading Google Places…"
              className="w-full py-2.5 text-sm outline-none"
              style={{ backgroundColor: "#FFFFFF", color: "#94A3B8" }}
            />
          )}
        </div>

        {selected && (
          <div
            className="text-xs rounded-lg px-3 py-2"
            style={{ backgroundColor: "#F0FDF4", color: "#166534", border: "1px solid #BBF7D0" }}
          >
            <p className="font-semibold">{selected.formatted_address}</p>
            <p className="font-mono" style={{ color: "#15803D" }}>
              {selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)}
            </p>
          </div>
        )}
      </form>
    </StepShell>
  );
}
