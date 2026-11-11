# FrikiMadrid

Aplicación web progresiva (PWA) en español para descubrir tiendas, sitios, eventos y rutas frikis de Madrid, con un pack de stickers original para WhatsApp.

## Abrir la aplicación

Opción rápida: abre `index.html` en un navegador moderno. Para que la instalación PWA y el modo sin conexión funcionen, sirve la carpeta por HTTP:

```bash
python3 -m http.server 8080
```

Después abre `http://localhost:8080`.

## Funciones

- 14 tiendas y 10 sitios con filtros, búsqueda, favoritos, ficha, fuente y enlace a Maps.
- Agenda con niveles de verificación, descarga individual y calendario `.ics` completo.
- 5 rutas temáticas y constructor de ruta personal.
- 6 diseños originales en PNG, WebP y GIF; compartir nativo en móvil.
- PWA instalable, responsive y con caché offline.
- Datos revisados el 11 de noviembre de 2026.

## Estructura

- `index.html`: interfaz.
- `styles.css`: diseño responsive.
- `data.js`: contenido y fuentes.
- `app.js`: filtros, rutas, calendario, compartir y favoritos.
- `assets/stickers/`: imágenes, WebP y GIF originales.
- `manifest.webmanifest` y `sw.js`: instalación y modo offline.

## Actualización de datos

Edita los arrays `stores`, `places` y `events` en `data.js`. La aplicación no necesita compilación. Horarios, precios y agendas pueden cambiar; cada ficha enlaza a la fuente o web oficial para una última comprobación.
