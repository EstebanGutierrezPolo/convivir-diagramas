// Visor y editor de los diagramas de Convivir.
// Cada diagrama es un archivo de texto (Mermaid) en la carpeta "fuentes".
/* global mermaid, marked */

const $ = (id) => document.getElementById(id)

const RUTA_COMPLETO = 'clases/_completo' // no es un archivo: se arma uniendo los modulos de clases

const ATAJOS = {
  clases: [
    ['Clase', 'class NuevaClase {\n    +atributo : String\n    +metodo() : void\n}'],
    ['Enumeración', 'class NuevoEstado {\n    <<enumeration>>\n    VALOR_UNO\n    VALOR_DOS\n}'],
    ['Asociación', 'ClaseA "1" --> "*" ClaseB : etiqueta'],
    ['Agregación', 'ClaseA "1" o-- "*" ClaseB : etiqueta'],
    ['Composición', 'ClaseA "1" *-- "*" ClaseB : etiqueta'],
    ['Herencia', 'ClasePadre <|-- ClaseHija'],
    ['Realización', 'Interfaz <|.. ClaseQueImplementa'],
    ['Dependencia', 'ClaseA ..> ClaseB : usa'],
  ],
  secuencia: [
    ['Actor', '    actor A as Nombre del actor'],
    ['Participante', '    participant X as NombreDeLaClase'],
    ['Mensaje', '    A->>B: mensaje()'],
    ['Respuesta', '    B-->>A: respuesta'],
    ['Alternativa', '    alt condición\n        A->>B: mensaje()\n    else otro caso\n        A->>B: otroMensaje()\n    end'],
    ['Opcional', '    opt condición\n        A->>B: mensaje()\n    end'],
    ['Ciclo', '    loop por cada elemento\n        A->>B: mensaje()\n    end'],
    ['Nota', '    Note over A,B: texto de la nota'],
  ],
  flujo: [
    ['Caja', '    idNuevo["Texto"]'],
    ['Caso de uso', '    cu99(["CU-99 Nombre del caso de uso"])'],
    ['Actor', '    actorNuevo["👤<br/>Nombre"]:::actor'],
    ['Base de datos', '    bd[("Nombre")]'],
    ['Línea', '    a --- b'],
    ['Flecha', '    a -->|etiqueta| b'],
    ['Punteada', '    a -.->|«include»| b'],
    ['Grupo', '    subgraph grupoNuevo["Título del grupo"]\n        id1["Texto"]\n    end'],
  ],
  notas: [],
}

const PLANTILLAS = {
  clases: (t) => `%% titulo: ${t}\nclassDiagram\ndirection TB\n\nclass NuevaClase {\n    +atributo : String\n}\n`,
  secuencia: (t) => `%% titulo: ${t}\nsequenceDiagram\n    autonumber\n    actor A as Actor\n    participant B as Sistema\n    A->>B: mensaje()\n    B-->>A: respuesta\n`,
  flujo: (t) => `%% titulo: ${t}\nflowchart LR\n    a["Inicio"] --> b["Fin"]\n`,
  notas: (t) => `<!-- titulo: ${t} -->\n# ${t}\n`,
}

const estado = {
  indice: [],
  pestana: null,
  diagrama: null,
  textoGuardado: '',
  soloLectura: false,
  vista: { escala: 1, x: 0, y: 0 },
  contador: 0,
  temporizador: null,
}

// ---------- Tema (sistema de diseño de Convivir) ----------

const raiz = document.documentElement
const preferenciaOscura = matchMedia('(prefers-color-scheme: dark)')

function leerTema() {
  try { return localStorage.getItem('convivir-tema') || 'auto' } catch { return 'auto' }
}

function temaEsOscuro() {
  const forzado = raiz.getAttribute('data-theme')
  return forzado ? forzado === 'dark' : preferenciaOscura.matches
}

// Los diagramas leen los mismos tokens que el resto de la página.
function variablesDelTema() {
  const estilo = getComputedStyle(raiz)
  const t = (nombre) => estilo.getPropertyValue(nombre).trim()
  return {
    darkMode: temaEsOscuro(),
    fontFamily: 'Archivo, system-ui, sans-serif',
    background: t('--papel'),
    primaryColor: t('--convivir-c'),
    primaryTextColor: t('--tinta'),
    primaryBorderColor: t('--convivir'),
    secondaryColor: t('--concreto'),
    tertiaryColor: t('--papel'),
    mainBkg: t('--convivir-c'),
    textColor: t('--tinta'),
    titleColor: t('--tinta'),
    classText: t('--tinta'),
    lineColor: t('--acero'),
    clusterBkg: t('--fondo'),
    clusterBorder: t('--borde'),
    edgeLabelBackground: t('--papel'),
    noteBkgColor: t('--concreto'),
    noteTextColor: t('--tinta'),
    noteBorderColor: t('--borde'),
    actorBkg: t('--convivir-c'),
    actorBorder: t('--convivir'),
    actorTextColor: t('--tinta'),
    actorLineColor: t('--borde'),
    signalColor: t('--acero'),
    signalTextColor: t('--tinta'),
    labelBoxBkgColor: t('--concreto'),
    labelBoxBorderColor: t('--borde'),
    labelTextColor: t('--tinta'),
    loopTextColor: t('--tinta'),
    activationBkgColor: t('--concreto'),
    activationBorderColor: t('--acero'),
    sequenceNumberColor: t('--papel'),
  }
}

function configurarMermaid(variables = variablesDelTema()) {
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base',
    themeVariables: variables,
    suppressErrorRendering: true,
    maxTextSize: 300000,
    maxEdges: 3000,
    flowchart: { useMaxWidth: false },
    sequence: { useMaxWidth: false },
    class: { useMaxWidth: false },
  })
}

function aplicarTema(tema) {
  if (tema === 'auto') raiz.removeAttribute('data-theme')
  else raiz.setAttribute('data-theme', tema)
  for (const boton of document.querySelectorAll('.conmutador button')) {
    boton.setAttribute('aria-pressed', String(boton.dataset.t === tema))
  }
  configurarMermaid()
  if (estado.diagrama) dibujar($('texto').value)
}

function elegirTema(tema) {
  try { localStorage.setItem('convivir-tema', tema) } catch { /* sin almacenamiento */ }
  aplicarTema(tema)
}

// ---------- Datos ----------

async function pedir(url, opciones) {
  const respuesta = await fetch(url, opciones)
  if (!respuesta.ok) {
    const detalle = await respuesta.json().catch(() => ({}))
    throw new Error(detalle.error || `Error ${respuesta.status}`)
  }
  return respuesta
}

async function cargarIndice() {
  estado.indice = await (await pedir('/api/indice')).json()
  const clases = estado.indice.find((p) => p.carpeta === 'clases')
  if (clases && clases.diagramas.length > 1) {
    clases.diagramas.unshift({ ruta: RUTA_COMPLETO, titulo: 'Diagrama completo (se arma solo)' })
  }
}

async function leerFuente(ruta) {
  if (ruta !== RUTA_COMPLETO) return (await pedir(`/api/fuente?ruta=${encodeURIComponent(ruta)}`)).text()
  // Une todos los modulos de clases en un solo diagrama.
  const modulos = estado.indice.find((p) => p.carpeta === 'clases').diagramas.filter((d) => d.ruta !== RUTA_COMPLETO)
  const textos = await Promise.all(modulos.map((d) => leerFuente(d.ruta)))
  const cuerpo = textos.map((texto) =>
    texto
      .split('\n')
      .filter((linea) => !/^\s*(classDiagram|direction\s+\w+|%%\s*titulo:.*)\s*$/.test(linea))
      .join('\n'),
  )
  return ['classDiagram', 'direction TB', ...cuerpo].join('\n')
}

// ---------- Pintar ----------

function pintarPestanas() {
  $('pestanas').replaceChildren(
    ...estado.indice.map((pestana) => {
      const boton = document.createElement('button')
      boton.textContent = pestana.titulo
      boton.className = pestana === estado.pestana ? 'activa' : ''
      boton.onclick = () => abrir((pestana.diagramas[0] || {}).ruta, pestana)
      return boton
    }),
  )
}

function pintarLista() {
  $('lista-diagramas').replaceChildren(
    ...estado.pestana.diagramas.map((diagrama) => {
      const item = document.createElement('li')
      const boton = document.createElement('button')
      boton.textContent = diagrama.titulo
      boton.className = diagrama === estado.diagrama ? 'activo' : ''
      boton.onclick = () => abrir(diagrama.ruta)
      item.append(boton)
      return item
    }),
  )
}

function pintarAtajos() {
  const atajos = estado.soloLectura ? [] : ATAJOS[estado.pestana.tipo] || []
  $('atajos').replaceChildren(
    ...atajos.map(([nombre, texto]) => {
      const boton = document.createElement('button')
      boton.textContent = `+ ${nombre}`
      boton.title = texto
      boton.onclick = () => insertarEnEditor(texto)
      return boton
    }),
  )
}

function mostrarError(mensaje, causa = 'El texto del diagrama tiene un error y se muestra la última versión válida') {
  $('aviso-error').hidden = !mensaje
  $('aviso-error').textContent = mensaje ? `${causa}: ${mensaje}` : ''
}

async function dibujar(texto, { ajustarVista = false } = {}) {
  const dibujo = $('dibujo')
  if (estado.pestana.tipo === 'notas') {
    estado.contador++
    $('lienzo').classList.remove('ocupado')
    dibujo.className = 'dibujo documento'
    dibujo.style.transform = ''
    dibujo.innerHTML = marked.parse(texto)
    mostrarError('')
    return
  }
  // Si mientras se dibuja llega otro pedido (otro diagrama u otra tecla), este resultado se descarta.
  const turno = ++estado.contador
  $('lienzo').classList.add('ocupado')
  try {
    const { svg } = await mermaid.render(`grafico${turno}`, texto)
    if (turno !== estado.contador) return
    $('lienzo').classList.remove('ocupado')
    dibujo.className = 'dibujo'
    dibujo.innerHTML = svg
    const grafico = dibujo.querySelector('svg')
    const caja = grafico.viewBox.baseVal
    if (caja && caja.width) {
      grafico.setAttribute('width', caja.width)
      grafico.setAttribute('height', caja.height)
    }
    grafico.style.maxWidth = 'none'
    mostrarError('')
    if (ajustarVista) ajustar()
    else aplicarVista()
  } catch (error) {
    if (turno !== estado.contador) return
    $('lienzo').classList.remove('ocupado')
    if (dibujo.classList.contains('documento')) {
      // Venía de una nota: no dejar su texto bajo el título de un diagrama.
      dibujo.className = 'dibujo'
      dibujo.innerHTML = ''
    }
    mostrarError(String(error.message || error).split('\n').slice(0, 6).join(' '))
  }
}

// ---------- Zoom y arrastre ----------

function aplicarVista() {
  const { escala, x, y } = estado.vista
  if (estado.pestana.tipo === 'notas') return
  $('dibujo').style.transform = `translate(${x}px, ${y}px) scale(${escala})`
}

function ajustar() {
  const grafico = $('dibujo').querySelector('svg')
  if (!grafico) return
  const lienzo = $('lienzo').getBoundingClientRect()
  const ancho = Number(grafico.getAttribute('width')) || 1
  const alto = Number(grafico.getAttribute('height')) || 1
  const escala = Math.min((lienzo.width - 32) / ancho, (lienzo.height - 32) / alto, 1.5)
  estado.vista = { escala, x: (lienzo.width - ancho * escala) / 2, y: Math.max(16, (lienzo.height - alto * escala) / 2) }
  aplicarVista()
}

function acercar(factor, centroX, centroY) {
  const lienzo = $('lienzo').getBoundingClientRect()
  const cx = centroX ?? lienzo.width / 2
  const cy = centroY ?? lienzo.height / 2
  const anterior = estado.vista.escala
  const escala = Math.min(6, Math.max(0.05, anterior * factor))
  estado.vista.x = cx - ((cx - estado.vista.x) * escala) / anterior
  estado.vista.y = cy - ((cy - estado.vista.y) * escala) / anterior
  estado.vista.escala = escala
  aplicarVista()
}

function activarArrastre() {
  const lienzo = $('lienzo')
  let origen = null
  lienzo.addEventListener('wheel', (evento) => {
    if (estado.pestana.tipo === 'notas') return
    evento.preventDefault()
    const caja = lienzo.getBoundingClientRect()
    acercar(evento.deltaY < 0 ? 1.12 : 1 / 1.12, evento.clientX - caja.left, evento.clientY - caja.top)
  }, { passive: false })
  lienzo.addEventListener('pointerdown', (evento) => {
    if (estado.pestana.tipo === 'notas') return
    origen = { x: evento.clientX - estado.vista.x, y: evento.clientY - estado.vista.y }
    lienzo.setPointerCapture(evento.pointerId)
    lienzo.classList.add('arrastrando')
  })
  lienzo.addEventListener('pointermove', (evento) => {
    if (!origen) return
    estado.vista.x = evento.clientX - origen.x
    estado.vista.y = evento.clientY - origen.y
    aplicarVista()
  })
  const soltar = () => { origen = null; lienzo.classList.remove('arrastrando') }
  lienzo.addEventListener('pointerup', soltar)
  lienzo.addEventListener('pointercancel', soltar)
}

// ---------- Editor ----------

function hayCambiosSinGuardar() {
  return !estado.soloLectura && $('texto').value !== estado.textoGuardado
}

// El estado se dice con píldora: punto, palabra y color. 'ok' guardado, 'al' pendiente, 'no' falló, 'ne' neutro.
function pintarEstadoGuardado(mensaje, tono = 'ne') {
  const pendiente = hayCambiosSinGuardar()
  const pildora = $('estado-guardado')
  pildora.textContent = mensaje ?? (pendiente ? 'Cambios sin guardar' : 'Guardado')
  pildora.className = `pildora p-${mensaje === undefined ? (pendiente ? 'al' : 'ok') : tono}`
  $('boton-guardar').disabled = estado.soloLectura || !pendiente
}

function insertarEnEditor(fragmento) {
  const texto = $('texto')
  const valor = texto.value
  const finDeLinea = valor.indexOf('\n', texto.selectionEnd)
  const posicion = finDeLinea === -1 ? valor.length : finDeLinea
  const antes = valor.slice(0, posicion)
  const insercion = `${antes.endsWith('\n') || antes === '' ? '' : '\n'}${fragmento}`
  texto.value = antes + insercion + valor.slice(posicion)
  texto.focus()
  texto.selectionStart = antes.length + (insercion.startsWith('\n') ? 1 : 0)
  texto.selectionEnd = antes.length + insercion.length
  alCambiarTexto()
}

function alCambiarTexto() {
  pintarEstadoGuardado()
  clearTimeout(estado.temporizador)
  estado.temporizador = setTimeout(() => dibujar($('texto').value), 350)
}

async function guardar() {
  if (!hayCambiosSinGuardar()) return
  const contenido = $('texto').value
  try {
    await pedir(`/api/fuente?ruta=${encodeURIComponent(estado.diagrama.ruta)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contenido }),
    })
    estado.textoGuardado = contenido
    pintarEstadoGuardado()
    // El titulo sale de la primera linea del archivo: se refresca la lista por si cambio.
    const ruta = estado.diagrama.ruta
    await cargarIndice()
    seleccionar(ruta)
    pintarPestanas()
    pintarLista()
    $('titulo-diagrama').textContent = estado.diagrama.titulo
  } catch (error) {
    pintarEstadoGuardado(`No se guardó: ${error.message}`, 'no')
  }
}

function mostrarEditor(visible) {
  $('panel-editor').hidden = !visible
  $('boton-editar').textContent = visible ? 'Cerrar editor' : 'Editar diagrama'
  try { localStorage.setItem('editorAbierto', visible ? '1' : '0') } catch { /* sin almacenamiento */ }
  if (estado.diagrama) requestAnimationFrame(ajustar)
}

// ---------- Navegacion ----------

function seleccionar(ruta) {
  for (const pestana of estado.indice) {
    const diagrama = pestana.diagramas.find((d) => d.ruta === ruta)
    if (diagrama) { estado.pestana = pestana; estado.diagrama = diagrama; return true }
  }
  return false
}

async function abrir(ruta, pestanaVacia) {
  if (hayCambiosSinGuardar() && !confirm('Hay cambios sin guardar en este diagrama. ¿Salir y descartarlos?')) return
  if (!ruta || !seleccionar(ruta)) {
    estado.pestana = pestanaVacia || estado.indice[0]
    estado.diagrama = null
  }
  pintarPestanas()
  pintarLista()
  estado.soloLectura = !estado.diagrama || estado.diagrama.ruta === RUTA_COMPLETO
  $('nota-solo-lectura').hidden = !estado.diagrama || estado.diagrama.ruta !== RUTA_COMPLETO
  $('nota-solo-lectura').textContent = 'Este diagrama se arma uniendo los módulos. Para cambiarlo, edita el módulo que corresponda.'
  $('texto').readOnly = estado.soloLectura
  pintarAtajos()

  if (!estado.diagrama) {
    $('titulo-diagrama').textContent = 'Todavía no hay diagramas aquí. Crea uno con «Nuevo diagrama».'
    $('dibujo').innerHTML = ''
    $('texto').value = ''
    estado.textoGuardado = ''
    pintarEstadoGuardado('')
    return
  }

  $('titulo-diagrama').textContent = estado.diagrama.titulo
  history.replaceState(null, '', `#${estado.diagrama.ruta}`)
  try {
    const texto = await leerFuente(estado.diagrama.ruta)
    $('texto').value = texto
    estado.textoGuardado = texto
    pintarEstadoGuardado(estado.soloLectura ? 'Solo lectura' : undefined)
    await dibujar(texto, { ajustarVista: true })
  } catch (error) {
    // Sin el texto real no se deja editar: guardar escribiría el diagrama anterior en este archivo.
    $('texto').value = ''
    estado.textoGuardado = ''
    estado.soloLectura = true
    $('texto').readOnly = true
    $('dibujo').innerHTML = ''
    pintarAtajos()
    pintarEstadoGuardado('Sin cargar', 'no')
    mostrarError(error.message, 'No se pudo cargar el diagrama')
  }
}

async function crearDiagrama() {
  const titulo = (prompt(`Nombre del nuevo diagrama en "${estado.pestana.titulo}":`) || '').trim()
  if (!titulo) return
  const nombre = titulo
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  if (!nombre) return alert('El nombre necesita al menos una letra o un número.')
  const extension = estado.pestana.tipo === 'notas' ? 'md' : 'mmd'
  const ruta = `${estado.pestana.carpeta}/${nombre}.${extension}`
  try {
    await pedir(`/api/fuente?ruta=${encodeURIComponent(ruta)}&nuevo=1`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contenido: PLANTILLAS[estado.pestana.tipo](titulo) }),
    })
    await cargarIndice()
    await abrir(ruta)
    mostrarEditor(true)
  } catch (error) {
    alert(`No se pudo crear: ${error.message}`)
  }
}

// La imagen descargada va siempre en tema claro, porque su destino es un documento impreso.
async function descargarSvg() {
  if (!estado.diagrama || estado.pestana.tipo === 'notas' || !$('dibujo').querySelector('svg')) return
  const temaForzado = raiz.getAttribute('data-theme')
  raiz.setAttribute('data-theme', 'light')
  const variablesClaras = variablesDelTema()
  if (temaForzado === null) raiz.removeAttribute('data-theme')
  else raiz.setAttribute('data-theme', temaForzado)

  let svg
  try {
    configurarMermaid(variablesClaras)
    svg = (await mermaid.render(`descarga${Date.now()}`, $('texto').value)).svg
  } catch (error) {
    return mostrarError(String(error.message || error).split('\n')[0], 'No se pudo generar la imagen')
  } finally {
    configurarMermaid()
  }
  const molde = document.createElement('div')
  molde.innerHTML = svg
  const copia = molde.querySelector('svg')
  copia.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  copia.style.background = '#FFFFFF'
  const enlace = document.createElement('a')
  enlace.href = URL.createObjectURL(new Blob([copia.outerHTML], { type: 'image/svg+xml' }))
  enlace.download = `${estado.diagrama.ruta.replace(/[/_]+/g, '-').replace(/\.\w+$/, '')}.svg`
  enlace.click()
  URL.revokeObjectURL(enlace.href)
}

// ---------- Arranque ----------

async function iniciar() {
  $('boton-editar').onclick = () => mostrarEditor($('panel-editor').hidden)
  $('boton-guardar').onclick = guardar
  $('boton-nuevo').onclick = crearDiagrama
  $('boton-ajustar').onclick = ajustar
  $('boton-acercar').onclick = () => acercar(1.25)
  $('boton-alejar').onclick = () => acercar(0.8)
  $('boton-svg').onclick = descargarSvg
  $('texto').addEventListener('input', alCambiarTexto)
  document.addEventListener('keydown', (evento) => {
    if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === 's') { evento.preventDefault(); guardar() }
  })
  window.addEventListener('beforeunload', (evento) => { if (hayCambiosSinGuardar()) evento.preventDefault() })
  window.addEventListener('resize', () => estado.diagrama && ajustar())
  activarArrastre()

  let editorAbierto = false
  try { editorAbierto = localStorage.getItem('editorAbierto') === '1' } catch { /* sin almacenamiento */ }
  $('panel-editor').hidden = !editorAbierto
  $('boton-editar').textContent = editorAbierto ? 'Cerrar editor' : 'Editar diagrama'

  for (const boton of document.querySelectorAll('.conmutador button')) boton.onclick = () => elegirTema(boton.dataset.t)
  preferenciaOscura.addEventListener('change', () => { if (leerTema() === 'auto') aplicarTema('auto') })
  // Mermaid mide el texto con la fuente: se espera a Archivo (sin bloquear si no hay internet).
  await Promise.race([document.fonts.load('600 16px Archivo'), new Promise((listo) => setTimeout(listo, 1500))]).catch(() => {})
  aplicarTema(leerTema())

  await cargarIndice()
  const rutaInicial = decodeURIComponent(location.hash.slice(1))
  await abrir(rutaInicial || (estado.indice[0].diagramas[0] || {}).ruta, estado.indice[0])
}

iniciar().catch((error) => mostrarError(error.message))
