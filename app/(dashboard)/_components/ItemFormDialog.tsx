"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Upload, ImageIcon, Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useMenuStore } from "@/lib/stores/menu.store";
import { useUploadsStore } from "@/lib/stores/uploads.store";
import { isApiError } from "@/lib/api/client";
import type { GoCategory, GoMenuItem } from "@/lib/api/dto";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  item: GoMenuItem | null;
  categories: GoCategory[];
  onSaved: () => void;
};

type SizeDraft = {
  id?: string;
  name: string;
  price_modifier: number;
  is_default: boolean;
};

type ExtraDraft = {
  id?: string;
  name: string;
  price: number;
  is_available: boolean;
};

export default function ItemFormDialog({
  open,
  onOpenChange,
  item,
  categories,
  onSaved,
}: Props) {
  const isEdit = !!item;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [sizes, setSizes] = useState<SizeDraft[]>([]);
  const [extras, setExtras] = useState<ExtraDraft[]>([]);
  const [saving, setSaving] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(item?.name ?? "");
      setDescription(item?.description ?? "");
      setBasePrice(item?.base_price != null ? String(item.base_price) : "");
      setCategoryId(item?.category_id ?? categories[0]?.id ?? "");
      setDisplayOrder(item?.display_order ?? 0);
      setIsAvailable(item?.is_available ?? true);
      setIsFeatured(item?.is_featured ?? false);
      setImageUrl(item?.image_url ?? null);
      setSizes(
        (item?.sizes ?? []).map((s) => ({
          id: s.id,
          name: s.name,
          price_modifier: s.price_modifier,
          is_default: s.is_default,
        }))
      );
      setExtras(
        (item?.extras ?? []).map((e) => ({
          id: e.id,
          name: e.name,
          price: e.price,
          is_available: e.is_available,
        }))
      );
    }
  }, [open, item, categories]);

  const presignAndPut = useUploadsStore((s) => s.presignAndPut);
  const createMenuItem = useMenuStore((s) => s.create);
  const updateMenuItem = useMenuStore((s) => s.update);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB.");
      return;
    }

    setUploadingImage(true);
    try {
      const publicUrl = await presignAndPut("menu-images", file);
      if (publicUrl) setImageUrl(publicUrl);
      else toast.error("Upload failed.");
    } finally {
      setUploadingImage(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  // Sizes helpers
  const addSize = () =>
    setSizes((s) => [
      ...s,
      { name: "", price_modifier: 0, is_default: s.length === 0 },
    ]);
  const removeSize = (idx: number) =>
    setSizes((s) => s.filter((_, i) => i !== idx));
  const updateSize = <K extends keyof SizeDraft>(
    idx: number,
    key: K,
    value: SizeDraft[K]
  ) =>
    setSizes((s) => {
      const next = [...s];
      next[idx] = { ...next[idx], [key]: value };
      // Ensure at most one default
      if (key === "is_default" && value === true) {
        next.forEach((sz, i) => {
          if (i !== idx) sz.is_default = false;
        });
      }
      return next;
    });

  // Extras helpers
  const addExtra = () =>
    setExtras((e) => [...e, { name: "", price: 0, is_available: true }]);
  const removeExtra = (idx: number) =>
    setExtras((e) => e.filter((_, i) => i !== idx));
  const updateExtra = <K extends keyof ExtraDraft>(
    idx: number,
    key: K,
    value: ExtraDraft[K]
  ) =>
    setExtras((e) => {
      const next = [...e];
      next[idx] = { ...next[idx], [key]: value };
      return next;
    });

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Item name is required.");
      return;
    }
    const priceNum = Number(basePrice);
    if (!priceNum || priceNum <= 0) {
      toast.error("Enter a base price greater than 0.");
      return;
    }
    if (!categoryId) {
      toast.error("Pick a category first.");
      return;
    }
    if (sizes.some((s) => !s.name.trim())) {
      toast.error("Every size needs a name.");
      return;
    }
    if (extras.some((e) => !e.name.trim())) {
      toast.error("Every extra needs a name.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        base_price: priceNum,
        category_id: categoryId,
        display_order: displayOrder,
        is_available: isAvailable,
        is_featured: isFeatured,
        image_url: imageUrl ?? "",
        sizes: sizes.map((s) => ({
          name: s.name.trim(),
          price_modifier: Number(s.price_modifier) || 0,
          is_default: s.is_default,
        })),
        extras: extras.map((e) => ({
          name: e.name.trim(),
          price: Number(e.price) || 0,
          is_available: e.is_available,
        })),
      };

      if (isEdit && item) {
        await updateMenuItem(item.id, payload);
      } else {
        await createMenuItem(payload);
      }

      toast.success(isEdit ? "Item updated." : "Item created.");
      onSaved();
      onOpenChange(false);
    } catch (e) {
      toast.error(isApiError(e) ? e.error : "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit item" : "New menu item"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Image */}
          <div className="flex items-center gap-4">
            <div
              className="w-20 h-20 rounded-lg overflow-hidden flex items-center justify-center shrink-0"
              style={{
                backgroundColor: "#F5F7FA",
                border: "1.5px dashed #6B7280",
              }}
            >
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon size={22} style={{ color: "#6B7280" }} />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => fileRef.current?.click()}
                disabled={uploadingImage}
                className="gap-2"
              >
                <Upload size={13} />
                {uploadingImage
                  ? "Uploading…"
                  : imageUrl
                    ? "Replace image"
                    : "Upload image"}
              </Button>
              {imageUrl && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setImageUrl(null)}
                  className="text-red-600"
                >
                  Remove
                </Button>
              )}
            </div>
          </div>

          {/* Basic fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Label htmlFor="item-name">Name</Label>
              <Input
                id="item-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Margherita Pizza"
                className="mt-1.5"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="item-desc">Description</Label>
              <Textarea
                id="item-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Fresh basil, mozzarella di bufala, San Marzano tomato."
                rows={2}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="item-price">Base price</Label>
              <Input
                id="item-price"
                type="number"
                step="0.01"
                min="0"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="12.95"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="item-cat">Category</Label>
              <select
                id="item-cat"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1.5 w-full h-9 px-3 text-sm rounded-md"
                style={{ border: "1px solid #E5E7EB", color: "#1E1E1E" }}
              >
                {categories.length === 0 && (
                  <option value="">(create a category first)</option>
                )}
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="item-order">Display order</Label>
              <Input
                id="item-order"
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value) || 0)}
                className="mt-1.5"
              />
            </div>
            <div className="flex items-center justify-between pt-6">
              <div className="flex items-center gap-2">
                <Star size={14} style={{ color: "#0F2B4D" }} />
                <Label className="!cursor-pointer">Featured</Label>
              </div>
              <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
            </div>
            <div className="sm:col-span-2 flex items-center justify-between py-2 px-3 rounded-lg"
              style={{ backgroundColor: "#F5F7FA" }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: "#1E1E1E" }}>
                  Available for ordering
                </p>
                <p className="text-xs" style={{ color: "#4A4A4A" }}>
                  Off = hidden from customers until you turn it back on.
                </p>
              </div>
              <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
            </div>
          </div>

          {/* Sizes */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-semibold" style={{ color: "#1E1E1E" }}>
                  Sizes
                </h3>
                <p className="text-xs" style={{ color: "#4A4A4A" }}>
                  Price modifiers add to the base price. Leave empty for no sizing.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addSize}
                className="gap-1.5"
              >
                <Plus size={13} /> Add size
              </Button>
            </div>
            {sizes.length === 0 ? (
              <p
                className="text-xs text-center py-3 rounded-md"
                style={{ backgroundColor: "#F5F7FA", color: "#6B7280" }}
              >
                No sizes — customers order the base item directly.
              </p>
            ) : (
              <div className="space-y-2">
                {sizes.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={s.name}
                      onChange={(e) => updateSize(idx, "name", e.target.value)}
                      placeholder="Small"
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      value={s.price_modifier}
                      onChange={(e) =>
                        updateSize(idx, "price_modifier", Number(e.target.value) || 0)
                      }
                      placeholder="+0.00"
                      className="w-28"
                    />
                    <label
                      className="flex items-center gap-1.5 text-xs whitespace-nowrap px-2"
                      style={{ color: "#4A4A4A" }}
                    >
                      <input
                        type="radio"
                        name="size-default"
                        checked={s.is_default}
                        onChange={() => updateSize(idx, "is_default", true)}
                      />
                      Default
                    </label>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeSize(idx)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Extras */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-semibold" style={{ color: "#1E1E1E" }}>
                  Extras
                </h3>
                <p className="text-xs" style={{ color: "#4A4A4A" }}>
                  Optional add-ons with their own price.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addExtra}
                className="gap-1.5"
              >
                <Plus size={13} /> Add extra
              </Button>
            </div>
            {extras.length === 0 ? (
              <p
                className="text-xs text-center py-3 rounded-md"
                style={{ backgroundColor: "#F5F7FA", color: "#6B7280" }}
              >
                No extras on this item.
              </p>
            ) : (
              <div className="space-y-2">
                {extras.map((ex, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={ex.name}
                      onChange={(e) => updateExtra(idx, "name", e.target.value)}
                      placeholder="Extra cheese"
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      value={ex.price}
                      onChange={(e) =>
                        updateExtra(idx, "price", Number(e.target.value) || 0)
                      }
                      placeholder="0.00"
                      className="w-28"
                    />
                    <div className="flex items-center gap-1.5 px-2">
                      <Switch
                        checked={ex.is_available}
                        onCheckedChange={(v) => updateExtra(idx, "is_available", v)}
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeExtra(idx)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
