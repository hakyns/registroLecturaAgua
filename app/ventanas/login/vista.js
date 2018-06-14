/**
 * @file Cliente ventana usuarios 9 de Marzo del 2018
 * @copyright Joaquin Reyes Sanchez 2018
 * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
 * @version 1.0.0
 */

const electron = require('electron')
const path = require('path')
const fs = require('fs')
const { ipcRenderer } = electron

const {tratamiento} = require('../../tools/maquinaDatos')

/**
 * @description Iniciadores de componentes materialize
 */
$('select').material_select()

/**
 * @class
 * @method nuevo, cambiar, limpiarDatos, eliminarImagen, estadosErrores
 * @description Funcionalidades para cambiar el DOM de la vista html
 */
class estadoLogin {
  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @returns {null}
   * @description Limpia todos los campos sensibles del form tab nuevo o tab cambiar
   * @event boton limpiar [id="limpiar"] del tab nuevo y metodos de este archivo
  */
  limpiarDatos () {
    $('#llave').val('')

    $('select').prop('selectedIndex', 0)
    $('select').material_select()

    const errores = {
      usuario: [],
      llave: []
    }

    Object.keys(errores).forEach(key => this.estadosErrores(key, errores[key]))
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
} const eLogin = new estadoLogin()


/**
 * @class
 * @constructor cargarEntregaDatos, eventoSubmit, eventoLimpiar
 * @method
 * @description Manipulación de datos sensibles del formulario
 */
class login {
  constructor () {
    this.cargarEntregaDatos()
    this.eventoSubmit()
    this.eventoSelect()

    this.losUsuarios = []
  }

  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @returns {null}
   * @description Carga los selects usuario_tipo y manzanas
   * @event Constructor de la clase
  */
  cargarEntregaDatos () {
    ipcRenderer.on('login_entregaComponentes', (e, componentes) => {
      this.losUsuarios = componentes.usuarios.filas

      if (!componentes.usuarios.filas.length) {
        let optionUsuario = ['<option value="" disabled selected>No hay Usuarios para mostrar</option>', '<option value="-1990">Admin Root</option>']

        $('select[name="usuario"]').html(optionUsuario.join(''))
      } else {
        let optionUsuario = ['<option value="" disabled selected>Escoge un Usuario</option>']

        componentes.usuarios.filas.forEach(u => {
          if (u.imagen !== null) {
            optionUsuario.push(`<option value="${u.idUsuario}" data-icon="${path.join(__dirname, '../../assets/img/usuarios/', u.manzana, u.imagen)}" class="circle">${u.nombre} ${u.apellidos}</option>`)
          } else {
            optionUsuario.push(`<option value="${u.idUsuario}">${u.nombre} ${u.apellidos}</option>`)
          }
        })

        $('select[name="usuario"]').html(optionUsuario.join(''))
      }

      // if (!componentes.usuarios.filas.length) $('button[type="submit"]').addClass('disabled')
      // else $('button[type="submit"]').removeClass('disabled')

      $('select').material_select()
      $('select').closest('.input-field').children('span.caret').remove()

      ipcRenderer.removeAllListeners('login_entregaComponentes')
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

      var datosLogin = {}

      formData.forEach((dato, key) => {
        if (key === 'usuario') {
          datosLogin[key] = parseInt(dato)
        } else datosLogin[key] = dato.length ? dato : null
      })

      const nombreCampos = Object.keys(datosLogin)

      if (!nombreCampos.includes('usuario')) datosLogin['usuario'] = 0

      datosLogin['USUARIO'] = $('select[name="usuario"] option:selected').text()

      /**
       * @description Proceso de envio de datos usuario al servidor (ventana.js)
       */
      ipcRenderer.send('login_datosLogin', datosLogin)

      /**
       * @description Proceso de recepción de errores despues de manipularlos en el servidor
       */
      ipcRenderer.on('login_errores', (e, errores) => {

        Object.keys(errores).forEach(key => eLogin.estadosErrores(key, errores[key]))

        datosLogin = {}

        ipcRenderer.removeAllListeners('login_errores')

        ipcRenderer.removeAllListeners('login_respuesta')
      })

      /**
       * @description Proceso de recepción del mensaje de éxito al finalizar todo el proceso del lado del servidor
       */
      ipcRenderer.on('login_respuesta', (e, datos) => {
        Object.keys(datos.errores).forEach(key => eLogin.estadosErrores(key, datos.errores[key]))

        $('#medidor').focus()

        $('#modal').html(`
          <div class="row">
            <div class="col s12">
              <div class="card-panel teal">
                <span class="white-text">${datos.mensaje}</span>
              </div>
            </div>
          </div>
        `)

        let tiempo = 1000
        const cerrarModal = setTimeout(() => {
          $('#modal').empty()

          ipcRenderer.send('login_terminado')
        }, tiempo)


        ipcRenderer.removeAllListeners('login_respuesta')
      })
    })
  }

  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @returns {null}
   * @description Recolecta los datos ingresados por la persona y los envia al servidor (ventana.js) para su tratamiento
   * @event boton submit [type="submit"]
  */
  eventoSelect () {
    const imagenes = fs.readdirSync(path.join(__dirname, '../../assets/img/login'))

    const rutaImagen = path.join(__dirname, '../../assets/img/login/', imagenes[Math.floor(Math.random() * imagenes.length)])

    $('.card').find('img').attr('src', rutaImagen)

    $('select[name="usuario"]').change(() => {
      const valor = parseInt($('select[name="usuario"]').val())

      let datosCard = {}

      this.losUsuarios.forEach(usu => {
        if (usu.idUsuario === valor) {
          datosCard = usu
          return
        }
      })

      if (datosCard.imagen) {
        const rutaImagen = path.join(__dirname, '../../assets/img/usuarios', datosCard.manzana, datosCard.imagen)

        $('.card').find('img').attr('src', rutaImagen)
      }

      if (valor === -1990) $('.card').find('h3').text('Admin Root')
      else $('.card').find('h3').text(datosCard.nombre + ' ' + datosCard.apellidos)
    })
  }
} new login()
