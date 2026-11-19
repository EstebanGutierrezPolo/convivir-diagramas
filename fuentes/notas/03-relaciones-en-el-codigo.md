<!-- titulo: Relaciones en el código -->
# Cómo se llevan las relaciones del diagrama al código

Así está escrito el backend (`com.convivir.<modulo>`). Cada tipo de relación del diagrama de clases tiene una sola forma de escribirse en Java con JPA, y cada atributo de relación lleva encima un comentario con la flecha del diagrama que implementa, por ejemplo `// Inmueble "1" *-- "*" Obligacion : adeuda (composición)`. Así se puede señalar en el código dónde está cada flecha.

**Regla general:** la llave foránea siempre queda en el lado "muchos", con `@ManyToOne`. Cuando la flecha del diagrama sale del lado "uno", ese lado tiene además la lista con `@OneToMany(mappedBy = …)`, que es por donde se navega. Así ninguna relación necesita una tabla intermedia y guardar un elemento nuevo no obliga a cargar la lista completa.

| Relación en el diagrama | Ejemplo del proyecto | Cómo queda en el código |
|---|---|---|
| Asociación `-->` | `Obligacion "1" <-- "*" Pago : abona` | `Pago` tiene un atributo `obligacion` con `@ManyToOne`. Si hace falta recorrerla al revés, `Obligacion` tiene una lista con `@OneToMany(mappedBy = "obligacion")` |
| Agregación `o--` | `PropiedadHorizontal "1" o-- "*" Inmueble : administra` | Lista con `@OneToMany` sin borrado en cascada. Las partes pueden existir sin el todo |
| Composición `*--` | `Reporte "1" *-- "*" SeguimientoReporte : recibe` | Lista con `@OneToMany(cascade = ALL, orphanRemoval = true)`. Las partes se crean y se borran con el todo |
| Composición uno a uno | `Integrante "1" *-- "0..1" Cuenta : accede con` | `@OneToOne(cascade = ALL, orphanRemoval = true)` |
| Relación reflexiva | `Inmueble "0..1" o-- "*" Inmueble : contiene` | `Inmueble` tiene `inmuebleContenedor` con `@ManyToOne` y la lista `inmueblesContenidos` con `@OneToMany(mappedBy = "inmuebleContenedor")` |
| Muchos a muchos con clase intermedia | `Integrante "*" -- "*" Inmueble` a través de `Vinculacion` | No se usa `@ManyToMany`. `Vinculacion` es una entidad con dos `@ManyToOne`, porque guarda datos propios (fechas, estado) |
| Herencia `<\|--` | `Integrante <\|-- Arrendatario` | `abstract class Integrante` con `@Inheritance(strategy = JOINED)` y `class Arrendatario extends Integrante`. Una tabla `integrante` con lo común y una por tipo (`arrendatario`, `propietario`…) con lo propio |
| Realización `<\|..` | `EstrategiaTarifa <\|.. TarifaPorHora` | `interface EstrategiaTarifa` y `class TarifaPorHora implements EstrategiaTarifa`. No son entidades, no van a la base |
| Dependencia `..>` | `CesionUso ..> TipoInmueble : valida` | No hay atributo. La clase recibe o consulta el otro objeto dentro de un método |
| Enumeración | `Obligacion ..> EstadoObligacion` | `enum EstadoObligacion` y el atributo con `@Enumerated(EnumType.STRING)` |

## Patrones del diagrama

| Patrón | Clases | Para qué |
|---|---|---|
| Fábrica | `FabricaIntegrante`, `FabricaObligacion`, `FabricaEstrategiaTarifa` | Crear el objeto correcto según el rol, el concepto o la unidad de tarifa |
| Estado | `ComportamientoReserva` con `ReservaSolicitada`, `ReservaConfirmada`, `ReservaCerrada` | Lo que una reserva puede hacer depende de su estado |
| Estrategia | `EstrategiaTarifa` (por hora, por día, por evento) y `PoliticaInteresMora` | Cambiar la forma de calcular sin tocar `Reserva` ni `Obligacion` |
| Adaptador | `PasarelaPago` con `AdaptadorPasarelaExterna` | Aislar el servicio de pagos externo |
| Observador | `PublicadorEventos` con `ObservadorAuditoria` y `ObservadorNotificaciones` | Auditar y notificar sin que cada clase conozca esos detalles |
| Singleton | `PublicadorEventos.obtenerInstancia()` | Que las clases del dominio publiquen sin recibir el publicador por parámetro |

Los objetos de un patrón que no son datos (estrategias, estados, el adaptador) no van a la base: en la entidad son `@Transient` y se reconstruyen al cargarla. Por ejemplo, `Reserva` vuelve a armar su `ComportamientoReserva` a partir de su `estado`.

## Visibilidad y modificadores

| En el diagrama | En Java |
|---|---|
| `+atributo` | Campo privado con getter (Lombok `@Getter` en la clase) |
| `-atributo` | Campo privado sin getter (`@Getter(AccessLevel.NONE)`), por ejemplo `Cuenta.contrasena` |
| `+metodo()` | `public` |
| `-metodo()` | `private` |
| `#metodo()` | `protected` |
| `~metodo()` | Sin modificador: visible solo dentro del paquete del módulo |
| `metodo()$` (subrayado) | `static` |
| `metodo()*` (cursiva) | `abstract` |
| `<<enumeration>>` | `enum`, guardado como texto (`@Enumerated(EnumType.STRING)`) |
| `Date`, `Time`, `DateTime` | `LocalDate`, `LocalTime`, `LocalDateTime` |
