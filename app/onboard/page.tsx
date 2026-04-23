import { notFound } from "next/navigation";
import OnboardForm from "./OnboardForm";

type SearchParams = Promise<{ invite?: string }>;

export default async function AdminOnboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { invite } = await searchParams;
  if (!invite) notFound();

  // The Go backend validates the invite when the user calls finalize.
  // We intentionally don't pre-check here (no anonymous DB access in the
  // new architecture).

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div
        className="w-full max-w-md rounded-2xl p-8 shadow-lg"
        style={{ backgroundColor: "#FFFFFF" }}
      >
        <div className="text-center mb-8">
          <div
            className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center text-xl font-bold"
            style={{ backgroundColor: "#111318", color: "#E8A045" }}
          >
            E&F
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "#0F172A" }}>
            Create Restaurant Owner Account
          </h1>
          <p className="text-sm mt-2" style={{ color: "#64748B" }}>
            Set up your admin credentials below. Your invite code will be
            validated when you submit.
          </p>
        </div>

        <OnboardForm invite={invite} />
      </div>
    </main>
  );
}
