<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Data layer (two backends coexist)

This project has two parallel data layers:

- **Go backend (active going forward)**: `lib/api/` + `lib/stores/*.store.ts`.
  - Typed HTTP client: [lib/api/client.ts](lib/api/client.ts).
  - Wire types: [lib/api/dto.ts](lib/api/dto.ts).
  - Endpoint wrappers: [lib/api/endpoints.ts](lib/api/endpoints.ts).
  - Zustand stores, one file per store: `auth.store.ts`, `restaurant.store.ts`, `categories.store.ts`, `menu.store.ts`, `orders.store.ts`, `invites.store.ts`, `team.store.ts`, `uploads.store.ts`, `studio.store.ts`.
  - Env: `NEXT_PUBLIC_API_URL` points at the Go backend. Admin tokens are stored under localStorage key `rs_admin_token` and scoped to a restaurant via `POST /api/auth/admin/activate`.

- **Supabase (legacy, still wired)**: `lib/supabase/*` + `lib/hooks/*.supabase.ts`.
  - The original hooks were copied to `*.supabase.ts` before the refactor. Any page still importing `./useOrders` / `./useStudioStore` etc. is currently reading from Supabase.

### Rules for changes

- New data calls: use the store. Never add a new Supabase query outside the `.supabase.ts` files.
- Moving a page from Supabase → Go: swap the import from `lib/hooks/*.ts` (or `*.supabase.ts`) to the matching `lib/stores/*.store.ts`. Do one page at a time and verify it works.
- If you need a new endpoint, add it to `lib/api/endpoints.ts` and expose the store method; the Go backend already carries the full admin surface at `/api/admin/*` and `/api/restaurants/*`.
