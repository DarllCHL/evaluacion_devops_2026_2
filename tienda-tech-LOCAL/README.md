# Tienda productos Tecnologicos

Aplicación de ejemplo en 3 capas usando Docker y Docker Compose:

- Frontend: HTML + JavaScript (Nginx)
- Backend: Node.js + Express
- Base de datos: MySQL

## Requisitos

- Docker Desktop instalado

## Estructura del proyecto

tienda-tech-LOCAL
├── docker-compose.yml
├── tienda-tech-frontend
│   ├── Dockerfile
│   ├── index.html
│   └── app.js
│   └── nginx.conf
├── tienda-tech-backend
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
└── tienda-tech-db
    └── init.sql
    └── Dockerfile

## Cómo ejecutar

1. Abrir una terminal en la carpeta del proyecto tienda-tech-LOCAL
2. Ejecutar:
```bash
docker compose build
docker compose up -d
docker ps
docker compose logs db
docker compose logs backend
docker compose logs frontend
```
3. Abrir en el navegador:
- Frontend: http://localhost:8080
- Backend (API): http://localhost:3001/api/productos

4. Para detener los contenedores:
```bash
docker compose down -v
```

5. Eliminar contenedores:
```bash
docker rm tienda-tech-backend
docker rm tienda-tech-frontend
docker rm tienda-tech-db
```

## Notas
- La base de datos se inicializa automáticamente con el script `db/init.sql` en el primer arranque.
- Puedes modificar el frontend y backend, reconstruir y volver a levantar los contenedores.




## como hacer que se levante el dockers en local (como me funciono)

cd --colocar carpeta donde esta almacenado el proyecto--

docker compose build

docker compose up -d

y ahi esta listeilor