// Servidor local del visor de diagramas de Convivir.
// Sirve la pagina y lee/guarda los archivos de la carpeta "fuentes".
// Solo escucha en este PC (127.0.0.1).
import { createServer } from 'node:http'
import { readFile, writeFile, access } from 'node:fs/promises'
import { dirname, extname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { construirIndice } from './indice.mjs'

const RAIZ = dirname(fileURLToPath(import.meta.url))
const WEB = join(RAIZ, 'web')
const FUENTES = join(RAIZ, 'fuentes')
const PUERTO = Number(process.env.PUERTO) || 4000

const ARCHIVOS_FIJOS = {
  '/': [join(WEB, 'index.html'), 'text/html; charset=utf-8'],
  '/app.js': [join(WEB, 'app.js'), 'text/javascript; charset=utf-8'],
  '/estilos.css': [join(WEB, 'estilos.css'), 'text/css; charset=utf-8'],
  '/sistema': [join(RAIZ, 'convivir_sistema.html'), 'text/html; charset=utf-8'],
  '/guia': [join(RAIZ, 'guia-equipo.html'), 'text/html; charset=utf-8'],
  '/vendor/mermaid.js': [join(RAIZ, 'node_modules', 'mermaid', 'dist', 'mermaid.min.js'), 'text/javascript; charset=utf-8'],
  '/vendor/marked.js': [join(RAIZ, 'node_modules', 'marked', 'lib', 'marked.umd.js'), 'text/javascript; charset=utf-8'],
}

// Una ruta valida es "carpeta/archivo.mmd" o "carpeta/archivo.md", en minusculas y sin subir de carpeta.
const RUTA_VALIDA = /^[a-z0-9-]+\/[a-z0-9-]+\.(mmd|md)$/

// Vistas (interfaces de la aplicación): /vistas/archivo.ext o /vistas/rol/archivo.ext, solo lectura.
const VISTAS = join(RAIZ, 'vistas')
const RUTA_VISTA = /^\/vistas\/(?:[a-z0-9-]+\/)?[a-z0-9-]+\.(html|css|js)$/
const TIPOS_VISTA = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
}

function vistaEnDisco(pathname) {
  if (pathname === '/vistas' || pathname === '/vistas/') pathname = '/vistas/index.html'
  if (!RUTA_VISTA.test(pathname)) return null
  const completa = resolve(RAIZ, '.' + pathname)
  return completa.startsWith(VISTAS + sep) ? completa : null
}

function rutaEnDisco(ruta) {
  if (!RUTA_VALIDA.test(ruta || '')) return null
  const completa = resolve(FUENTES, ruta)
  return completa.startsWith(FUENTES + sep) ? completa : null
}

function responder(res, estado, cuerpo, tipo = 'application/json; charset=utf-8') {
  res.writeHead(estado, { 'Content-Type': tipo, 'Cache-Control': 'no-store' })
  res.end(typeof cuerpo === 'string' || Buffer.isBuffer(cuerpo) ? cuerpo : JSON.stringify(cuerpo))
}

async function leerCuerpoJson(req) {
  const partes = []
  let tamano = 0
  for await (const parte of req) {
    tamano += parte.length
    if (tamano > 2_000_000) throw new Error('El contenido es demasiado grande')
    partes.push(parte)
  }
  return JSON.parse(Buffer.concat(partes).toString('utf8'))
}

const servidor = createServer(async (req, res) => {
  try {
    // Solo se atiende lo que llega pidiendo este mismo servidor local.
    const anfitrion = (req.headers.host || '').split(':')[0]
    if (!['localhost', '127.0.0.1'].includes(anfitrion)) return responder(res, 403, { error: 'Solo uso local' })

    const url = new URL(req.url, `http://${req.headers.host}`)

    if (req.method === 'GET' && ARCHIVOS_FIJOS[url.pathname]) {
      const [archivo, tipo] = ARCHIVOS_FIJOS[url.pathname]
      return responder(res, 200, await readFile(archivo), tipo)
    }

    if (req.method === 'GET' && url.pathname.startsWith('/vistas')) {
      if (url.pathname === '/vistas') {
        res.writeHead(301, { Location: '/vistas/' })
        return res.end()
      }
      const archivo = vistaEnDisco(url.pathname)
      if (!archivo) return responder(res, 404, { error: 'No encontrado' })
      return responder(res, 200, await readFile(archivo), TIPOS_VISTA[extname(archivo)])
    }

    if (req.method === 'GET' && url.pathname === '/api/indice') {
      return responder(res, 200, await construirIndice(FUENTES))
    }

    if (url.pathname === '/api/fuente') {
      const archivo = rutaEnDisco(url.searchParams.get('ruta'))
      if (!archivo) return responder(res, 400, { error: 'Ruta no válida' })

      if (req.method === 'GET') {
        return responder(res, 200, await readFile(archivo, 'utf8'), 'text/plain; charset=utf-8')
      }

      if (req.method === 'PUT') {
        // Exigir JSON impide que otra pagina web abierta en el navegador escriba aqui.
        if (!(req.headers['content-type'] || '').startsWith('application/json')) {
          return responder(res, 415, { error: 'Se esperaba JSON' })
        }
        const { contenido } = await leerCuerpoJson(req)
        if (typeof contenido !== 'string') return responder(res, 400, { error: 'Falta el contenido' })
        if (url.searchParams.get('nuevo') === '1') {
          const yaExiste = await access(archivo).then(() => true, () => false)
          if (yaExiste) return responder(res, 409, { error: 'Ya existe un diagrama con ese nombre' })
        }
        await writeFile(archivo, contenido, 'utf8')
        return responder(res, 200, { guardado: true })
      }
    }

    responder(res, 404, { error: 'No encontrado' })
  } catch (error) {
    responder(res, error.code === 'ENOENT' ? 404 : 500, { error: error.message })
  }
})

servidor.listen(PUERTO, '127.0.0.1', () => {
  console.log(`Diagramas de Convivir en http://localhost:${PUERTO}`)
})
