# Tienda Productos Tecnológicos

Aplicación de ejemplo en 3 capas usando Docker y Docker Compose:

- Frontend: HTML + JavaScript (Nginx)
- Backend: Node.js + Express
- Base de datos: MySQL

**Autores:** Matías Bustos y Roberto González  
**Asignatura:** Ingeniería DevOps — DOY0101  

---

## Requisitos

- Docker Desktop instalado
- Cuenta en GitHub con acceso al repositorio
- Secrets configurados en GitHub: `SNYK_TOKEN_3`, `SONAR_TOKEN_3`

---

## Estructura del proyecto

tienda-tech-LOCAL
├── .github
│   └── workflows
│       └── main.yml        # Pipeline CI/CD
├── docker-compose.yml
├── tienda-tech-frontend
│   ├── Dockerfile
│   ├── index.html
│   ├── app.js
│   └── nginx.conf
├── tienda-tech-backend
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js
│   └── server.test.js      # Pruebas unitarias con Jest
├── tienda-tech-db
├── Dockerfile
└── init.sql

---

## Pipeline CI/CD

El pipeline está implementado en GitHub Actions y se ejecuta automáticamente en cada push a la rama `main`. Consta de 5 etapas encadenadas:
snyk-scan → test → sonar-analysis → build → deploy

### Etapa 1 — Análisis de seguridad (Snyk + npm audit)
- Ejecuta `npm audit` para revisar dependencias vulnerables
- Ejecuta `snyk test --severity-threshold=high`, que **bloquea el pipeline** si detecta vulnerabilidades de severidad alta o crítica
- Genera y sube un reporte JSON como artifact descargable

### Etapa 2 — Pruebas automatizadas (Jest)
- Levanta un servicio MySQL real mediante GitHub Actions services
- Importa el schema de la base de datos
- Ejecuta los tests unitarios del backend con Jest + Supertest
- Cubre: GET, POST, PUT, DELETE de productos, endpoint `/api/health`, validaciones y errores de DB

### Etapa 3 — Análisis de calidad (SonarCloud)
- Analiza el código fuente del backend y frontend
- Reporta code smells, duplicaciones y cobertura en SonarCloud

### Etapa 4 — Build de imágenes Docker
- Construye las imágenes de los tres servicios (backend, frontend, db)
- Guarda las imágenes como artifacts comprimidos

### Etapa 5 — Deploy (self-hosted runner)
- Se ejecuta en el runner local (Windows)
- Limpia contenedores anteriores
- Levanta los servicios con `docker compose up --build -d`
- Realiza un health check al endpoint `/api/health` para verificar que el backend esté operativo

---

## Trazabilidad y calidad

Cada ejecución del pipeline genera:
- **Reporte de Snyk** (artifact `snyk-report`) con el análisis de vulnerabilidades
- **Reporte de SonarCloud** disponible en https://sonarcloud.io
- **Artifacts de imágenes Docker** (`backend-image.tar.gz`, `frontend-image.tar.gz`)
- **Logs de cada etapa** visibles en la pestaña Actions de GitHub

Si alguna etapa falla, las siguientes no se ejecutan, garantizando que solo código seguro y probado llega a producción.

---

## Orquestación de contenedores

El archivo `docker-compose.yml` define los tres servicios:

| Servicio | Imagen | Puerto |
|----------|--------|--------|
| frontend | nginx (custom) | 8080 |
| backend | node:18-alpine | 3001 |
| db | mysql:8 | 3306 |

- La base de datos incluye **healthcheck** para garantizar que el backend solo inicie cuando MySQL esté listo
- El backend tiene `restart: on-failure` para recuperarse ante errores
- Los datos de MySQL se persisten en un volumen Docker (`dbdata`)
- Cada servicio tiene límites de recursos configurados (`deploy.resources`) para garantizar estabilidad

---

## Cómo ejecutar localmente

1. Abrir una terminal en la carpeta del proyecto:
```bash
cd tienda-tech-LOCAL
```

2. Levantar los servicios:
```bash
docker compose build
docker compose up -d
```

3. Verificar que estén corriendo:
```bash
docker ps
docker compose logs backend
docker compose logs frontend
docker compose logs db
```

4. Abrir en el navegador:
- Frontend: http://localhost:8080
- Backend (API): http://localhost:3001/api/productos
- Health check: http://localhost:3001/api/health

5. Para detener:
```bash
docker compose down -v
```

---

## Conclusiones

### Reflexión individual — Matías Bustos
*(Redactar sin apoyo de IA: aprendizaje personal y contribución al proyecto)*

### Reflexión individual — Roberto González
*(Redactar sin apoyo de IA: aprendizaje personal y contribución al proyecto)*

---

## Uso de Inteligencia Artificial

Durante el desarrollo de este proyecto se utilizó Claude (Anthropic) como herramienta de apoyo para revisión de configuraciones YAML, estructura del pipeline y documentación. Todas las decisiones técnicas, justificaciones y reflexiones son propias del equipo.

Referencia de citación: https://bibliotecas.duoc.cl/ia