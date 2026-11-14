<!-- titulo: Relaciones en el código -->
# Cómo se llevan las relaciones del diagrama al código

Propuesta para revisar. Cada tipo de relación del diagrama de clases tiene una sola forma de escribirse en Java con JPA, para que se pueda señalar en el código dónde está cada flecha.

| Relación en el diagrama | Ejemplo del proyecto | Cómo queda en el código |
|---|---|---|
| Asociación `-->` | `Obligacion "1" <-- "*" Pago : abona` | `Pago` tiene un atributo `obligacion` con `@ManyToOne`. Si hace falta recorrerla al revés, `Obligacion` tiene una lista con `@OneToMany(mappedBy = "obligacion")` |
| Agregación `o--` | `PropiedadHorizontal "1" o-- "*" Inmueble : administra` | Lista con `@OneToMany` sin borrado en cascada. Las partes pueden existir sin el todo |
| Composición `*--` | `Reporte "1" *-- "*" SeguimientoReporte : recibe` | Lista con `@OneToMany(cascade = ALL, orphanRemoval = true)`. Las partes se crean y se borran con el todo |
| Composición uno a uno | `Integrante "1" *-- "0..1" Cuenta : accede con` | `@OneToOne(cascade = ALL, orphanRemoval = true)` |
| Relación reflexiva | `Inmueble "0..1" o-- "*" Inmueble : contiene` | `Inmueble` tiene `inmuebleContenedor` con `@ManyToOne` y la lista `inmueblesContenidos` con `@OneToMany(mappedBy = "inmuebleContenedor")` |
| Muchos a muchos con clase intermedia | `Integrante "*" -- "*" Inmueble` a través de `Vinculacion` | No se usa `@ManyToMany`. `Vinculacion` es una entidad con dos `@ManyToOne`, porque guarda datos propios (fechas, estado) |
| Herencia `<\|--` | `Integrante` y sus tipos, si se aprueba la decisión 1 | `abstract class Integrante` con `@Inheritance`, y cada tipo con `extends` |
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
