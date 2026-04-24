"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import { useCategoriesStore } from "@/lib/stores/categories.store";
import { isApiError } from "@/lib/api/client";
import type { GoCategory } from "@/lib/api/dto";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  category: GoCategory | null;
  onSaved: () => void;
};

export default function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  onSaved,
}: Props) {
  const isEdit = !!category;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName(category?.name ?? "");
      setDescription(category?.description ?? "");
      setDisplayOrder(category?.display_order ?? 0);
      setIsActive(category?.is_active ?? true);
    }
  }, [open, category]);

  const createCategory = useCategoriesStore((s) => s.create);
  const updateCategory = useCategoriesStore((s) => s.update);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Category name is required.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        display_order: displayOrder,
        is_active: isActive,
        image_url: category?.image_url ?? "",
      };

      if (isEdit && category) {
        await updateCategory(category.id, payload);
        toast.success("Category updated.");
      } else {
        await createCategory(payload);
        toast.success("Category created.");
      }

      onSaved();
      onOpenChange(false);
    } catch (e) {
      toast.error(isApiError(e) ? e.error : "Could not save.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit category" : "New category"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="cat-name">Name</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Starters"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="cat-desc">Description</Label>
            <Textarea
              id="cat-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Shareable small plates to start the meal."
              rows={2}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="cat-order">Display order</Label>
            <Input
              id="cat-order"
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(Number(e.target.value) || 0)}
              className="mt-1.5"
            />
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium" style={{ color: "#1E1E1E" }}>
                Active
              </p>
              <p className="text-xs" style={{ color: "#4A4A4A" }}>
                Hidden categories don't appear on the public menu.
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
