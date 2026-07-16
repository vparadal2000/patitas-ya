# Patitas Ya V2

## Archivos para subir a GitHub

Sube estos elementos en la raíz del repositorio:

- `index.html`
- `styles.css`
- `app.js`
- `productos.json`
- carpeta `images`

## Cómo agregar imágenes

1. Dentro del repositorio crea o sube la carpeta `images`.
2. Sube cada imagen con un nombre simple, en minúsculas y sin espacios.
3. En `productos.json`, cambia la propiedad `image`.

Ejemplo:

```json
"image": "images/brit-premium-adulto-15kg.webp"
```

No necesitas usar el enlace completo de GitHub. La ruta relativa funciona mejor.

Formatos recomendados:

- WebP: mejor opción.
- JPG: fotografías.
- PNG: imágenes con fondo transparente.

Idealmente, cada imagen debería pesar menos de 300 KB.

## Cómo editar productos

Todos los productos están dentro de `productos.json`.

Ejemplo:

```json
{
  "id": 1,
  "name": "Brit Premium Adult M",
  "brand": "Brit",
  "category": "Perros",
  "stage": "Adulto",
  "weight": "15 kg",
  "description": "Descripción del producto.",
  "benefits": ["Beneficio 1", "Beneficio 2"],
  "price": 37990,
  "oldPrice": 41990,
  "stock": 8,
  "featured": true,
  "image": "images/brit-premium-adult.webp"
}
```

Para agregar otro producto, copia un bloque completo, cambia sus datos y utiliza un `id` distinto.

## WhatsApp

En `app.js`, busca:

```js
const phone="56900000000";
```

Reemplázalo por el número real, incluyendo `56` y sin `+`, espacios ni guiones.

## Importante

GitHub distingue mayúsculas y minúsculas:

- `images/Producto.webp`
- `images/producto.webp`

Son archivos diferentes. Usa siempre minúsculas para evitar errores.
