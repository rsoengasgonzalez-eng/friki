# FrikiMadrid · Edición Espectacular

Aplicación web progresiva (PWA) en español para descubrir la cultura friki de Madrid y compartir una biblioteca multimedia original.

## Abrir la aplicación

Para una prueba rápida puedes abrir `index.html`. Para activar instalación PWA, caché y compartir archivos, sirve la carpeta por HTTP:

```bash
python3 -m http.server 8080
```

Después abre `http://localhost:8080`.

## Contenido de esta edición

- **20 tiendas** de cómic, manga, TCG, juegos, LEGO, miniaturas y coleccionismo.
- **23 sitios y experiencias**: museos, VR, arcades, bares, cafés, ciencia, cine, astronomía y escape rooms.
- **21 eventos y agendas** con estados claros: confirmado, anunciado, comprobar, radar o agenda continua.
- **5 rutas temáticas** y constructor de ruta propia con Google Maps.
- **500 imágenes PNG + 500 GIFs animados**, 50 universos y 10 reacciones por universo.
- Descargas completas separadas y cinco packs de 100 imágenes + 100 GIFs.
- **Top 300 editorial**: 100 películas frikis, 100 videojuegos y 100 animes.
- Búsqueda, filtros, favoritos, calendarios `.ics`, compartir nativo y diseño responsive.
- PWA instalable con caché de la aplicación; los recursos multimedia se almacenan bajo demanda.

## Rendimiento

La megagalería renderiza 40 recursos por bloque, utiliza `loading="lazy"` y permite filtrar antes de cargar más. Esto evita insertar las 500 animaciones simultáneamente en el navegador.

## Derechos y criterio editorial

Los 1.000 archivos de la galería son diseños originales no oficiales. Se inspiran en **géneros y arquetipos** de cine y series frikis, pero no reproducen personajes, fotogramas, carteles ni logotipos de terceros.

Los rankings son una selección editorial subjetiva basada en impacto cultural, calidad, influencia, vigencia y variedad. No reproducen puntuaciones de terceros.

## Estructura principal

- `index.html`, `styles.css`, `app.js`: aplicación.
- `data.js` y `expansion-data.js`: tiendas, sitios, rutas y eventos.
- `rankings-data.js`: Top 300.
- `media-manifest.js`: índice de los 500 diseños.
- `assets/media/images/`: 500 PNG.
- `assets/media/gifs/`: 500 GIF.
- `assets/media/packs/`: packs descargables.
- `manifest.webmanifest` y `sw.js`: instalación y modo offline.
- `scripts/`: regeneración reproducible de imágenes, GIFs y rankings.

Datos de Madrid revisados el 11 de noviembre de 2026. Horarios, precios y agendas pueden cambiar; cada ficha incluye una fuente para comprobar antes de ir.
