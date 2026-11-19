# Convivir · Diagramas

Diagramas UML y sistema de diseño de Convivir, plataforma para la gestión y control de propiedades horizontales. Proyecto de Ingeniería de Software II, Universidad Simón Bolívar.

El código está en [convivir-frontend](https://github.com/EstebanGutierrezPolo/convivir-frontend) y [convivir-backend](https://github.com/EstebanGutierrezPolo/convivir-backend).

## Qué hay aquí

| Carpeta o archivo | Contenido |
|---|---|
| `fuentes/casos-de-uso/` | Diagrama general del sistema y uno por área |
| `fuentes/clases/` | Diagrama de clases, un archivo por módulo |
| `fuentes/componentes/` | Componentes del sistema y paquetes del backend |
| `fuentes/despliegue/` | Despliegue con Docker Compose |
| `fuentes/secuencia/` | Un diagrama de secuencia por caso de uso |
| `fuentes/notas/` | Estado del proyecto, decisiones abiertas y cómo se llevan las relaciones al código |
| `convivir_sistema.html` | Sistema de diseño: marca, paleta, tipografía y componentes |
| `vistas/` | Interfaces definitivas de la aplicación, una por caso de uso, y la hoja de estilos que se lleva al frontend |
| `servidor.mjs` y `web/` | Visor y editor de los diagramas |

Los diagramas son archivos de texto en formato [Mermaid](https://mermaid.js.org). La regla del proyecto es que el diagrama es el código: si el código necesita algo distinto, primero se cambia el diagrama.

## Ver y editar los diagramas

Necesita Node 22 o superior.

```bash
npm install
npm start
```

Abre http://localhost:4000

- Las pestañas cambian el tipo de diagrama y la lista de la izquierda cambia el diagrama.
- **Editar diagrama** abre el texto. El dibujo se actualiza mientras se escribe, y los botones de arriba del editor insertan una clase, una relación o un mensaje de ejemplo.
- **Guardar diagrama** (Ctrl + S) escribe el archivo en `fuentes/`. Después se hace commit como con cualquier otro cambio.
- **Descargar SVG** baja la imagen en tema claro para insertarla en Word.
- En Clases, el diagrama completo se arma solo uniendo los módulos.

## Publicar en Vercel

La versión publicada es estática y de solo lectura: muestra los diagramas, las vistas, el sistema de diseño y la guía del equipo, y permite descargar el SVG, pero no editar ni guardar, porque en Vercel no hay un disco donde escribir. Para editar se sigue usando `npm start` en el PC.

1. En Vercel, crea un proyecto e importa el repositorio `convivir-diagramas`.
2. Deja la configuración que trae: la toma de `vercel.json` (instala con `npm ci`, arma con `npm run construir` y publica la carpeta `publico`). No necesita variables de entorno.
3. Cada push a `main` se vuelve a publicar solo.

Para ver en el PC lo mismo que se publica:

```bash
npm run construir
```

Y abre la carpeta `publico/` con cualquier servidor estático.

## Ver las interfaces

Con el visor corriendo, abre http://localhost:4000/vistas/ o el enlace **Vistas** de la barra. Cada vista se puede ver como administrador, vigilante, residente o miembro del consejo desde el menú de la cuenta, en tema claro u oscuro. Las reglas para construir una vista nueva están en `vistas/GUIA-VISTAS.md`.
