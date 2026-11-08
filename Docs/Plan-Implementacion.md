# Plan de Implementación — SERVI-X (backend + frontend)

## Contexto

El repo SERVI-X está en fase de arranque: solo tiene `Docs/Spec-Funcional.md` y `Docs/Spec-Tecnico.md`. Estos dos documentos ya definen actores, reglas de negocio, modelo de datos físico, contratos REST y stack tecnológico. El objetivo es construir la primera versión funcional del módulo SERVI-X (PQRS) siguiendo esos specs al pie de la letra, en un monorepo backend+frontend, respetando el flujo git acordado (`feature/*` → `dev` → `main`, cada paso con aprobación explícita).

Decisiones tomadas:
- **Framework backend:** Express.js (no NestJS).
- **ORM:** Prisma.
- **Alcance:** monorepo — `/backend` y `/frontend` en el mismo repo.

## Estructura del monorepo

```
SERVI-X/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   │   ├── config/          # env, conexión Prisma, constantes
│   │   ├── common/          # tipos, errores HTTP, utilidades UUID
│   │   ├── middlewares/     # auth.jwt, roles.guard, error.handler
│   │   ├── modules/
│   │   │   ├── auth/            # login, hash bcrypt
│   │   │   ├── responsables/    # CRUD agentes/admin (RF admin)
│   │   │   ├── casos/           # radicación, consulta, estado, cierre
│   │   │   ├── historial/       # inserciones append-only, timeline
│   │   │   ├── reportes/        # métricas agrupadas
│   │   │   └── integraciones/   # clientes HTTP CRM-X/SALES-X/LOGISTI-X
│   │   ├── app.ts
│   │   └── server.ts
│   ├── tests/               # jest + supertest
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── portals/
│   │   │   ├── cliente/     # radicar, listar propios, ver respuesta
│   │   │   └── agente/      # dashboard, grilla, asignar, transicionar, cerrar
│   │   ├── admin/           # gestión de responsables
│   │   ├── api/             # cliente axios (camelCase)
│   │   └── auth/            # contexto JWT, rutas protegidas por rol
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml        # postgres + backend + frontend
└── .env.example
```

## Modelo de datos (Prisma)

Prisma resuelve de forma nativa la regla "columnas `snake_case` / payload `camelCase`": los campos del modelo se declaran en camelCase y se mapean a la columna real con `@map`, y la tabla con `@@map`. No hace falta una capa manual de traducción.

```prisma
model Caso {
  casoId          String   @id @default(uuid()) @map("caso_id") @db.Uuid
  clienteId       String   @map("cliente_id") @db.Uuid
  pedidoId        String?  @map("pedido_id") @db.Uuid
  despachoId      String?  @map("despacho_id") @db.Uuid
  tipoSolicitud   String   @map("tipo_solicitud") @db.VarChar(50)
  descripcion     String
  estadoAtencion  String   @default("Radicado") @map("estado_atencion") @db.VarChar(50)
  responsableId   String?  @map("responsable_id") @db.Uuid
  fechaCreacion   DateTime @default(now()) @map("fecha_creacion") @db.Timestamptz
  responsable     Responsable?      @relation(fields: [responsableId], references: [responsableId])
  historial       HistorialAtencion[]
  @@map("caso")
}

model HistorialAtencion {
  historialId    String   @id @default(uuid()) @map("historial_id") @db.Uuid
  casoId         String   @map("caso_id") @db.Uuid
  accion         String   @db.VarChar(100)
  estadoNuevo    String   @map("estado_nuevo") @db.VarChar(50)
  observacion    String
  usuarioId      String   @map("usuario_id") @db.Uuid
  fechaRegistro  DateTime @default(now()) @map("fecha_registro") @db.Timestamptz
  caso           Caso     @relation(fields: [casoId], references: [casoId])
  @@map("historial_atencion")
}

model Responsable {
  responsableId  String   @id @default(uuid()) @map("responsable_id") @db.Uuid
  email          String   @unique @db.VarChar(150)
  passwordHash   String   @map("password_hash") @db.VarChar(255)
  rol            String   @db.VarChar(50)   // Agente | Administrador
  activo         Boolean  @default(true)
  casos          Caso[]
  @@map("responsable")
}
```

**Regla append-only de `historial_atencion` (RN-04 / sección 4.2 del SDD):** se aplica a nivel de base de datos con una migración SQL adicional (no expresable en `schema.prisma`) que crea un trigger `BEFORE UPDATE OR DELETE` sobre `historial_atencion` que lanza `RAISE EXCEPTION`. Se agrega como migración manual de Prisma (`prisma migrate dev --create-only` + SQL a mano).

## Diseño de API (Express + TypeScript)

Middlewares transversales:
- `auth.jwt.ts`: valida `Authorization: Bearer <token>`, decodifica `{ usuarioId, rol }`.
- `roles.guard.ts`: `requireRole('Cliente' | 'Agente' | 'Administrador')`.
- `error.handler.ts`: mapea errores de dominio a códigos HTTP (400/403/404).

Endpoints (todos bajo `/api/v1`):

| Método | Ruta | Rol | Función |
|---|---|---|---|
| POST | `/auth/login` | público | login responsable → JWT |
| POST | `/responsables` | Administrador | crear agente/admin (bcrypt, salt 10) |
| GET | `/responsables` | Administrador | listar responsables activos |
| POST | `/casos` | Cliente | radicar PQRS (4.1) → inserta `caso` + primer `historial_atencion` (RN-04) |
| GET | `/casos?clienteId=` | Cliente/Agente | listar (cliente solo ve lo propio — filtrado por JWT) |
| GET | `/casos/:casoId` | Cliente/Agente | detalle + timeline de historial |
| PATCH | `/casos/:casoId/asignacion` | Agente/Admin | asignar responsable (obliga responsable antes de operar) |
| PATCH | `/casos/:casoId/estado` | Agente | cambio de estado + observación obligatoria → historial |
| POST | `/casos/:casoId/respuesta` | Agente | respuesta oficial → historial (`accion='RespuestaOficial'`) |
| PATCH | `/casos/:casoId/cierre` | Agente | cierre; **RN-03**: rechaza 400 si no hay `RespuestaOficial` previa en historial; bloquea ediciones posteriores |
| GET | `/reportes/resumen` | Agente/Admin | métricas agrupadas por `tipoSolicitud` y `estadoAtencion` |

Contratos de request/response siguen exactamente los ejemplos de la sección 5 del SDD.

## Integraciones externas (sección 6 del SDD)

Módulo `modules/integraciones/`:
- `crmClient.ts`, `salesClient.ts`, `logistiClient.ts`: wrappers `axios` con `timeout` corto (ej. 2s).
- Circuit breaker con `opossum` (ligero, estándar en Node) envolviendo cada llamada — si el servicio externo falla o se cae, SERVI-X sigue operando localmente (tolerancia a fallos exigida en el SDD §1) y el dato externo simplemente no se muestra (no bloquea el flujo de PQRS).
- Se consumen solo para enriquecer la vista de detalle del Agente (GET `/casos/:casoId`), nunca de forma bloqueante para las operaciones propias de SERVI-X.

## Seguridad

- `bcrypt` salt rounds = 10 para `password_hash`.
- JWT firma con secreto de entorno (`JWT_SECRET`), payload `{ usuarioId, rol }`, expiración configurable.
- Timestamps `TIMESTAMPTZ` en UTC estricto (Prisma + Postgres lo garantizan si el server corre en UTC — se fija `TZ=UTC` en Docker).

## Frontend (React + Vite)

- `auth/`: contexto de sesión (JWT en memoria/localStorage), rutas protegidas por rol (`RequireRole`).
- `portals/cliente/`: formulario de radicación (tipoSolicitud + descripción + pedidoId opcional), listado propio, detalle con respuesta.
- `portals/agente/`: dashboard (conteo abiertos/cerrados), grilla con filtros (clienteId, estado, tipo), vista de detalle con acciones (asignar, cambiar estado, responder, cerrar — deshabilitadas si el caso está cerrado).
- `admin/`: alta de responsables.
- `api/`: capa de acceso a datos con **dos implementaciones intercambiables** detrás de la misma interfaz (`ServiXApi`):
  - `api/mock/`: datos en memoria/fixtures + `localStorage` (fase de mockups, sin backend).
  - `api/http.ts`: axios real contra `/api/v1` (fase de implementación, con interceptor JWT).
  - Un flag de entorno (`VITE_USE_MOCK_API`) decide cuál se inyecta; los componentes solo conocen la interfaz, nunca la implementación concreta.

## Fase 0 — Mockups interactivos (antes de la implementación real)

Antes de tocar backend, se construye el frontend completo y **navegable** con datos simulados, para validar con el usuario final los flujos de la Spec Funcional (§4.1–4.5) sin esperar a tener API/DB reales.

- Alcance: las 3 pantallas de cada portal ya descritas arriba (Cliente, Agente, Admin), con navegación real (`react-router`), estados de UI reales (loading, error, deshabilitado si el caso está cerrado) y las reglas de negocio simuladas en el mock (ej. RN-03: el mock también rechaza el cierre sin respuesta previa, para que el flujo se sienta idéntico al final).
- `api/mock/fixtures.ts`: casos, responsables e historial de ejemplo cubriendo cada `tipoSolicitud` y `estadoAtencion`.
- `api/mock/mockApi.ts`: implementa `ServiXApi` operando en memoria (persistida en `localStorage` para sobrevivir refresh), incluyendo la validación RN-03 y la inserción automática en historial (RN-04).
- Sin JWT real: login mock que solo valida contra la lista de `responsable` fixture y guarda el rol en sesión.
- Entregable de esta fase: demo clickeable end-to-end (crear PQRS como Cliente → login Agente → asignar → cambiar estado → responder → cerrar → Cliente ve la respuesta) corriendo con `npm run dev`, sin Docker ni Postgres.
- Al pasar a la Fase 1 (implementación real), solo se escribe `api/http.ts` y se cambia el flag — no se reescribe UI.

## Docker

- `docker-compose.yml`: servicio `postgres:15`, `backend` (Node 20, expone API, corre migraciones al iniciar), `frontend` (Vite build servido o dev server), red interna compartida.
- `.env.example` con `DATABASE_URL`, `JWT_SECRET`, `PORT`, `TZ=UTC`.

## Plan de ramas (siguiendo el flujo acordado)

Cada punto es una rama `feature/*` creada desde `dev`, con merge a `dev` y luego a `main` solo tras aprobación explícita. **Fase 0 primero (mockups), Fase 1 después (implementación real):**

**Fase 0 — Mockups interactivos**

0. `feature/mockups-interactivos` — scaffold `/frontend` (Vite+React+router), los 3 portales completos con `api/mock/` (fixtures + reglas RN-03/RN-04 simuladas), login mock por rol. Sin backend, sin Docker. Entregable: demo clickeable completa para validar con el usuario.

**Fase 1 — Implementación real**

1. `feature/backend-scaffold` — estructura `/backend`, `schema.prisma`, migraciones (incluida la del trigger append-only), Docker + docker-compose + `.env.example`.
2. `feature/auth-responsables` — login JWT, CRUD de `responsable`, bcrypt, middlewares `auth.jwt`/`roles.guard`.
3. `feature/casos-core` — radicación (`POST /casos`), listado/detalle (`GET /casos`, `GET /casos/:id`), inserción automática en historial al crear (RN-04).
4. `feature/casos-gestion` — asignación, cambio de estado, respuesta oficial, cierre con validación RN-03.
5. `feature/integraciones-externas` — clientes HTTP CRM-X/SALES-X/LOGISTI-X con timeout + circuit breaker.
6. `feature/reportes` — endpoint de métricas agrupadas.
7. `feature/frontend-conectar-api` — se implementa `api/http.ts`, se apaga el flag de mock, se cablea JWT real; la UI de la Fase 0 no se reescribe.

## Verificación end-to-end

- **Fase 0 (mockups):** `npm run dev` en `/frontend` con `VITE_USE_MOCK_API=true`. Flujo manual: radicar como Cliente → login Agente → asignar → cambiar estado → intentar cerrar sin respuesta (debe bloquearlo el mock) → responder → cerrar → Cliente ve la respuesta. Todo sin Docker/Postgres.
- **Fase 1 (real):** `docker-compose up` levanta Postgres + backend + frontend.
- `npx prisma migrate dev` aplica schema + trigger append-only; verificar manualmente con un `UPDATE historial_atencion ...` que la DB lo rechace.
- Backend: `npm test` (jest + supertest) cubriendo el flujo crítico: crear caso → asignar → cambiar estado → intentar cerrar sin respuesta (debe dar 400 con el mensaje del SDD §5.3) → responder → cerrar (200) → intentar reabrir/editar (debe fallar).
- Frontend: flujo manual en navegador — radicar como Cliente, iniciar sesión como Agente, gestionar el caso hasta cierre, confirmar que el Cliente ve la respuesta final.
