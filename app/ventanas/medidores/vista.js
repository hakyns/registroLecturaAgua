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

var modificarMedidor = {}

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
class estadoMedidor {
  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @param {boolean} limpiar: Si es true limpiara los datos del formulario y además lva variable global modificarMedidor, de lo contrario no lo hará
   * @returns {null}
   * @description Devuelve a su estado original el tab del formulario principal
   * @event boton nuevo [id="volverTabNuevo"] del tab cambiar y metodos de este archivo
  */
  nuevo (limpiar = true) {
    $('#medidores').text('Nuevo')
    $('button[type="submit"]').text('Crear')

    $('#volverTabNuevo').remove()

    const errores = {
      usuario: [],
      medidor: [],
      latitud: [],
      longitud: [],
      notas: []
    }

    Object.keys(errores).forEach(key => this.estadosErrores(key, errores[key]))

    if (limpiar) {
      this.limpiarDatos()
      modificarMedidor = {}

      ipcRenderer.send('medidores_componentes')
      med.cargarEntregaDatos()
      $('select[name="usuario"]').prop('disabled', false)
      $('select[name="usuario"]').material_select()
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

    $('#medidores').text('Cambio')
    $('button[type="submit"]').text('Cambiar')

    const botonNuevo = `
      <div class="row" id="volverTabNuevo">
        <div class="container">
          <div class="col s12 right-align">
            <button class="btn waves-effect waves-light center-align cyan darken-2" type="button" onclick="eMedidor.nuevo()"> Nuevo
            </button>
            <br>
          </div>
        </div>
      </div>
    `

    $('#nuevo').find('.container').find('.row').find('form').prepend(botonNuevo)

    $('.collapsible').collapsible('open', 0)
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
    $('#medidor').val('')
    $('#latitud').val('')
    $('#longitud').val('')
    $('#notas').val('')

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
} const eMedidor = new estadoMedidor()

/**
 * @class
 * @constructor
 * @method tablaCrear, eventoTabla, eventoTablaPanel, eventoResetarTabla, seleccionUsuario, seleccionUsuario, cargarDatos
 * @description Creación y manipulación de la tabla de usuarios
 */
class buscarMedidores {
  constructor() {
    this.eventoTabla()
    this.eventoTablaPanel()
    this.eventoResetarTabla()
    this.generarPDF()

    this.datosMedidores = null
  }

  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @returns {null}
   * @description Crea la tabla de registros de usuarios creados y modificados
   * @event tab buscar y metodos de este archivo
  */
  tablaCrear () {
    ipcRenderer.on('medidores_entregaTabla', (e, datos) => {
      const filas = []
      this.datosMedidores = datos.filas

      datos.filas.forEach(dato => {
        filas.push(`
          <tr onclick="bMedidor.seleccionMedidor('${JSON.stringify(dato).replace(/"/gi, '&quot;')}')">
            <td>${dato.idMedidor}</td>
            <td>${dato.nombre} ${dato.apellidos}</td>
            <td>${dato.medidor ? dato.medidor : 'Sin medidor'}</td>
            <td>${dato.latitud}</td>
            <td>${dato.longitud}</td>
          </tr>
        `)
      })

      $('table').find('tbody').html(filas.join(''))

      ipcRenderer.removeAllListeners('medidores_entregaTabla')
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
      ipcRenderer.send('medidores_cargaTabla')
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
    const selectA = document.getElementById('clienteBuscar')
    const selectB = document.getElementById('manzanaBuscar')

    const modificar = document.getElementById('modalModificar')
    const borrar = document.getElementById('modalBorrar')
    const cancelar = document.getElementById('modalCancelar')

    const pdf = document.getElementById('botonPDF')

    $(selectA).change(() => {
      $(selectB).prop('selectedIndex', 0)
      $(selectB).material_select()

      const valorInput = $(selectA).val()

      if (valorInput) {
        ipcRenderer.send('medidores_datosClienteBuscar', valorInput)

        this.tablaCrear()
      }
    })

    $(selectB).change(() => {
      $(selectA).prop('selectedIndex', 0)
      $(selectA).material_select()

      const valorInput = $(selectB).val()

      if (valorInput) {
        ipcRenderer.send('medidores_datosManzanaBuscar', valorInput)

        this.tablaCrear()
      }
    })

    modificar.addEventListener('click', e => {
      eMedidor.cambiar()

      $('ul.tabs').tabs('select_tab', 'nuevo')

      this.cargarDatos()
    })

    borrar.addEventListener('click', e => {
      $('body').addClass('bloquear-vista')

      const mensaje = `Esta a punto de borrar el medidor del cliente con folio ${modificarMedidor.idMedidor}`

      const detalles = `
        Cliente: ${modificarMedidor.nombre} ${modificarMedidor.apellidos}
        Medidor: ${modificarMedidor.medidor ? modificarMedidor.medidor : 'Sin medidor'}
        Mapa Latitud: ${modificarMedidor.latitud}
        Mapa Longitud: ${modificarMedidor.longitud}

        Considere los cambios que podrá generar al ejercer esta acción:

        1.-Este y todos los demás registros están ligados directamente a los módulos "registro de agua y cobro de agua", por lo que una vez borrado este medidor cliente se eliminarán automáticamente todos los registros de agua y cobros de agua en donde este figurado el cliente titular "${modificarMedidor.nombre} ${modificarMedidor.apellidos}".

        2.-NO HAY SOPORTE DE HISTORIAL PARA REGISTROS BORRADOS... Una vez que decidas borrarlo, se eliminará por completo la información de la base de datos y "no será recuperable". Una alternativa a esto es crear informes PDF cada determinado tiempo.
      `

      let botones = ['Cancelar', 'Borrar']

      dialog.showMessageBox(new BrowserWindow({show: false, alwaysOnTop: true}), { type: 'error', buttons: botones, message: mensaje, detail: detalles }, respuesta => {
        $('body').removeClass('bloquear-vista')

        if (respuesta) ipcRenderer.send('medidores_borrarRegistro', modificarMedidor)

        ipcRenderer.on('medidores_respuestaBorrarRegistro', (e, mensaje) => {
          $('#modalB').html(`
            <div class="row">
              <div class="col s12">
                <div class="card-panel teal">
                  <span class="white-text">${mensaje.mensaje}</span>
                </div>
              </div>
            </div>
          `)

          modificarMedidor = {}
          eMedidor.nuevo()

          ipcRenderer.send('medidores_cargaTabla')
          this.tablaCrear()

          let tiempo = 5000
          const cerrarModal = setTimeout(() => {
            $('#modalB').empty()
          }, tiempo)

          ipcRenderer.removeAllListeners('medidores_respuestaBorrarRegistro')
        })
      })
    })

    cancelar.addEventListener('click', e => {
      modificarMedidor = {}
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
      ipcRenderer.send('medidores_cargaTabla')

      this.tablaCrear()

      $('select').prop('selectedIndex', 0)
      $('select').material_select()
    })
  }

  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @param {JSON -> string} medidorString: contiene todos los datos informativos del usuario elegido
   * @returns {null}
   * @description Crea el card del usuario
   * @event click en alguna fila de la tabla
  */
  seleccionMedidor (medidorString) {
    const medidorJSON = JSON.parse(medidorString.replace(/&quot;/gi, '"'))

    modificarMedidor = medidorJSON

    $('.modal').modal({
      dismissible: false
    })

    if (medidorJSON.imagen) {
      const rutaImagen = path.join(__dirname, '../../assets/img/usuarios', medidorJSON.manzana, medidorJSON.imagen)

      $('#modalMedidor').find('.card').find('img').attr('src', rutaImagen)
    } else $('#modalMedidor').find('.card').find('img').removeAttr('src')

    $('#modalMedidor').find('.card').find('h3').text(medidorJSON.nombre + ' ' + medidorJSON.apellidos)

    $('#modalMedidor').find('.card').find('.especificos').find('h4').text(medidorJSON.medidor)

    $('#modalMedidor').find('.card').find('.fechas').find('.grupo:first-child').find('h4').text(medidorJSON.latitud)
    $('#modalMedidor').find('.card').find('.fechas').find('.grupo:last-child').find('h4').text(medidorJSON.longitud)

    $('#modalMedidor').find('.card').find('p').text(medidorJSON.notas)

    $('#modalMedidor').modal('open')
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
    if (Object.keys(modificarMedidor).length) {
      $('#medidor').val(modificarMedidor.medidor)
      $('#medidor').siblings('label').addClass("active")

      $('#latitud').val(modificarMedidor.latitud)
      $('#latitud').siblings('label').addClass("active")

      $('#longitud').val(modificarMedidor.longitud)
      $('#longitud').siblings('label').addClass("active")

      $('#notas').val(modificarMedidor.notas)
      $('#notas').siblings('label').addClass("active")


      $('select[name="usuario"]').html(`
      <option value="" disabled selected>${modificarMedidor.nombre} ${modificarMedidor.apellidos}</option>
      `)
      $('select[name="usuario"]').prop('disabled', true)
      $('select[name="usuario"]').material_select()
      $('select[name="usuario"]').closest('.input-field').children('span.caret').remove()
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
      if (this.datosMedidores !== null) {
        const organizacion = datos.filas[0]
        const salidaPDF = 'registro de usuarios'

        const datosPDF = {
          registros: this.datosMedidores.length,
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

        this.datosMedidores.forEach(col => {
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

} const bMedidor = new buscarMedidores()


/**
 * @class
 * @constructor cargarEntregaDatos, eventoSubmit, eventoLimpiar
 * @method
 * @description Manipulación de datos sensibles del formulario
 */
class medidores {
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
    ipcRenderer.on('medidores_entregaComponentes', (e, componentes) => {
      if (!componentes.usuariosClientes.filas.length) {
        let optionUsuarioCliente = ['<option value="" disabled selected>No hay clientes para mostrar</option>']

        $('select[id="clienteBuscar"]').html(optionUsuarioCliente.join(''))
      } else {
        let optionUsuarioCliente = ['<option value="" disabled selected>Escoge un Cliente</option>']

        componentes.usuariosClientes.filas.forEach(u => {
          if (u.imagen !== null) {
            optionUsuarioCliente.push(`<option value="${u.idUsuario}" data-icon="${path.join(__dirname, '../../assets/img/usuarios/', u.manzana, u.imagen)}" class="circle">${u.nombre} ${u.apellidos}</option>`)
          } else {
            optionUsuarioCliente.push(`<option value="${u.idUsuario}">${u.nombre} ${u.apellidos}</option>`)
          }
        })

        $('select[id="clienteBuscar"]').html(optionUsuarioCliente.join(''))
      }

      if (!componentes.usuarios.filas.length) {
        let optionUsuario = ['<option value="" disabled selected>No hay clientes para asignar medidor</option>']

        $('select[name="usuario"]').html(optionUsuario.join(''))
      } else {
        let optionUsuario = ['<option value="" disabled selected>Escoge un Cliente</option>']

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
        let optionManzana = ['<option value="" disabled selected>No hay manzanas disponibles para asignar al lecturista</option>']

        $('select[name="zona_trabajo"]').html(optionManzana.join(''))
        $('select[id="manzanaBuscar"]').html(optionManzana.join(''))
      } else {
        let optionManzana = ['<option value="" disabled selected>Escoge la zona de trabajo</option>']

        componentes.manzanas.filas.forEach(m => optionManzana.push(`<option value="${m.idManzana}">${m.manzana}</option>`))

        $('select[name="zona_trabajo"]').html(optionManzana.join(''))
        $('select[id="manzanaBuscar"]').html(optionManzana.join(''))
      }

      if (!componentes.usuarios.filas.length) $('button[type="submit"]').addClass('disabled')
      else $('button[type="submit"]').removeClass('disabled')

      $('select').material_select()
      $('select').closest('.input-field').children('span.caret').remove()

      ipcRenderer.removeAllListeners('medidores_entregaComponentes')
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

      var datosMedidor = {}

      formData.forEach((dato, key) => {
        if (key === 'usuario') {
          datosMedidor[key] = parseInt(dato)
        } else datosMedidor[key] = dato.length ? dato : null
      })

      const nombreCampos = Object.keys(datosMedidor)

      if (!nombreCampos.includes('usuario')) datosMedidor['usuario'] = 0

      datosMedidor['CLIENTE'] = $('select[name="usuario"] option:selected').text()

      if (Object.keys(modificarMedidor).length) {
        datosMedidor['ESTADO'] = 'cambiar'

        datosMedidor['viajeTiempo'] = modificarMedidor
      } else datosMedidor['ESTADO'] = 'crear'

      /**
       * @description Proceso de envio de datos usuario al servidor (ventana.js)
       */
      ipcRenderer.send('medidores_datosMedidor', datosMedidor)

      /**
       * @description Proceso de recepción de errores despues de manipularlos en el servidor
       */
      ipcRenderer.on('medidores_errores', (e, errores) => {

        Object.keys(errores).forEach(key => eMedidor.estadosErrores(key, errores[key]))

        datosMedidor = {}

        ipcRenderer.removeAllListeners('medidores_errores')
      })

      /**
       * @description Proceso de recepción del mensaje de éxito al finalizar todo el proceso del lado del servidor
       */
      ipcRenderer.on('medidores_respuesta', (e, datos) => {
        Object.keys(datos.errores).forEach(key => eMedidor.estadosErrores(key, datos.errores[key]))

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

        if (Object.keys(modificarMedidor).length) {
          eMedidor.nuevo()
          let tiempo = 2000
          const cerrarModal = setTimeout(() => {
            $('#modal').empty()

            ipcRenderer.send('medidores_cargaTabla')
            bMedidor.tablaCrear()

            eMedidor.limpiarDatos()

            $('ul.tabs').tabs('select_tab', 'buscar')
          }, tiempo)
        } else {
          eMedidor.nuevo()

          let tiempo = 5000
          const cerrarModal = setTimeout(() => {
            $('#modal').empty()
          }, tiempo)
        }


        ipcRenderer.removeAllListeners('medidores_respuesta')
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
      eMedidor.limpiarDatos()

      const errores = {
        usuario: [],
        medidor: [],
        latitud: [],
        longitud: [],
        notas: []
      }

      Object.keys(errores).forEach(key => eMedidor.estadosErrores(key, errores[key]))
    })
  }
} const med = new medidores()
