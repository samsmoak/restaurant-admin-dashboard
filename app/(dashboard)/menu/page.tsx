"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  ImageIcon,
  Star,
  AlertCircle,
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useCategoriesStore } from "@/lib/stores/categories.store";
import { useMenuStore } from "@/lib/stores/menu.store";
import { isApiError } from "@/lib/api/client";
import type { GoCategory, GoMenuItem } from "@/lib/api/dto";
import ItemFormDialog from "../_components/ItemFormDialog";
import CategoryFormDialog from "../_components/CategoryFormDialog";
import DeleteConfirmDialog from "../_components/DeleteConfirmDialog";

export default function MenuManagementPage() {
  const categories = useCategoriesStore((s) => s.categories);
  const fetchCategories = useCategoriesStore((s) => s.fetch);
  const updateCategory = useCategoriesStore((s) => s.update);
  const deleteCategory = useCategoriesStore((s) => s.del);

  const items = useMenuStore((s) => s.items);
  const fetchMenu = useMenuStore((s) => s.fetch);
  const updateMenuItem = useMenuStore((s) => s.update);
  const deleteMenuItem = useMenuStore((s) => s.del);

  const categoriesLoading = useCategoriesStore((s) => s.loading);
  const menuLoading = useMenuStore((s) => s.loading);
  const loading = categoriesLoading || menuLoading;

  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GoMenuItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<GoMenuItem | null>(null);

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<GoCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<GoCategory | null>(null);

  useEffect(() => {
    void fetchCategories();
    void fetchMenu();
  }, [fetchCategories, fetchMenu]);

  const categoriesById = useMemo(() => {
    const m = new Map<string, GoCategory>();
    for (const c of categories) m.set(c.id, c);
    return m;
  }, [categories]);

  const reload = async () => {
    await Promise.all([fetchCategories(), fetchMenu()]);
  };

  const toggleItemFlag = async (
    item: GoMenuItem,
    key: "is_available" | "is_featured",
    value: boolean
  ) => {
    try {
      await updateMenuItem(item.id, {
        ...item,
        [key]: value,
        category_id: item.category_id,
        sizes: item.sizes.map(({ id: _id, ...rest }) => rest),
        extras: item.extras.map(({ id: _id, ...rest }) => rest),
      });
    } catch (e) {
      toast.error(isApiError(e) ? e.error : "Could not update.");
    }
  };

  const toggleCategoryActive = async (cat: GoCategory, value: boolean) => {
    try {
      await updateCategory(cat.id, { ...cat, is_active: value });
    } catch (e) {
      toast.error(isApiError(e) ? e.error : "Could not update.");
    }
  };

  const confirmDeleteItem = async () => {
    if (!deletingItem) return;
    try {
      await deleteMenuItem(deletingItem.id);
      toast.success("Item deleted.");
    } catch (e) {
      toast.error(isApiError(e) ? e.error : "Could not delete.");
    }
  };

  const confirmDeleteCategory = async () => {
    if (!deletingCategory) return;
    try {
      await deleteCategory(deletingCategory.id);
      toast.success("Category deleted.");
    } catch (e) {
      toast.error(isApiError(e) ? e.error : "Could not delete.");
    }
  };

  return (
    <div className="space-y-5">
      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">Items ({items.length})</TabsTrigger>
          <TabsTrigger value="categories">
            Categories ({categories.length})
          </TabsTrigger>
        </TabsList>

        {/* ITEMS */}
        <TabsContent value="items" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm" style={{ color: "#64748B" }}>
              {loading
                ? "Loading…"
                : `${items.length} item${items.length === 1 ? "" : "s"}`}
            </p>
            <Button
              onClick={() => {
                if (categories.length === 0) {
                  toast.error("Create a category first.");
                  return;
                }
                setEditingItem(null);
                setItemDialogOpen(true);
              }}
              className="gap-2"
              style={{ backgroundColor: "#111318", color: "#FFFFFF" }}
            >
              <Plus size={15} /> Add item
            </Button>
          </div>

          {!loading && items.length === 0 ? (
            <EmptyState
              title="No items yet"
              body={
                categories.length === 0
                  ? "Create a category on the Categories tab, then add your first item."
                  : "Add your first menu item to get started."
              }
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  categoryName={
                    item.category_id
                      ? categoriesById.get(item.category_id)?.name ?? "Uncategorized"
                      : "Uncategorized"
                  }
                  onToggleAvailable={(v) => toggleItemFlag(item, "is_available", v)}
                  onToggleFeatured={(v) => toggleItemFlag(item, "is_featured", v)}
                  onEdit={() => {
                    setEditingItem(item);
                    setItemDialogOpen(true);
                  }}
                  onDelete={() => setDeletingItem(item)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* CATEGORIES */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm" style={{ color: "#64748B" }}>
              {loading
                ? "Loading…"
                : `${categories.length} categor${categories.length === 1 ? "y" : "ies"}`}
            </p>
            <Button
              onClick={() => {
                setEditingCategory(null);
                setCategoryDialogOpen(true);
              }}
              className="gap-2"
              style={{ backgroundColor: "#111318", color: "#FFFFFF" }}
            >
              <Plus size={15} /> Add category
            </Button>
          </div>

          {!loading && categories.length === 0 ? (
            <EmptyState
              title="No categories yet"
              body="Create your first category (e.g., Starters, Mains, Desserts) so you can organize menu items."
            />
          ) : (
            <div
              className="rounded-lg overflow-hidden"
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E2E8F0",
              }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr
                    className="text-left text-xs uppercase tracking-wider"
                    style={{ backgroundColor: "#F8FAFC", color: "#64748B" }}
                  >
                    <th className="px-4 py-2.5 font-semibold">Name</th>
                    <th className="px-4 py-2.5 font-semibold">Description</th>
                    <th className="px-4 py-2.5 font-semibold text-center">Order</th>
                    <th className="px-4 py-2.5 font-semibold text-center">Active</th>
                    <th className="px-4 py-2.5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => {
                    const itemCount = items.filter((i) => i.category_id === c.id).length;
                    return (
                      <tr key={c.id} style={{ borderTop: "1px solid #F1F5F9" }}>
                        <td className="px-4 py-3">
                          <p className="font-semibold" style={{ color: "#0F172A" }}>
                            {c.name}
                          </p>
                          <p className="text-xs" style={{ color: "#94A3B8" }}>
                            {itemCount} item{itemCount === 1 ? "" : "s"}
                          </p>
                        </td>
                        <td className="px-4 py-3" style={{ color: "#64748B" }}>
                          {c.description || "—"}
                        </td>
                        <td className="px-4 py-3 text-center tabular-nums">
                          {c.display_order}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center">
                            <Switch
                              checked={c.is_active}
                              onCheckedChange={(v) => toggleCategoryActive(c, v)}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingCategory(c);
                                setCategoryDialogOpen(true);
                              }}
                            >
                              <Pencil size={13} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeletingCategory(c)}
                              className="text-red-600"
                            >
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ItemFormDialog
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        item={editingItem}
        categories={categories}
        onSaved={reload}
      />
      <CategoryFormDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        category={editingCategory}
        onSaved={reload}
      />
      <DeleteConfirmDialog
        open={!!deletingItem}
        onOpenChange={(v) => !v && setDeletingItem(null)}
        title="Delete menu item?"
        description={`“${deletingItem?.name}” and its sizes/extras will be removed. This cannot be undone.`}
        onConfirm={confirmDeleteItem}
      />
      <DeleteConfirmDialog
        open={!!deletingCategory}
        onOpenChange={(v) => !v && setDeletingCategory(null)}
        title="Delete category?"
        description={
          deletingCategory
            ? `“${deletingCategory.name}” will be removed. Items in it will become uncategorized.`
            : ""
        }
        onConfirm={confirmDeleteCategory}
      />
    </div>
  );
}

function ItemRow({
  item,
  categoryName,
  onToggleAvailable,
  onToggleFeatured,
  onEdit,
  onDelete,
}: {
  item: GoMenuItem;
  categoryName: string;
  onToggleAvailable: (v: boolean) => void;
  onToggleFeatured: (v: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="rounded-lg p-3 flex gap-3"
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #E2E8F0",
        opacity: item.is_available ? 1 : 0.65,
      }}
    >
      <div
        className="w-20 h-20 rounded-md overflow-hidden flex items-center justify-center shrink-0"
        style={{ backgroundColor: "#F8FAFC" }}
      >
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <ImageIcon size={18} style={{ color: "#CBD5E1" }} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p
              className="font-semibold truncate flex items-center gap-1.5"
              style={{ color: "#0F172A" }}
            >
              {item.name}
              {item.is_featured && (
                <Star size={12} fill="#FFB627" style={{ color: "#FFB627" }} />
              )}
            </p>
            <p className="text-xs truncate" style={{ color: "#94A3B8" }}>
              {categoryName} · ${item.base_price.toFixed(2)}
            </p>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button size="sm" variant="ghost" onClick={onEdit}>
              <Pencil size={13} />
            </Button>
            <Button size="sm" variant="ghost" onClick={onDelete} className="text-red-600">
              <Trash2 size={13} />
            </Button>
          </div>
        </div>

        {item.description && (
          <p className="text-xs line-clamp-2 mt-0.5" style={{ color: "#64748B" }}>
            {item.description}
          </p>
        )}

        <div className="flex items-center gap-3 mt-2 text-xs">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <Switch checked={item.is_available} onCheckedChange={onToggleAvailable} />
            <span style={{ color: "#64748B" }}>
              {item.is_available ? "Available" : "Hidden"}
            </span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <Switch checked={item.is_featured} onCheckedChange={onToggleFeatured} />
            <span style={{ color: "#64748B" }}>Featured</span>
          </label>
          {(item.sizes?.length ?? 0) > 0 && (
            <span style={{ color: "#94A3B8" }}>
              · {item.sizes.length} size{item.sizes.length === 1 ? "" : "s"}
            </span>
          )}
          {(item.extras?.length ?? 0) > 0 && (
            <span style={{ color: "#94A3B8" }}>
              · {item.extras.length} extra{item.extras.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div
      className="rounded-lg py-12 px-6 text-center"
      style={{ backgroundColor: "#F8FAFC", border: "1px dashed #CBD5E1" }}
    >
      <AlertCircle size={22} className="mx-auto mb-2" style={{ color: "#CBD5E1" }} />
      <p className="font-semibold text-sm" style={{ color: "#0F172A" }}>
        {title}
      </p>
      <p className="text-xs mt-1 max-w-md mx-auto" style={{ color: "#64748B" }}>
        {body}
      </p>
    </div>
  );
}
