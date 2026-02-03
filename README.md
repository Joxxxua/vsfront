# Painel da Clínica

Frontend do painel administrativo da clínica: login do administrador e gestão de agendamentos (confirmar/cancelar).

## Requisitos

- Node.js 18+
- pnpm
- API NestJS rodando (ex.: `http://localhost:3000`)

## Configuração

1. Instalar dependências: `pnpm install`
2. Copiar `.env.example` para `.env` e ajustar se necessário:
   - `VITE_API_URL=http://localhost:3000` (URL base da API)

## Desenvolvimento

```bash
pnpm dev
```

Abre em `http://localhost:5173`.

## CORS e proxy de desenvolvimento

Se o frontend estiver em outra porta (ex.: `5173`), o backend precisa permitir essa origem no CORS.
Alternativamente, você pode usar proxy no Vite para evitar problemas de CORS em desenvolvimento.

Exemplo de proxy (ajuste conforme necessário) em `vite.config.ts`:

```ts
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': 'http://localhost:3000',
      '/agendamento': 'http://localhost:3000',
    },
  },
})
```

## Build

```bash
pnpm build
```

## Autenticação

- Login com as credenciais da clínica em **POST** `/auth/signin`.
- O JWT é armazenado em `localStorage` e enviado como `Authorization: Bearer <access_token>` em todas as requisições.
- Em 401, o app tenta **refresh** em **POST** `/auth/refresh` (Bearer com `refresh_token`). Se falhar, limpa tokens e redireciona para `/login`.
- No logout, faz **POST** `/auth/logout`, limpa tokens e redireciona para `/login`.

## Endpoints da API utilizados

- **POST** `/auth/signin` – login (email + senha)
- **POST** `/auth/refresh` – refresh do token (Bearer com `refresh_token`)
- **POST** `/auth/logout` – logout (Bearer com `access_token`)
- **GET** `/agendamento` – listar agendamentos da clínica (filtros opcionais)
- **GET** `/agendamento/:id` – obter um agendamento
- **PATCH** `/agendamento/:id/confirmar` – confirmar agendamento
- **PATCH** `/agendamento/:id/cancelar` – cancelar agendamento

Se a sua API NestJS usar outros caminhos ou nomes, edite `src/services/auth.ts` e `src/services/agendamentos.ts`.

## Exemplos de requisição/resposta

### Login

```
POST /auth/signin
Content-Type: application/json

{ "email": "admin@clinica.com", "password": "StrongP@ssw0rd!" }
```

Resposta 200:

```
{ "access_token": "eyJ...", "refresh_token": "eyJ..." }
```

### Listar agendamentos

```
GET /agendamento
Authorization: Bearer <access_token>
```

Resposta 200:

```
[
  {
    "id": "uuid",
    "data": "2026-02-03T10:00:00.000Z",
    "status": "AGENDADO",
    "user": { "name": "Paciente" },
    "medico": { "name": "Dr. Fulano" },
    "clinica": { "name": "Clínica Exemplo" },
    "tipo": "Consulta",
    "created_at": "2026-02-01T10:00:00.000Z",
    "updated_at": "2026-02-01T10:00:00.000Z"
  }
]
```

### Confirmar agendamento

```
PATCH /agendamento/:id/confirmar
Authorization: Bearer <access_token>
Content-Type: application/json

{}
```

### Cancelar agendamento

```
PATCH /agendamento/:id/cancelar
Authorization: Bearer <access_token>
Content-Type: application/json

{}
```

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
