<!-- titulo: Estado del proyecto -->
# Convivir: estado del proyecto

Plataforma web para la gestión y control de propiedades horizontales. Toda la información se ancla al **inmueble** y no a la persona, para que el historial no se pierda cuando cambia el propietario o el arrendatario.

## Documento base

Versión 1.2 del documento de requisitos (23 de octubre de 2026):

| Elemento | Cantidad |
|---|---|
| Requisitos funcionales | 123 (RF-001 a RF-123) |
| Reglas de negocio | 43 (RN-01 a RN-43) |
| Requisitos no funcionales | 15 (RNF-01 a RNF-15) |
| Casos de uso | 21 (CU-01 a CU-21) |
| Clases y enumeraciones | 67 (48 clases y 19 enumeraciones) |

## Entregables de la materia

| Entregable | Estado | Dónde está |
|---|---|---|
| Diagramas de casos de uso | Borrador para revisar | Pestaña Casos de uso |
| Diagrama de clases | Hecho por el equipo. Ajustado al programar el dominio; quedan 3 decisiones de negocio abiertas | Pestaña Clases y Proyecto, "Decisiones abiertas" |
| Diagrama de componentes | Borrador para revisar | Pestaña Componentes |
| Diagrama de despliegue | Refleja lo que ya corre en Docker | Pestaña Despliegue |
| Diagramas de secuencia, uno por caso de uso | Borrador para revisar | Pestaña Secuencia |
| Metodología | Pendiente | |
| Cómo se implementaron las relaciones en el código | Aplicado en todo el dominio | Proyecto, "Relaciones en el código" |
| Interfaces de la aplicación | Hechas en React: las 28 pantallas de los cuatro roles. Las vistas HTML siguen siendo la referencia de diseño | Carpeta `frontend/src/paginas` y enlace **Vistas** del visor |
| Aplicación funcionando | Dominio completo en Java. API de CU-02 y CU-19 conectada al frontend; las demás pantallas con datos de ejemplo | Carpetas `backend` y `frontend` |

## Tecnologías decididas

| Pieza | Tecnología |
|---|---|
| Frontend | React con Vite, servido con Node (sin Nginx) |
| Backend | Spring Boot 4 con Java 21, API REST |
| Base de datos | PostgreSQL 17 |
| Ejecución | Docker Compose, un contenedor por pieza. Java se compila dentro de Docker porque el PC no lo tiene instalado |

## Qué está construido hoy

- Los tres contenedores levantan con `docker compose up -d --build`.
- **Dominio completo:** las 67 clases y enumeraciones del diagrama están en Java, un paquete por módulo (`com.convivir.inmuebles`, `integrantes`, `reservas`, `cesiones`, `accesos`, `finanzas`, `reportes`, `eventos`), con sus relaciones en JPA y sus patrones (Fábrica, Estado, Estrategia, Adaptador, Observador, Singleton). Al arrancar, Hibernate crea las 28 tablas en PostgreSQL.
- **Auditoría automática:** toda operación del dominio publica un evento y `ObservadorAuditoria` lo guarda (RN-30).
- **Casos de uso con API, probados de punta a punta:**

  | Caso de uso | Rutas |
  |---|---|
  | CU-19 Gestionar tipos de inmueble | `GET`, `POST /api/tipos-inmueble`, `PUT /api/tipos-inmueble/{id}`, `PATCH …/{id}/desactivar` |
  | CU-01 Iniciar sesión | `POST`, `GET`, `DELETE /api/sesion`, `POST /api/sesion/restablecimiento` |
  | CU-02 Gestionar inmuebles | `GET`, `POST /api/inmuebles`, `PUT /api/inmuebles/{id}`, `PATCH …/{id}/desactivar`, `PATCH …/{id}/reactivar`, `GET …/{id}/historial` |

- **Errores:** responden 404, 409 o 422 con un mensaje que explica y dirige, como en los diagramas de secuencia.
- **Datos iniciales:** la primera vez que arranca crea la copropiedad Villa Campestre y seis tipos de inmueble de ejemplo.
- **Sesión y permisos:** la sesión vive en una cookie del servidor. Toda la API pide sesión salvo `/api/estado` y `/api/sesion`, inmuebles y tipos solo los usa el administrador (403 para los demás), y la auditoría registra el documento de quien actúa. La contraseña de las cuentas de ejemplo sale de `CONVIVIR_CONTRASENA_INICIAL` en el `.env`.
- **Falta en el backend:** los servicios y controladores de los otros 18 casos de uso, y completar el restablecimiento de contraseña (hoy se registra el envío del enlace, simulado; falta la pantalla para fijar la nueva).
- **Frontend en React:** las 28 pantallas de administrador, vigilante, residente y consejo, con rutas por rol, tema claro y oscuro y la hoja del sistema de diseño. Inmuebles, el detalle del inmueble y Tipos de inmueble leen y escriben en la API real. Las demás muestran un aviso de datos de ejemplo hasta que exista su API. El inicio de sesión es el real (CU-01).
- Las interfaces definitivas están en `vistas/` del repositorio de diagramas, en HTML y CSS sin dependencias. `vistas/convivir.css` se copia tal cual al frontend y cada vista se vuelve una página de React. Las reglas para construirlas están en `vistas/GUIA-VISTAS.md`.

## Regla del proyecto: el diagrama es el código

1. Cada clase del diagrama de clases existe en el código con el mismo nombre, atributos y métodos.
2. La lógica vive en las clases del dominio. Los servicios solo coordinan: buscan, llaman al método de la clase y guardan.
3. Cada módulo del diagrama de clases es un paquete del backend.
4. Cada caso de uso se programa siguiendo su diagrama de secuencia. Si el código necesita algo distinto, primero se cambia el diagrama.

## Cómo usar este visor

- Las pestañas de arriba cambian el tipo de diagrama y la lista de la izquierda cambia el diagrama.
- **Editar diagrama** abre el texto del diagrama. El dibujo se actualiza mientras se escribe.
- Los botones **+ Clase**, **+ Asociación**, **+ Mensaje** y los demás insertan la línea de ejemplo para solo cambiar los nombres.
- **Guardar diagrama** (o Ctrl + S) escribe el archivo en `fuentes/`. Esos archivos van al repositorio.
- **Nuevo diagrama** crea un diagrama en la pestaña actual.
- **Descargar SVG** baja la imagen en tema claro para insertarla en Word.
- **Vistas** abre el catálogo de pantallas de la aplicación, agrupadas por actor, con la tabla de qué caso de uso se realiza en cada una.
- El interruptor **Claro, Oscuro, Sistema** cambia el tema de la página y de los diagramas. **Sistema de diseño** abre la guía visual de Convivir.
- En Clases, el "Diagrama completo" se arma solo uniendo los ocho módulos: se edita el módulo, no el completo.
