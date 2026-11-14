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
| Diagrama de clases | Hecho por el equipo, con decisiones abiertas | Pestaña Clases |
| Diagrama de componentes | Borrador para revisar | Pestaña Componentes |
| Diagrama de despliegue | Refleja lo que ya corre en Docker | Pestaña Despliegue |
| Diagramas de secuencia, uno por caso de uso | Borrador para revisar | Pestaña Secuencia |
| Metodología | Pendiente | |
| Cómo se implementaron las relaciones en el código | Propuesta | Proyecto, "Relaciones en el código" |
| Aplicación funcionando | Solo el esqueleto | Carpetas `backend` y `frontend` |

## Tecnologías decididas

| Pieza | Tecnología |
|---|---|
| Frontend | React con Vite, servido con Node (sin Nginx) |
| Backend | Spring Boot 4 con Java 21, API REST |
| Base de datos | PostgreSQL 17 |
| Ejecución | Docker Compose, un contenedor por pieza. Java se compila dentro de Docker porque el PC no lo tiene instalado |

## Qué está construido hoy

- Los tres contenedores levantan con `docker compose up -d --build`.
- El backend solo tiene `EstadoController` (`/api/estado`), que confirma que la API responde y llega a la base.
- El frontend solo tiene una pantalla que muestra ese estado.
- Todavía no hay ninguna clase del dominio en el código.

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
- El interruptor **Claro, Oscuro, Sistema** cambia el tema de la página y de los diagramas. **Sistema de diseño** abre la guía visual de Convivir.
- En Clases, el "Diagrama completo" se arma solo uniendo los ocho módulos: se edita el módulo, no el completo.
