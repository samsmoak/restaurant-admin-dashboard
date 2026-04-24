"use client";

import { useEffect } from "react";
import { useInvitesStore } from "@/lib/stores/invites.store";
import InvitesView from "./InvitesView";

export default function TeamPage() {
  const invites = useInvitesStore((s) => s.invites);
  const loading = useInvitesStore((s) => s.loading);
  const fetchInvites = useInvitesStore((s) => s.fetch);

  useEffect(() => {
    void fetchInvites();
  }, [fetchInvites]);

  return (
    <div className="max-w-4xl">
      {loading && invites.length === 0 ? (
        <p style={{ color: "#4A4A4A" }}>Loading…</p>
      ) : (
        <InvitesView invites={invites} />
      )}
    </div>
  );
}
