"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Plus, Copy, Ban, Check } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { useInvitesStore } from "@/lib/stores/invites.store";
import { isApiError } from "@/lib/api/client";
import type { GoInvite } from "@/lib/api/dto";

type Status = "pending" | "used" | "revoked";

function inviteStatus(inv: GoInvite): Status {
  if (inv.revoked) return "revoked";
  if (inv.used_at) return "used";
  return "pending";
}

const STATUS_STYLES: Record<Status, { bg: string; fg: string }> = {
  pending: { bg: "#FEF3C7", fg: "#92400E" },
  used: { bg: "#D1FAE5", fg: "#065F46" },
  revoked: { bg: "#E5E7EB", fg: "#374151" },
};

export default function InvitesView({ invites }: { invites: GoInvite[] }) {
  const revoke = useInvitesStore((s) => s.revoke);
  const [createOpen, setCreateOpen] = useState(false);

  const handleRevoke = async (id: string) => {
    try {
      await revoke(id);
      toast.success("Invite revoked.");
    } catch (e) {
      toast.error(isApiError(e) ? e.error : "Could not revoke.");
    }
  };

  const copyShareUrl = (code: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/onboard?invite=${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(url);
    toast.success("Invite link copied.");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "#64748B" }}>
          {invites.length} invite{invites.length === 1 ? "" : "s"}
        </p>
        <Button
          onClick={() => setCreateOpen(true)}
          className="gap-2"
          style={{ backgroundColor: "#111318", color: "#FFFFFF" }}
        >
          <Plus size={15} /> New invite
        </Button>
      </div>

      <div
        className="rounded-lg overflow-hidden"
        style={{ border: "1px solid #E2E8F0", backgroundColor: "#FFFFFF" }}
      >
        {invites.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="font-semibold text-sm" style={{ color: "#0F172A" }}>
              No invites yet
            </p>
            <p
              className="text-xs mt-1 max-w-md mx-auto"
              style={{ color: "#64748B" }}
            >
              Generate a one-time code and share the link with someone you want
              to grant restaurant-admin access to.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-left text-xs uppercase tracking-wider"
                style={{ backgroundColor: "#F8FAFC", color: "#64748B" }}
              >
                <th className="px-4 py-2.5 font-semibold">Code</th>
                <th className="px-4 py-2.5 font-semibold">For</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5 font-semibold">Created</th>
                <th className="px-4 py-2.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((inv) => {
                const status = inviteStatus(inv);
                const s = STATUS_STYLES[status];
                return (
                  <tr
                    key={inv.id}
                    style={{ borderTop: "1px solid #F1F5F9" }}
                  >
                    <td className="px-4 py-3">
                      <p
                        className="font-mono font-semibold"
                        style={{ color: "#0F172A" }}
                      >
                        {inv.code}
                      </p>
                      {inv.note && (
                        <p
                          className="text-xs"
                          style={{ color: "#94A3B8" }}
                        >
                          {inv.note}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {inv.email ? (
                        <span style={{ color: "#0F172A" }}>{inv.email}</span>
                      ) : (
                        <span style={{ color: "#94A3B8" }}>Anyone</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
                        style={{ backgroundColor: s.bg, color: s.fg }}
                      >
                        {status}
                      </span>
                      {status === "used" && inv.used_at && (
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: "#94A3B8" }}
                        >
                          {format(new Date(inv.used_at), "MMM d, h:mm a")}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#64748B" }}>
                      {format(new Date(inv.created_at), "MMM d, yyyy")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyShareUrl(inv.code)}
                          title="Copy share URL"
                        >
                          <Copy size={13} />
                        </Button>
                        {status === "pending" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRevoke(inv.id)}
                            title="Revoke"
                            className="text-red-600"
                          >
                            <Ban size={13} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <CreateInviteDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  );
}

function CreateInviteDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const createInvite = useInvitesStore((s) => s.create);
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string>("");

  const reset = () => {
    setEmail("");
    setNote("");
    setCreatedCode(null);
    setShareUrl("");
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const inv = await createInvite({
        email: email.trim() || undefined,
        note: note.trim() || undefined,
      });
      setCreatedCode(inv.code);
      setShareUrl(inv.share_url);
    } catch (e) {
      toast.error(isApiError(e) ? e.error : "Could not create invite.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {createdCode ? "Invite ready" : "New admin invite"}
          </DialogTitle>
        </DialogHeader>

        {!createdCode ? (
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="invite-email">Email (optional)</Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="maria@restaurant.com"
                className="mt-1.5"
              />
              <p className="text-xs mt-1" style={{ color: "#64748B" }}>
                If set, the invite can only be redeemed by a Google/email
                account with this exact address.
              </p>
            </div>
            <div>
              <Label htmlFor="invite-note">Note (optional)</Label>
              <Textarea
                id="invite-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Kitchen manager"
                rows={2}
                className="mt-1.5"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3 py-2">
            <div
              className="rounded-lg p-3 flex items-center gap-2 text-sm"
              style={{
                backgroundColor: "#F0FDF4",
                border: "1px solid #BBF7D0",
                color: "#166534",
              }}
            >
              <Check size={16} />
              <span className="font-semibold">Invite created</span>
            </div>
            <div>
              <Label>Share this URL</Label>
              <div className="flex gap-2 mt-1.5">
                <Input value={shareUrl} readOnly className="font-mono text-xs" />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    toast.success("Copied!");
                  }}
                >
                  <Copy size={13} />
                </Button>
              </div>
              <p className="text-xs mt-2" style={{ color: "#64748B" }}>
                Anyone with this link can create one restaurant-admin account.
                The link stops working once it's used or revoked.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {!createdCode ? (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={saving}>
                {saving ? "Creating…" : "Create invite"}
              </Button>
            </>
          ) : (
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
