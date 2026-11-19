# Cómo se construye una vista de Convivir

Las vistas son las pantallas definitivas de la aplicación, en HTML, CSS y JavaScript sin dependencias. Después se llevan a React tal cual: la hoja `convivir.css` pasa al frontend sin cambios y cada página se vuelve un componente.

## Archivos

| Archivo | Qué es |
|---|---|
| `convivir.css` | Tokens del sistema de diseño (sección 10 de `convivir_sistema.html`) y todos los componentes |
| `marco.js` | Barra, navegación según el rol, menú de la cuenta, tema y comportamientos (diálogos, pestañas, confirmaciones) |
| `index.html` | Catálogo de todas las vistas, agrupadas por actor |
| `administrador/inmuebles.html` | Referencia de una pantalla de gestión: filtros, tabla, diálogo con validación |
| `vigilante/porteria.html` | Referencia de portería: misma paleta, escala grande, veredicto |

## Plantilla de una página

```html
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Nombre corto · Convivir</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../convivir.css">
<script src="../marco.js"></script>
</head>
<!-- CU-XX Nombre del caso de uso · Clase.metodo() que usa la pantalla -->
<body data-rol="administrador" data-seccion="inmuebles" data-sub="tipos">
<main class="pagina">…</main>
</body>
</html>
```

`data-rol`, `data-seccion` y `data-sub` son los `id` de la navegación en `marco.js`. La barra y la subnavegación las pinta `marco.js`: la página no las escribe.

## Reglas

1. **Ningún color literal.** Solo `var(--…)`. Sin `box-shadow`. Radios 4, 6 y 999 px con sus tokens.
2. **El azul es la marca; verde, ámbar y rojo solo dicen estado**, siempre con píldora (punto y palabra), ficha con regla izquierda o veredicto. `p-ok` al día, vigente, confirmado, resuelto. `p-al` requiere atención pronto (por vencer, sin asignar, por confirmar). `p-no` negado, vencido, en mora, rechazado, fallido. `p-ne` terminado o neutro (finalizada, cancelada, utilizada, inactivo). `p-az` solo para "actual" o selección, nunca estado. Categorías, roles y tipos van en `.etiqueta`.

   | Enumeración | `p-ok` | `p-al` | `p-no` | `p-ne` |
   |---|---|---|---|---|
   | EstadoReporte | Cerrado | Abierto, Sin asignar | | En proceso |
   | EstadoReserva | Confirmada | Solicitada (por confirmar) | Incumplida | Cancelada, Finalizada |
   | EstadoAutorizacion | Vigente | | | Utilizada, Cancelada, Revocada, Vencida |
   | EstadoObligacion | Pagada | Pendiente, Pagada parcialmente | Vencida (con los días) | Anulada |
   | EstadoPago | Confirmado | Pendiente | Rechazado | Anulado |
   | EstadoCuenta | Activa | | Bloqueada | Inactiva |
   | ResultadoEnvio | Enviada | Sin confirmación | Fallida | |
   | EstadoRegistro y EstadoVigencia | Activo, Vigente | | | Inactivo, Finalizada |
3. **Monoespaciada solo para identificadores**: placa, cédula, unidad, referencia, comprobante, NIT (`.identificador` o `.dato`). Las cifras van con `tabular-nums` (`.num`), y en tablas en `td.num`.
4. **Dinero** con `Convivir.pesos(n)` o escrito como `$ 1 340 000` (espacio duro entre miles). Fechas en español: "30 de noviembre", "7:52 p. m.".
5. **Textos (sección 8)**: el botón dice qué pasa ("Registrar visita", nunca "Enviar" ni "Aceptar"); la confirmación conserva el verbo ("Visita registrada"); el error explica y dirige; el vacío invita; decir cuánto ("45 días en mora"); sin mayúsculas sostenidas.
6. **Cada campo obligatorio** lleva `required` y un `data-error` que explica y dirige.
7. **Lo que pide el diagrama de secuencia se ve**: cada `alt` (error de regla, 403, 422) tiene su mensaje en la pantalla, con la regla en palabras del usuario.
8. **Responsivo**: a 375 px de ancho no hay desplazamiento horizontal de la página. Las tablas se desplazan dentro de `.tabla-envoltura`; en vistas del residente se prefieren listas y fichas.
9. **Componentes que faltan**: un `<style>` en la página, solo con tokens. Si se repite en dos páginas, pasa a `convivir.css`.

## Comportamientos de `marco.js`

| Uso | Cómo |
|---|---|
| Abrir un diálogo | `<button data-abrir="id-del-dialogo">` sobre `<dialog class="dialogo" id="…">` |
| Cerrar | `data-cerrar` en cualquier botón dentro del diálogo |
| Formulario que confirma | `<form data-confirmar="Visita registrada" novalidate>`: valida los `required`, cierra el diálogo y muestra la confirmación. Escucha `confirmado` y llama `preventDefault()` para validar algo más |
| Pestañas | `<div class="pestanas" role="tablist"><button role="tab" aria-selected="true" aria-controls="panel-x">` y paneles con `id`, los no activos con `hidden` |
| Segmentos | `<div class="segmentos" data-grupo>` con `<button data-valor>`; emite el evento `cambio` con `detail` = valor |
| Confirmación suelta | `Convivir.confirmar('Texto', 'no' o 'al' opcional)` |
| Validar a mano | `Convivir.validar(formulario)` |
| Mostrar solo a un rol | `data-solo="administrador"` (se oculta si la página se ve con `?como=consejo`) |

## Datos de ejemplo

Copropiedad **Villa Campestre**, torres A, B y C, sótanos 1 y 2. Hoy es **sábado 14 de noviembre de 2026**; el periodo de facturación es noviembre de 2026 y la cuota vence el 30 de noviembre.

| Quién | Dato |
|---|---|
| Paula Ortega | Administradora |
| Jhon Rojas | Vigilante, turno noche |
| Hernán Ruiz | Miembro del consejo, tesorero |
| Lucía Mendoza | Arrendataria residente de B-0302, con permiso para autorizar accesos. Contrato `ARR-2026-0187`. Propietario de B-0302: Ernesto Vargas, no residente |
| Jorge Peñaranda | Propietario no residente de A-1104, sin ocupante, $ 1 340 000, 45 días en mora |
| Marta Oviedo | Propietaria residente de A-0902, $ 620 000, 12 días en mora |
| Gloria Ariza | Propietaria residente de A-0401; Sofía Restrepo, residente autorizada (hija) |
| Andrés Caicedo | Arrendatario residente de C-0705 |
| Diana Salcedo | Propietaria residente de C-1201, $ 2 105 000, 92 días en mora |
| Camila Restrepo Ariza | Visitante de B-0302, CC 1045887332 |

Parqueaderos privados `P-001` a `P-180`; `P-022` es de Ernesto Vargas y está cedido a B-0302 hasta el 30 de noviembre. Visitantes `V-01` a `V-12`. Depósito `D-014` de uso exclusivo de A-0902. Zonas comunes: Salón social (por evento, $ 180 000, multa $ 90 000), Zona BBQ (por hora, $ 25 000, multa $ 50 000), Cancha múltiple (por hora, sin costo), Piscina (no se reserva). Placas: `BQA 47F` (Lucía, Mazda 2 gris), `JKT 512`, `HZM 908`, `RTY 22E` (moto).
