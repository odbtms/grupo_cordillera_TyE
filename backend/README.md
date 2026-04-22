# Plataforma de Monitoreo Inteligente - Grupo Cordillera (Backend)

Este repositorio contiene la arquitectura de microservicios backend desarrollada en **Spring Boot (Java 17)** para solventar la fragmentación de datos operativos del Grupo Cordillera, implementando estándares empresariales de orquestación mediante **Docker y Docker Compose**.

---

## 🏗️ Visión Arquitectónica

El sistema fue diseñado utilizando el patrón arquitectónico de **Microservicios**, separando responsabilidades lógicas en módulos independientes, pero manteniendo una alta cohesión a nivel de orquestación.

### Justificación de Bases de Datos (El Modelo de 3 BD)
Aunque la teoría estricta sugiere *Database-per-service* (4 BDs para 4 microservicios), en el contexto de Grupo Cordillera se optó por una **Arquitectura de Base de Datos Compartida** para el área de consolidación de datos (Data Warehouse approach), resultando en **3 bases de datos**:
1. `ms_datos`: Base de datos de consolidación masiva. Es compartida por el módulo de Ingesta (escritura) y el Motor de KPIs (lectura/cálculo). Esto evita el colapso de red que implicaría transferir millones de registros vía API entre microservicios.
2. `ms_reportes`: Base de datos exclusiva para persistir configuraciones y plantillas de reportería.
3. `ms_auth`: Base de datos exclusiva para almacenar credenciales y roles con alta seguridad.

---

## 🧩 Diccionario de Microservicios y Endpoints

Cada microservicio se despliega en un puerto interno único para evitar colisiones y expone su propio grupo de operaciones RESTful.

### 1. Gestión de Datos Organizacionales (`ms-datos`) - Puerto 8081
Encargado de la ingesta centralizada desde los 5 sistemas legados del Grupo Cordillera.
- `POST /api/ventas/registrar`: Ingesta un nuevo registro de venta (Añade fecha automática).
- `GET /api/ventas`: Lista todos los registros ingestados.

### 2. Motor de KPIs (`ms-kpis`) - Puerto 8082
Lee información en crudo desde la BD consolidada y ejecuta el motor matemático de los indicadores clave.
- `GET /api/kpis`: Retorna los indicadores pre-calculados.
- `PUT /api/kpis/{id}/formula`: Actualiza la fórmula matemática de un indicador específico.

### 3. Visualización de Reportes (`ms-reportes`) - Puerto 8083
Responsable del formato visual que consumirá el Frontend (BFF).
- `POST /api/reportes/plantillas`: Genera una nueva plantilla de dashboard.
- `DELETE /api/reportes/plantillas/{id}`: Ejecuta un borrado lógico (cambio de estado a Inactivo) de un reporte.

### 4. Seguridad y Autenticación (`ms-auth`) - Puerto 8084
Gobierna el control de acceso basado en roles (RBAC) simulando la emisión de tokens JWT.
- `POST /api/auth/login`: Valida credenciales y genera Token JWT.
- `GET /api/auth/validar`: Verifica la vigencia de un token.
- `PUT /api/auth/usuarios/{id}/rol`: Modifica el privilegio de un usuario en el sistema.

---

## 🐳 Guía de Despliegue Local (Docker)

El proyecto utiliza una estrategia avanzada de **Multi-stage Build** en Docker. Esto significa que **NO requieres tener Java o Maven configurado en tu máquina local para compilarlo**. Docker descarga las dependencias, empaqueta el código fuente y lo expone a la red de forma automatizada.

Además, la base de datos `db_postgres` cuenta con un **Healthcheck**, garantizando que los microservicios esperen a que PostgreSQL esté 100% saludable antes de intentar conectarse.

### Instrucciones:
1. Asegúrate de tener **Docker Engine** en ejecución.
2. Abre una terminal en este directorio (`/backend`).
3. Ejecuta el comando mágico de orquestación:
   ```bash
   docker-compose up --build -d
   ```
4. El sistema levantará 5 contenedores interconectados (`db_postgres`, `ms-datos`, `ms-kpis`, `ms-reportes`, `ms-auth`).

Para apagar todo el ecosistema de forma segura y liberar la red, simplemente ejecuta:
```bash
docker-compose down
```
