# Especificación Técnica de Software (SDD): Módulo SERVI-X

## 1. Visión General de la Arquitectura
El módulo **SERVI-X** está diseñado bajo un enfoque de **Arquitectura Orientada a Servicios (SOA)**. Opera como un servicio independiente dentro del ecosistema INTEGRAX, con responsabilidades estrictamente limitadas a la gestión de PQRS. 
*   **Desacoplamiento de Datos:** SERVI-X posee su propia base de datos aislada. No comparte tablas ni vistas físicas con CRM-X, SALES-X o LOGISTI-X.
*   **Comunicación:** Las interacciones con otros módulos se realizan exclusivamente mediante peticiones HTTP/REST síncronas.
*   **Tolerancia a Fallos:** Implementa patrones de programación defensiva (*Circuit Breaker* / *Timeouts*) para garantizar que SERVI-X continúe operando localmente si los servicios externos presentan caídas.

---

## 2. Stack Tecnológico
La selección tecnológica prioriza el tipado estricto, el alto rendimiento en operaciones I/O (asíncronas) y la integridad relacional.

*   **Backend & API:** Node.js v20+ con **TypeScript**.
*   **Framework Web:** Express.js o NestJS (para enrutamiento e inyección de dependencias).
*   **Base de Datos:** PostgreSQL v15+ (Motor relacional puro).
*   **ORM / Query Builder:** Prisma ORM o TypeORM (Mapeo de entidades tipadas).
*   **Frontend:** React (SPA - Single Page Application) con Vite.
*   **Contenedores:** Docker (para empaquetar el microservicio y su base de datos en entornos aislados).

---

## 3. Estándares y Convenciones
Para asegurar la consistencia entre el código, la red y la persistencia de datos, se establecen las siguientes reglas estructurales:

1.  **Identidad (UUID v4):** Queda estrictamente prohibido el uso de enteros autoincrementales (`SERIAL`, `INT`). Todas las llaves primarias (PK) y foráneas (FK) deben ser generadas como UUID v4.
2.  **Nomenclatura de Base de Datos:** Toda tabla y columna en PostgreSQL debe ser nombrada usando `snake_case` (ej. `estado_atencion`).
3.  **Nomenclatura de Red (Contratos API):** Todo *payload* JSON de entrada o salida debe ser serializado usando `camelCase` (ej. `estadoAtencion`). El backend se encargará del mapeo entre ambas nomenclaturas.
4.  **Husos Horarios:** Todas las estampas de tiempo (`TIMESTAMP`) se almacenarán en formato UTC estricto (ISO 8601).

---

## 4. Modelo de Datos Físico (Esquema PostgreSQL)

El esquema garantiza la integridad referencial interna y la inmutabilidad de la auditoría.

### 4.1. Tabla: `caso`
| Columna | Tipo de Dato | Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `caso_id` | `UUID` | PK, Default `uuid_generate_v4()` | Identificador universal del caso. |
| `cliente_id` | `UUID` | NOT NULL, Index | Llave foránea lógica (Vía CRM-X). |
| `pedido_id` | `UUID` | NULL | Llave foránea lógica (Vía SALES-X). |
| `despacho_id` | `UUID` | NULL | Llave foránea lógica (Vía LOGISTI-X). |
| `tipo_solicitud` | `VARCHAR(50)` | NOT NULL | Enum: Peticion, Queja, Reclamo, Sugerencia. |
| `descripcion` | `TEXT` | NOT NULL | Texto original ingresado por el cliente. |
| `estado_atencion` | `VARCHAR(50)` | NOT NULL, Default 'Radicado' | Estado operativo actual. |
| `responsable_id` | `UUID` | NULL, FK | Relación con la tabla `responsable`. |
| `fecha_creacion` | `TIMESTAMPTZ` | NOT NULL, Default `NOW()` | Fecha de radicación. |

### 4.2. Tabla: `historial_atencion`
**Regla Estructural:** Esta tabla es *Append-Only* (Solo Inserción). Se deniegan privilegios de `UPDATE` y `DELETE` a nivel de base de datos.

| Columna | Tipo de Dato | Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `historial_id` | `UUID` | PK | Identificador del registro. |
| `caso_id` | `UUID` | NOT NULL, FK, Index | Relación con la tabla `caso`. |
| `accion` | `VARCHAR(100)`| NOT NULL | Tipo de evento (ej. 'Asignacion', 'CambioEstado'). |
| `estado_nuevo` | `VARCHAR(50)` | NOT NULL | Estado posterior al evento. |
| `observacion` | `TEXT` | NOT NULL | Justificación del agente o respuesta oficial. |
| `usuario_id` | `UUID` | NOT NULL | ID del Agente o Cliente que disparó la acción. |
| `fecha_registro` | `TIMESTAMPTZ` | NOT NULL, Default `NOW()` | Estampa de tiempo inmutable. |

### 4.3. Tabla: `responsable`
| Columna | Tipo de Dato | Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `responsable_id` | `UUID` | PK | Identificador del Agente. |
| `email` | `VARCHAR(150)`| NOT NULL, UNIQUE | Credencial de acceso corporativo. |
| `password_hash` | `VARCHAR(255)`| NOT NULL | Contraseña encriptada (bcrypt). |
| `rol` | `VARCHAR(50)` | NOT NULL | Enum: Agente, Administrador. |
| `activo` | `BOOLEAN` | NOT NULL, Default `TRUE` | Estado lógico del operador. |

---

## 5. Diseño de API REST (Endpoints Principales)

El controlador tipado en TypeScript expondrá los siguientes recursos.

### 5.1. Radicar Caso (Vista Cliente)
*   **Ruta:** `POST /api/v1/casos`
*   **Auth:** JWT (Rol: Cliente)
*   **Payload Esperado (Body):**
    ```json
    {
      "tipoSolicitud": "Queja",
      "descripcion": "El producto llegó incompleto.",
      "pedidoId": "d290f1ee-6c54-4b01-90e6-d701748f0851" // Opcional
    }
    ```
*   **Comportamiento:** Inserta en `caso` y dispara un *trigger* (o evento en el servicio) para insertar simultáneamente la creación en `historial_atencion`.
*   **Respuesta Exitosa:** `201 Created`

### 5.2. Actualizar Estado (Gestión Operativa)
*   **Ruta:** `PATCH /api/v1/casos/:casoId/estado`
*   **Auth:** JWT (Rol: Agente/Administrador)
*   **Payload Esperado (Body):**
    ```json
    {
      "estadoAtencion": "En Proceso",
      "observacion": "Se inicia revisión con el operador logístico."
    }
    ```
*   **Comportamiento:** Actualiza el campo `estado_atencion` en la tabla `caso` e inserta obligatoriamente el registro en `historial_atencion`.
*   **Respuesta Exitosa:** `200 OK`

### 5.3. Cierre de Caso (Regla de Negocio RN-03)
*   **Ruta:** `PATCH /api/v1/casos/:casoId/cierre`
*   **Auth:** JWT (Rol: Agente)
*   **Comportamiento:** El backend consultará si existe un registro de "Respuesta Oficial" previo en el historial. Si no existe, abortará la transacción.
*   **Respuesta de Error:** `400 Bad Request` - `{"error": "No se puede cerrar un caso sin emitir una respuesta oficial."}`

---

## 6. Contratos de Integración Externa (Consumo SOA A FUTURO)

El módulo SERVI-X actuará como **Cliente HTTP** para enriquecer su contexto.

### 6.1. Integración con CRM-X (Validación de Cliente)
*   **Evento:** Ejecutado en segundo plano al cargar el perfil del caso.
*   **Endpoint Consumido:** `GET https://crm-x.integrax.local/api/clientes/:clienteId`
*   **Contrato de Salida (Lo que SERVI-X exige recibir):**
    ```json
    {
      "clienteId": "uuid",
      "nombreCompleto": "string",
      "email": "string",
      "telefono": "string"
    }
    ```

### 6.2. Integración con SALES-X (Contexto de Pedido)
*   **Endpoint Consumido:** `GET https://sales-x.integrax.local/api/pedidos/:pedidoId`
*   **Contrato de Salida Exigido:**
    ```json
    {
      "pedidoId": "uuid",
      "fechaCompra": "timestamp",
      "montoTotal": "number",
      "estadoPago": "string"
    }
    ```

### 6.3. Integración con LOGISTI-X (Contexto de Despacho)
*   **Endpoint Consumido:** `GET https://logisti-x.integrax.local/api/despachos/:despachoId`
*   **Contrato de Salida Exigido:**
    ```json
    {
      "despachoId": "uuid",
      "transportadora": "string",
      "estadoEntrega": "string",
      "fechaEstimada": "timestamp"
    }
    ```

---

## 7. Políticas de Seguridad y Autenticación
*   **Hashing de Contraseñas:** Las contraseñas de los Agentes nunca se almacenan en texto plano. Se utilizará el algoritmo `bcrypt` con un *salt round* mínimo de 10.
*   **JSON Web Tokens (JWT):** El token JWT incluirá el `uuid` del usuario y su `rol`.