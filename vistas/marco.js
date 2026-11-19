// Marco común de las vistas de Convivir: barra, navegación por rol, tema y
// comportamientos pequeños (diálogos, pestañas, confirmaciones).
// Cada página declara en <body> su rol y su sección:
//   <body data-rol="administrador" data-seccion="inmuebles" data-sub="tipos">
// Con ?como=consejo una página de administrador se ve como la ve el consejo,
// y todo lo marcado con data-solo="administrador" se oculta.
(function () {
  'use strict'

  var raiz = document.documentElement
  var CLAVE_TEMA = 'convivir-tema'
  var BASE = (document.currentScript && document.currentScript.src) || location.href
  BASE = BASE.slice(0, BASE.lastIndexOf('/') + 1)

  // ---------- Tema: se aplica antes de pintar para que no parpadee ----------
  function leerTema() {
    try { return localStorage.getItem(CLAVE_TEMA) || 'auto' } catch (e) { return 'auto' }
  }
  function aplicarTema(tema) {
    if (tema === 'light' || tema === 'dark') raiz.setAttribute('data-theme', tema)
    else raiz.removeAttribute('data-theme')
    var botones = document.querySelectorAll('[data-tema]')
    for (var i = 0; i < botones.length; i++) botones[i].setAttribute('aria-pressed', String(botones[i].getAttribute('data-tema') === tema))
  }
  function elegirTema(tema) {
    try { localStorage.setItem(CLAVE_TEMA, tema) } catch (e) { /* sin almacenamiento */ }
    aplicarTema(tema)
  }
  function temaEsOscuro() {
    var forzado = raiz.getAttribute('data-theme')
    return forzado ? forzado === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches
  }
  aplicarTema(leerTema())

  // ---------- Quién usa la aplicación y qué ve ----------
  var ROLES = {
    administrador: {
      persona: 'Paula Ortega', iniciales: 'PO', cargo: 'Administradora',
      inicio: 'administrador/inicio.html',
      navegacion: [
        { id: 'inicio', nombre: 'Inicio', ruta: 'administrador/inicio.html' },
        { id: 'inmuebles', nombre: 'Inmuebles', ruta: 'administrador/inmuebles.html', sub: [
          { id: 'inmuebles', nombre: 'Inmuebles', ruta: 'administrador/inmuebles.html' },
          { id: 'tipos', nombre: 'Tipos de inmueble', ruta: 'administrador/tipos-inmueble.html' },
          { id: 'parqueaderos', nombre: 'Parqueaderos y cesiones', ruta: 'administrador/parqueaderos.html' },
          { id: 'vehiculos', nombre: 'Vehículos', ruta: 'administrador/vehiculos.html' },
        ] },
        { id: 'residentes', nombre: 'Personas', ruta: 'administrador/integrantes.html' },
        { id: 'cartera', nombre: 'Cartera', ruta: 'administrador/obligaciones.html', sub: [
          { id: 'obligaciones', nombre: 'Obligaciones', ruta: 'administrador/obligaciones.html' },
          { id: 'pago', nombre: 'Registrar pago', ruta: 'administrador/pago-presencial.html' },
          { id: 'estado', nombre: 'Estado de cartera', ruta: 'administrador/cartera.html' },
        ] },
        { id: 'reservas', nombre: 'Reservas', ruta: 'administrador/reservas.html' },
        { id: 'reportes', nombre: 'Reportes', ruta: 'administrador/reportes.html' },
        { id: 'administracion', nombre: 'Administración', ruta: 'administrador/usuarios.html', sub: [
          { id: 'usuarios', nombre: 'Usuarios y roles', ruta: 'administrador/usuarios.html' },
          { id: 'auditoria', nombre: 'Auditoría', ruta: 'administrador/auditoria.html' },
          { id: 'notificaciones', nombre: 'Notificaciones', ruta: 'administrador/notificaciones.html' },
          { id: 'copropiedad', nombre: 'Copropiedad', ruta: 'administrador/copropiedad.html' },
        ] },
      ],
    },
    vigilante: {
      persona: 'Jhon Rojas', iniciales: 'JR', cargo: 'Vigilante · turno noche',
      inicio: 'vigilante/porteria.html',
      navegacion: [
        { id: 'personas', nombre: 'Personas', ruta: 'vigilante/porteria.html' },
        { id: 'vehiculos', nombre: 'Vehículos', ruta: 'vigilante/vehiculos.html' },
        { id: 'presentes', nombre: 'Dentro del conjunto', ruta: 'vigilante/presentes.html' },
        { id: 'novedad', nombre: 'Reportar novedad', ruta: 'vigilante/reportar.html' },
      ],
    },
    residente: {
      persona: 'Lucía Mendoza', iniciales: 'LM', cargo: 'Arrendataria · Torre B · Apto 302',
      inicio: 'residente/inicio.html',
      inmuebles: [
        { nombre: 'Torre B · Apto 302', vinculo: 'Arrendataria residente', actual: true },
      ],
      navegacion: [
        { id: 'inicio', nombre: 'Inicio', ruta: 'residente/inicio.html' },
        { id: 'visitas', nombre: 'Visitas', ruta: 'residente/visitas.html' },
        { id: 'pagos', nombre: 'Pagos', ruta: 'residente/pagos.html' },
        { id: 'reservas', nombre: 'Reservas', ruta: 'residente/reservas.html' },
        { id: 'reportes', nombre: 'Reportes', ruta: 'residente/reportes.html' },
        { id: 'vehiculos', nombre: 'Vehículos', ruta: 'residente/vehiculos.html' },
      ],
    },
    consejo: {
      persona: 'Hernán Ruiz', iniciales: 'HR', cargo: 'Consejo · tesorero',
      inicio: 'administrador/cartera.html?como=consejo',
      navegacion: [
        { id: 'cartera', nombre: 'Cartera', ruta: 'administrador/cartera.html?como=consejo', sub: null },
        { id: 'administracion', nombre: 'Auditoría', ruta: 'administrador/auditoria.html?como=consejo' },
      ],
    },
  }
  var COPROPIEDAD = 'Villa Campestre'

  var parametros = new URLSearchParams(location.search)

  function url(ruta) { return new URL(ruta, BASE).href }

  function rolActual() {
    var pedido = parametros.get('como')
    if (pedido && ROLES[pedido]) return pedido
    return (document.body && document.body.getAttribute('data-rol')) || 'administrador'
  }

  // ---------- Construcción de la barra ----------
  var LOGO = '<svg width="24" height="24" viewBox="0 0 34 34" aria-hidden="true">' +
    '<rect x="1" y="1" width="32" height="32" rx="5" fill="none" stroke="var(--convivir)" stroke-width="2.4"/>' +
    '<rect x="8" y="8" width="7" height="7" fill="var(--convivir)"/>' +
    '<rect x="19" y="8" width="7" height="7" fill="var(--convivir)" opacity=".35"/>' +
    '<rect x="8" y="19" width="7" height="7" fill="var(--convivir)" opacity=".35"/>' +
    '<rect x="19" y="19" width="7" height="7" fill="var(--convivir)"/></svg>'

  function el(etiqueta, atributos, hijos) {
    var nodo = document.createElement(etiqueta)
    for (var clave in atributos || {}) {
      if (clave === 'texto') nodo.textContent = atributos[clave]
      else if (clave === 'html') nodo.innerHTML = atributos[clave]
      else nodo.setAttribute(clave, atributos[clave])
    }
    ;(hijos || []).forEach(function (h) { if (h) nodo.appendChild(h) })
    return nodo
  }

  function construirBarra() {
    var cuerpo = document.body
    if (cuerpo.hasAttribute('data-sin-marco')) return
    var clave = rolActual()
    var rol = ROLES[clave]
    var seccion = cuerpo.getAttribute('data-seccion')
    var sub = cuerpo.getAttribute('data-sub')
    // Si la página es de administrador y se ve como consejo, la sección activa es la del consejo.
    if (clave === 'consejo' && seccion === 'cartera') sub = null

    var marca = el('a', { class: 'marca', href: url('index.html'), title: 'Todas las vistas', html: LOGO + '<span class="nombre">CONVIVIR</span>' })

    var nav = el('nav', { class: 'navegacion', 'aria-label': 'Secciones' })
    var actual = null
    rol.navegacion.forEach(function (item) {
      var a = el('a', { href: url(item.ruta), texto: item.nombre })
      if (item.id === seccion) { a.setAttribute('aria-current', 'page'); actual = item }
      nav.appendChild(a)
    })

    var luna = el('button', { class: 'luna', type: 'button', 'aria-label': 'Cambiar entre tema claro y oscuro', title: 'Cambiar tema', texto: '◐' })
    luna.addEventListener('click', function () { elegirTema(temaEsOscuro() ? 'light' : 'dark') })

    var boton = el('button', { class: 'cuenta', type: 'button', 'aria-haspopup': 'true', 'aria-expanded': 'false' }, [
      el('span', { class: 'avatar', texto: rol.iniciales }),
      el('span', { class: 'quien', html: '<b></b><span></span>' }),
    ])
    boton.querySelector('b').textContent = rol.persona
    boton.querySelector('.quien span').textContent = clave === 'residente' ? rol.inmuebles[0].nombre : COPROPIEDAD

    var menu = construirMenu(clave, rol)
    var envoltura = el('div', { class: 'menu-cuenta' }, [boton, menu])
    boton.addEventListener('click', function (e) {
      e.stopPropagation()
      var abierto = menu.hidden
      menu.hidden = !abierto
      boton.setAttribute('aria-expanded', String(abierto))
    })
    document.addEventListener('click', function (e) {
      if (!envoltura.contains(e.target)) { menu.hidden = true; boton.setAttribute('aria-expanded', 'false') }
    })
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) { menu.hidden = true; boton.setAttribute('aria-expanded', 'false'); boton.focus() }
    })

    var barra = el('header', { class: 'barra' }, [marca, nav, el('div', { class: 'usuario' }, [luna, envoltura])])
    cuerpo.insertBefore(barra, cuerpo.firstChild)

    if (actual && actual.sub) {
      var dentro = el('div', { class: 'dentro' })
      actual.sub.forEach(function (s) {
        var a = el('a', { href: url(s.ruta) + (clave !== cuerpo.getAttribute('data-rol') ? (s.ruta.indexOf('?') < 0 ? '?' : '&') + 'como=' + clave : ''), texto: s.nombre })
        if (s.id === sub) a.setAttribute('aria-current', 'page')
        dentro.appendChild(a)
      })
      barra.insertAdjacentElement('afterend', el('nav', { class: 'subnavegacion', 'aria-label': actual.nombre }, [dentro]))
    }

    // Lo que solo puede hacer otro rol no se muestra.
    var restringidos = document.querySelectorAll('[data-solo]')
    for (var i = 0; i < restringidos.length; i++) {
      var permitidos = restringidos[i].getAttribute('data-solo').split(/\s+/)
      if (permitidos.indexOf(clave) < 0) restringidos[i].hidden = true
    }
    var exclusivos = document.querySelectorAll('[data-solo-como]')
    for (var j = 0; j < exclusivos.length; j++) {
      if (exclusivos[j].getAttribute('data-solo-como') !== clave) exclusivos[j].hidden = true
    }
  }

  function construirMenu(clave, rol) {
    var menu = el('div', { class: 'menu', role: 'menu', hidden: '' })
    var cabeza = el('div', { style: 'padding:var(--e2) var(--e3) var(--e3)' }, [
      el('div', { class: 'fuerte', texto: rol.persona }),
      el('div', { class: 'guia', texto: rol.cargo + ' · ' + COPROPIEDAD }),
    ])
    menu.appendChild(cabeza)

    if (rol.inmuebles) {
      menu.appendChild(el('hr'))
      menu.appendChild(el('div', { class: 'titulo-menu', texto: 'Tus inmuebles' }))
      rol.inmuebles.forEach(function (i) {
        var b = el('button', { type: 'button', role: 'menuitem' }, [
          el('span', { html: '<span class="identificador"></span><br><small class="guia"></small>' }),
          i.actual ? el('span', { class: 'pildora p-az', texto: 'Actual' }) : null,
        ])
        b.querySelector('.identificador').textContent = i.nombre
        b.querySelector('small').textContent = i.vinculo
        menu.appendChild(b)
      })
    }

    menu.appendChild(el('hr'))
    menu.appendChild(el('div', { class: 'titulo-menu', texto: 'Tema' }))
    var temas = el('div', { class: 'segmentos', style: 'margin:0 var(--e3) var(--e2);display:flex' })
    ;[['light', 'Claro'], ['dark', 'Oscuro'], ['auto', 'Sistema']].forEach(function (t) {
      var b = el('button', { type: 'button', 'data-tema': t[0], 'aria-pressed': String(leerTema() === t[0]), texto: t[1], style: 'flex:1' })
      // El clic sube al manejador general de [data-tema]; aquí solo se evita que cierre el menú.
      temas.appendChild(b)
    })
    menu.appendChild(temas)

    menu.appendChild(el('hr'))
    menu.appendChild(el('div', { class: 'titulo-menu', texto: 'Ver la aplicación como' }))
    ;[['administrador', 'Administrador'], ['vigilante', 'Vigilante'], ['residente', 'Residente'], ['consejo', 'Miembro del consejo']].forEach(function (r) {
      var a = el('a', { href: url(ROLES[r[0]].inicio), role: 'menuitem', texto: r[1] })
      if (r[0] === clave) a.setAttribute('aria-current', 'true')
      menu.appendChild(a)
    })

    menu.appendChild(el('hr'))
    menu.appendChild(el('a', { href: url('iniciar-sesion.html'), role: 'menuitem', texto: 'Cerrar sesión' }))
    return menu
  }

  // ---------- Comportamientos de las páginas ----------
  var Convivir = {}

  Convivir.pesos = function (valor) {
    var signo = valor < 0 ? '−' : ''
    var entero = Math.round(Math.abs(valor)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    return signo + '$ ' + entero
  }

  Convivir.confirmar = function (texto, tono) {
    var pila = document.querySelector('.confirmaciones')
    if (!pila) { pila = el('div', { class: 'confirmaciones', role: 'status', 'aria-live': 'polite' }); document.body.appendChild(pila) }
    var aviso = el('div', { class: 'confirmacion' + (tono ? ' ' + tono : ''), texto: texto })
    pila.appendChild(aviso)
    setTimeout(function () { aviso.remove() }, 4200)
  }

  Convivir.abrir = function (id) {
    var dialogo = document.getElementById(id)
    if (dialogo && dialogo.showModal) dialogo.showModal()
  }

  Convivir.validar = function (formulario) {
    var valido = true
    var campos = formulario.querySelectorAll('[required]')
    for (var i = 0; i < campos.length; i++) {
      var c = campos[i]
      var contenedor = c.closest('.campo')
      var previo = contenedor && contenedor.querySelector('.error[data-generado]')
      if (previo) previo.remove()
      c.removeAttribute('aria-invalid')
      var vacio = c.type === 'checkbox' ? !c.checked : !String(c.value).trim()
      if (vacio && !c.disabled && !c.closest('[hidden]')) {
        valido = false
        c.setAttribute('aria-invalid', 'true')
        if (contenedor) {
          // Cada campo obligatorio trae su propio data-error que explica y dirige.
          var mensaje = c.getAttribute('data-error') || 'Completa este dato para continuar.'
          contenedor.appendChild(el('span', { class: 'error', 'data-generado': '', texto: mensaje }))
        }
      }
    }
    var primero = formulario.querySelector('[aria-invalid="true"]')
    if (primero) primero.focus()
    return valido
  }

  function activarComportamientos() {
    document.addEventListener('click', function (e) {
      var abrir = e.target.closest('[data-abrir]')
      if (abrir) { e.preventDefault(); Convivir.abrir(abrir.getAttribute('data-abrir')) }
      var tema = e.target.closest('[data-tema]')
      if (tema) elegirTema(tema.getAttribute('data-tema'))
      var cerrar = e.target.closest('[data-cerrar]')
      if (cerrar) { var d = cerrar.closest('dialog'); if (d) { e.preventDefault(); d.close() } }

      // Pestañas: <div class="pestanas" role="tablist"><button aria-controls="panel">
      var pestana = e.target.closest('.pestanas [role="tab"]')
      if (pestana) {
        var grupo = pestana.closest('.pestanas')
        grupo.querySelectorAll('[role="tab"]').forEach(function (p) {
          var activa = p === pestana
          p.setAttribute('aria-selected', String(activa))
          var panel = document.getElementById(p.getAttribute('aria-controls'))
          if (panel) panel.hidden = !activa
        })
      }

      // Segmentos: un solo botón presionado por grupo
      var segmento = e.target.closest('.segmentos[data-grupo] button')
      if (segmento) {
        segmento.parentNode.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String(b === segmento)) })
        segmento.parentNode.dispatchEvent(new CustomEvent('cambio', { detail: segmento.getAttribute('data-valor'), bubbles: true }))
      }
    })

    // Formularios con data-confirmar: validan, cierran su diálogo y confirman con el verbo del botón.
    document.addEventListener('submit', function (e) {
      var formulario = e.target
      if (!formulario.hasAttribute('data-confirmar')) return
      e.preventDefault()
      if (!Convivir.validar(formulario)) return
      var evento = new CustomEvent('confirmado', { cancelable: true, bubbles: true })
      if (!formulario.dispatchEvent(evento)) return
      var d = formulario.closest('dialog')
      if (d) d.close()
      Convivir.confirmar(formulario.getAttribute('data-confirmar'))
      if (formulario.hasAttribute('data-limpiar')) formulario.reset()
    })

    // Quitar el error en cuanto el usuario corrige.
    document.addEventListener('input', function (e) {
      if (e.target.getAttribute && e.target.getAttribute('aria-invalid') === 'true' && String(e.target.value).trim()) {
        e.target.removeAttribute('aria-invalid')
        var c = e.target.closest('.campo')
        var error = c && c.querySelector('.error[data-generado]')
        if (error) error.remove()
      }
    })

    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { if (leerTema() === 'auto') aplicarTema('auto') })
  }

  window.Convivir = Convivir

  document.addEventListener('DOMContentLoaded', function () {
    construirBarra()
    aplicarTema(leerTema())
    activarComportamientos()
  })
})()
