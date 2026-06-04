# Especificación del sistema web: Gestión Personal de Medios de Entretenimiento

## 1. Nombre del sistema

**MediaTracker Personal — Sistema Web de Seguimiento de Series, Novelas Ligeras, Películas y Mangas**

---

## 2. Objetivo general

Desarrollar una aplicación web personal para gestionar y hacer seguimiento del consumo de medios de entretenimiento, organizados en cuatro categorías independientes: series, novelas ligeras, películas y mangas.

El sistema debe permitir:

- Crear, editar y eliminar registros en cada una de las cuatro categorías.
- Registrar el estado de consumo de cada elemento (pendiente, en progreso, completado, abandonado).
- Guardar una nota de progreso en series, novelas ligeras y mangas para recordar el capítulo, episodio o página donde se dejó la lectura o visualización.
- Filtrar y buscar registros por nombre, estado, género u otros campos relevantes.
- Operar desde escritorio y dispositivos móviles mediante interfaz responsiva.

---

## 3. Alcance del sistema

El sistema será una aplicación web de uso personal para organizar el consumo de medios.

Debe incluir:

- Frontend web responsivo.
- Base de datos local o en la nube.
- CRUD completo para cada una de las cuatro categorías.
- Campo de nota de progreso editable para series, novelas ligeras y mangas.
- Filtros por categoría, estado y nombre.
- Interfaz limpia con acceso directo a cada categoría desde el menú principal.

No se incluyen en esta primera versión:

- Sistema de usuarios o autenticación múltiple.
- Integración con APIs externas de metadatos como MyAnimeList, Spotify o TMDB.
- Recomendaciones automáticas basadas en historial.
- Notificaciones de nuevos episodios o capítulos.
- Exportación de datos a formatos externos.
- Estadísticas avanzadas de consumo.

---

## 4. Tipo de aplicación

Aplicación web personal de uso individual.

El sistema puede ejecutarse localmente en el navegador o desplegarse en un servidor personal.

Tecnologías sugeridas:

- Frontend: React o HTML + CSS + JavaScript vanilla.
- Base de datos: localStorage del navegador, IndexedDB, o SQLite local.
- Estilos: Tailwind CSS o Bootstrap.
- Opción de backend ligero: Node.js con Express y SQLite si se quiere persistencia en servidor.

Arquitectura mínima:

```text
frontend/
  src/
    components/
    pages/
      series/
      novelas/
      peliculas/
      mangas/
    utils/
    styles/
  public/
database/
docs/
```

---

# 5. Funcionalidades principales

## 5.1 Pantalla de inicio y navegación

El sistema debe mostrar una pantalla de inicio que permita al usuario acceder rápidamente a cualquiera de las cuatro categorías.

Elementos mínimos:

- Menú lateral o superior con acceso directo a cada categoría.
- Tarjeta o sección resumen por categoría mostrando la cantidad total de registros y cuántos están en progreso.
- Acceso a búsqueda global opcional.

Reglas:

- El menú debe ser visible en todo momento.
- En dispositivos móviles el menú debe poder colapsar.
- La categoría activa debe estar visualmente destacada.

---

## 5.2 Gestión de series

El usuario debe poder crear, listar, editar y eliminar registros de series.

Campos mínimos:

- ID interno.
- Título.
- Género o géneros.
- Plataforma donde se ve (Netflix, Crunchyroll, Disney+, otra, desconocida).
- Estado: pendiente, en progreso, completado, abandonado.
- Puntuación personal del 1 al 10, opcional.
- Nota de progreso (campo de texto libre para indicar temporada y episodio actual, por ejemplo: "Temporada 2, episodio 5").
- Observación general, opcional.
- Fecha de creación del registro.
- Fecha de última actualización.

Reglas:

- El título es obligatorio y debe tener entre 1 y 200 caracteres.
- El estado es obligatorio.
- La nota de progreso solo es editable cuando el estado es en progreso.
- La nota de progreso puede quedar vacía.
- Un registro eliminado no puede recuperarse.
- La puntuación, si se ingresa, debe ser un número entre 1 y 10.

---

## 5.3 Gestión de novelas ligeras

El usuario debe poder crear, listar, editar y eliminar registros de novelas ligeras.

Campos mínimos:

- ID interno.
- Título.
- Autor, opcional.
- Género o géneros.
- Estado: pendiente, en progreso, completado, abandonado.
- Puntuación personal del 1 al 10, opcional.
- Nota de progreso (campo de texto libre para indicar el volumen, capítulo o página actual, por ejemplo: "Volumen 3, capítulo 12" o "Página 247").
- Observación general, opcional.
- Fecha de creación del registro.
- Fecha de última actualización.

Reglas:

- El título es obligatorio y debe tener entre 1 y 200 caracteres.
- El estado es obligatorio.
- La nota de progreso solo es editable cuando el estado es en progreso.
- La nota de progreso puede quedar vacía.
- Un registro eliminado no puede recuperarse.
- La puntuación, si se ingresa, debe ser un número entre 1 y 10.

---

## 5.4 Gestión de películas

El usuario debe poder crear, listar, editar y eliminar registros de películas.

Campos mínimos:

- ID interno.
- Título.
- Género o géneros.
- Director, opcional.
- Año de estreno, opcional.
- Plataforma donde se vio o se verá, opcional.
- Estado: pendiente, vista, abandonada.
- Puntuación personal del 1 al 10, opcional.
- Observación general, opcional.
- Fecha de creación del registro.
- Fecha de última actualización.

Reglas:

- El título es obligatorio y debe tener entre 1 y 200 caracteres.
- El estado es obligatorio.
- El año de estreno, si se ingresa, debe ser un número de cuatro dígitos válido.
- La puntuación, si se ingresa, debe ser un número entre 1 y 10.
- Un registro eliminado no puede recuperarse.

---

## 5.5 Gestión de mangas

El usuario debe poder crear, listar, editar y eliminar registros de mangas.

Campos mínimos:

- ID interno.
- Título.
- Autor, opcional.
- Género o géneros.
- Estado: pendiente, en progreso, completado, abandonado.
- Puntuación personal del 1 al 10, opcional.
- Nota de progreso (campo de texto libre para indicar el tomo, capítulo o página actual, por ejemplo: "Capítulo 134" o "Tomo 7, capítulo 60").
- Observación general, opcional.
- Fecha de creación del registro.
- Fecha de última actualización.

Reglas:

- El título es obligatorio y debe tener entre 1 y 200 caracteres.
- El estado es obligatorio.
- La nota de progreso solo es editable cuando el estado es en progreso.
- La nota de progreso puede quedar vacía.
- Un registro eliminado no puede recuperarse.
- La puntuación, si se ingresa, debe ser un número entre 1 y 10.

---

## 5.7 Nota de progreso

La nota de progreso es un campo especial disponible únicamente en las categorías de series, novelas ligeras y mangas. Su propósito es que el usuario pueda registrar fácilmente en qué punto dejó su consumo.

Comportamiento esperado:

- El campo es de texto libre con hasta 300 caracteres.
- Debe ser fácilmente accesible y editable desde la vista de detalle y desde la vista de lista mediante edición rápida.
- Debe mostrarse de forma destacada en la ficha del registro cuando tenga contenido.
- Al cambiar el estado a completado o abandonado, el sistema debe preguntar si se desea conservar o limpiar la nota de progreso.

Ejemplos de contenido válido para la nota de progreso:

- "Temporada 3, episodio 7 — justo antes del flashback."
- "Capítulo 88, página 12."
- "Volumen 5, empezando el capítulo 31."

---

# 6. Estados por categoría

## 6.1 Estados de series

- Pendiente: no iniciada, en lista de espera.
- En progreso: actualmente siendo vista.
- Completada: finalizada.
- Abandonada: descartada sin terminar.

## 6.2 Estados de novelas ligeras

- Pendiente: no iniciada.
- En progreso: actualmente siendo leída.
- Completada: finalizada.
- Abandonada: descartada sin terminar.

## 6.3 Estados de películas

- Pendiente: no vista, en lista de espera.
- Vista: ya fue vista.
- Abandonada: descartada sin terminar.

## 6.4 Estados de mangas

- Pendiente: no iniciado.
- En progreso: actualmente siendo leído.
- Completado: finalizado.
- Abandonado: descartado sin terminar.

---

# 7. Funcionalidades de listado y filtros

## 7.1 Vista de lista por categoría

Cada categoría debe mostrar su lista completa de registros en una tabla o cuadrícula.

Columnas mínimas visibles en la lista de series, novelas ligeras y mangas:

- Título.
- Género.
- Estado.
- Nota de progreso resumida (primeros 60 caracteres si existe).
- Puntuación.
- Acciones: editar, eliminar, ver detalle.

Columnas mínimas visibles en la lista de películas:

- Título.
- Género.
- Director.
- Año.
- Estado.
- Puntuación.
- Acciones: editar, eliminar, ver detalle.

## 7.2 Filtros mínimos por categoría

Todas las categorías deben ofrecer al menos:

- Filtro por estado.
- Filtro por texto sobre el título.
- Filtro por género, cuando aplique.
- Ordenamiento por título, puntuación o fecha de actualización.

Reglas:

- Los filtros deben aplicarse en tiempo real o al presionar un botón.
- El texto de búsqueda no debe ser sensible a mayúsculas ni a tildes.
- Los filtros deben poder limpiarse con un solo clic.

---

# 8. Formulario de creación y edición

## 8.1 Comportamiento general del formulario

El sistema debe presentar un formulario único para crear y editar registros de cada categoría.

Reglas:

- Al crear, el formulario debe estar vacío excepto por valores por defecto como el estado inicial.
- Al editar, el formulario debe cargarse con los datos actuales del registro.
- Los campos obligatorios deben estar visualmente marcados.
- Al guardar, el sistema debe mostrar un mensaje de éxito o de error.
- Al cancelar, el sistema debe descartar los cambios y volver a la lista.

## 8.2 Confirmación antes de eliminar

Antes de eliminar cualquier registro, el sistema debe mostrar una confirmación explícita al usuario.

Mensaje mínimo de confirmación:

- "¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer."

Reglas:

- El botón de confirmar eliminación debe ser claramente distinto del botón de cancelar.
- Si el usuario cancela, el registro no debe verse afectado.

---

# 9. Modelo de datos

## 9.1 Tabla: series

| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| id | entero autoincremental | sí | clave primaria |
| titulo | texto, máx 200 | sí | |
| genero | texto, máx 100 | no | |
| plataforma | texto, máx 100 | no | |
| estado | texto | sí | pendiente, en progreso, completado, abandonado |
| puntuacion | entero | no | entre 1 y 10 |
| nota_progreso | texto, máx 300 | no | |
| observacion | texto | no | |
| creado_en | fecha y hora | sí | automático |
| actualizado_en | fecha y hora | sí | automático al editar |

## 9.2 Tabla: novelas_ligeras

| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| id | entero autoincremental | sí | clave primaria |
| titulo | texto, máx 200 | sí | |
| autor | texto, máx 150 | no | |
| genero | texto, máx 100 | no | |
| estado | texto | sí | pendiente, en progreso, completado, abandonado |
| puntuacion | entero | no | entre 1 y 10 |
| nota_progreso | texto, máx 300 | no | |
| observacion | texto | no | |
| creado_en | fecha y hora | sí | automático |
| actualizado_en | fecha y hora | sí | automático al editar |

## 9.3 Tabla: peliculas

| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| id | entero autoincremental | sí | clave primaria |
| titulo | texto, máx 200 | sí | |
| director | texto, máx 150 | no | |
| genero | texto, máx 100 | no | |
| anio | entero | no | año de estreno de 4 dígitos |
| plataforma | texto, máx 100 | no | |
| estado | texto | sí | pendiente, vista, abandonada |
| puntuacion | entero | no | entre 1 y 10 |
| observacion | texto | no | |
| creado_en | fecha y hora | sí | automático |
| actualizado_en | fecha y hora | sí | automático al editar |

## 9.4 Tabla: mangas

| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| id | entero autoincremental | sí | clave primaria |
| titulo | texto, máx 200 | sí | |
| autor | texto, máx 150 | no | |
| genero | texto, máx 100 | no | |
| estado | texto | sí | pendiente, en progreso, completado, abandonado |
| puntuacion | entero | no | entre 1 y 10 |
| nota_progreso | texto, máx 300 | no | |
| observacion | texto | no | |
| creado_en | fecha y hora | sí | automático |
| actualizado_en | fecha y hora | sí | automático al editar |

---

# 10. Reglas de negocio generales

- Ningún registro puede guardarse sin título.
- Ningún registro puede guardarse sin estado.
- La puntuación, si se proporciona, debe ser un número entero entre 1 y 10. El sistema no debe aceptar valores fuera de ese rango.
- La nota de progreso no puede superar los 300 caracteres.
- La nota de progreso solo aplica a series, novelas ligeras y mangas. Las películas no deben tener este campo.
- Al cambiar el estado de un registro a completado o abandonado, si existe una nota de progreso, el sistema debe ofrecer al usuario la opción de conservarla o limpiarla.
- Un registro eliminado no puede recuperarse. La eliminación es definitiva.
- El campo actualizado_en debe actualizarse automáticamente cada vez que se modifique cualquier campo del registro.

---

# 11. Pantallas principales

Pantallas mínimas:

1. Inicio con resumen de las cuatro categorías.
2. Lista de series con filtros y buscador.
3. Formulario de creación y edición de serie.
4. Lista de novelas ligeras con filtros y buscador.
5. Formulario de creación y edición de novela ligera.
6. Lista de películas con filtros y buscador.
7. Formulario de creación y edición de película.
8. Lista de mangas con filtros y buscador.
9. Formulario de creación y edición de manga.
12. Vista de detalle individual para cualquier categoría.
13. Diálogo de confirmación de eliminación.

---

# 12. Diseño responsivo

El sistema debe adaptarse a los siguientes tamaños:

```text
Móvil:      320px a 767px
Tablet:     768px a 1023px
Escritorio: 1024px o superior
```

Reglas de interfaz:

- En móvil, el menú debe colapsar en un ícono o menú hamburguesa.
- Las tablas deben permitir scroll horizontal o transformarse en tarjetas en pantallas pequeñas.
- Los formularios deben usar una sola columna en móvil y dos columnas en escritorio.
- Los botones de eliminar deben requerir confirmación explícita.
- La nota de progreso debe ser fácilmente accesible y editable desde cualquier tamaño de pantalla.

---

# 13. Validaciones mínimas

Validaciones que el sistema debe aplicar antes de guardar cualquier registro:

- El título no puede estar vacío.
- El título no puede superar los 200 caracteres.
- El estado debe ser uno de los valores permitidos para la categoría correspondiente.
- La puntuación, si se ingresa, debe ser un número entero entre 1 y 10.
- La nota de progreso, si se ingresa, no puede superar los 300 caracteres.
- El año de estreno en películas, si se ingresa, debe ser un número de cuatro dígitos mayor que 1880.


---

# 14. Casos de prueba funcionales mínimos

## CP-01 Crear una serie válida

Datos:

- Título: Attack on Titan.
- Género: Acción.
- Plataforma: Crunchyroll.
- Estado: En progreso.
- Nota de progreso: Temporada 3, episodio 4.

Resultado esperado:

- Registro creado correctamente.
- Aparece en la lista de series.
- La nota de progreso se muestra en la ficha.

---

## CP-02 Crear una serie sin título

Datos:

- Título: vacío.
- Estado: Pendiente.

Resultado esperado:

- El sistema rechaza la operación.
- Se muestra un mensaje de error indicando que el título es obligatorio.
- No se crea ningún registro.

---

## CP-03 Editar la nota de progreso de un manga

Datos:

- Manga existente con estado En progreso.
- Nueva nota de progreso: Capítulo 312.

Resultado esperado:

- La nota de progreso se actualiza correctamente.
- El campo actualizado_en refleja la nueva fecha y hora.

---

## CP-04 Cambiar estado de novela ligera a completada con nota de progreso existente

Datos:

- Novela ligera con estado En progreso y nota: Volumen 4, capítulo 18.
- Se cambia el estado a Completada.

Resultado esperado:

- El sistema pregunta si se desea conservar o limpiar la nota de progreso.
- Según la elección del usuario, la nota se mantiene o se borra.
- El registro se guarda con el nuevo estado.

---

## CP-05 Eliminar una película

Datos:

- Película existente con estado Vista.

Resultado esperado:

- El sistema muestra un diálogo de confirmación antes de eliminar.
- Si el usuario confirma, el registro desaparece de la lista.
- Si el usuario cancela, el registro permanece intacto.

---

## CP-06 Ingresar puntuación fuera de rango

Datos:

- Puntuación: 15.

Resultado esperado:

- El sistema rechaza el valor.
- Se muestra un mensaje indicando que la puntuación debe estar entre 1 y 10.
- El registro no se guarda hasta corregir el valor.

---

## CP-07 Filtrar series por estado

Datos:

- Existen series con distintos estados.
- El usuario selecciona el filtro "En progreso".

Resultado esperado:

- La lista muestra únicamente las series con estado En progreso.
- Las demás series quedan ocultas mientras el filtro está activo.

---

## CP-08 Buscar manga por título parcial

Datos:

- Existen varios mangas registrados.
- El usuario escribe "nar" en el buscador.

Resultado esperado:

- La lista muestra todos los mangas cuyo título contiene "nar", sin distinguir mayúsculas ni tildes.
- Los mangas que no coinciden quedan ocultos.

---

## CP-09 Nota de progreso con más de 300 caracteres

Datos:

- Nota de progreso con 350 caracteres de texto.

Resultado esperado:

- El sistema rechaza la operación o trunca el texto al límite permitido.
- Se muestra un mensaje indicando el límite de caracteres.

---

# 15. Estructura de archivos sugerida

```text
mediatracker/
  src/
    components/
      Header.jsx
      Sidebar.jsx
      RegistroCard.jsx
      FormularioRegistro.jsx
      ModalConfirmacion.jsx
      NotaProgreso.jsx
      FiltroBuscador.jsx
    pages/
      Inicio.jsx
      series/
        ListaSeries.jsx
        FormSerie.jsx
      novelas/
        ListaNovelas.jsx
        FormNovela.jsx
      peliculas/
        ListaPeliculas.jsx
        FormPelicula.jsx
      mangas/
        ListaMangas.jsx
        FormManga.jsx
    utils/
      validaciones.js
      formatoFecha.js
    styles/
      global.css
    data/
      db.js
  public/
  README.md
```

---

# 16. Definición final del producto mínimo viable

El producto mínimo viable debe ser una aplicación web personal llamada **MediaTracker Personal** que permita gestionar el seguimiento de series, novelas ligeras, películas y mangas desde una interfaz simple y responsiva.

Debe incluir creación, edición y eliminación de registros en cada categoría, nota de progreso editable para series, novelas ligeras y mangas, filtros por estado y búsqueda por título, validaciones de formulario, confirmación antes de eliminar y diseño adaptable a móvil, tablet y escritorio.

El sistema está pensado para uso personal, sin necesidad de autenticación, y debe ser fácil de instalar y ejecutar localmente o desde un servidor personal.
