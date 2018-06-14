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

var modificarUsuario = {}

/**
 * @description Iniciadores de componentes materialize
 */
$('select').material_select()
$('ul.tabs').tabs()
$('.collapsible').collapsible()

/**
 * @class
 * @method nuevo, cambiar, limpiarDatos, eliminarImagen, estadosErrores
 * @description Funcionalidades para cambiar el DOM de la vista html
 */
class estadoUsuario {
  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @param {boolean} limpiar: Si es true limpiara los datos del formulario y además lva variable global modificarUsuario, de lo contrario no lo hará
   * @returns {null}
   * @description Devuelve a su estado original el tab del formulario principal
   * @event boton nuevo [id="volverTabNuevo"] del tab cambiar y metodos de este archivo
  */
  nuevo (limpiar = true) {
    $('#usuario').text('Nuevo')
    $('button[type="submit"]').text('Crear')

    $('#volverTabNuevo').remove()
    $('#eliminarImagen').remove()

    if (limpiar) {
      this.limpiarDatos()
      modificarUsuario = {}
    }

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

    $('#usuario').text('Cambio')
    $('button[type="submit"]').text('Cambiar')

    const botonNuevo = `
      <div class="row" id="volverTabNuevo">
        <div class="container">
          <div class="col s12 right-align">
            <button class="btn waves-effect waves-light center-align cyan darken-2" type="button" onclick="eUsuario.nuevo()"> Nuevo
            </button>
            <br>
          </div>
        </div>
      </div>
    `

    if (modificarUsuario.imagen) {
      const botonEliminarImagen = `
        <div class="col s12 center-align" id="eliminarImagen">
          <button class="btn waves-effect waves-light deep-orange" type="button" onclick="eUsuario.eliminarImagen()"> Eliminar Imagen
          </button>
        </div>
      `

      $('#imagen').parent().parent().prepend(botonEliminarImagen)
    }

    $('#nuevo').find('.container').find('.row').find('form').prepend(botonNuevo)

    $('.collapsible').collapsible('open', 0)
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
    $('#apellidos').val('')
    $('#notas').val('')

    $('select').prop('selectedIndex', 0)
    $('select').material_select()

    $('input:file').val('')
    $('#imagenTexto').val('')
  }

  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @returns {null}
   * @description Limpia solo el campo imagen
   * @event boton eliminar imagen [id="eliminarImagen"] del tab cambiar
  */
  eliminarImagen () {
    $('input:file').val('')
    $('#imagenTexto').val('')

    modificarUsuario['eliminarImagen'] = true
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
} const eUsuario = new estadoUsuario()

/**
 * @class
 * @constructor
 * @method tablaCrear, eventoTabla, eventoTablaPanel, eventoResetarTabla, seleccionUsuario, seleccionUsuario, cargarDatos
 * @description Creación y manipulación de la tabla de usuarios
 */
class buscarUsuario {
  constructor() {
    this.eventoTabla()
    this.eventoTablaPanel()
    this.eventoResetarTabla()
    this.generarPDF()

    this.datosUsuarios = null
  }

  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @returns {null}
   * @description Crea la tabla de registros de usuarios creados y modificados
   * @event tab buscar y metodos de este archivo
  */
  tablaCrear () {
    ipcRenderer.on('usuario_entregaTabla', (e, datos) => {
      const filas = []
      this.datosUsuarios = datos.filas

      datos.filas.forEach(dato => {
        filas.push(`
          <tr onclick="bUsuario.seleccionUsuario('${JSON.stringify(dato).replace(/"/gi, '&quot;')}')">
            <td>${dato.idUsuario}</td>
            <td>${dato.nombre} ${dato.apellidos}</td>
            <td>${dato.usuario_tipo}</td>
            <td>${dato.manzana}</td>
          </tr>
        `)
      })

      $('table').find('tbody').html(filas.join(''))

      ipcRenderer.removeAllListeners('usuario_entregaTabla')
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
      ipcRenderer.send('usuario_cargaTabla')
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
    const selectA = document.getElementById('usuarioTipoBuscar')
    const selectB = document.getElementById('manzanaBuscar')

    const modificar = document.getElementById('modalModificar')
    const borrar = document.getElementById('modalBorrar')
    const cancelar = document.getElementById('modalCancelar')

    const pdf = document.getElementById('botonPDF')

    boton.addEventListener('click', e => {
      $('select').prop('selectedIndex', 0)
      $('select').material_select()

      const valorInput = input.value
      if (valorInput) {
        ipcRenderer.send('usuario_datosInputBuscar', valorInput)

        this.tablaCrear()
      }
    })

    input.addEventListener('keyup', e => {
      if (e.keyCode === 13) {
        $('select').prop('selectedIndex', 0)
        $('select').material_select()

        const valorInput = input.value

        if (valorInput) {
          ipcRenderer.send('usuario_datosInputBuscar', valorInput)

          this.tablaCrear()
        }
      }
    })

    $(selectA).change(() => {
      $('#inputBuscar').val('')
      $(selectB).prop('selectedIndex', 0)
      $(selectB).material_select()

      const valorInput = $(selectA).val()

      if (valorInput) {
        ipcRenderer.send('usuario_datosUsuarioTipoBuscar', valorInput)

        this.tablaCrear()
      }
    })

    $(selectB).change(() => {
      $('#inputBuscar').val('')
      $(selectA).prop('selectedIndex', 0)
      $(selectA).material_select()

      const valorInput = $(selectB).val()

      if (valorInput) {
        ipcRenderer.send('usuario_datosManzanaBuscar', valorInput)

        this.tablaCrear()
      }
    })

    modificar.addEventListener('click', e => {
      eUsuario.cambiar()

      $('ul.tabs').tabs('select_tab', 'nuevo')

      this.cargarDatos()
    })

    borrar.addEventListener('click', e => {
      $('body').addClass('bloquear-vista')
      const mensaje = `Esta a punto de borrar el usuario con folio: ${modificarUsuario.idUsuario}`

      const detalles = `
        Usuario: ${modificarUsuario.nombre} ${modificarUsuario.apellidos}
        Manzana: ${modificarUsuario.manzana}
        Tipo de Usuario: ${modificarUsuario.usuario_tipo}
        Notas del Usuario: ${modificarUsuario.notas ? modificarUsuario.notas : 'No hay notas'}

        Considere los cambios que podrá generar al ejercer esta acción:

        1.-Este y todos los demás usuarios están ligados directamente a los siguientes modulos: "Lecturistas, Clientes, Registro de Agua, Cobro de Agua", por lo que si usted borra este usuario, también se borrará todos aquellos registros en los que este usuario haya sido llamado en alguno de los modulos antes mencionados; por lo que antes de estar seguro de borrarlo, asegurate de tener un respaldo en PDF de tus registros de interés.

        2.-NO HAY SOPORTE DE HISTORIAL PARA REGISTROS BORRADOS... Una vez que decidas borrarlo, se eliminará por completo la información de la base de datos y "no será recuperable". Una alternativa a esto es crear informes PDF cada determinado tiempo.
      `

      let botones = ['Cancelar', 'Borrar']

      dialog.showMessageBox(new BrowserWindow({show: false, alwaysOnTop: true}), { type: 'error', buttons: botones, message: mensaje, detail: detalles }, respuesta => {
        $('body').removeClass('bloquear-vista')

        if (respuesta) ipcRenderer.send('usuarios_borrarRegistro', modificarUsuario)

        ipcRenderer.on('usuarios_respuestaBorrarRegistro', (e, mensaje) => {
          $('#modalB').html(`
            <div class="row">
              <div class="col s12">
                <div class="card-panel teal">
                  <span class="white-text">${mensaje.mensaje}</span>
                </div>
              </div>
            </div>
          `)


          ipcRenderer.send('usuario_cargaTabla')
          this.tablaCrear()

          let tiempo = 5000
          const cerrarModal = setTimeout(() => {

            if (modificarUsuario.idUsuario === mensaje.trabajador.idTrabajador) {
              ipcRenderer.send('usuario_enviarALogin')
            }

            $('#modalB').empty()

            eUsuario.nuevo()
          }, tiempo)

          ipcRenderer.removeAllListeners('usuarios_respuestaBorrarRegistro')
        })
      })
    })

    cancelar.addEventListener('click', e => {
      modificarUsuario = {}
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
  seleccionUsuario (usuarioString) {
    const usuarioJSON = JSON.parse(usuarioString.replace(/&quot;/gi, '"'))

    modificarUsuario = usuarioJSON

    modificarUsuario['eliminarImagen'] = false

    $('.modal').modal({
      dismissible: false
    })

    if (usuarioJSON.imagen) {
      const rutaImagen = path.join(__dirname, '../../assets/img/usuarios', usuarioJSON.manzana, usuarioJSON.imagen)

      $('#modalUsuario').find('.card').find('img').attr('src', rutaImagen)
    } else $('#modalUsuario').find('.card').find('img').removeAttr('src')

    $('#modalUsuario').find('.card').find('h3').text(usuarioJSON.nombre + ' ' + usuarioJSON.apellidos)

    $('#modalUsuario').find('.card').find('div:first-child').find('h4').text(usuarioJSON.usuario_tipo)
    $('#modalUsuario').find('.card').find('div:last-child').find('h4').text(usuarioJSON.manzana)

    $('#modalUsuario').find('.card').find('.fechas').find('div:first-child').find('h4').text(fechas.fixDate()(usuarioJSON.creado, 'longDate'))
    $('#modalUsuario').find('.card').find('.fechas').find('div:last-child').find('h4').text(fechas.fixDate()(usuarioJSON.actualizado, 'longDate'))

    $('#modalUsuario').find('.card').find('p').text(usuarioJSON.notas)

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
    if (Object.keys(modificarUsuario).length) {
      $('#nombre').val(modificarUsuario.nombre)
      $('#nombre').siblings('label').addClass("active")

      $('#apellidos').val(modificarUsuario.apellidos)
      $('#apellidos').siblings('label').addClass("active")

      $('#notas').val(modificarUsuario.notas)
      $('#notas').siblings('label').addClass("active")

      $(`select[name="usuario_tipo"] option[value="${modificarUsuario.idUsuario_tipo.toString()}"]`).prop('selected', true)
      $('select[name="usuario_tipo"]').material_select()

      $(`select[name="manzana"] option[value="${modificarUsuario.idManzana.toString()}"]`).prop('selected', true)
      $('select[name="manzana"]').material_select()

      $('input:file').val('')
      $('#imagenTexto').val(modificarUsuario.imagen)
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
      if (this.datosUsuarios !== null && datos.filas.length) {
        const organizacion = datos.filas[0]
        const salidaPDF = 'registro de usuarios'

        const datosPDF = {
          registros: this.datosUsuarios.length,
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

        this.datosUsuarios.forEach(col => {
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
      } else {
        alert('Es necesario llenar el formulario del módulo organización')
      }
    })
  }

} const bUsuario = new buscarUsuario()


/**
 * @class
 * @constructor cargarEntregaDatos, eventoSubmit, eventoLimpiar
 * @method
 * @description Manipulación de datos sensibles del formulario
 */
class usuario {
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
    ipcRenderer.on('usuario_entregaComponentes', (e, componentes) => {
      let optionUsuarioTipo = ['<option value="" disabled selected>Escoge un Usuario</option>']

      componentes.usuarioTipo.filas.forEach(uT => optionUsuarioTipo.push(`<option value="${uT.id}">${uT.tipo}</option>`))

      $('select[name="usuario_tipo"]').html(optionUsuarioTipo.join(''))
      $('select[id="usuarioTipoBuscar"]').html(optionUsuarioTipo.join(''))


      let optionManzanas = ['<option value="" disabled selected>Escoge la Manzana</option>']

      componentes.manzanas.filas.forEach(m => optionManzanas.push(`<option value="${m.id}">${m.manzana}</option>`))

      $('select[name="manzana"]').html(optionManzanas.join(''))
      $('select[id="manzanaBuscar"]').html(optionManzanas.join(''))

      $('select').material_select()
      $('select').closest('.input-field').children('span.caret').remove()

      ipcRenderer.removeAllListeners('usuario_entregaComponentes')
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

      var datosUsuario = {}

      formData.forEach((dato, key) => {
        if (key === 'imagen') {

          datosUsuario[key] = {
            'path': dato.path ? dato.path : null,
            'lastModified': dato.lastModified.length ? dato.lastModified : null,
            'lastModifiedDate': dato.lastModifiedDate.length ? dato.lastModified : null,
            'name': dato.name ? dato.name : null,
            'size': dato.size ? dato.size : null,
            'type': dato.type ? dato.type : null
          }
        } else if (key === 'usuario_tipo' || key === 'manzana') {
          datosUsuario[key] = parseInt(dato)
        } else datosUsuario[key] = dato.length ? dato : null
      })

      const nombreCampos = Object.keys(datosUsuario)

      if (!nombreCampos.includes('usuario_tipo')) datosUsuario['usuario_tipo'] = 0
      if (!nombreCampos.includes('manzana')) datosUsuario['manzana'] = 0

      if (Object.keys(modificarUsuario).length) {
        datosUsuario['ESTADO'] = 'cambiar'

        datosUsuario['viajeTiempo'] = modificarUsuario
      } else datosUsuario['ESTADO'] = 'crear'

      /**
       * @description Proceso de envio de datos usuario al servidor (ventana.js)
       */
      ipcRenderer.send('usuario_datosUsuario', datosUsuario)

      /**
       * @description Proceso de recepción de errores despues de manipularlos en el servidor
       */
      ipcRenderer.on('usuario_errores', (e, errores) => {

        Object.keys(errores).forEach(key => eUsuario.estadosErrores(key, errores[key]))

        datosUsuario = {}

        ipcRenderer.removeAllListeners('usuario_errores')
      })

      /**
       * @description Proceso de recepción del mensaje de éxito al finalizar todo el proceso del lado del servidor
       */
      ipcRenderer.on('usuario_respuesta', (e, datos) => {
        Object.keys(datos.errores).forEach(key => eUsuario.estadosErrores(key, datos.errores[key]))

        $('#nombre').focus()

        $('#modal').html(`
          <div class="row">
            <div class="col s12">
              <div class="card-panel teal">
                <span class="white-text">${datos.mensaje}</span>
              </div>
            </div>
          </div>
        `)

        if (Object.keys(modificarUsuario).length) {
          eUsuario.nuevo(false)
          modificarUsuario = {}
          let tiempo = 2000
          const cerrarModal = setTimeout(() => {
            $('#modal').empty()

            ipcRenderer.send('usuario_cargaTabla')
            bUsuario.tablaCrear()

            eUsuario.limpiarDatos()

            $('ul.tabs').tabs('select_tab', 'buscar')
          }, tiempo)
        } else {
          eUsuario.nuevo()

          let tiempo = 5000
          const cerrarModal = setTimeout(() => {
            $('#modal').empty()
          }, tiempo)
        }


        ipcRenderer.removeAllListeners('usuario_respuesta')
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
      eUsuario.limpiarDatos()

      const errores = {
        nombre: [],
        apellidos: [],
        notas: [],
        usuario_tipo: [],
        manzana: [],
        imagen: []
      }

      Object.keys(errores).forEach(key => eUsuario.estadosErrores(key, errores[key]))
    })
  }
} new usuario()
