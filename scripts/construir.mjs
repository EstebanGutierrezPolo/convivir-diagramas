// Arma la versión publicada (estática y de solo lectura) del visor en la carpeta
// "publico", que es la que sirve Vercel. Uso: npm run construir
//
// Lo que en local responde servidor.mjs, aquí queda como archivo:
//   /api/indice          -> /indice.json
//   /api/fuente?ruta=... -> /fuentes/<ruta>
// y el visor sabe que está publicado por window.CONVIVIR_PUBLICADO.
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { construirIndice } from '../indice.mjs'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const SALIDA = join(RAIZ, 'publico')
const FUENTES = join(RAIZ, 'fuentes')

await rm(SALIDA, { recursive: true, force: true })
await mkdir(join(SALIDA, 'vendor'), { recursive: true })

// Visor
const indiceHtml = await readFile(join(RAIZ, 'web', 'index.html'), 'utf8')
const marca = '<script src="/vendor/mermaid.js"></script>'
if (!indiceHtml.includes(marca)) throw new Error('web/index.html cambió: no se encontró dónde marcar la versión publicada')
await writeFile(join(SALIDA, 'index.html'),
  indiceHtml.replace(marca, `<script>window.CONVIVIR_PUBLICADO = true</script>\n    ${marca}`))
await cp(join(RAIZ, 'web', 'app.js'), join(SALIDA, 'app.js'))
await cp(join(RAIZ, 'web', 'estilos.css'), join(SALIDA, 'estilos.css'))
await cp(join(RAIZ, 'node_modules', 'mermaid', 'dist', 'mermaid.min.js'), join(SALIDA, 'vendor', 'mermaid.js'))
await cp(join(RAIZ, 'node_modules', 'marked', 'lib', 'marked.umd.js'), join(SALIDA, 'vendor', 'marked.js'))

// Sistema de diseño, guía del equipo y vistas
await cp(join(RAIZ, 'convivir_sistema.html'), join(SALIDA, 'convivir_sistema.html'))
await cp(join(RAIZ, 'guia-equipo.html'), join(SALIDA, 'guia-equipo.html'))
await cp(join(RAIZ, 'vistas'), join(SALIDA, 'vistas'), {
  recursive: true,
  filter: (origen) => !origen.endsWith('.md'),
})

// Diagramas: los archivos fuente y su índice
await cp(FUENTES, join(SALIDA, 'fuentes'), { recursive: true })
const indice = await construirIndice(FUENTES)
await writeFile(join(SALIDA, 'indice.json'), JSON.stringify(indice))

const diagramas = indice.reduce((total, p) => total + p.diagramas.length, 0)
console.log(`Versión publicada lista en publico/: ${indice.length} pestañas, ${diagramas} diagramas.`)
