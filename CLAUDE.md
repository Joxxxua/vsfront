# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) and similar assistants when working in this repository.

## Project overview

Frontend administrativo de uma clínica médica (**Painel Clínica / Vida Saudável**): login de administrador, listagem de agendamentos (lista + agenda semanal), ações **confirmar / cancelar / realizar**, página de perfil e política de privacidade.

- **Stack:** React 19 + TypeScript + Vite 7, **react-router-dom** v7. **Sem** UI library (MUI, Chakra, etc.): CSS por página/componente + variáveis globais em `src/index.css`.
- **Idioma da UI:** textos voltados ao usuário em **português (pt-BR)**; datas/horas com `Intl` / `toLocaleString('pt-BR', …)`.

## Commands

Scripts are defined in `package.json` (use **npm** or **pnpm** interchangeably):

```bash
npm run dev      # Vite dev server — http://localhost:5173
npm run build    # tsc -b && vite build
npm run lint     # eslint .
npm run preview  # vite preview (production build locally)
```

There is **no** test runner (Jest/Vitest) configured.

## Environment

- Copy `.env.example` → `.env` and set `VITE_API_URL` when pointing at a local API.
- **Important:** In `lib/api.ts` and `services/auth.ts`, if `VITE_API_URL` is unset, **`import.meta.env.DEV`** uses `https://api.vidasaudavel.app` and **production** build falls back to `http://localhost:3000`. Adjust `.env` if that inversion surprises you during deploy.

## Conventions (do this by default)

1. **Scope:** Change only what the task requires; avoid drive-by refactors and unrelated files.
2. **New UI:** Reuse CSS variables from `:root` in `src/index.css` (`--color-primary`, `--color-surface`, `--border-color`, etc.); keep spacing/typography consistent with existing pages (e.g. `AgendamentosPage`, `LoginPage`).
3. **API calls:**
   - Prefer **`api` from `lib/api.ts`** for authenticated REST (`GET/PATCH` agendamentos, etc.) so refresh-on-401 works.
   - **`services/auth.ts`** intentionally uses raw **`fetch`** against the same `BASE_URL` for `signin`, `logout`, and (inside `api.ts`) `refresh` — keep that split unless you unify with care.
4. **Types:** Shared shapes live in `src/types/index.ts`. Backend may return `nome` or `name`; UI helpers often accept both (see `displayUserName` / `displayMedicoName` on `AgendamentosPage`).
5. **Routing:** New routes under the authenticated shell go in `App.tsx` as children of the layout that renders `DashboardLayout` + `Outlet`.
6. **Markdown/docs:** Do not add or expand project documentation unless the user asks (this file is the exception when maintained for the repo).

## Architecture

### Directory map

```
src/
  index.css          # Global :root variables, body, base resets
  App.tsx            # Router + AuthProvider
  lib/
    api.ts           # fetch wrapper, Bearer token, 401 → refresh → retry, ApiError, getApiErrorMessage
    auth.ts          # localStorage tokens, session email, JWT payload parse, getSessionUserDisplay(), 'auth:changed'
  services/
    auth.ts          # login / logout / clearSession (fetch, not api.*)
    agendamentos.ts  # listarAgendamentos, getAgendamento, confirmar, cancelar, realizar (api.*)
  contexts/
    AuthContext.tsx  # isAuthenticated; sync via 'auth:changed' + storage
  components/
    DashboardLayout.tsx   # Header, profile menu, breadcrumb, Outlet
    ProtectedRoute.tsx    # Redirect to /login if no access token
  pages/
    LoginPage.tsx, AgendamentosPage.tsx, PerfilPage.tsx, PrivacyPolicyPage.tsx
  types/
    index.ts
```

### Auth flow (short)

- Tokens: `localStorage` keys `clinic_admin_access_token`, `clinic_admin_refresh_token`, `clinic_admin_session_email`.
- After successful **login**, `setSessionEmail(credentials.email)` stores the email for the header/profile even if the JWT omits it.
- On 401, `api.ts` tries `POST /auth/refresh` with refresh token; failure → `clearAuth()`, `sessionStorage` message, user sent to login on next protected navigation.

### Routing (`App.tsx`)

| Path            | Access     | Notes                          |
|-----------------|------------|--------------------------------|
| `/login`        | Public     |                                |
| `/privacidade`  | Public     |                                |
| `/`             | Protected  | `DashboardLayout` + `Outlet`   |
| `/perfil`       | Protected  | Nested under same layout       |
| `*`             | —          | `Navigate` to `/`              |

`vercel.json` rewrites `/*` → `/index.html` for SPA hosting.

### API client

- Use **`getApiErrorMessage(err, fallback, { unauthorized, forbidden, validation, server })`** for user-visible strings from `ApiError`.
- Responses: JSON when `content-type` is JSON; otherwise callers may get `undefined` — handle if adding new endpoints.

## Agendamentos — critical behavior

**Do not send `dataInicio` or `dataFim` in `listarAgendamentos` query params.** Production API behavior with those filters has returned empty/incorrect results; the app relies on:

1. **GET `/agendamento`** with optional **`status`** and **`especialidade`** only (see `AgendamentosPage` → `filtros` + `services/agendamentos.ts` `buildQuery`).
2. **Client-side date filtering** in `AgendamentosPage`:
   - No start/end date in the form → show appointments whose **local calendar day** is **today or later**.
   - With date inputs → filter by **local day** inclusive range (`agendamentoPassaFiltroDatas`).
3. Changing **only** date fields updates the visible list on re-render; **Buscar** still refetches when you need fresh data after changing **status** / **especialidade** (those affect the API query).

If the list is empty but Postman shows data, check **token/clinic scope** on the backend, not only the front filters.

## Types reference (`src/types/index.ts`)

- **`StatusAgendamento`:** `'AGENDADO' | 'CONFIRMADO' | 'CANCELADO' | 'REALIZADO'`.
- **`Agendamento`:** `data` as ISO string; nested `user`, `medico`, `tipo`, `clinica` often partially populated.
- **`ListarAgendamentosParams`:** may still list `dataInicio`/`dataFim` for typing/backends elsewhere — **this frontend does not send them** for listing.

## Dashboard header / perfil

- `DashboardLayout`: profile trigger opens menu with **Meu perfil** (`Link` to `/perfil`) and **Sair** (calls `logout()` then `navigate('/login')`).
- Display name/email from `getSessionUserDisplay()` (`lib/auth.ts`).

## When editing this project

1. Run **`npm run build`** (or `pnpm build`) after non-trivial TS/React changes.
2. Run **`npm run lint`** if you touch many files or ESLint rules may apply.
3. Prefer **accessible** patterns for new interactive UI (labels, `aria-*`, keyboard for menus/modals).

## Git workflow

After completing each function or task:

1. Stage only the files related to the task (`git add <files>`).
2. Commit using **Conventional Commits** in English:
   - `feat: add weekly schedule view`
   - `fix: correct date filter on agendamentos list`
   - `chore: update dependencies`
   - `refactor: extract date helpers to utils`
   - `style: adjust spacing on LoginPage`
   - `docs: update CLAUDE.md with git workflow`
3. **One commit per task/feature** — do not batch unrelated changes into a single commit.
4. Do **not** push automatically; leave pushing to the developer unless explicitly asked.