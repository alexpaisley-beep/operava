# Portal + MCP — deployment & configuration

Everything needed to run the customer portal, the Operava admin surface and the
Operava MCP in production. The marketing site keeps working with none of this
configured.

## 1. Supabase

The schema lives in `supabase/migrations/` and is already applied to the live
**Operava** project (`ihfocwkzpyknvqplpoef`). On a fresh project, apply the
migrations in filename order (Supabase CLI: `supabase db push`, or the
dashboard SQL editor). The first three are a verbatim export of the original
live schema; the rest are additive.

The migrations create a private `project-files` storage bucket, all RLS
policies, and the `portal_private` helper functions.

### Recommended Auth settings (Supabase dashboard → Authentication)

- **Enable "Leaked password protection"** (Auth → Policies). Off by default;
  the security advisor flags it. It checks new passwords against
  HaveIBeenPwned.
- Set the **Site URL** to the portal's origin and add
  `https://<host>/portal/auth/confirm` and `https://<host>/portal/auth/callback`
  to the **Redirect allow-list**, so invite and magic links resolve.
- Configure **SMTP** if you want Supabase to send auth emails directly.
  (Invites also work without it: the admin UI always shows the invite link for
  manual delivery, and important portal notifications go through Resend.)

## 2. Environment variables

| Variable                        | Scope           | Purpose                                               |
| ------------------------------- | --------------- | ----------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | public          | Supabase project URL                                  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public          | Publishable/anon key (RLS applies)                    |
| `SUPABASE_SERVICE_ROLE_KEY`     | **server-only** | Service role — bypasses RLS                           |
| `OPERAVA_MCP_KEY`               | **server-only** | Shared secret for the MCP                             |
| `OPERAVA_MCP_ACTOR_LABEL`       | server-only     | Audit label for MCP mutations (optional)              |
| `PORTAL_FROM_EMAIL`             | server-only     | Notification sender (falls back to `LEAD_FROM_EMAIL`) |
| `RESEND_API_KEY`                | server-only     | Existing; also powers portal notifications            |

Generate the MCP key with `openssl rand -hex 32`. The service-role key and MCP
key must never be prefixed `NEXT_PUBLIC_` — that would inline them into the
browser bundle.

On Vercel, set these under Project → Settings → Environment Variables. The two
`NEXT_PUBLIC_*` values are safe to expose; the rest must be server-only.

## 3. Connecting ChatGPT (or another MCP client)

The MCP endpoint is `POST /api/mcp`.

- **Header-capable clients:** `Authorization: Bearer <OPERAVA_MCP_KEY>` to
  `https://<host>/api/mcp`.
- **ChatGPT custom connectors** (cannot set headers): use the key in the path,
  `https://<host>/api/mcp/<OPERAVA_MCP_KEY>`.

The server is stateless streamable HTTP with JSON responses, so it runs on
serverless with no session store. It exposes 8 read tools and 11 write tools
(see `docs/PORTAL_ARCHITECTURE.md` and `src/lib/portal/mcp/tools.ts`). Every
write accepts an `idempotencyKey`; pass one when retrying.

Treat the MCP key like a password: it grants Operava-level access to all
customer and project data. Rotate it by changing `OPERAVA_MCP_KEY` and
re-issuing the connector URL.

## 4. First-run: create an admin

Portal roles live in `public.profiles`. To bootstrap the first Operava admin,
create an auth user in the Supabase dashboard, then insert a profile with
`role = 'admin'` and `company_id = null`. After that, everything else — adding
customers, inviting their users, running projects — is done through `/admin`
or the MCP.

## 5. Verifying a deployment

```bash
npm run build        # production build
npm run test         # unit tests
npm run test:rls     # RLS tests (needs a local postgres; otherwise skipped)
```

A quick live smoke test: sign in at `/portal/login` as an admin, create a
customer and project, invite a customer user, and confirm the customer sees
only their own project.
