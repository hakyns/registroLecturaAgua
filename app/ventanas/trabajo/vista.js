/**
 * @file Cliente ventana usuarios 9 de Marzo del 2018
 * @copyright Joaquin Reyes Sanchez 2018
 * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
 * @version 1.0.0
 */

const electron = require('electron')
const path = require('path')
const {fechas} = require('../../tools/herramietasCustomizadas.js')
const { ipcRenderer } = electron
const dialog = electron.remote.dialog
const BrowserWindow = electron.remote.BrowserWindow

const {tratamiento} = require('../../tools/maquinaDatos')
const {generadorPDF} = require('../../tools/reportes')

var modificarTrabajador = {}

/**
 * @description Iniciadores de componentes materialize
 */
$('select').material_select()
$('ul.tabs').tabs()
$('.datepicker').pickadate({
  selectMonths: true, // Creates a dropdown to control month
  selectYears: 15, // Creates a dropdown of 15 years to control year,
  today: 'Today',
  clear: 'Clear',
  close: 'Ok',
  format: 'yyyy-mm-dd',
  closeOnSelect: false // Close upon selecting a date,
})

/**
 * @class
 * @method nuevo, cambiar, limpiarDatos, eliminarImagen, estadosErrores
 * @description Funcionalidades para cambiar el DOM de la vista html
 */
class estadoTrabajador {
  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @param {boolean} limpiar: Si es true limpiara los datos del formulario y además lva variable global modificarTrabajador, de lo contrario no lo hará
   * @returns {null}
   * @description Devuelve a su estado original el tab del formulario principal
   * @event boton nuevo [id="volverTabNuevo"] del tab cambiar y metodos de este archivo
  */
  nuevo (limpiar = true) {
    $('#trabajador').text('Asignar')
    $('button[type="submit"]').text('Asignar')

    $('#volverTabAsignar').remove()

    const errores = {
      usuario: [],
      llave: [],
      zona_trabajo: [],
      fecha_inicio: [],
      fecha_fin: [],
      minutos_trabajados: [],
      estado: []
    }

    Object.keys(errores).forEach(key => this.estadosErrores(key, errores[key]))

    if (limpiar) {
      this.limpiarDatos()
      modificarTrabajador = {}

      ipcRenderer.send('trabajo_componentes')
      trab.cargarEntregaDatos()
      $('select[name="usuario"]').prop('disabled', false)
      $('select[name="usuario"]').material_select()
    }
  }

  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @returns {null}
   * @description Resetea el tab nuevo para cambiarlo a tab cambiar
   * @event boton modificar del card Usuario
  */
  cambiar () {
    this.nuevo(false)

    $('#trabajador').text('Reasignar')
    $('button[type="submit"]').text('Reasignar')

    const botonAsignar = `
      <div class="row" id="volverTabAsignar">
        <div class="container">
          <div class="col s12 right-align">
            <button class="btn waves-effect waves-light center-align cyan darken-2" type="button" onclick="eTrabajador.nuevo()"> Asignar
            </button>
            <br>
          </div>
        </div>
      </div>
    `

    $('#asignar').find('.container').find('.row').find('form').prepend(botonAsignar)
    $('button[type="submit"]').removeClass('disabled')
  }

  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @returns {null}
   * @description Limpia todos los campos sensibles del form tab nuevo o tab cambiar
   * @event boton limpiar [id="limpiar"] del tab nuevo y metodos de este archivo
  */
  limpiarDatos () {
    $('#llave').val('')
    // $('#fecha_inicio').val('')
    // $('#fecha_fin').val('')
    // $('#minutos_trabajados').val('')
    $('#deshabilitado').prop('checked', true)

    $('select').prop('selectedIndex', 0)
    $('select').material_select()
  }

  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @param {string} id: Identificador del input al cual se va a mostrar el error
   * @param {string} error: Mensaje de error que se va a mostrar
   * @returns {null}
   * @description Muestra los errores presentados en los campos especificos cuando se haya observado algun fallo en el dato sensible
   * @event boton submit [type="submit"]
  */
  estadosErrores(id, error) {
    if (error.length) {

      switch ($('#' + id).parent().attr('class')) {
        case 'row':
          $('#' + id).find('.error').html('<div class="card-panel red-text text-darken-1 caja-error">' + error[0] + '</div>')
          break

        default:
          $('#' + id).siblings('.error').html('<div class="card-panel red-text text-darken-1 caja-error">' + error[0] + '</div>')
      }

      $('input, textarea').addClass('input-error')

    } else {
      switch ($('#' + id).parent().attr('class')) {
        case 'row':
          $('#' + id).find('.error').empty()
          break

        default:
          $('#' + id).siblings('.error').empty()
      }

      $('input, textarea').removeClass('input-error')
    }
  }
} const eTrabajador = new estadoTrabajador()

/**
 * @class
 * @constructor
 * @method tablaCrear, eventoTabla, eventoTablaPanel, eventoResetarTabla, seleccionUsuario, seleccionUsuario, cargarDatos
 * @description Creación y manipulación de la tabla de usuarios
 */
class buscarTrabajador {
  constructor() {
    this.eventoTabla()
    this.eventoTablaPanel()
    this.eventoResetarTabla()
    this.generarPDF()

    this.datosTrabajador = null
  }

  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @returns {null}
   * @description Crea la tabla de registros de usuarios creados y modificados
   * @event tab buscar y metodos de este archivo
  */
  tablaCrear () {
    ipcRenderer.on('trabajo_entregaTabla', (e, datos) => {
      const filas = []
      this.datosTrabajador = datos.filas

      datos.filas.forEach(dato => {
        filas.push(`
          <tr onclick="bTrabajador.seleccionTrabajador('${JSON.stringify(dato).replace(/"/gi, '&quot;')}')">
            <td>${dato.idTrabajo}</td>
            <td>${dato.nombre} ${dato.apellidos}</td>
            <td>${dato.zona_trabajo}</td>
            <td>${fechas.fixDate()(dato.fecha_fin, 'longDate')}</td>
            <td>${dato.estado ? 'Habilitado': 'Deshabilitado'}</td>
          </tr>
        `)
      })

      $('table').find('tbody').html(filas.join(''))

      const calendario = $('#fecha_inicio').pickadate()
      const picker = calendario.pickadate('picker')
      picker.set({})

      const calendarioB = $('#fecha_fin').pickadate()
      const pickerB = calendarioB.pickadate('picker')
      pickerB.set({})

      ipcRenderer.removeAllListeners('trabajo_entregaTabla')
    })
  }

  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @returns {null}
   * @description Solicita y crea la tabla de usuarios
   * @event tab buscar [id="tabla"]
  */
  eventoTabla () {
    const tabla = document.getElementById('tabla')

    tabla.addEventListener('click', e => {
      ipcRenderer.send('trabajo_cargaTabla')
      this.tablaCrear()
    })
  }

  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @returns {null}
   * @description Eventos del panel: filtros, card del usuario, pdf y excel
   * @event botones Filtro: buscar, boton... botones Card: modificar, cancelar
  */
  eventoTablaPanel () {
    const selectA = document.getElementById('lecturistaBuscar')
    const selectB = document.getElementById('zonaTrabajoBuscar')

    const modificar = document.getElementById('modalModificar')
    const borrar = document.getElementById('modalBorrar')
    const cancelar = document.getElementById('modalCancelar')

    const pdf = document.getElementById('botonPDF')

    $(selectA).change(() => {
      $(selectB).prop('selectedIndex', 0)
      $(selectB).material_select()

      const valorInput = $(selectA).val()

      if (valorInput) {
        ipcRenderer.send('trabajo_datosTrabajadorBuscar', valorInput)

        this.tablaCrear()
      }
    })

    $(selectB).change(() => {
      $(selectA).prop('selectedIndex', 0)
      $(selectA).material_select()

      const valorInput = $(selectB).val()

      if (valorInput) {
        ipcRenderer.send('trabajo_datosZonaTrabajoBuscar', valorInput)

        this.tablaCrear()
      }
    })

    modificar.addEventListener('click', e => {
      eTrabajador.cambiar()

      $('ul.tabs').tabs('select_tab', 'asignar')

      this.cargarDatos()
    })

    borrar.addEventListener('click', e => {
      $('body').addClass('bloquear-vista')

      const mensaje = `Esta a punto de borrar al lecturista con folio: ${modificarTrabajador.idTrabajo}`

      const detalles = `
        Lecturista: ${modificarTrabajador.nombre} ${modificarTrabajador.apellidos}
        Zona de Trabajo: ${modificarTrabajador.zona_trabajo}
        Fecha final de Trabajo: ${fechas.fixDate()(modificarTrabajador.fecha_fin, 'longDate')}
        Estado: ${modificarTrabajador.estado ? 'Habilitado' : 'Deshabilitado'}

        Considere los cambios que podrá generar al ejercer esta acción:

        1.-Este y todos los demás registros están ligados directamente a los módulos "registro de agua y cobro de agua", por lo que una vez borrado este lecturista se eliminarán automáticamente todos los registros de agua y cobros de agua en donde este figurado el lecturista titular "${modificarTrabajador.nombre} ${modificarTrabajador.apellidos}".

        2.-NO HAY SOPORTE DE HISTORIAL PARA REGISTROS BORRADOS... Una vez que decidas borrarlo, se eliminará por completo la información de la base de datos y "no será recuperable". Una alternativa a esto es crear informes PDF cada determinado tiempo.

        3.- Una vez borrado el trabajador, el sistema de cerrará por completo con el fin de garantizar la seguridad y corrupción de datos de la base de datos... Tendrás que volver a acceder al sistema para verificar los cambios realizados.
      `

      let botones = ['Cancelar', 'Borrar']

      dialog.showMessageBox(new BrowserWindow({show: false, alwaysOnTop: true}), { type: 'error', buttons: botones, message: mensaje, detail: detalles }, respuesta => {
        $('body').removeClass('bloquear-vista')

        if (respuesta) ipcRenderer.send('trabajo_borrarRegistro', modificarTrabajador)

        ipcRenderer.on('trabajo_respuestaBorrarRegistro', (e, mensaje) => {
          $('#modalB').html(`
            <div class="row">
              <div class="col s12">
                <div class="card-panel teal">
                  <span class="white-text">${mensaje.mensaje}</span>
                </div>
              </div>
            </div>
          `)

          modificarTrabajador = {}
          eTrabajador.nuevo()

          ipcRenderer.send('trabajo_cargaTabla')
          this.tablaCrear()

          let tiempo = 7000
          const cerrarModal = setTimeout(() => {
            ipcRenderer.send('trabajo_enviarALogin')
            $('#modalB').empty()
          }, tiempo)

          ipcRenderer.removeAllListeners('trabajo_respuestaBorrarRegistro')
        })
      })
    })

    cancelar.addEventListener('click', e => {
      modificarTrabajador = {}
    })

    pdf.addEventListener('click', async e => {
      ipcRenderer.send('usuario_organizacion')
    })
  }

  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @returns {null}
   * @description Resetea la tabla, dejandola en su etapa más actual
   * @event boton recargar [id="resetearTabla"]
  */
  eventoResetarTabla () {
    const boton = document.getElementById('resetearTabla')

    boton.addEventListener('click', e => {
      ipcRenderer.send('trabajo_cargaTabla')

      this.tablaCrear()

      $('select').prop('selectedIndex', 0)
      $('select').material_select()
    })
  }

  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @param {JSON -> string} usuarioString: contiene todos los datos informativos del usuario elegido
   * @returns {null}
   * @description Crea el card del usuario
   * @event click en alguna fila de la tabla
  */
  seleccionTrabajador (trabajadorString) {
    const trabajadorJSON = JSON.parse(trabajadorString.replace(/&quot;/gi, '"'))

    modificarTrabajador = trabajadorJSON

    $('.modal').modal({
      dismissible: false
    })

    if (trabajadorJSON.imagen) {
      const rutaImagen = path.join(__dirname, '../../assets/img/usuarios', trabajadorJSON.manzana_usuario, trabajadorJSON.imagen)

      $('#modalTrabajador').find('.card').find('img').attr('src', rutaImagen)
    } else $('#modalTrabajador').find('.card').find('img').removeAttr('src')

    $('#modalTrabajador').find('.card').find('h3').text(trabajadorJSON.nombre + ' ' + trabajadorJSON.apellidos)

    $('#modalTrabajador').find('.card').find('#cardGrupoA').find('div:first-child').find('h4').text(trabajadorJSON.zona_trabajo)
    $('#modalTrabajador').find('.card').find('#cardGrupoA').find('div:last-child').find('h4').text(trabajadorJSON.llave)

    $('#modalTrabajador').find('.card').find('#cardGrupoB').find('div:first-child').find('h4').text(fechas.fixDate()(trabajadorJSON.fecha_inicio, 'longDate'))
    $('#modalTrabajador').find('.card').find('#cardGrupoB').find('div:last-child').find('h4').text(fechas.fixDate()(trabajadorJSON.fecha_fin, 'longDate'))

    $('#modalTrabajador').find('.card').find('#cardGrupoC').find('div:first-child').find('h4').text(trabajadorJSON.minutos_trabajados)
    $('#modalTrabajador').find('.card').find('#cardGrupoC').find('div:last-child').find('h4').text(trabajadorJSON.estado ? 'Habilitado' : 'Deshabilitado')

    $('#modalTrabajador').modal('open')
  }

  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @param {JSON} datos: contiene todos los datos informativos del usuario elegido
   * @returns {null}
   * @description Carga los datos del usuario al tab cambiar/nuevo con los datos obtenidos de su selección
   * @event boton modificar del card usuario [id="modalModificar"]
  */
  cargarDatos (datos) {
    if (Object.keys(modificarTrabajador).length) {
      $('#llave').val(modificarTrabajador.llave)
      $('#llave').siblings('label').addClass("active")

      const calendarioA = $('#fecha_inicio').pickadate()
      const pickerA = calendarioA.pickadate('picker')
      pickerA.set('select', new Date(modificarTrabajador.fecha_inicio).toISOString().slice(0,10), { format: 'yyyy-mm-dd' })
      $('#fecha_inicio').siblings('label').addClass("active")

      const calendarioB = $('#fecha_fin').pickadate()
      const pickerB = calendarioB.pickadate('picker')
      pickerB.set('select', new Date(modificarTrabajador.fecha_fin).toISOString().slice(0,10), { format: 'yyyy-mm-dd' })
      $('#fecha_fin').siblings('label').addClass("active")

      $('#minutos_trabajados').val(modificarTrabajador.minutos_trabajados)
      $('#minutos_trabajados').siblings('label').addClass("active")

      if (modificarTrabajador.estado) $('#habilitado').prop('checked', true)
      else $('#deshabilitado').prop('checked', true)

      $('select[name="usuario"]').html(`
      <option value="" disabled selected>${modificarTrabajador.nombre} ${modificarTrabajador.apellidos}</option>
      `)
      $('select[name="usuario"]').prop('disabled', true)
      $('select[name="usuario"]').material_select()
      $('select[name="usuario"]').closest('.input-field').children('span.caret').remove()

      $(`select[name="zona_trabajo"] option[value="${modificarTrabajador.idZona_trabajo.toString()}"]`).prop('selected', true)
      $('select[name="zona_trabajo"]').material_select()
    }
  }

  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @returns {null}
   * @description Carga los datos de la organización
   * @event boton PDF del panel de la tabla
  */
  generarPDF () {
    ipcRenderer.on('usuario_datosOrganizacion', (e, datos) => {
      if (this.datosTrabajador !== null) {
        const organizacion = datos.filas[0]
        const salidaPDF = 'registro de usuarios'

        const datosPDF = {
          registros: this.datosTrabajador.length,
          salida: `${salidaPDF} #####.pdf`,
          cabecera: {
            titulo: organizacion.nombre.toUpperCase(),
            subtitulo: salidaPDF.toUpperCase(),
            imagen: organizacion.imagen,
            ciudad: organizacion.ciudad,
            estado: organizacion.estado,
            telefono: organizacion.telefono,
            codigo_postal: organizacion.codigo_postal,
            domicilio: organizacion.domicilio
          },
          columnas: {
            titulares: [
              'Folio',
              'Usuario',
              'Tipo Usuario',
              'Manzana',
              'Notas',
              'Creado'
            ],
            estilos: {
              0: {columnWidth: 40}, // Folio
              1: {columnWidth: 110}, // Nombre
              2: {columnWidth: 80}, // Usuario_Tipo
              3: {columnWidth: 80}, // Manzana
              4: {columnWidth: 150}, // Notas
              5: {columnWidth: 80} // Creado
            }
          },
          filas: []
        }

        const tratar = new tratamiento()

        this.datosTrabajador.forEach(col => {
          datosPDF.filas.push([
            col.idUsuario,
            tratar.treatCharacters(`${col.nombre} ${col.apellidos}`),
            tratar.treatCharacters(col.usuario_tipo),
            tratar.treatCharacters(col.manzana),
            col.notas ? tratar.treatCharacters(col.notas) : '',
            fechas.fixDate()(col.creado, 'mediumDate')
          ])
        })

        new generadorPDF('registros', datosPDF)
      }
    })
  }

} const bTrabajador = new buscarTrabajador()


/**
 * @class
 * @constructor cargarEntregaDatos, eventoSubmit, eventoLimpiar
 * @method
 * @description Manipulación de datos sensibles del formulario
 */
class trabajo {
  constructor () {
    this.cargarEntregaDatos()
    this.eventoSubmit()
    this.eventoLimpiar()
  }

  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @returns {null}
   * @description Carga los selects usuario_tipo y manzanas
   * @event Constructor de la clase
  */
  cargarEntregaDatos () {
    ipcRenderer.on('trabajo_entregaComponentes', (e, componentes) => {
      if (!componentes.usuariosTrabajando.filas.length) {
        let optionUsuarioTrabajando = ['<option value="" disabled selected>No hay lecturistas para asignar</option>']

        $('select[id="lecturistaBuscar"]').html(optionUsuarioTrabajando.join(''))
      } else {
        let optionUsuarioTrabajando = ['<option value="" disabled selected>Escoge un Lecturista</option>']

        componentes.usuariosTrabajando.filas.forEach(u => {
          if (u.imagen !== null) {
            optionUsuarioTrabajando.push(`<option value="${u.idUsuario}" data-icon="${path.join(__dirname, '../../assets/img/usuarios/', u.manzana, u.imagen)}" class="circle">${u.nombre} ${u.apellidos}</option>`)
          } else {
            optionUsuarioTrabajando.push(`<option value="${u.idUsuario}">${u.nombre} ${u.apellidos}</option>`)
          }
        })

        $('select[id="lecturistaBuscar"]').html(optionUsuarioTrabajando.join(''))
      }

      if (!componentes.usuarios.filas.length) {
        let optionUsuario = ['<option value="" disabled selected>No hay lecturistas para asignar</option>']

        $('select[name="usuario"]').html(optionUsuario.join(''))
      } else {
        let optionUsuario = ['<option value="" disabled selected>Escoge un Lecturista</option>']

        componentes.usuarios.filas.forEach(u => {
          if (u.imagen !== null) {
            optionUsuario.push(`<option value="${u.idUsuario}" data-icon="${path.join(__dirname, '../../assets/img/usuarios/', u.manzana, u.imagen)}" class="circle">${u.nombre} ${u.apellidos}</option>`)
          } else {
            optionUsuario.push(`<option value="${u.idUsuario}">${u.nombre} ${u.apellidos}</option>`)
          }
        })

        $('select[name="usuario"]').html(optionUsuario.join(''))
      }

      if (!componentes.manzanas.filas.length) {
        let optionZonaTrabajo = ['<option value="" disabled selected>No hay manzanas disponibles para asignar al lecturista</option>']

        $('select[name="zona_trabajo"]').html(optionZonaTrabajo.join(''))
        $('select[id="zonaTrabajoBuscar"]').html(optionZonaTrabajo.join(''))
      } else {
        let optionZonaTrabajo = ['<option value="" disabled selected>Escoge la zona de trabajo</option>']

        componentes.manzanas.filas.forEach(m => optionZonaTrabajo.push(`<option value="${m.idManzana}">${m.manzana}</option>`))

        $('select[name="zona_trabajo"]').html(optionZonaTrabajo.join(''))
        $('select[id="zonaTrabajoBuscar"]').html(optionZonaTrabajo.join(''))
      }

      if (!componentes.usuarios.filas.length || !componentes.manzanas.filas.length) $('button[type="submit"]').addClass('disabled')
      else $('button[type="submit"]').removeClass('disabled')

      $('select').material_select()
      $('select').closest('.input-field').children('span.caret').remove()

      ipcRenderer.removeAllListeners('trabajo_entregaComponentes')
    })
  }

  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @returns {null}
   * @description Recolecta los datos ingresados por la persona y los envia al servidor (ventana.js) para su tratamiento
   * @event boton submit [type="submit"]
  */
  eventoSubmit () {
    const form = document.querySelector('form')

    form.addEventListener('submit', e => {
      e.preventDefault()

      const formData = new FormData(document.querySelector('form'))

      var datosTrabajador = {}

      formData.forEach((dato, key) => {
        if (key === 'usuario' || key === 'zona_trabajo' || key === 'estado') {
          datosTrabajador[key] = parseInt(dato)
        } else if (key === 'minutos_trabajados') {
          datosTrabajador[key] = parseFloat(dato)
        } else datosTrabajador[key] = dato.length ? dato : null
      })

      const nombreCampos = Object.keys(datosTrabajador)

      if (!nombreCampos.includes('usuario')) datosTrabajador['usuario'] = 0
      if (!nombreCampos.includes('zona_trabajo')) datosTrabajador['zona_trabajo'] = 0
      if (!nombreCampos.includes('minutos_trabajados')) datosTrabajador['minutos_trabajados'] = 0.00

      datosTrabajador['LECTURISTA'] = $('select[name="usuario"] option:selected').text()

      if (Object.keys(modificarTrabajador).length) {
        datosTrabajador['ESTADO'] = 'reasignar'

        datosTrabajador['viajeTiempo'] = modificarTrabajador
      } else datosTrabajador['ESTADO'] = 'asignar'

      /**
       * @description Proceso de envio de datos usuario al servidor (ventana.js)
       */
      ipcRenderer.send('trabajo_datosTrabajador', datosTrabajador)

      /**
       * @description Proceso de recepción de errores despues de manipularlos en el servidor
       */
      ipcRenderer.on('trabajo_errores', (e, errores) => {

        Object.keys(errores).forEach(key => eTrabajador.estadosErrores(key, errores[key]))

        datosTrabajador = {}

        ipcRenderer.removeAllListeners('trabajo_errores')
      })

      /**
       * @description Proceso de recepción del mensaje de éxito al finalizar todo el proceso del lado del servidor
       */
      ipcRenderer.on('trabajo_respuesta', (e, datos) => {
        Object.keys(datos.errores).forEach(key => eTrabajador.estadosErrores(key, datos.errores[key]))

        $('#llave').focus()

        $('#modal').html(`
          <div class="row">
            <div class="col s12">
              <div class="card-panel teal">
                <span class="white-text">${datos.mensaje}</span>
              </div>
            </div>
          </div>
        `)

        if (Object.keys(modificarTrabajador).length) {
          eTrabajador.nuevo()
          let tiempo = 2000

          const cerrarModal = setTimeout(() => {
            $('#modal').empty()

            ipcRenderer.send('trabajo_cargaTabla')
            bTrabajador.tablaCrear()

            eTrabajador.limpiarDatos()

            $('ul.tabs').tabs('select_tab', 'buscar')
          }, tiempo)
        } else {
          eTrabajador.nuevo()

          let tiempo = 2000
          const cerrarModal = setTimeout(() => {
            $('#modal').empty()
          }, tiempo)
        }


        ipcRenderer.removeAllListeners('trabajo_respuesta')
      })
    })
  }

  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @returns {null}
   * @description Limpiará los errores y los datos que haya sido colocados en el formulario
   * @event boton limpiar [id="limpiar"]
  */
  eventoLimpiar () {
    document.getElementById('limpiar').addEventListener('click', e => {
      eTrabajador.limpiarDatos()

      const errores = {
        usuario: [],
        llave: [],
        zona_trabajo: [],
        fecha_inicio: [],
        fecha_fin: [],
        minutos_trabajados: [],
        estado: []
      }

      Object.keys(errores).forEach(key => eTrabajador.estadosErrores(key, errores[key]))
    })
  }
} const trab = new trabajo()
