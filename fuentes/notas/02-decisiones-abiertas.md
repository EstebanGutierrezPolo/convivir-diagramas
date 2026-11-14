<!-- titulo: Decisiones abiertas -->
# Decisiones abiertas

Puntos donde el diagrama de clases no se puede programar tal como está, o donde los documentos se contradicen. Hay que cerrarlos antes de escribir el dominio, porque el código debe ser igual al diagrama.

| # | Punto | Por qué es un problema | Recomendación |
|---|---|---|---|
| 1 | `Integrante` es una interfaz con atributos | En Java una interfaz no guarda datos y no se puede guardar en la base | Pasarla a clase abstracta y cambiar las cinco realizaciones por herencia |
| 2 | Los métodos están en las clases del dominio (`registrarInmueble()`, `confirmarReserva()`) | Spring Boot suele poner la lógica en servicios. Hay que elegir una forma para que los diagramas de secuencia sean el flujo real | Respetar el diagrama: la lógica en la clase y el servicio solo coordina. Los diagramas de secuencia ya están dibujados así |
| 3 | Copropietarios | La regla RN-03 permite una sola vinculación de propiedad vigente por inmueble, pero `Vinculacion` tiene `porcentajePropiedad` | Decidir si se permiten varios propietarios. Si no, quitar `porcentajePropiedad` |
| 4 | Una persona con dos roles | El rol sale del tipo de integrante (RF-102). Un propietario que también es miembro del consejo no cabe sin registrarlo dos veces | Decidir si se registra dos veces o si el rol deja de depender de la subclase |
| 5 | Gastos | El consejo consulta los gastos (RF-089), pero ningún requisito permite registrarlos y `Gasto` solo tiene el método de consulta | Agregar un requisito y un método para registrar gastos, o cargarlos como datos iniciales |
| 6 | Anular un pago | `Pago.anularPagoPorMotivo()` existe, pero ninguna clase tiene un método que le devuelva el saldo a la obligación | Agregar a `Obligacion` un método que revierta el abono |
| 7 | `Vinculacion` no tiene tipo de vínculo | Los requisitos hablan de tipo de vínculo (RF-020, RF-025). En el diagrama se deduce del tipo de integrante y de `esResidente` | Confirmar que se deduce así, o agregar el atributo |
| 8 | `Reserva` y `Obligacion` se necesitan entre sí | `Reserva` genera obligaciones y `FabricaObligacion` lee la reserva. Los paquetes `reservas` y `finanzas` quedan dependiendo uno del otro | Aceptarlo, o que `FabricaObligacion` reciba el valor y el inmueble en vez de la reserva |
| 9 | Pasarela de pagos y notificaciones | Son servicios externos que no tenemos | Simularlos detrás de `PasarelaPago` y del servicio de notificaciones, como ya lo permite el diagrama |
| 10 | `diasPermitidos` y `horarios` son texto en `AutorizacionAcceso` | Validar día y franja horaria sobre un texto es frágil. `ProgramacionAsignacion` ya modela día y franja para las reservas | Decidir el formato del texto, o reutilizar la idea de `ProgramacionAsignacion` |

## Pendientes de documentación

- El documento v1.2 no trae las imágenes de los diagramas por caso de uso, y CU-19 a CU-21 nunca tuvieron una.
- El módulo 8 del documento del diagrama de clases no tiene nombre. Aquí se llama "Eventos, auditoría y notificaciones".
- Falta la sección de metodología.
