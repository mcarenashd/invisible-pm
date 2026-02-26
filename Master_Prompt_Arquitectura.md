# Documento Maestro Técnico: Plataforma "Invisible PM"

## 1. Contexto del Proyecto y Filosofía Core

**Objetivo:** Desarrollar un software de gestión de proyectos (SaaS B2B) diseñado específicamente para consultoras y entidades institucionales/públicas (ej. BID).

**Filosofías de Diseño:**

1. **Invisible PM (Cero Fricción):** El usuario no debe hacer "trabajo sobre el trabajo". El sistema deduce el progreso escuchando eventos externos (emails, reuniones, subida de archivos) mediante integraciones profundas.
2. **Progressive Disclosure (Interfaz Evolutiva):** La UI debe ser tan simple como Trello al inicio, pero permitir activar módulos complejos (Gantt, Finanzas, Carga de trabajo) según escale el proyecto y el rol del usuario.
3. **Enterprise-First:** Fuerte enfoque en auditoría, trazabilidad, control de horas facturables y presupuestos.

---

## 2. Stack Tecnológico Recomendado

Para asegurar escalabilidad, seguridad corporativa y facilidad de integración con IA y APIs externas, el stack será:

- **Frontend (Cliente):**
  - **Framework:** Next.js (React) - Permite renderizado rápido y excelente manejo de rutas.
  - **Estilos:** Tailwind CSS + Componentes Radix o Shadcn UI (para un diseño limpio, profesional y de rápida iteración).
  - **Estado:** Zustand o Redux Toolkit (crucial para manejar la complejidad de la interfaz evolutiva sin recargar la página).
- **Backend (Servidor & API):**
  - **Framework:** NestJS (Node.js) o FastAPI (Python). _(Nota: FastAPI es excelente si el motor de IA será muy pesado, pero NestJS es ideal para arquitecturas empresariales y microservicios)._
  - **Arquitectura:** Event-Driven Architecture (EDA) para manejar los Webhooks de forma asíncrona.
- **Base de Datos & Caché:**
  - **Principal:** PostgreSQL (Relacional, vital para transacciones financieras y trazabilidad de auditorías).
  - **Caché/Colas:** Redis (Para encolar los eventos que llegan de Outlook/Teams y procesarlos sin saturar el servidor).
- **Integraciones Core (El motor invisible):**
  - **Microsoft Graph API:** Fundamental para el nicho EY/BID (leer Outlook, Teams, SharePoint, OneDrive).
  - **OAuth 2.0 / SAML:** Autenticación Single Sign-On (SSO) obligatoria para empresas corporativas.
- **Capa de IA:**
  - Integración con APIs de modelos fundacionales para análisis de texto (correos) y predicción.

---

## 3. Fases de Desarrollo (Roadmap de Ejecución)

> **Instrucción para la IA asistente:** Al iniciar el desarrollo, no intentes programar todo a la vez. Debemos avanzar estrictamente fase por fase, validando cada una antes de pasar a la siguiente.

### Fase 0: Fundación y Arquitectura Base

- Configuración del repositorio (Monorepo o Front/Back separados).
- Diseño del esquema de Base de Datos relacional (Usuarios, Roles, Espacios de Trabajo, Proyectos, Tareas, Registros de Tiempo).
- Implementación de Autenticación (JWT y preparación para Microsoft SSO).
- Configuración del entorno CI/CD.

### Fase 1: El MVP Core "Modo Simple"

- Desarrollo de la interfaz base (limpia, estilo Notion/Trello).
- CRUD (Crear, Leer, Actualizar, Borrar) de Proyectos y Tareas.
- Vistas básicas: Lista y Tablero Kanban.
- Sistema de roles y permisos básicos (Admin, PM, Consultor, Cliente).
- _Hito:_ Poder gestionar un proyecto sencillo manualmente sin que la UI se sienta pesada.

### Fase 2: Motor de Interfaz Evolutiva

- Implementación del sistema de "Toggles" (interruptores) en la configuración del proyecto.
- Desarrollo de la lógica condicional en el Frontend: mostrar/ocultar campos de presupuesto, estimación de horas, y dependencias según los módulos activos.
- Creación de Vistas por Rol (ej. Dashboard financiero exclusivo para gerencia).

### Fase 3: Módulo de Finanzas y Recursos

- Creación de tablas de presupuesto (Planificado vs. Consumido).
- Asignación de "Costo por Hora" a los perfiles de usuario.
- Sistema de Timesheets (Hojas de tiempo) manuales (preparando el terreno para automatizarlas en la siguiente fase).

### Fase 4: El "PM Invisible" - Integración MS Graph [FASE CRÍTICA]

- Conexión con Microsoft Graph API.
- **Evento 1 (Calendario):** Leer eventos de Outlook/Teams y sugerir registros de tiempo automáticos al usuario.
- **Evento 2 (Archivos):** Detectar cuando un documento se aprueba en SharePoint y cambiar el estado de la tarea en nuestro backend mediante Webhooks.
- **Evento 3 (Correos):** Analizar hilos de correo etiquetados con el ID del proyecto para extraer adjuntos y registrar aprobaciones de hitos.

### Fase 5: Capa de Inteligencia Artificial

- Prompt Engineering para convertir lenguaje natural en la creación estructurada de proyectos (_"Crea un proyecto de auditoría de 3 meses con 5 consultores"_).
- Agente de extracción: Usar IA para leer un correo de un cliente (ej. "Aprobado el presupuesto adjunto, avancemos") y traducirlo en un _trigger_ (disparador) que cierre el hito en la base de datos.

### Fase 6: Pruebas, Auditoría y Seguridad Corporativa

- Pruebas de carga.
- Validación de logs de auditoría (quién aprobó qué y cuándo, vital para el BID/EY).
- Refinamiento de UI/UX.

---

## 4. Protocolo de Trabajo con la IA

Cuando necesitemos programar, usaremos este flujo de trabajo estricto:

1. **Definir el objetivo:** Indicar a la IA en qué Fase y Tarea estamos trabajando.
2. **Diseño de Datos:** La IA primero propondrá las tablas o modificaciones en la base de datos PostgreSQL. El equipo humano lo aprobará.
3. **Backend:** La IA generará los _endpoints_ (APIs) y la lógica de negocio.
4. **Frontend:** La IA generará los componentes visuales conectándolos a la API.
