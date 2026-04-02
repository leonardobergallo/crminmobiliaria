# Flujo Manual De Links

## Para que sirve

Este flujo sirve para usar una busqueda ya cargada del cliente como base, abrir portales con filtros y pegar manualmente los links reales que encuentres.

No hace scraping en vivo.

No entra a leer automaticamente las paginas de ZonaProp, ArgenProp, MercadoLibre, etc.

La busqueda del cliente sigue siendo la base del proceso.

## Como funciona

1. Elegis el cliente.
2. Elegis una busqueda de ese cliente.
3. Tocás `Preparar flujo manual`.
4. El sistema arma accesos a portales con filtros segun esa busqueda.
5. Vos abrís esos portales y buscás links reales.
6. Pegás esos links manualmente.
7. Cada link se convierte en una card.
8. Seleccionás las cards correctas.
9. Guardás y seguís el flujo en `Gestion del Cliente`.

## Que toma de la busqueda

La busqueda elegida aporta el contexto:

- tipo de propiedad
- zona
- presupuesto
- dormitorios

Con eso el sistema arma los botones para abrir portales y te ayuda a cargar resultados coherentes con ese requerimiento.

## Donde pegar los links

En la pantalla `Parsear` o en la pantalla `Busquedas`, dentro del bloque:

`Cargar resultados encontrados para esta busqueda`

## Que pasa cuando pegas un link

Cuando pegás una URL:

- se completa una card
- el sistema detecta el portal desde la URL
- intenta armar un titulo inicial desde el link
- crea otra card vacia para que sigas cargando mas resultados

## Como se ordenan las cards

Las cards se muestran en este orden:

1. cards seleccionadas
2. cards con link cargado
3. cards vacias

Ademas:

- `Actual`: es la card que estas editando
- `Cargado`: la card ya tiene URL
- `Seleccionado`: la card ya fue elegida para pasar a Gestion

## Que tenes que hacer vos

Tu trabajo manual es este:

1. abrir los portales sugeridos
2. encontrar publicaciones reales
3. copiar los links
4. pegarlos en cards
5. seleccionar las cards correctas
6. enviarlas a Gestion

## Importante

Este flujo no reemplaza la busqueda del cliente.

La busqueda del cliente es el requerimiento base.

Los links manuales son resultados encontrados para ese requerimiento.

## Ejemplo simple

1. Cliente con busqueda: `Departamento 2 dormitorios dentro de boulevares`.
2. Tocás `Preparar flujo manual`.
3. Abrís `ZonaProp`.
4. Encontrás una publicacion real.
5. Pegás el link.
6. La card detecta `ZonaProp`.
7. La seleccionás.
8. Tocás `Guardar seleccion y pasar a Gestion`.

## Resumen corto

`Busqueda del cliente` -> `Abrir portales` -> `Pegar links` -> `Seleccionar cards` -> `Gestion`
