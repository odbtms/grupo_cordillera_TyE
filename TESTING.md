# Pruebas unitarias y cobertura — Grupo Cordillera

Este documento explica cómo correr las pruebas unitarias y generar los reportes de
**cobertura** (qué porcentaje del código está cubierto por tests) en cada microservicio
y en el frontend.

## Resultados actuales

Backend — **72+ pruebas**, todas en verde (Mockito, sin DB):

| Servicio | Tests | Cobertura (lógica de negocio) |
|----------|------:|------------------------------:|
| ms-auth | 26 | ~90% |
| ms-datos | 34 | ~93% |
| ms-kpis | 9 | 100% |
| ms-reportes | 5 | 100% |

Frontend — **32 pruebas** (Vitest), cobertura global ~81% de la lógica medida
(`utils` y `features` al 100%).

> La cobertura del backend excluye las entidades Lombok (`model/`), la clase
> `Application` y los inicializadores de datos, porque son código autogenerado o de
> arranque sin lógica que valga la pena testear unitariamente.

## Backend (JaCoCo)

Cada microservicio con lógica de negocio tiene configurado el plugin **JaCoCo**, que
genera un reporte HTML navegable tras correr los tests.

Servicios con tests + cobertura: `ms-auth`, `ms-datos`, `ms-kpis`, `ms-reportes`.
(`ms-bff` es solo el API Gateway, no tiene lógica propia que testear.)

### Correr tests + cobertura de un servicio

Desde la carpeta del servicio (ej. `backend/ms-auth`):

```
.\mvnw.cmd test        # Windows
./mvnw test            # Linux/Mac
```

### Ver el reporte de cobertura

Tras correr `test`, se genera:

```
backend/<servicio>/target/site/jacoco/index.html
```

Abre ese archivo en el navegador. Verás el porcentaje de líneas y ramas cubiertas por
paquete y por clase (controllers, services, etc.).

### Correr los 4 servicios de una vez (PowerShell)

```powershell
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot"
foreach ($s in "ms-auth","ms-datos","ms-kpis","ms-reportes") {
  Set-Location "C:\Users\tomas\grupo_cordillera_TyE\backend\$s"
  .\mvnw.cmd test
}
```

### Qué cubren los tests del backend

| Servicio | Clases de test | Cubre |
|----------|----------------|-------|
| ms-auth | `AuthControllerTest`, `JwtServiceTest` | login, registro (validaciones + duplicados), validación de token, gestión de roles, expiración/firma/issuer de JWT |
| ms-datos | `VentaControllerTest`, `StockControllerTest`, `SucursalControllerTest` | reglas de venta (fecha 6 meses, monto, sucursal, stock), upsert de stock, CRUD de sucursales con propagación de renombrado |
| ms-kpis | `KpiControllerTest`, `MetaSucursalControllerTest` | actualización de fórmulas, upsert de metas |
| ms-reportes | `ReporteControllerTest` | filtrado de plantillas inactivas/healthcheck, borrado |

Son pruebas unitarias con **Mockito** (no levantan Spring ni la base de datos), por lo que
corren rápido y no dependen de AWS RDS.

## Frontend (Vitest + v8 coverage)

### Correr tests

```
cd frontend
npm test              # modo watch
npm run test:run      # corrida única
npm run test:coverage # corrida única + reporte de cobertura
```

### Ver el reporte de cobertura

`npm run test:coverage` imprime un resumen en la terminal y genera el reporte HTML en:

```
frontend/coverage/index.html
```

La cobertura está enfocada en la lógica pura (`src/utils`, `src/features`, `src/api`).

### Qué cubren los tests del frontend

| Archivo | Cubre |
|---------|-------|
| `stockUtils.test.ts` | cálculo de stock: orden, totales por sucursal/mes, modo GENERAL, casos borde |
| `formatters.test.ts` | normalización de texto (acentos/mayúsculas) y formato de moneda CLP |
