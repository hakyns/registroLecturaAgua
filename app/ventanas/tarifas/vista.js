/**
 * @file Cliente ventana usuarios 28 de Marzo del 2018
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

var modificarTarifa = {}

/**
 * @description Iniciadores de componentes materialize
 */
$('.tabs').tabs()

/**
 * @class
 * @method nuevo, cambiar, limpiarDatos, eliminarImagen, estadosErrores
 * @description Funcionalidades para cambiar el DOM de la vista html
 */
class estadoTarifa {
  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @param {boolean} limpiar: Si es true limpiara los datos del formulario y además lva variable global modificarTarifa, de lo contrario no lo hará
   * @returns {null}
   * @description Devuelve a su estado original el tab del formulario principal
   * @event boton nuevo [id="volverTabNuevo"] del tab cambiar y metodos de este archivo
  */
  nuevo (limpiar = true) {
    $('#tarifas').text('Nuevo')
    $('button[type="submit"]').text('Crear')

    $('#volverTabNuevo').remove()

    if (limpiar) {
      this.limpiarDatos()
      modificarTarifa = {}
    }

    $('#rango_minimo').removeAttr('disabled')
    $('#rango_maximo').removeAttr('disabled')

    $('.collapsible').collapsible('close', 0)
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

    $('#tarifas').text('Cambio')
    $('button[type="submit"]').text('Cambiar')

    const botonNuevo = `
      <div class="row" id="volverTabNuevo">
        <div class="container">
          <div class="col s12 right-align">
            <button class="btn waves-effect waves-light center-align cyan darken-2" type="button" onclick="eTarifa.nuevo()"> Nuevo
            </button>
            <br>
          </div>
        </div>
      </div>
    `

    $('#rango_minimo').attr('disabled', 'disabled')
    $('#rango_maximo').attr('disabled', 'disabled')

    $('#nuevo').find('.container').find('.row').find('form').prepend(botonNuevo)
  }

  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @returns {null}
   * @description Limpia todos los campos sensibles del form tab nuevo o tab cambiar
   * @event boton limpiar [id="limpiar"] del tab nuevo y metodos de este archivo
  */
  limpiarDatos () {
    $('#rango_minimo').val('')
    $('#rango_maximo').val('')
    $('#tarifa').val('')

    $('#fija').prop('checked', true)
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
} const eTarifa = new estadoTarifa()

/**
 * @class
 * @constructor
 * @method tablaCrear, eventoTabla, eventoTablaPanel, eventoResetarTabla, seleccionUsuario, seleccionUsuario, cargarDatos
 * @description Creación y manipulación de la tabla de usuarios
 */
class buscarTarifa {
  constructor() {
    this.eventoTabla()
    this.eventoTablaPanel()
    this.eventoResetarTabla()
  }

  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @returns {null}
   * @description Crea la tabla de registros de usuarios creados y modificados
   * @event tab buscar y metodos de este archivo
  */
  tablaCrear () {
    ipcRenderer.on('tarifas_entregaTabla', (e, datos) => {
      const filas = []

      datos.filas.forEach(dato => {
        filas.push(`
          <tr onclick="bTarifa.seleccionTarifa('${JSON.stringify(dato).replace(/"/gi, '&quot;')}')">
            <td>${dato.idTarifa}</td>
            <td>${dato.rango_minimo} m<sup>2</sup></td>
            <td>${dato.rango_maximo} m<sup>2</sup></td>
            <td>$ ${dato.tarifa}</td>
            <td>${dato.fija_incrementada ? 'Incremento * m<sup>2</sup> consumido' : 'Tarifa Fija'}</td>
          </tr>
        `)
      })

      $('table').find('tbody').html(filas.join(''))

      ipcRenderer.removeAllListeners('tarifas_entregaTabla')
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
      ipcRenderer.send('tarifas_cargaTabla')
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
    const modificar = document.getElementById('modalModificar')
    const borrar = document.getElementById('modalBorrar')
    const cancelar = document.getElementById('modalCancelar')

    modificar.addEventListener('click', e => {
      eTarifa.cambiar()

      $('ul.tabs').tabs('select_tab', 'nuevo')

      this.cargarDatos()
    })

    borrar.addEventListener('click', e => {
      $('body').addClass('bloquear-vista')

      const mensaje = `Esta a punto de borrar todas las tarifas`

      const detalles = `
      Considere los cambios que podrá generar al ejercer esta acción:

      1.-Se eliminarán todas las tarifas por completo, para este módulo "no hay opción de eliminar tarifa determinada".

      2.-Cualquier tarifa esta ligada directamente al módulo "cobro agua", por lo que es recomendable preveer ciertos riesgos.

      3.-El borrar estas tarifas "no afectará en nada" a los registros de cobro de agua ya registrados; lo que si afectará es su disponibilidad para registros de cobro de agua futuros.

      4.-Es 100% necesario crear nuevamente los intervalos de tarifas, de ninguna manera se te ocurra saltarte este paso, ya que podrías afectar drasticamente el funcionamiento del módulo "cobro agua".
      `
      let botones = ['Cancelar', 'Borrar']

      dialog.showMessageBox(new BrowserWindow({show: false, alwaysOnTop: true}), { type: 'error', buttons: botones, message: mensaje, detail: detalles }, respuesta => {
        $('body').removeClass('bloquear-vista')

        if (respuesta) ipcRenderer.send('tarifas_borrarRegistro', modificarTarifa)

        ipcRenderer.on('tarifa_respuestaBorrarRegistro', (e, mensaje) => {
          $('#modalB').html(`
            <div class="row">
              <div class="col s12">
                <div class="card-panel teal">
                  <span class="white-text">${mensaje.mensaje}</span>
                </div>
              </div>
            </div>
          `)

          modificarTarifa = {}
          eTarifa.nuevo()

          ipcRenderer.send('tarifas_cargaTabla')
          this.tablaCrear()

          let tiempo = 5000
          const cerrarModal = setTimeout(() => {
            $('#modalB').empty()
          }, tiempo)

          ipcRenderer.removeAllListeners('tarifa_respuestaBorrarRegistro')
        })
      })
    })

    cancelar.addEventListener('click', e => {
      modificarTarifa = {}
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
      ipcRenderer.send('usuario_cargaTabla')

      this.tablaCrear()

      $('#inputBuscar').val('')
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
  seleccionTarifa (taridaString) {
    const tarifaJSON = JSON.parse(taridaString.replace(/&quot;/gi, '"'))

    modificarTarifa = tarifaJSON

    modificarTarifa['eliminarImagen'] = false

    $('.modal').modal({
      dismissible: false
    })

    $('#modalUsuario').find('.card').find('div:first-child').find('h4').html(`${tarifaJSON.rango_minimo} m<sup>2</sup>`)
    $('#modalUsuario').find('.card').find('div:last-child').find('h4').html(`${tarifaJSON.rango_maximo} m<sup>2</sup>`)

    $('#modalUsuario').find('.card').find('.fechas').find('div:first-child').find('h4').html(`$ ${tarifaJSON.tarifa}`)
    $('#modalUsuario').find('.card').find('.fechas').find('div:last-child').find('h4').html(tarifaJSON.fija_incrementada ? 'Incremento * m<sup>2</sup> consumido' : 'Tarifa Fija')

    $('#modalUsuario').modal('open')
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
    if (Object.keys(modificarTarifa).length) {
      $('#rango_minimo').val(modificarTarifa.rango_minimo)
      $('#rango_minimo').siblings('label').addClass("active")

      $('#rango_maximo').val(modificarTarifa.rango_maximo)
      $('#rango_maximo').siblings('label').addClass("active")

      $('#tarifa').val(modificarTarifa.tarifa)
      $('#tarifa').siblings('label').addClass("active")

      if (modificarTarifa.fija_incrementada) $('#incrementada').prop('checked', true)
      else $('#fija').prop('checked', true)
    }
  }

} const bTarifa = new buscarTarifa()


/**
 * @class
 * @constructor cargarEntregaDatos, eventoSubmit, eventoLimpiar
 * @method
 * @description Manipulación de datos sensibles del formulario
 */
class tarifa {
  constructor () {
    this.eventoSubmit()
    this.eventoLimpiar()
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

      var datosTarifa = {}

      formData.forEach((dato, key) => {
        if (key === 'rango_minimo' || key === 'rango_maximo' || key === 'fija_incrementada') {
          datosTarifa[key] = dato ? parseInt(dato) : 0
        } else if (key === 'tarifa') {
          datosTarifa[key] = dato ? parseFloat(dato) : 0.00
        } else datosTarifa[key] = dato.length ? dato : null
      })

      if (Object.keys(modificarTarifa).length) {
        datosTarifa['ESTADO'] = 'cambiar'

        datosTarifa['viajeTiempo'] = modificarTarifa
      } else datosTarifa['ESTADO'] = 'crear'

      /**
       * @description Proceso de envio de datos usuario al servidor (ventana.js)
       */
      ipcRenderer.send('tarifa_datosTarifa', datosTarifa)

      /**
       * @description Proceso de recepción de errores despues de manipularlos en el servidor
       */
      ipcRenderer.on('tarifa_errores', (e, errores) => {
        Object.keys(errores).forEach(key => eTarifa.estadosErrores(key, errores[key]))

        datosTarifa = {}

        ipcRenderer.removeAllListeners('tarifa_errores')
      })

      /**
       * @description Proceso de recepción del mensaje de éxito al finalizar todo el proceso del lado del servidor
       */
      ipcRenderer.on('tarifa_respuesta', (e, datos) => {
        Object.keys(datos.errores).forEach(key => eTarifa.estadosErrores(key, datos.errores[key]))

        $('#rango_minimo').focus()

        $('#modal').html(`
          <div class="row">
            <div class="col s12">
              <div class="card-panel teal">
                <span class="white-text">${datos.mensaje}</span>
              </div>
            </div>
          </div>
        `)

        if (Object.keys(modificarTarifa).length) {
          eTarifa.nuevo(false)
          let tiempo = 2000
          const cerrarModal = setTimeout(() => {
            $('#modal').empty()

            ipcRenderer.send('tarifas_cargaTabla')
            bTarifa.tablaCrear()

            eTarifa.limpiarDatos()

            $('ul.tabs').tabs('select_tab', 'buscar')
          }, tiempo)
        } else {
          eTarifa.nuevo()

          let tiempo = 5000
          const cerrarModal = setTimeout(() => {
            $('#modal').empty()
          }, tiempo)
        }


        ipcRenderer.removeAllListeners('tarifa_respuesta')
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
      eTarifa.limpiarDatos()

      const errores = {
        rango_minimo: [],
        rango_maximo: [],
        tarifa: [],
        fija_incrementada: []
      }

      Object.keys(errores).forEach(key => eTarifa.estadosErrores(key, errores[key]))
    })
  }
} new tarifa()
