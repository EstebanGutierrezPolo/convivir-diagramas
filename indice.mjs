// Índice de los diagramas: las pestañas de fuentes/pestanas.json con los
// archivos de cada carpeta y su título. Lo usan el servidor local y el armado
// de la versión publicada (scripts/construir.mjs).
import { readFile, readdir } from 'node:fs/promises'
import { extname, join } from 'node:path'

/** El título va en la primera línea del archivo: "%% titulo: ..." o "<!-- titulo: ... -->". */
export function tituloDe(texto, nombre) {
  const m = /^\s*(?:%%|<!--)\s*titulo:\s*(.+?)\s*(?:-->)?\s*$/m.exec(texto.slice(0, 400))
  return m ? m[1] : nombre
}

export async function construirIndice(carpetaFuentes) {
  const pestanas = JSON.parse(await readFile(join(carpetaFuentes, 'pestanas.json'), 'utf8'))
  for (const pestana of pestanas) {
    const nombres = (await readdir(join(carpetaFuentes, pestana.carpeta)).catch(() => []))
      .filter((n) => ['.mmd', '.md'].includes(extname(n)))
      .sort()
    pestana.diagramas = []
    for (const nombre of nombres) {
      const texto = await readFile(join(carpetaFuentes, pestana.carpeta, nombre), 'utf8')
      pestana.diagramas.push({ ruta: `${pestana.carpeta}/${nombre}`, titulo: tituloDe(texto, nombre) })
    }
  }
  return pestanas
}
