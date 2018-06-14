/**
 * @file Cliente ventana usuarios 16 de Marzo del 2018
 * @copyright Joaquin Reyes Sanchez 2018
 * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
 * @version 1.0.0
 */

const electron = require('electron')
const path = require('path')
const { ipcRenderer } = electron

var modificarManzana = {}

/**
 * @description Iniciadores de componentes materialize
 */
$('ul.tabs').tabs()

/**
 * @class
 * @method nuevo, cambiar, limpiarDatos, eliminarImagen, estadosErrores
 * @description Funcionalidades para cambiar el DOM de la vista html
 */
class estadoManzana {
  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @param {boolean} limpiar: Si es true limpiara los datos del formulario y además lva variable global modificarUsuario, de lo contrario no lo hará
   * @returns {null}
   * @description Devuelve a su estado original el tab del formulario principal
   * @event boton nuevo [id="volverTabNuevo"] del tab cambiar y metodos de este archivo
  */
  nuevo (limpiar = true) {
    $('#manzanaManzana').text('Nuevo')
    $('button[type="submit"]').text('Crear')

    $('#volverTabNuevo').remove()

    if (limpiar) {
      this.limpiarDatos()
      modificarManzana = {}
    }
  }

  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @returns {null}
   * @description Resetea el tab nuevo para cambiarlo a tab cambiar
   * @event boton modificar del card Usuario Tipo
  */
  cambiar () {
    this.nuevo(false)

    $('#manzanaManzana').text('Cambio')
    $('button[type="submit"]').text('Cambiar')

    const botonNuevo = `
      <div class="row" id="volverTabNuevo">
        <div class="container">
          <div class="col s12 right-align">
            <button class="btn waves-effect waves-light center-align cyan darken-2" type="button" onclick="eManzana.nuevo()"> Nuevo
            </button>
            <br>
          </div>
        </div>
      </div>
    `

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
    $('#manzana').val('')
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
} const eManzana = new estadoManzana()

/**
 * @class
 * @constructor
 * @method tablaCrear, eventoTabla, eventoTablaPanel, eventoResetarTabla, seleccionUsuario, seleccionUsuario, cargarDatos
 * @description Creación y manipulación de la tabla de usuarios
 */
class buscarManzana {
  constructor() {
    this.eventoTabla()
    this.eventoTablaPanel()
    this.eventoResetarTabla()
    /**
     * @readonly
     */
    this.datosTiposusuario = null
  }

  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @returns {null}
   * @description Crea la tabla de registros de tipos de usuarios creados y modificados
   * @event tab buscar y metodos de este archivo
  */
  tablaCrear () {
    ipcRenderer.on('manzana_entregaTabla', (e, datos) => {
      const filas = []
      this.datosTiposusuario = datos.filas

      datos.filas.forEach(dato => {
        filas.push(`
          <tr onclick="bManzana.seleccionManzana('${JSON.stringify(dato).replace(/"/gi, '&quot;')}')">
            <td>${dato.idManzana}</td>
            <td>${dato.manzana}</td>
          </tr>
        `)
      })

      $('table').find('tbody').html(filas.join(''))

      ipcRenderer.removeAllListeners('manzana_entregaTabla')
    })
  }

  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @returns {null}
   * @description Solicita y crea la tabla de tipos de usuario
   * @event tab buscar [id="tabla"]
  */
  eventoTabla () {
    const tabla = document.getElementById('tabla')

    tabla.addEventListener('click', e => {
      ipcRenderer.send('manzana_cargaTabla')
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
    const input = document.getElementById('inputBuscar')
    const boton = document.getElementById('botonBuscar')

    const modificar = document.getElementById('modalModificar')
    const cancelar = document.getElementById('modalCancelar')

    boton.addEventListener('click', e => {
      const valorInput = input.value
      if (valorInput) {
        ipcRenderer.send('manzana_manzanaBuscar', valorInput)

        this.tablaCrear()
      }
    })

    input.addEventListener('keyup', e => {
      if (e.keyCode === 13) {
        const valorInput = input.value

        if (valorInput) {
          ipcRenderer.send('manzana_manzanaBuscar', valorInput)

          this.tablaCrear()
        }
      }
    })

    modificar.addEventListener('click', e => {
      eManzana.cambiar()

      $('ul.tabs').tabs('select_tab', 'nuevo')

      this.cargarDatos()
    })

    cancelar.addEventListener('click', e => {
      modificarManzana = {}
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
      ipcRenderer.send('manzana_cargaTabla')

      this.tablaCrear()

      $('#inputBuscar').val('')
    })
  }

  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @param {JSON -> string} usuarioTipoString: contiene todos los datos informativos del usuario elegido
   * @returns {null}
   * @description Crea el card del usuario tipo
   * @event click en alguna fila de la tabla
  */
 seleccionManzana (usuarioTipoString) {
    const manzanaTipoJSON = JSON.parse(usuarioTipoString.replace(/&quot;/gi, '"'))

    modificarManzana = manzanaTipoJSON

    $('.modal').modal({
      dismissible: false
    })

    $('#modalManzana').find('.card').find('h3').text(manzanaTipoJSON.manzana)

    $('#modalManzana').modal('open')
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
    if (Object.keys(modificarManzana).length) {
      $('#manzana').val(modificarManzana.manzana)
      $('#manzana').siblings('label').addClass("active")
    }
  }

} const bManzana = new buscarManzana()


/**
 * @class
 * @constructor eventoSubmit, eventoLimpiar
 * @method
 * @description Manipulación de datos sensibles del formulario
 */
class manzana {
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

      var datosManzana = {}

      formData.forEach((dato, key) => {
        datosManzana[key] = dato.length ? dato : null
      })

      if (Object.keys(modificarManzana).length) {
        datosManzana['ESTADO'] = 'cambiar'

        datosManzana['viajeTiempo'] = modificarManzana
      } else datosManzana['ESTADO'] = 'crear'

      /**
       * @description Proceso de envio de datos usuario al servidor (ventana.js)
       */
      ipcRenderer.send('manzana_datosManzana', datosManzana)

      /**
       * @description Proceso de recepción de errores despues de manipularlos en el servidor
       */
      ipcRenderer.on('manzana_errores', (e, errores) => {

        Object.keys(errores).forEach(key => eManzana.estadosErrores(key, errores[key]))

        datosManzana = {}

        ipcRenderer.removeAllListeners('manzana_errores')
      })

      /**
       * @description Proceso de recepción del mensaje de éxito al finalizar todo el proceso del lado del servidor
       */
      ipcRenderer.on('manzana_respuesta', (e, datos) => {
        Object.keys(datos.errores).forEach(key => eManzana.estadosErrores(key, datos.errores[key]))

        $('#manzana').focus()

        $('#modal').html(`
          <div class="row">
            <div class="col s12">
              <div class="card-panel teal">
                <span class="white-text">${datos.mensaje}</span>
              </div>
            </div>
          </div>
        `)

        if (Object.keys(modificarManzana).length) {
          eManzana.nuevo(false)
          let tiempo = 2000
          const cerrarModal = setTimeout(() => {
            $('#modal').empty()

            ipcRenderer.send('manzana_cargaTabla')
            bManzana.tablaCrear()

            eManzana.limpiarDatos()

            $('ul.tabs').tabs('select_tab', 'buscar')
          }, tiempo)
        } else {
          eManzana.nuevo()

          let tiempo = 5000
          const cerrarModal = setTimeout(() => {
            $('#modal').empty()
          }, tiempo)
        }


        ipcRenderer.removeAllListeners('manzana_respuesta')
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
      eManzana.limpiarDatos()

      const errores = {
        manzana: []
      }

      Object.keys(errores).forEach(key => eManzana.estadosErrores(key, errores[key]))
    })
  }
} new manzana()
