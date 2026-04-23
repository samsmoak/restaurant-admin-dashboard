"use client";

import { useRef, useState } from "react";
import { Upload, ImageIcon, Trash2 } from "lucide-react";
import { useRestaurantStore } from "@/lib/stores/restaurant.store";
import { useUploadsStore } from "@/lib/stores/uploads.store";
import { isApiError } from "@/lib/api/client";
import StepShell from "../_components/StepShell";

export default function StepBranding({
  onDone,
  onBack,
  initialLogoUrl,
}: {
  onDone: () => void;
  onBack?: () => void;
  initialLogoUrl?: string | null;
}) {
  const update = useRestaurantStore((s) => s.update);
  const presignAndPut = useUploadsStore((s) => s.presignAndPut);

  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB.");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const url = await presignAndPut("logos", file);
      if (!url) {
        setError("Upload failed — check S3 bucket CORS is configured.");
      } else {
        setLogoUrl(url);
        await update({ logo_url: url });
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const remove = async () => {
    setLogoUrl(null);
    await update({ logo_url: "" });
  };

  const finish = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await update({ completed_step: "branding" });
      onDone();
    } catch (e) {
      setError(isApiError(e) ? e.error : "Could not finish onboarding.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StepShell
      eyebrow="Step 5 of 5"
      title="Add a logo"
      description="Optional, but a logo makes your customer site feel finished. You can always add one later in Settings."
      onBack={onBack}
      footer={
        <button
          type="button"
          onClick={finish}
          disabled={submitting}
          className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, #FFB627 0%, #FF5A3C 100%)",
            color: "#FFFFFF",
          }}
        >
          {submitting ? "Finishing…" : logoUrl ? "Finish & go to dashboard" : "Skip & finish"}
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

      <div className="flex items-center gap-4">
        <div
          className="w-24 h-24 rounded-2xl overflow-hidden flex items-center justify-center shrink-0"
          style={{ backgroundColor: "#F8FAFC", border: "1.5px dashed #CBD5E1" }}
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon size={28} style={{ color: "#94A3B8" }} />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onUpload}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
            style={{ backgroundColor: "#111318", color: "#FFFFFF" }}
          >
            <Upload size={14} />
            {uploading ? "Uploading…" : logoUrl ? "Replace logo" : "Upload logo"}
          </button>
          {logoUrl && (
            <button
              type="button"
              onClick={remove}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ color: "#DC2626" }}
            >
              <Trash2 size={13} />
              Remove
            </button>
          )}
          <p className="text-xs" style={{ color: "#94A3B8" }}>
            PNG or JPG, up to 5 MB.
          </p>
        </div>
      </div>
    </StepShell>
  );
}
