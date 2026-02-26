# TODO - Invisible PM (Enterprise SaaS)

> Documento de seguimiento del proyecto. Se actualiza al completar cada tarea.

---

## FASE 0: Fundación y Arquitectura Base

### Scaffolding
- [x] Inicializar Next.js 16 con TypeScript, Tailwind v4, App Router
- [x] Configurar estructura de carpetas (`(auth)`, `dashboard`, `api/*`, `components/*`, `lib`, `hooks`, `stores`, `types`, `utils`)
- [x] Instalar y configurar Shadcn UI (button, input, card, dialog)
- [x] Instalar Zustand + Lucide React
- [x] Verificar build exitoso

### Base de Datos
- [x] Configurar Prisma ORM v7 con driver adapter (`@prisma/adapter-pg`)
- [x] Crear schema.prisma con 9 modelos y 6 enums
- [x] Modelos: Role, User, Workspace, WorkspaceUser, Project, Task, TaskRelation, TimeEntry, AuditLog
- [x] Adiciones aprobadas: TaskRelation, AuditLog, campos extra en Task/Project
- [x] Configurar PostgreSQL 17 local (Homebrew) y `DATABASE_URL` en `.env`
- [x] Correr primera migración (`prisma migrate dev --name init`)
- [x] Crear seed inicial (roles: Admin, PM, Consultor, Cliente)
- [x] Scripts npm: `db:migrate`, `db:seed`, `db:reset`, `db:studio`

### Autenticación
- [x] Instalar y configurar Auth.js v5 (next-auth@5.0.0-beta.30)
- [x] Provider de credentials (email/password) con bcryptjs
- [x] Preparar estructura para Microsoft Azure AD (placeholder, Fase 4)
- [x] Middleware de protección de rutas (matcher configurable)
- [x] Página de login (`/login`)
- [x] Página de register (`/register`) + API Route `/api/auth/register`
- [x] Página dashboard placeholder (`/dashboard`)
- [x] Migración: campo `password_hash` en User
- [x] Seed: usuario de prueba `admin@invisiblepm.dev` / `admin123!`
- [x] Session strategy: JWT
- [x] Type augmentation para session.user.id

### Testing
- [x] Vitest configurado para unit/integration tests
- [x] Test database separada (`invisible_pm_test`)
- [x] Helpers: `resetDatabase()`, `getTestPrisma()`, `applyMigrations()`
- [x] Integration tests auth-register (3 tests)
- [x] Integration tests auth-login (6 tests)
- [x] Integration tests projects CRUD (4 tests)
- [x] Integration tests tasks CRUD (5 tests)
- [x] Integration tests time-entries (4 tests)
- [x] Integration tests permissions RBAC (7 tests)
- [x] Playwright configurado para E2E (Chromium)
- [x] E2E tests flujo auth completo (5 tests): redirect, navegación, registro, login, error
- [x] Scripts npm: `test`, `test:watch`, `test:e2e`

### Decisiones Arquitectónicas Tomadas
- **Backend:** Next.js API Routes (monolito fullstack, no NestJS)
- **Esquema BD:** Incluye TaskRelation + AuditLog desde día 1
- **Enums definidos:** ProjectStatus, TaskStatus, TaskPriority, TaskRelationType, TimeEntrySource, AuditAction

---

## FASE 1: MVP Core "Modo Simple"

### API Routes (CRUD)
- [x] `api/workspaces` — GET (listar)
- [x] `api/projects` — GET (listar con task count) + POST (crear con audit log)
- [x] `api/projects/[id]` — GET (detalle con tareas) + PATCH (actualizar) + DELETE (soft delete)
- [x] `api/tasks` — GET (por project_id) + POST (crear con auto-position y audit log)
- [x] `api/tasks/[id]` — PATCH (actualizar status/priority/etc) + DELETE (soft delete)
- [x] `api/users` — GET miembros del workspace con roles (Fase 1b)
- [x] `api/time-entries` — GET (filtros) + POST (validación) + DELETE soft (Fase 1b)
- [x] Helper `getSessionOrUnauthorized()` para auth en API Routes

### Frontend — Layout y Navegación
- [x] Layout dashboard: sidebar colapsable + header con avatar/dropdown
- [x] Sidebar: Dashboard, Proyectos, Registro de Horas, Configuración
- [x] Header: avatar con iniciales, dropdown con perfil + cerrar sesión
- [x] SessionProvider + TooltipProvider en root layout
- [x] Título y metadata actualizados ("Invisible PM")

### Frontend — Proyectos
- [x] Vista lista de proyectos (cards con status badge y task count)
- [x] Crear proyecto (dialog con nombre + descripción)
- [x] Detalle de proyecto (header + Kanban board)
- [x] Estado vacío cuando no hay proyectos

### Frontend — Tareas
- [x] Vista tablero Kanban con 5 columnas (Backlog, Todo, In Progress, In Review, Done)
- [x] Drag & drop nativo entre columnas (HTML5 DnD)
- [x] Crear tarea (dialog con título, descripción, estado, prioridad)
- [x] Cards con prioridad (badge color) y avatar de asignado

### Roles y Permisos
- [x] Roles base en BD (Admin, PM, Consultor, Cliente) con seed
- [x] Workspace con asignación de usuario+rol (WorkspaceUser)
- [x] Sistema de permisos por rol (`permissions.ts` con RBAC)
- [x] Helpers `checkPermission()` y `forbiddenResponse()` en api-utils
- [x] Permisos aplicados a `project:create` y `project:delete`
- [x] Visibilidad condicional en UI según rol (Fase 2)

### Estado Global (Zustand)
- [x] Store de proyectos (fetch, create, update, delete)
- [x] Store de tareas (fetch, create, update, delete)

### Frontend — Registro de Horas
- [x] Componente LogTimeDialog (seleccionar tarea, fecha, horas)
- [x] Página `/dashboard/time-entries` con listado y totales
- [x] Eliminar registros propios

### Frontend — Tareas (mejoras Fase 1b)
- [x] TaskCard con menú: asignar usuario, desasignar, eliminar
- [x] Dropdown dinámico de usuarios del workspace

### Fase 1c — Polish & Completeness
- [x] Task detail panel (Sheet lateral con edición completa de todos los campos)
- [x] Dashboard con métricas reales (proyectos activos, tareas pendientes, horas semana, equipo)
- [x] Tareas recientes del usuario en dashboard
- [x] Edición de proyecto (dialog con nombre, descripción, estado, fechas, presupuesto, moneda)
- [x] Eliminación de proyecto desde detalle (soft delete con confirmación)
- [x] Metadata visual en header proyecto (fechas, presupuesto)
- [x] Toast notifications (Sonner) en toda la app (crear, actualizar, eliminar)
- [x] API `/api/dashboard/stats` (métricas agregadas)
- [x] Integration tests: projects (4), tasks (5), time-entries (4), permissions (7)
- [x] Test config: `fileParallelism: false` para evitar race conditions en BD

### Seed actualizado
- [x] Workspace por defecto "Invisible PM" con admin asignado

---

## FASE 2: Motor de Interfaz Evolutiva (Progressive Disclosure)

### Foundation
- [x] Schema: 3 booleans en Project (`module_budget`, `module_time`, `module_workload`) + migración
- [x] API `/api/me` — endpoint de contexto (rol, workspace, userId)
- [x] Zustand `auth-store.ts` — `fetchMe()` con guard contra llamadas duplicadas
- [x] Hook `usePermissions()` — `can()`, `isRole()`, `isManager`, `isReadOnly`
- [x] Hook `useProjectModules()` — `hasBudget`, `hasTime`, `hasWorkload`
- [x] `permissions.ts` separado de Prisma (client-safe, sin imports de server)
- [x] `AuthLoader` en providers.tsx — bootstrap de contexto al autenticarse

### Backend (permisos en API)
- [x] `PATCH /api/projects/[id]` — acepta module toggles + verifica `project:update`
- [x] `GET /api/dashboard/stats` — `budgetStats` solo para Admin/PM (módulo budget)
- [x] `GET /api/time-entries` — own-only enforcement para rol Consultor
- [x] Store types: `module_*` fields en `ProjectSummary`

### UI — Visibilidad condicional por rol
- [x] Sidebar: filtra nav por permisos (Cliente solo ve Dashboard + Proyectos)
- [x] Header: badge con nombre del rol junto al avatar
- [x] Dashboard: cards "Miembros del equipo" y "Presupuesto activo" solo para managers
- [x] Crear proyecto: botón oculto sin permiso `project:create`
- [x] Project header: edit/delete condicionales por permiso + budget metadata solo si `hasBudget`
- [x] Project header: switches de módulos activos en dialog de edición (solo Admin)
- [x] Kanban: drag deshabilitado para Cliente, create task oculto sin `task:create`
- [x] Task card: prop `readOnly` controla drag handle y menú de acciones
- [x] Task detail sheet: modo lectura completo para Cliente, own-only edit para Consultor
- [x] Time entries: botones create/delete gated por permisos

### Seed y Tests
- [x] 3 usuarios de prueba adicionales: `pm@invisiblepm.dev`, `consultor@invisiblepm.dev`, `cliente@invisiblepm.dev`
- [x] Integration tests project-modules (3 tests: defaults, custom toggles, update independiente)
- [x] 32 tests totales pasando, build exitoso
- [x] Página raíz `/` redirige a `/dashboard` (eliminado boilerplate Next.js)

### Fase 2.5 — Polish & Gaps funcionales
- [x] Página de Configuración (`/dashboard/settings`) — gestión de workspace *(resuelto en Fase 3)*
- [x] Gestión de miembros del workspace (listar, cambiar rol, cambiar tarifa) *(resuelto en Fase 3)*
- [x] Desactivar / reactivar miembros del workspace (Switch en member-edit-dialog + badge "Inactivo")
- [x] Página "Mi perfil" (`/dashboard/profile`) — editar nombre, email, cambiar contraseña
- [x] API `PATCH /api/me` — actualizar nombre y email propios
- [x] API `PATCH /api/me/password` — cambiar contraseña (verifica actual con bcrypt)
- [x] Link "Mi perfil" en dropdown del header funcional → `/dashboard/profile`
- [x] Página 404 personalizada (`src/app/not-found.tsx`)
- [x] `PATCH /api/users/[id]` extendido con `is_active` + protección contra auto-desactivación
- [x] Integration tests `profile.test.ts` (5 tests: update name, email uniqueness, password change, toggle is_active, inactive login check)
- [x] 47 tests pasando (10 archivos), build exitoso
- [ ] Invitar nuevos miembros al workspace (pendiente)

#### Archivos nuevos (4)
- `src/app/api/me/password/route.ts` — Cambio de contraseña
- `src/app/dashboard/profile/page.tsx` — Página perfil (wrapper)
- `src/components/profile/profile-content.tsx` — Contenido perfil (client)
- `src/app/not-found.tsx` — Página 404 personalizada

#### Archivos modificados (5)
- `src/app/api/me/route.ts` — +PATCH handler (name, email)
- `src/app/api/users/[id]/route.ts` — +is_active en PATCH
- `src/components/layout/header.tsx` — Link "Mi perfil" → /dashboard/profile
- `src/components/settings/settings-content.tsx` — Badge inactivo + opacity
- `src/components/settings/member-edit-dialog.tsx` — Switch is_active

---

## FASE 3: Módulo de Finanzas y Recursos

### Batch A — Foundation (Schema + Settings + User Management)
- [x] Schema: `rate_snapshot Decimal?` en TimeEntry + migración `add_rate_snapshot`
- [x] Permiso `budget:read` agregado a Admin y PM en `permissions.ts`
- [x] API `GET /api/roles` — lista de roles para dropdown en settings
- [x] API `PATCH /api/users/[id]` — actualizar `hourly_rate` y/o rol (requiere `user:manage`)
- [x] Instalar Shadcn Tabs (`npx shadcn@latest add tabs`)
- [x] Página de Configuración `/dashboard/settings` con Tabs (General + Miembros)
- [x] Componente `settings-content.tsx` — tabla de miembros con rol, tarifa, botón editar
- [x] Componente `member-edit-dialog.tsx` — dialog para cambiar rol y tarifa
- [x] `rate_snapshot` capturado en POST `/api/time-entries` desde `user.hourly_rate`
- [x] `workspaceName` expuesto en `usePermissions()` hook

### Batch B — Budget Tracking por Proyecto
- [x] API `GET /api/projects/[id]/budget` — presupuesto vs consumido, desglose por usuario
- [x] Utilidades `src/lib/format.ts` — `formatCurrency()`, `formatHours()`, `calcPercentage()`
- [x] Componente `progress-bar.tsx` — barra Tailwind con colores por nivel (verde/amarillo/rojo)
- [x] Componente `budget-panel.tsx` — panel con resumen + progreso + tabla desglose
- [x] `BudgetPanel` integrado en `/dashboard/projects/[id]` (entre header y kanban)

### Batch C — Dashboard Financiero + Time Entries con Costo
- [x] GET `/api/time-entries` enriquecido con `cost: hours * rate_snapshot`
- [x] GET `/api/dashboard/stats` — `budgetStats` con `totalConsumed`, `remaining`, `weeklyBurn`
- [x] Dashboard: 3 cards financieras (Presupuesto total, Costo consumido con progress bar, Burn rate semanal)
- [x] Time entries: costo por entrada + costo total en header (solo managers)

### Batch D — Tests + Build
- [x] Integration tests `financial.test.ts` (5 tests: rate_snapshot, cost calc, multi-user, rate change protection, soft delete exclusion)
- [x] Integration tests `user-management.test.ts` (5 tests: update rate, assign role, change role, list members, audit log)
- [x] Build exitoso (`npx next build`)
- [x] 42 tests pasando (9 archivos)

### Decisión Arquitectónica: Rate Snapshot
> Al crear una time entry, se captura el `hourly_rate` del usuario en `rate_snapshot`.
> Esto protege contra cambios retroactivos de tarifa. El costo se computa server-side como `hours * rate_snapshot`.

### Archivos nuevos (12)
- `src/app/api/users/[id]/route.ts` — PATCH user (rate + role)
- `src/app/api/projects/[id]/budget/route.ts` — GET budget tracking
- `src/app/api/roles/route.ts` — GET lista de roles
- `src/app/dashboard/settings/page.tsx` — Página settings
- `src/components/settings/settings-content.tsx` — Tabs: General + Miembros
- `src/components/settings/member-edit-dialog.tsx` — Dialog editar miembro
- `src/components/projects/budget-panel.tsx` — Panel presupuesto proyecto
- `src/components/ui/progress-bar.tsx` — Barra de progreso
- `src/components/ui/tabs.tsx` — Shadcn tabs
- `src/lib/format.ts` — Formateo moneda/horas
- `tests/integration/financial.test.ts` — Tests financieros
- `tests/integration/user-management.test.ts` — Tests gestión usuarios

### Archivos modificados (7)
- `prisma/schema.prisma` — +rate_snapshot en TimeEntry
- `src/lib/permissions.ts` — +budget:read
- `src/app/api/time-entries/route.ts` — rate snapshot en POST, cost en GET
- `src/app/api/dashboard/stats/route.ts` — totalConsumed, remaining, weeklyBurn
- `src/app/dashboard/projects/[id]/page.tsx` — +BudgetPanel
- `src/app/dashboard/time-entries/page.tsx` — costo por entry (managers)
- `src/components/dashboard/dashboard-content.tsx` — 3 cards financieras

---

## FASE 4: Invisible PM — Integración Microsoft (SSO + MS Graph)

### Batch A — SSO con Microsoft Entra ID
- [x] Schema: modelo `Account` para OAuth tokens + relación en User
- [x] Migración `add_account_model` aplicada
- [x] Instalar `@auth/prisma-adapter` y `@microsoft/microsoft-graph-client`
- [x] Reescritura `auth.ts` con provider Microsoft Entra ID (condicional por env vars)
- [x] Callback `signIn`: provisionar usuario nuevo → crear User + WorkspaceUser (Consultor en workspace default)
- [x] Callback `jwt`: capturar `access_token` del provider Microsoft
- [x] Bloqueo de usuarios inactivos en flujo SSO
- [x] Upsert Account record con tokens OAuth en cada login
- [x] Variables de entorno en `.env` + `.env.example` creado
- [x] Login page: botón "Iniciar sesión con Microsoft" con icono SVG + separador "o"
- [x] Register page: link "¿Tienes cuenta Microsoft? Inicia sesión directamente"

### Batch B — MS Graph Client Foundation
- [x] `src/lib/graph-client.ts` — wrapper tipado para `@microsoft/microsoft-graph-client`
- [x] `src/lib/graph-token.ts` — `getAccessToken(userId)` con refresh automático + `hasMicrosoftAccount(userId)`
- [x] `GET /api/integrations/me` — test endpoint que llama Graph `/me` para verificar conexión

### Batch C — Calendario → Sugerencias de Time Entries
- [x] `GET /api/integrations/calendar?from=date&to=date` — leer eventos de Outlook (filtra all-day, calcula duración)
- [x] `GET /api/integrations/calendar/suggestions` — eventos últimos 7 días sin time entry (dedup por external_event_id)
- [x] `POST /api/integrations/calendar/accept` — aceptar sugerencia → crear time entry con source `OUTLOOK` + rate_snapshot
- [x] Componente `CalendarSuggestions` — panel con eventos pendientes, selector de tarea, aceptar/descartar
- [x] Dashboard: `hasMicrosoft` flag en stats API + `CalendarSuggestions` condicional

### Batch D — Tests + Build
- [x] Integration tests `microsoft-sso.test.ts` (8 tests: Account CRUD, unique constraint, cascade delete, token upsert, SSO provisioning, OUTLOOK source, dedup, soft-delete dedup)
- [x] Build exitoso (`npx next build`)
- [x] 55 tests pasando (11 archivos)

### Decisión Arquitectónica: SSO Condicional
> El provider Microsoft Entra ID solo se carga si las variables `AUTH_MICROSOFT_ENTRA_ID_ID` están configuradas.
> Login con email/contraseña se mantiene como opción principal. Microsoft SSO es complementario.
> Nuevos usuarios SSO se auto-asignan al workspace default con rol Consultor.
> Los tokens OAuth se almacenan en la tabla `Account` y se refrescan automáticamente en `graph-token.ts`.

### Archivos nuevos (9)
- `src/lib/graph-client.ts` — Client de MS Graph
- `src/lib/graph-token.ts` — Accessor + refresh de tokens
- `src/app/api/integrations/me/route.ts` — Test Graph connection
- `src/app/api/integrations/calendar/route.ts` — Leer eventos calendario
- `src/app/api/integrations/calendar/suggestions/route.ts` — Sugerencias de time entries
- `src/app/api/integrations/calendar/accept/route.ts` — Aceptar sugerencia
- `src/components/integrations/calendar-suggestions.tsx` — UI sugerencias
- `.env.example` — Template de variables de entorno
- `tests/integration/microsoft-sso.test.ts` — Tests SSO + Graph

### Archivos modificados (5)
- `prisma/schema.prisma` — +Account model, +relación accounts en User
- `src/lib/auth.ts` — +Entra ID provider, +signIn/jwt callbacks para OAuth
- `src/app/(auth)/login/page.tsx` — +botón "Iniciar sesión con Microsoft"
- `src/app/(auth)/register/page.tsx` — +link a SSO
- `src/components/dashboard/dashboard-content.tsx` — +CalendarSuggestions condicional
- `src/app/api/dashboard/stats/route.ts` — +hasMicrosoft flag

### Prerrequisito del usuario
> Para probar el SSO, el usuario debe crear un Azure AD App Registration en portal.azure.com:
> 1. Microsoft Entra ID → App registrations → New registration
> 2. Redirect URI: `http://localhost:3000/api/auth/callback/microsoft-entra-id`
> 3. API permissions: User.Read + Calendars.Read (delegated)
> 4. Configurar variables en `.env`:
>    - `AUTH_MICROSOFT_ENTRA_ID_ID`, `AUTH_MICROSOFT_ENTRA_ID_SECRET`, `AUTH_MICROSOFT_ENTRA_ID_TENANT_ID`

---

## FASE 5: Invisible PM — Expansión MS Graph (pendiente)
- [ ] Evento Archivos: detectar aprobaciones en SharePoint → cambiar estado tarea
- [ ] Evento Correos: analizar hilos etiquetados → registrar aprobaciones

---

## FASE 6: Capa de IA
> No iniciar hasta completar Fase 5

- [ ] Creación de proyectos por lenguaje natural
- [ ] Agente de extracción de correos → triggers automáticos

---

## FASE 7: Pruebas, Auditoría y Seguridad
> No iniciar hasta completar Fase 6

- [ ] Pruebas de carga
- [ ] Validación de logs de auditoría
- [ ] Refinamiento UI/UX
