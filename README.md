# Patitas Ya — catálogo moderno

Versión generada desde el archivo `productos_patitas.xlsx`.

## Contenido generado

- 174 productos.
- Categorías detectadas automáticamente.
- Marcas detectadas automáticamente.
- Precios transformados al formato chileno.
- 8 productos destacados iniciales.
- Catálogo paginado para mantener una carga ordenada.
- Carrito y pedido por WhatsApp.

## Estructura

```text
index.html
assets/
  css/styles.css
  js/app.js
  images/
data/
  productos.json
README.md
```

## Agregar imágenes

Cada producto ya tiene una ruta sugerida dentro de `productos.json`, por ejemplo:

```json
"image": "assets/images/nomade-20-kg-perro-adulto.webp"
```

Debes subir una imagen con exactamente ese nombre dentro de:

```text
assets/images/
```

También puedes cambiar manualmente la ruta del campo `image`.

## Editar descripción

En `data/productos.json`, completa:

```json
"shortDescription": "",
"description": "",
"benefits": []
```

Ejemplo:

```json
"description": "Alimento completo para perros adultos.",
"benefits": [
  "Ayuda a mantener una digestión saludable",
  "Proteínas de alta calidad"
]
```

## Destacar productos

Para mostrar un producto en la sección principal:

```json
"featured": true,
"badge": "Más vendido"
```

Puedes usar textos como:

- Más vendido
- Oferta
- Recomendado
- Nuevo

## Precios sin información

Los productos que no tenían precio en el Excel quedaron con:

```json
"price": null
```

La web mostrará “Consultar precio” y no permitirá agregarlos al carrito hasta que completes el valor.

## WhatsApp

El número configurado es:

```javascript
whatsapp: "56956736785"
```

Puedes cambiarlo en `assets/js/app.js`.

## Publicación en GitHub

Sube directamente a la raíz del repositorio:

- `index.html`
- carpeta `assets`
- carpeta `data`
- `README.md`

No subas una carpeta adicional que envuelva estos archivos.


## Panel para buscar y preparar imágenes

Esta versión incluye:

```text
admin/index.html
```

Para usarlo una vez publicado, entra a:

```text
https://vparadal2000.github.io/patitas-ya/admin/
```

El panel permite:

- Buscar cada producto en Bing Imágenes.
- Subir la imagen seleccionada.
- Convertirla automáticamente a WebP.
- Reducirla a un máximo de 1200 px.
- Descargarla con el nombre exacto requerido.
- Marcar productos completados.
- Filtrar pendientes y completados.
- Exportar un `productos.json` con el campo `imageReady`.

Importante: revisa que la imagen corresponda exactamente al producto y que tengas autorización para utilizarla.


## Mantenedor de detalles

El panel `admin/` ahora permite editar:

- Nombre
- Marca
- Categoría
- Formato o peso
- Precio
- Precio anterior
- Stock
- Etiqueta
- Descripción corta
- Descripción completa
- Beneficios
- Producto destacado
- Estado de imagen

Los cambios se guardan temporalmente en el navegador. Para publicarlos, usa **Exportar productos.json** y reemplaza `data/productos.json` en GitHub.


# Patitas Admin 2.0

La carpeta `admin/` ahora contiene un panel completo con:

- Dashboard de productos, imágenes y pendientes.
- Mantenedor de productos.
- Creación y eliminación de productos.
- Precio, precio anterior y stock.
- Descripción corta y completa.
- Beneficios.
- Búsqueda y preparación de imágenes.
- Conversión y renombrado a WebP.
- Productos destacados.
- Textos promocionales de la portada.
- Datos de WhatsApp y tienda.
- Guardado automático en el navegador.
- Exportación de `productos.json` y `config.json`.

## Publicación

GitHub Pages es un alojamiento estático, por lo que el botón **Preparar publicación** descarga los archivos modificados. Debes reemplazarlos en:

```text
data/productos.json
data/config.json
```

Luego realiza Commit y Push origin desde GitHub Desktop.

## Imágenes y descarte de borradores

El botón para descartar cambios locales borra solamente los borradores del navegador. El panel intenta cargar siempre las imágenes reales ubicadas en `assets/images`, por lo que no se ocultan solo por eliminar el estado local.
