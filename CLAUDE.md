# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

**Grupo Cordillera** is a business intelligence platform built as a **microservices architecture** with the following key components:

### Backend: Microservices (Spring Boot 3.3.0 + Java 17)
Five independent Spring Boot services connected to a shared/dedicated PostgreSQL database on AWS RDS:

1. **ms-datos** (Port 8081): Data ingestion service
   - Handles centralized ingestion from legacy systems
   - Endpoints: `POST /api/ventas/registrar`, `GET /api/ventas`, `GET /api/ventas/sucursal/{sucursal}`
   - Also manages stock tracking
   - Uses Spring Data JPA + PostgreSQL (db_datos)

2. **ms-kpis** (Port 8082): KPI calculation engine
   - Reads consolidated data and computes key performance indicators
   - Endpoints: `GET /api/kpis`, `PUT /api/kpis/{id}/formula`
   - Shares db_datos with ms-datos (intentional to avoid network overhead)
   - Uses Spring Data JPA + PostgreSQL (db_datos)

3. **ms-reportes** (Port 8083): Report templating service
   - Manages dashboard configurations and report templates
   - Endpoints: `POST /api/reportes/plantillas`, `DELETE /api/reportes/plantillas/{id}`
   - Uses Spring Data JPA + PostgreSQL (db_reporte)

4. **ms-auth** (Port 8084): Authentication & RBAC service
   - JWT token generation and validation
   - Role-based access control (ADMIN, EMPLEADO_TIENDA)
   - Endpoints: `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/validar`, `PUT /api/auth/usuarios/{id}/rol`
   - Uses JJWT (0.11.5), Spring Security, bcrypt
   - Uses Spring Data JPA + PostgreSQL (db_autenticacion)

5. **ms-bff** (Port 8085/8080): Backend For Frontend (API Gateway)
   - Spring Cloud Gateway for routing requests to microservices
   - Single entry point for React frontend

### Frontend: React + TypeScript + Vite
- **Framework**: React 19.2.5 with TypeScript
- **Build**: Vite 8.0.9 with React Compiler enabled
- **Charts**: Recharts 3.8.1
- **HTTP**: Axios 1.15.2
- **Testing**: Vitest 3.2.2 + React Testing Library
- **Linting**: ESLint with TypeScript

Pages: DashboardPrincipalPage, ReportesPage, GestionOrganizacionalPage, ConfiguracionAuditoriaPage, LoginPage, AdminLayout

Session: Token, rol, usuario, sucursal stored in sessionStorage.

### Database Architecture
Three PostgreSQL databases (AWS RDS):
- **bd_datos**: Shared by ms-datos (writes) and ms-kpis (reads) to avoid network overhead
- **bd_reporte**: Exclusive to ms-reportes
- **bd_autenticacion**: Exclusive to ms-auth

Endpoint: `bd-grupo-cordillera.cfyh1qtodg3d.us-east-1.rds.amazonaws.com`

### Deployment
- **Containerization**: Docker multi-stage builds
- **Orchestration**: Docker Compose (5 backend services + frontend)
- **Frontend**: Nginx (Alpine) reverse proxy
- **Ports**: Frontend on 80, BFF on 8080, individual services on 8081-8084

## Development Setup

### Prerequisites
- Docker & Docker Compose
- Maven 3.8+
- Node.js 20+
- Java 17 JDK

## Building & Running

### Full Stack (Docker)
```
cd backend
docker-compose up --build -d
docker-compose down
```

Services accessible at:
- ms-datos: http://localhost:8081
- ms-kpis: http://localhost:8082
- ms-reportes: http://localhost:8083
- ms-auth: http://localhost:8084
- ms-bff: http://localhost:8080
- frontend: http://localhost:80

### Backend (Individual Service)
From `backend/ms-{service}` directory:
```
mvn clean package      # Build
mvn spring-boot:run    # Run (uses RDS via application.properties)
mvn test               # Tests
mvn dependency:go-offline  # Download deps
```

### Frontend
```
cd frontend
npm install            # Install
npm run dev            # Dev server (http://localhost:5173)
npm run build          # Production build
npm run preview        # Preview production
npm run lint           # Lint
npm test               # Tests
npm test -- src/...    # Specific tests
```

Frontend uses VITE_API_BASE env var (default in .env: http://34.193.206.58:8080).

## Code Structure

### Backend Service Pattern
Each service: `src/main/java/com/grupocordillera/{service}/`
- `controller/`: REST endpoints
- `model/`: JPA entities
- `repository/`: Spring Data JPA repos
- `service/`: Business logic
- `dto/`: Data transfer objects
- `Application.java`: Spring Boot entry point

### Frontend Structure
```
frontend/src/
├── api/       # Axios client
├── assets/    # Static files
├── components/# Reusable components
├── constants/ # App constants
├── features/  # Feature logic
├── layouts/   # Layout components
├── pages/     # Full pages
├── test/      # Test setup
├── types/     # TypeScript types
├── utils/     # Utilities
├── App.tsx    # Main routing & session
├── main.tsx   # Entry point
└── index.css  # Styles
```

## Key Implementation Details

### Authentication & Authorization
- JWT tokens from ms-auth (expiration: 30 minutes default)
- Secret: `grupocordillera123tokendeseguridadparalaweb`
- Roles: ADMIN, EMPLEADO_TIENDA
- Frontend validates token via `/api/auth/validar` on app load
- Passwords hashed with bcrypt

### Data Ingestion Flow
1. Frontend sends sale data to ms-bff
2. ms-bff routes to ms-datos
3. ms-datos validates: date (within 6 months), amount (non-negative), branch exists, stock sufficient
4. Stock auto-decrements on valid sale
5. ms-kpis reads from db_datos to recalculate metrics

### Frontend Session Management
- Token/role/user/branch in sessionStorage (session-scoped)
- App.tsx checks on load; redirects to LoginPage if missing
- Hash routing (#dashboard, #reportes, etc.)

### Configuration & Secrets
**SECURITY WARNING**: AWS RDS credentials, JWT secret, API endpoints currently hardcoded in:
- `backend/ms-*/src/main/resources/application.properties`
- `frontend/.env`

Production should use environment variables or secrets management.

## Testing

### Backend
```
cd backend/ms-{service}
mvn test                              # All tests
mvn test -Dtest=VentaControllerTest   # Single class
mvn test -Dtest=VentaControllerTest#test  # Single method
```

### Frontend
```
cd frontend
npm test                  # Watch mode
npm test -- --run         # Single run
npm test -- src/...       # Specific directory
npm test -- --reporter=verbose
```

## Linting & Code Quality

### Frontend
```
npm run lint        # Check all files
npx eslint src/ --fix  # Auto-fix
```

ESLint config in eslint.config.js (flat format) with React compiler preset.

## CI/CD
GitHub Actions workflow in `.github/workflows/deploy.yml` handles automated AWS deployment.

## Known Constraints & Design Decisions

1. **Shared database (db_datos)**: ms-datos writes, ms-kpis reads same database to avoid network latency
2. **Multi-stage Docker**: Services compile inside Docker, no Maven/Java needed on host
3. **HikariCP pool**: Limited to 3 connections (AWS RDS t3.micro); adjust if scaling
4. **React Compiler**: Enabled; may impact build times but optimizes renders
5. **SessionStorage only**: Session-scoped security model (not localStorage)

## Common Development Workflows

### Adding a New Endpoint
1. Create JPA entity in model/ if needed
2. Create repository extending JpaRepository
3. Add controller method with @PostMapping/@GetMapping/etc.
4. Test via `mvn test` or direct service port
5. Add route in ms-bff if needed

### Adding a New React Page
1. Create component in pages/
2. Add type to PaginaSistema union in App.tsx
3. Add routing case in App.tsx
4. Import and render in switch statement
5. Test via `npm run dev`

### Debugging RDS Issues
- Check application.properties for endpoint and credentials
- Verify AWS RDS security group allows port 5432 from your IP
- Test: `psql -h <endpoint> -U <user> -d <database>`
