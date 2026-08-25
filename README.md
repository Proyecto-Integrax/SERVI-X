# SERVI-X — Servicio al Cliente y PQRS

Microproyecto individual dentro de **INTEGRAX**, un conjunto de 6 microproyectos interoperables desarrollados para la asignatura Electiva Profesional II — Integración de Aplicaciones y Sistemas (Ingeniería Informática). Al finalizar, los 6 sistemas se integrarán mediante una arquitectura orientada a servicios (SOA).

## Contexto global: INTEGRAX

INTEGRAX agrupa 6 sistemas independientes que luego se integran en una plataforma empresarial común:

| Microproyecto | Dominio |
|---|---|
| CRM-X | Gestión de clientes |
| INVENTA-X | Gestión de productos e inventario |
| SALES-X | Gestión de ventas y pedidos |
| FINAN-X | Facturación y pagos |
| LOGISTI-X | Gestión de despachos y entregas |
| **SERVI-X** | **Servicio al cliente y PQRS (este repo)** |

**Periodo:** 21-ago-2026 → 18-sep-2026 (5 semanas).

### Identificadores comunes (obligatorios para integración)

| Entidad | Identificador |
|---|---|
| Cliente | `clienteId` |
| Producto | `productoId` |
| Pedido | `pedidoId` |
| Factura | `facturaId` |
| Despacho | `despachoId` |
| Caso de atención | `casoId` |

Todos los microproyectos exponen APIs REST documentadas, intercambian datos en JSON y están preparados para integrarse vía SOA.

## Descripción del microproyecto

La empresa necesita un sistema que permita gestionar de manera organizada las solicitudes, peticiones, quejas, reclamos y sugerencias (PQRS) presentadas por sus clientes. Actualmente estas solicitudes se gestionan mediante correos y mensajes dispersos, dificultando su seguimiento.

SERVI-X administra los casos de atención y garantiza la trazabilidad de cada solicitud, consumiendo/exponiendo servicios hacia los demás microproyectos de INTEGRAX (en particular CRM-X para clientes, SALES-X para pedidos y LOGISTI-X para despachos).

## Requerimientos funcionales

| ID | Descripción |
|---|---|
| RF-01 | Registrar PQRS |
| RF-02 | Clasificar solicitudes |
| RF-03 | Asignar responsables |
| RF-04 | Consultar solicitudes |
| RF-05 | Actualizar estado de atención |
| RF-06 | Registrar respuestas |
| RF-07 | Cerrar casos |
| RF-08 | Consultar historial de atención |
| RF-09 | Buscar solicitudes por cliente |
| RF-10 | Generar reportes de gestión |
| RF-11 | Consultar información asociada a pedidos y despachos |
| RF-12 | Exponer servicios para integración empresarial |

## Requerimientos no funcionales

| ID | Descripción |
|---|---|
| RNF-01 | Disponibilidad mínima del 95% |
| RNF-02 | Tiempo de respuesta inferior a 3 segundos |
| RNF-03 | Interfaz amigable y responsiva |
| RNF-04 | Seguridad basada en autenticación y roles |
| RNF-05 | Registro histórico de actuaciones |
| RNF-06 | Arquitectura REST |
| RNF-07 | Compatibilidad con dispositivos móviles |
| RNF-08 | Escalabilidad para crecimiento de casos |

## Cronograma

| Semana | Fecha de cierre | Actividad | Resultado esperado |
|---|---|---|---|
| 1 | 21-ago-2026 | Análisis del problema, contexto, alcance y requisitos | Descripción y requisitos definidos |
| 2 | 28-ago-2026 | Modelado de la solución | Casos de uso, modelo de datos, UML |
| 3 | 04-sep-2026 | Diseño de arquitectura e interfaces de integración | Arquitectura, servicios/API, contratos de datos |
| 4 | 11-sep-2026 | Implementación y pruebas del núcleo funcional | Versión funcional + pruebas iniciales |
| 5 | 18-sep-2026 | Finalización, documentación y demostración | Microproyecto terminado, API documentada |

## Diagramas

_Pendiente: exportar desde draw.io (PNG/SVG + XML fuente) y añadir aquí._

## Flujo de trabajo Git

- `main`: rama estable, solo recibe merges de `dev` aprobados.
- `dev`: rama de integración del microproyecto.
- `feature/<nombre>`: una rama por funcionalidad, creada desde `dev`.

Flujo: `feature/*` → PR/merge a `dev` (requiere aprobación) → merge a `main` (requiere aprobación). Ningún merge a `dev` o `main` se ejecuta sin visto bueno explícito.

## Estado actual

Semana 1 — análisis y documentación inicial.
