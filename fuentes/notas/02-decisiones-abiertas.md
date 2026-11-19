<!-- titulo: Decisiones abiertas -->
# Decisiones del diagrama de clases

Puntos donde el diagrama de clases no se podía programar tal como estaba, o donde los documentos se contradicen. Las que eran técnicas se cerraron al escribir el dominio en Java: el diagrama ya está cambiado y el código es igual a él. Las que son de negocio siguen abiertas y las decide el equipo.

## Siguen abiertas

| # | Punto | Por qué es un problema | Cómo está hoy en el código |
|---|---|---|---|
| 3 | Copropietarios | La regla RN-03 permite una sola vinculación de propiedad vigente por inmueble, pero `Vinculacion` tiene `porcentajePropiedad` | Se aplica RN-03 (un propietario vigente por inmueble) y el porcentaje se guarda entre 1 y 100. Si se permiten varios propietarios, hay que cambiar RN-03; si no, quitar `porcentajePropiedad` |
| 4 | Una persona con dos roles | El rol sale del tipo de integrante (RF-102). Un propietario que también es miembro del consejo no cabe sin registrarlo dos veces | Cada persona es de un solo tipo y el documento es único: hoy no se puede registrar dos veces. Hay que decidir si el rol deja de depender de la subclase |
| 5 | Gastos | El consejo consulta los gastos (RF-089), pero ningún requisito permite registrarlos | `Gasto` solo se consulta. Los gastos se cargarían como datos iniciales mientras no haya requisito |

## Cerradas al programar

| # | Punto | Cómo se cerró |
|---|---|---|
| 1 | `Integrante` era una interfaz con atributos | Es una clase abstracta (`<<abstract>>`) y los cinco tipos la heredan. En la base, una tabla con los datos comunes y una por tipo (`@Inheritance(JOINED)`) |
| 2 | Lógica en las clases o en los servicios | En las clases del dominio. Los servicios solo buscan, llaman al método y guardan |
| 6 | Anular un pago no devolvía el saldo | `Obligacion.revertirAbonoDeLaObligacion(valorAbono)`, que llama `Pago.anularPagoPorMotivo(motivo)` |
| 7 | `Vinculacion` sin tipo de vínculo | Se deduce del tipo de integrante y de `esResidente`: `Cuenta.obtenerRolDelIntegranteEnInmueble()` devuelve, por ejemplo, `ARRENDATARIO_RESIDENTE` |
| 8 | `Reserva` y `Obligacion` se necesitan entre sí | Se acepta: `FabricaObligacion.crearObligacionPorReserva(reserva)` lee la reserva. Los paquetes `reservas` y `finanzas` dependen uno del otro |
| 9 | Pasarela de pagos y notificaciones | Simuladas. `AdaptadorPasarelaExterna` aprueba todo cobro salvo los de valor terminado en 13, que rechaza para poder probar. `Notificacion` escribe el envío en el registro del backend |
| 10 | `diasPermitidos` y `horarios` como texto | Formato fijo: días de `DiaSemana` separados por coma (`LUNES,MIERCOLES`) y una franja `07:00-17:00` |

## Cambios al diagrama de clases que pidió el código

Se hicieron porque sin ellos la clase no compila o el método no puede hacer lo que dice su nombre. Todos están ya en los diagramas de la pestaña Clases.

| Cambio | Por qué |
|---|---|
| `id : int` en `Inmueble`, `Integrante`, `Vehiculo` y `Cuenta` | Los diagramas de secuencia buscan por `findById(id)`. Así la identificación, el documento, la placa o el login se pueden corregir sin cambiar la llave |
| Parámetros en los métodos que cambian datos: `modificarDatosDelInmueble(coeficiente, areaM2, naturalezaInmueble)`, `modificarParametrosDelTipoDeInmueble(…)`, `modificarDatosDeContacto(…)`, `iniciarSesionConLoginYContrasena(contrasenaIngresada)`, `restablecerContrasena(nuevaContrasena)` y similares | Un método sin parámetros no tiene de dónde sacar los datos nuevos |
| Los métodos de registrar reciben con quién se relacionan: `vincularIntegranteAlInmueble(integrante, inmueble)`, `registrarVehiculo(inmueble, responsable)`, `registrarReservaDeZonaComun(integrante, finalidad)`, `crearReporteDeNovedad(creadoPor, categoria, inmueble, evidencia)` | El constructor del diagrama no recibe esos objetos y la relación se tiene que crear en algún punto |
| El constructor de `Inmueble` recibe `naturalezaInmueble` y `tipoInmueble` | Todo inmueble es de un tipo (`es de tipo`, multiplicidad 1) |
| `Inmueble.asignarPropiedadHorizontal(propiedadHorizontal)` | Para las relaciones `administra` y `es propietaria de` |
| `PublicadorEventos.obtenerInstancia()` estático (Singleton) | Las clases del dominio publican sin recibirlo por parámetro, que es la dependencia `..> PublicadorEventos : publica` |
| Métodos que operan sobre una lista pasan a ser estáticos y la reciben: `consultarGastosDelPeriodo`, `consultarPeriodosOcupadosDelInmueble`, `consultarPersonasPresentesEnElConjunto`, `generarInformeDeCartera`, `exportarRegistroDeAuditoria` | Una clase del dominio no consulta la base. El servicio trae la lista y la clase hace el cálculo |
| `generarInformeDeCartera` y `exportarRegistroDeAuditoria` devuelven `byte[]` (CSV) en vez de `File` | La API devuelve el archivo para descargar; no hace falta escribirlo en el disco del servidor |
| `MovimientoAcceso "0..1" --> "0..1" MovimientoAcceso : cierra` | Sin saber qué salida cierra qué ingreso no se puede saber quién sigue dentro del conjunto |
| `Auditoria.documentoActor` | Para auditar también al SISTEMA o a quien no es integrante registrado |
| `Pago.pagador` y `Pago.registrarDatosDelPagoPresencial(fecha, pagador)` | RN-24: el pago presencial guarda quién lo entregó |
| `Reserva.finalidad` | RF-116 pide la finalidad de la reserva |
| `AutorizacionAcceso.definirVigencia(…)` y sus fechas pasan a `DateTime` | Una visita vale entre una hora y otra del mismo día |
| `Obligacion.determinarSiHaySolidaridadDelArrendatario()` pasa de protegido a público | El pago de un arrendatario lo consulta para aplicar RN-22 |
| `Pago.validarResultadoDeLaPasarela()` pasa de protegido a público | El servicio lo llama al volver de la pasarela, como en el diagrama de secuencia de CU-12 |
| Métodos de paquete (`~`) como `Integrante.incorporarALaCopropiedad()`, `AutorizacionAcceso.registrarUso()` o `Obligacion.asignarPeriodo()` | Los usa otra clase del mismo módulo para cambiar un estado que no es público |

## Vacíos del diagrama que encontraron las vistas

Las pantallas mostraron datos que el diagrama todavía no tiene. No se han agregado: hay que decidir si entran.

- `AutorizacionAcceso` no tiene placa. Una visita que llega en carro se encuentra por el documento de quien conduce.
- `MovimientoAcceso` no guarda nombre ni documento de quien entra por excepción. Hoy van dentro de `motivoExcepcion`.
- `Reporte.evidencia` es un solo texto: se adjunta una sola foto.
- RF-121 pide la fecha de finalización de una reserva, pero `Reserva` no la guarda.
- `Cuenta` no tiene un método para desbloquear: se desbloquea al restablecer la contraseña.

## Pendientes de documentación

- El documento v1.2 no trae las imágenes de los diagramas por caso de uso, y CU-19 a CU-21 nunca tuvieron una.
- El módulo 8 del documento del diagrama de clases no tiene nombre. Aquí se llama "Eventos, auditoría y notificaciones".
- Falta la sección de metodología.
