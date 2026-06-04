# MediaTracker Personal

Aplicacion web personal para gestionar series, novelas ligeras, peliculas y mangas desde una interfaz de escritorio.

## Enfoque del proyecto

- Uso personal en computador.
- Ejecucion con Docker.
- Backend con FastAPI y SQLite.
- Frontend estatico con React via CDN, servido por Nginx.

## Requisitos

- Docker
- Docker Compose

## Ejecutar con Docker

```bash
docker compose up --build
```

Luego abre:

- Frontend: http://localhost:8080
- API: http://localhost:8000/docs

La base de datos se guarda en el volumen `mediatracker-data`.

## Ejecutar pruebas

```bash
docker compose run --rm backend pytest
```

## Estructura

```text
backend/
  app/
    main.py
  tests/
    test_main.py
  Dockerfile
  requirements.txt
frontend/
  index.html
  series.html
  novelas.html
  peliculas.html
  mangas.html
  styles.css
  dashboard.css
  series.css
  novelas.css
  peliculas.css
  mangas.css
  app.jsx
  Dockerfile
  nginx.conf
docker-compose.yml
```

## Funcionalidades

- UI principal de escritorio con resumen general.
- Vistas separadas para series, novelas ligeras, peliculas y mangas.
- CRUD para series, novelas ligeras, peliculas y mangas.
- Filtro por titulo y estado dentro de cada vista.
- Campo opcional de correo en los registros.
- Campos de capitulos para novelas y mangas; paginas para novelas.
- Validaciones de estados, capitulos, paginas y anio de pelicula.
- Confirmacion antes de eliminar registros.

## Notas de interfaz

La interfaz esta enfocada en computador. Usa un menu lateral fijo, una vista principal de resumen y una pantalla independiente por categoria con listado y formulario lateral.

El frontend esta separado en:

- `index.html`: panel principal.
- `series.html`, `novelas.html`, `peliculas.html`, `mangas.html`: paginas HTML separadas por categoria.
- `styles.css`: estilos base compartidos.
- `dashboard.css` y los CSS por categoria: estilos especificos de cada pantalla.
- `app.jsx`: logica React compartida, vistas y componentes.

## Capacidad esperada de SQLite

SQLite es suficiente para esta aplicacion personal. El limite practico dependera del disco, memoria, indices y patron de uso, pero para registros de entretenimiento como estos puede manejar cientos de miles o millones de filas sin problema si las consultas estan bien indexadas.

Referencias utiles:

- Limite teorico de archivo SQLite: hasta aproximadamente 281 TB con configuracion maxima de paginas.
- Maximo de paginas por base: 4,294,967,294 paginas.
- En una app personal, el limite real sera el almacenamiento disponible y el rendimiento de busquedas/listados, no la cantidad de registros.
