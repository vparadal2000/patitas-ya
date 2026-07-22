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
