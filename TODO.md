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

---

## FASE 3: Módulo de Finanzas y Recursos
> No iniciar hasta completar Fase 2

- [ ] Tablas de presupuesto (Planificado vs. Consumido)
- [ ] Costo por hora asignado a perfiles
- [ ] Timesheets manuales

---

## FASE 4: Invisible PM — Integración MS Graph
> No iniciar hasta completar Fase 3

- [ ] Conexión Microsoft Graph API
- [ ] Evento Calendario: leer Outlook/Teams → sugerir registros de tiempo
- [ ] Evento Archivos: detectar aprobaciones en SharePoint → cambiar estado tarea
- [ ] Evento Correos: analizar hilos etiquetados → registrar aprobaciones

---

## FASE 5: Capa de IA
> No iniciar hasta completar Fase 4

- [ ] Creación de proyectos por lenguaje natural
- [ ] Agente de extracción de correos → triggers automáticos

---

## FASE 6: Pruebas, Auditoría y Seguridad
> No iniciar hasta completar Fase 5

- [ ] Pruebas de carga
- [ ] Validación de logs de auditoría
- [ ] Refinamiento UI/UX
