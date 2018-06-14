/**
 * @file Cliente ventana organizacion 16 de Marzo del 2018
 * @copyright Joaquin Reyes Sanchez 2018
 * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
 * @version 1.0.0
 */

const electron = require('electron')
const path = require('path')
const { ipcRenderer } = electron

const {tratamiento} = require('../../tools/maquinaDatos')
const {generadorPDF} = require('../../tools/reportes')

var modificarOrganizacion = {}

/**
 * @description Iniciadores de componentes materialize
 */
$('ul.tabs').tabs()

/**
 * @class
 * @method nuevo, cambiar, limpiarDatos, eliminarImagen, estadosErrores
 * @description Funcionalidades para cambiar el DOM de la vista html
 */
class estadoOrganizacion {
  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @param {boolean} limpiar: Si es true limpiara los datos del formulario y además lva variable global modificarOrganizacion, de lo contrario no lo hará
   * @returns {null}
   * @description Devuelve a su estado original el tab del formulario principal
   * @event boton nuevo [id="volverTabNuevo"] del tab cambiar y metodos de este archivo
  */
  nuevo (limpiar = true) {
    $('#organizacion').text('Nuevo')
    $('button[type="submit"]').text('Crear')

    $('#botonPDF').remove()

    if (limpiar) {
      this.limpiarDatos()
      modificarOrganizacion = {}
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

    $('#organizacion').text('Cambio')
    $('button[type="submit"]').text('Cambiar')

    const botonNuevo = `

      <div class="row" id="botonPDF">
        <div class="container">
          <div class="col s12 right-align">
            <button class="btn waves-effect waves-light red accent-4 white-text boton-pequenio" type="button" id="generarPDF"><i class="material-icons">picture_as_pdf</i>
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
    $('#nombre').val('')
    $('#ciudad').val('')
    $('#estado').val('')
    $('#telefono').val('')
    $('#codigo_postal').val('')
    $('#domicilio').val('')

    $('input:file').val('')
    $('#imagenTexto').val('')
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
} const eOrganizacion = new estadoOrganizacion()


/**
 * @class
 * @constructor cargarEntregaDatos, eventoSubmit, eventoLimpiar
 * @method
 * @description Manipulación de datos sensibles del formulario
 */
class organizacion {
  constructor () {
    this.cargarEntregaDatos()
    this.eventoSubmit()
    this.eventoLimpiar()
  }

  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @returns {null}
   * @description Carga la vista cambiar o se mantiene en la vista nuevo
   * @event Constructor de la clase
  */
  cargarEntregaDatos () {
    ipcRenderer.on('organizacion_existeOrganizacion', (e, organizacion) => {
      if (organizacion.filas.length) {
        eOrganizacion.cambiar()

        modificarOrganizacion = organizacion.filas[0]

        this.cargarDatos()
        this.eventoPDF()
      } else eOrganizacion.nuevo()
    })
  }

  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @param {JSON} datos: contiene todos los datos informativos del usuario elegido
   * @returns {null}
   * @description Carga los datos del usuario al tab cambiar/nuevo con los datos obtenidos de su selección
   * @event boton modificar del card usuario [id="modalModificar"]
  */
  cargarDatos () {
    if (Object.keys(modificarOrganizacion).length) {
      $('#nombre').val(modificarOrganizacion.nombre)
      $('#nombre').siblings('label').addClass("active")

      $('#ciudad').val(modificarOrganizacion.ciudad)
      $('#ciudad').siblings('label').addClass("active")

      $('#estado').val(modificarOrganizacion.estado)
      $('#estado').siblings('label').addClass("active")

      $('#telefono').val(modificarOrganizacion.telefono)
      $('#telefono').siblings('label').addClass("active")

      $('#codigo_postal').val(modificarOrganizacion.codigo_postal)
      $('#codigo_postal').siblings('label').addClass("active")

      $('#domicilio').val(modificarOrganizacion.domicilio)
      $('#domicilio').siblings('label').addClass("active")

      $('input:file').val('')
      $('#imagenTexto').val(modificarOrganizacion.imagen)
    }
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

      var datosOrganizacion = {}

      formData.forEach((dato, key) => {
        if (key === 'imagen') {

          datosOrganizacion[key] = {
            'path': dato.path ? dato.path : null,
            'lastModified': dato.lastModified.length ? dato.lastModified : null,
            'lastModifiedDate': dato.lastModifiedDate.length ? dato.lastModified : null,
            'name': dato.name ? dato.name : null,
            'size': dato.size ? dato.size : null,
            'type': dato.type ? dato.type : null
          }
        } else datosOrganizacion[key] = dato.length ? dato : null
      })

      if (Object.keys(modificarOrganizacion).length) {
        datosOrganizacion['ESTADO'] = 'cambiar'

        datosOrganizacion['viajeTiempo'] = modificarOrganizacion
      } else datosOrganizacion['ESTADO'] = 'crear'

      /**
       * @description Proceso de envio de datos usuario al servidor (ventana.js)
       */
      ipcRenderer.send('organizacion_datosOrganizacion', datosOrganizacion)

      /**
       * @description Proceso de recepción de errores despues de manipularlos en el servidor
       */
      ipcRenderer.on('organizacion_errores', (e, errores) => {

        Object.keys(errores).forEach(key => eOrganizacion.estadosErrores(key, errores[key]))

        datosOrganizacion = {}

        ipcRenderer.removeAllListeners('organizacion_errores')
      })

      /**
       * @description Proceso de recepción del mensaje de éxito al finalizar todo el proceso del lado del servidor
       */
      ipcRenderer.on('organizacion_respuesta', (e, datos) => {
        Object.keys(datos.errores).forEach(key => eOrganizacion.estadosErrores(key, datos.errores[key]))

        $('#ciudad').focus()

        $('#modal').html(`
          <div class="row">
            <div class="col s12">
              <div class="card-panel teal">
                <span class="white-text">${datos.mensaje}</span>
              </div>
            </div>
          </div>
        `)

        if (Object.keys(modificarOrganizacion).length) {
          eOrganizacion.nuevo(false)

          let tiempo = 2000
          const cerrarModal = setTimeout(() => {
            eOrganizacion.limpiarDatos()
            $('#modal').empty()
            ipcRenderer.send('organizacion_actualizacion')
          }, tiempo)
        } else {
          eOrganizacion.nuevo()

          let tiempo = 2000
          const cerrarModal = setTimeout(() => {
            $('#modal').empty()
            ipcRenderer.send('organizacion_actualizacion')
          }, tiempo)
        }


        ipcRenderer.removeAllListeners('organizacion_respuesta')
      })
    })
  }

  eventoPDF () {
    const pdf = document.getElementById('generarPDF')

    pdf.addEventListener('click', e => {
      if (this.datosUsuarios !== null) {
        const salidaPDF = 'circular informativa'
        const datosPDF = {
          registros: 0,
          salida: `${salidaPDF} #####.pdf`,
          cabecera: {
            titulo: modificarOrganizacion.nombre.toUpperCase(),
            subtitulo: salidaPDF.toUpperCase(),
            imagen: modificarOrganizacion.imagen,
            ciudad: modificarOrganizacion.ciudad,
            estado: modificarOrganizacion.estado,
            telefono: modificarOrganizacion.telefono,
            codigo_postal: modificarOrganizacion.codigo_postal,
            domicilio: modificarOrganizacion.domicilio
          }
        }

        new generadorPDF('plantilla', datosPDF)
      }
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
      eOrganizacion.limpiarDatos()

      const errores = {
        nombre: [],
        ciudad: [],
        estado: [],
        telefono: [],
        codigo_postal: [],
        domicilio: [],
        imagen: []
      }

      Object.keys(errores).forEach(key => eOrganizacion.estadosErrores(key, errores[key]))
    })
  }
} new organizacion()
