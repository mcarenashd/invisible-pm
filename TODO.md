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
- [ ] `api/workspaces` — CRUD de espacios de trabajo
- [ ] `api/projects` — CRUD de proyectos
- [ ] `api/tasks` — CRUD de tareas
- [ ] `api/users` — gestión de usuarios
- [ ] `api/time-entries` — registro de horas

### Frontend — Layout y Navegación
- [ ] Layout principal (sidebar + header)
- [ ] Navegación entre workspaces/proyectos
- [ ] Componente de usuario/avatar

### Frontend — Proyectos
- [ ] Vista lista de proyectos
- [ ] Crear/editar proyecto (dialog)
- [ ] Detalle de proyecto

### Frontend — Tareas
- [ ] Vista lista de tareas
- [ ] Vista tablero Kanban (drag & drop)
- [ ] Crear/editar tarea (dialog)
- [ ] Asignación de usuario a tarea

### Roles y Permisos
- [ ] Sistema de roles básico (Admin, PM, Consultor, Cliente)
- [ ] Middleware de permisos en API Routes
- [ ] Visibilidad condicional en UI según rol

### Estado Global (Zustand)
- [ ] Store de autenticación/sesión
- [ ] Store de proyectos
- [ ] Store de tareas

---

## FASE 2: Motor de Interfaz Evolutiva
> No iniciar hasta completar Fase 1

- [ ] Sistema de toggles en configuración de proyecto
- [ ] Lógica condicional: mostrar/ocultar campos según módulos activos
- [ ] Vistas diferenciadas por rol (dashboard financiero para gerencia)

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
