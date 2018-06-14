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

var modificarCobroAgua = {}

/**
 * @description Iniciadores de componentes materialize
 */
$('select').material_select()
$('ul.tabs').tabs()

/**
 * @class
 * @method nuevo, cambiar, limpiarDatos, eliminarImagen, estadosErrores
 * @description Funcionalidades para cambiar el DOM de la vista html
 */
class estadoCobroAgua {
  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @param {boolean} limpiar: Si es true limpiara los datos del formulario y además lva variable global modificarCobroAgua, de lo contrario no lo hará
   * @returns {null}
   * @description Devuelve a su estado original el tab del formulario principal
   * @event boton nuevo [id="volverTabNuevo"] del tab cambiar y metodos de este archivo
  */
  nuevo (limpiar = true) {
    $('#cobroAgua').text('Cobrar')
    $('button[type="submit"]').text('Cobrar')

    $('#volverTabNuevo').remove()

    if (limpiar) {
      this.limpiarDatos()
      modificarCobroAgua = {}
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

    $('#cobroAgua').text('Cambio')
    $('button[type="submit"]').text('Cambiar')

    const botonNuevo = `
      <div class="row" id="volverTabNuevo">
        <div class="container">
          <div class="col s12 right-align">
            <button class="btn waves-effect waves-light center-align cyan darken-2" type="button" onclick="eCobroAgua.nuevo()"> Nuevo
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
    $('#dinero_total').val('')
    $('#desglose_pagos').val('')
    $('#dinero_recibido').val('')
    $('#dinero_cambio').val('')

    // $('select').prop('selectedIndex', 0)
    // $('select').material_select()
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
} const eCobroAgua = new estadoCobroAgua()

/**
 * @class
 * @constructor
 * @method tablaCrear, eventoTabla, eventoTablaPanel, eventoResetarTabla, seleccionUsuario, seleccionUsuario, cargarDatos
 * @description Creación y manipulación de la tabla de usuarios
 */
class buscarCobroAgua {
  constructor() {
    this.eventoTabla()
    this.eventoTablaPanel()
    this.eventoResetarTabla()
    this.generarPDF()

    this.datosCobroAgua = null
  }

  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @returns {null}
   * @description Crea la tabla de registros de usuarios creados y modificados
   * @event tab buscar y metodos de este archivo
  */
  tablaCrear () {
    ipcRenderer.on('cobroAgua_entregaTabla', (e, datos) => {
      const filas = []
      let desglosePagos = null

      this.datosCobroAgua = datos.filas

      let datos2 = JSON.parse(JSON.stringify(datos.filas))

      datos2.forEach(dato => {
        let desgloseJSON = JSON.parse(dato.desglose_pagos)

        let desgloseElegido = {}

        for (const desglose of desgloseJSON) {
          if (dato.registro_agua === desglose.registroAgua) desgloseElegido = desglose
        }

        if (dato.desglose_pagos) desglosePagos = JSON.stringify(dato.desglose_pagos).replace(/"/gi, '&quot;')
        else desglosePagos = null

        delete(dato.desglose_pagos)
        filas.push(`
          <tr onclick="bCobroAgua.seleccionCobroAgua('${JSON.stringify(dato).replace(/"/gi, '&quot;')}', ${desglosePagos})">
            <td>${dato.registro_agua}</td>
            <td>${dato.nombre} ${dato.apellidos}</td>
            <td>${fechas.fixDate()(new Date(desgloseElegido.fechaCobro), 'default')}</td>
            <td>${desgloseElegido.lecturaAgua}</td>
            <td>${desgloseElegido.metrosConsumidos}</td>
            <td>$${dato.dinero_total}</td>
          </tr>
        `)
      })

      $('table').find('tbody').html(filas.join(''))

      ipcRenderer.removeAllListeners('cobroAgua_entregaTabla')
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
      ipcRenderer.send('cobroAgua_cargaTabla')
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

    const borrar = document.getElementById('modalBorrar')
    const cancelar = document.getElementById('modalCancelar')

    const pdf = document.getElementById('botonPDF')

    $(selectA).change(() => {
      const valorInput = $(selectA).val()

      if (valorInput) {
        ipcRenderer.send('cobroAgua_clienteBuscar', valorInput)

        this.tablaCrear()
      }
    })

    borrar.addEventListener('click', e => {
      // Buscar una mejor forma de bloquear la ventana cuando el dialog este activo, por ahora tendrá un bug, el cual el usuario si puede cerrar la ventana desde la X para después volverla a abrir
      $('body').addClass('bloquear-vista')

      const mensaje = `Esta a punto de borrar el registro con el folio: ${modificarCobroAgua.registro_agua}`

      const detalles = `
      Cliente: ${modificarCobroAgua.nombre} ${modificarCobroAgua.apellidos}
      Fecha Cobro: ${fechas.fixDate()(modificarCobroAgua.fecha_cobro, 'default')}
      Total a pagar: $${modificarCobroAgua.dinero_total}
      Dinero Recibido: $${modificarCobroAgua.dinero_recibido}
      Dinero Cambio: $${modificarCobroAgua.dinero_cambio}
      Folios pago Conjunto: ${modificarCobroAgua.pago_conjunto}

      Considere los cambios que podrá generar al ejercer esta acción:

      1.-El registro de agua de este folio volverá a estar disponible para volverse a cobrar de nuevo, teniendo como consecuencia la mezcla con otras fechas en un "pago en conjunto" futuro.

      2.-El borrar este folio "no afectará en nada" los datos en los cobros de agua si éste pertenece a un "pago en conjunto"; por lo que si es borrado se eliminará la porción de dinero asignado a este folio (calculado por este sistema), pudiendo ocasionar confusiones personales al encargado que lleve la tesoreria de estos cobros.

      3.-NO HAY SOPORTE DE HISTORIAL PARA FOLIOS BORRADOS... Una vez que decidas borrarlo, se eliminará por completo la información de la base de datos y "no será recuperable". Una alternativa a esto es crear informes PDF cada determinado tiempo`

      let botones = ['Cancelar', 'Borrar'];

      dialog.showMessageBox(new BrowserWindow({show: false, alwaysOnTop: true}), { type: 'error', buttons: botones, message: mensaje, detail: detalles }, respuesta => {
        $('body').removeClass('bloquear-vista')

        if (respuesta) ipcRenderer.send('cobroAgua_borrarRegistro', modificarCobroAgua)

        ipcRenderer.on('cobroA_respuestaBorrarRegistro', (e, mensaje) => {
          $('#modalB').html(`
            <div class="row">
              <div class="col s12">
                <div class="card-panel teal">
                  <span class="white-text">${mensaje.mensaje}</span>
                </div>
              </div>
            </div>
          `)

          modificarCobroAgua = {}

          $('select').prop('selectedIndex', 0)
          $('select').material_select()

          ipcRenderer.send('cobroAgua_cargaTabla')
          this.tablaCrear()

          let tiempo = 3000
          const cerrarModal = setTimeout(() => {
            $('#modalB').empty()
          }, tiempo)

          ipcRenderer.removeAllListeners('cobroA_respuestaBorrarRegistro')
        })
      })
    })

    cancelar.addEventListener('click', e => {
      modificarCobroAgua = {}
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
      ipcRenderer.send('cobroAgua_cargaTabla')

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
  seleccionCobroAgua (cobroAguaString, desglosePagos) {
    const cobroAguaJSON = JSON.parse(cobroAguaString.replace(/&quot;/gi, '"'))
    const desglosePagosJSONARRAY = JSON.parse(desglosePagos.replace(/&quot;/gi, '"'))

    let desglosePagosJSON = {}

    for (const desglose of desglosePagosJSONARRAY) {
      if (desglose.registroAgua === cobroAguaJSON.registro_agua) desglosePagosJSON = desglose
    }

    modificarCobroAgua = cobroAguaJSON

    $('.modal').modal({
      dismissible: false
    })

    if (cobroAguaJSON.imagen) {
      const rutaImagen = path.join(__dirname, '../../assets/img/usuarios', cobroAguaJSON.manzana, cobroAguaJSON.imagen)

      $('#modalCobroAgua').find('.card').find('img').attr('src', rutaImagen)
    } else $('#modalCobroAgua').find('.card').find('img').removeAttr('src')

    $('#modalCobroAgua').find('.card').find('h3').text(cobroAguaJSON.nombre + ' ' + cobroAguaJSON.apellidos)

    $('#modalCobroAgua').find('.card').find('.especificos').find('div:first-child').find('h4').html(desglosePagosJSON.lecturaAgua)
    $('#modalCobroAgua').find('.card').find('.especificos').find('div:last-child').find('h4').text(desglosePagosJSON.fechaRegistro)

    let datosCliente = []

    for (const cliente of this.datosCobroAgua) {
      if (cobroAguaJSON.nombre + ' ' +cobroAguaJSON.apellidos === cliente.nombre + ' ' + cliente.apellidos) {
        datosCliente.push(cliente)
      }
    }

    datosCliente.sort((a, b) => {
      return Date.parse(a.fecha_cobro) + Date.parse(b.fecha_cobro)
    })

    let folioAnterior = null
    for (const folio of datosCliente) {
      if (cobroAguaJSON.registro_agua === folio.registro_agua) break

      folioAnterior = folio.registro_agua
    }

    let lecturaAnterior = null

    for (const dato of datosCliente) {
      if (dato.registro_agua === folioAnterior) {
        let desgloseJSON = JSON.parse(dato.desglose_pagos)
        let desgloseUsar = {}

        for (const desglose of desgloseJSON) if (desglose.registroAgua === folioAnterior) desgloseUsar = desglose

        lecturaAnterior = desgloseUsar.lecturaAgua
        break
      } else lecturaAnterior = `0m<sup>2</sup>`
    }

    const comprobacionLecturas = [
      parseInt(desglosePagosJSON.lecturaAgua.split('m')[0]),
      parseInt(lecturaAnterior.split('m')[0]),
      parseInt(desglosePagosJSON.metrosConsumidos.split('m')[0])
    ]

    if (comprobacionLecturas[0] - comprobacionLecturas[1] !== comprobacionLecturas[2]) {
      lecturaAnterior = (comprobacionLecturas[0] - comprobacionLecturas[2]).toString() + 'm<sup>2</sup> Borrado'
    }

    $('#modalCobroAgua').find('.card').find('#modalCobroAguaLecturas').find('div:first-child').find('h4').html(lecturaAnterior)
    $('#modalCobroAgua').find('.card').find('#modalCobroAguaLecturas').find('div:last-child').find('h4').html(desglosePagosJSON.metrosConsumidos)

    $('#modalCobroAgua').find('.card').find('#modalCobroAguaDineroA').find('div:first-child').find('h4').text(`$${cobroAguaJSON.dinero_total}`)
    let tarifaAplicada = desglosePagosJSON.tarifaAplicada.split(',')
    let tf = tarifaAplicada.map(t => {
      return `${t} <br>`
    })
    $('#modalCobroAgua').find('.card').find('#modalCobroAguaDineroA').find('div:last-child').find('h4').html(tf.join(''))

    $('#modalCobroAgua').find('.card').find('#modalCobroAguaDesglose').find('div:first-child').find('h4').text(`$${cobroAguaJSON.dinero_recibido}`)
    $('#modalCobroAgua').find('.card').find('#modalCobroAguaDesglose').find('div:last-child').find('h4').text(`$${cobroAguaJSON.dinero_cambio}`)

    let pagoConjunto = desglosePagosJSON.pagoConjunto.map(pago => {
      return `<b>Folio:</b> ${pago} <br>`
    })
    $('#modalCobroAgua').find('.card').find('#modalCobroAguaDineroB').find('div:first-child').find('h4').html(pagoConjunto.join(''))
    $('#modalCobroAgua').find('.card').find('#modalCobroAguaDineroB').find('div:last-child').find('h4').text(fechas.fixDate()(new Date (desglosePagosJSON.fechaCobro), 'longDate'))

    $('#modalCobroAgua').modal('open')
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

      if (this.datosCobroAgua !== null) {
        const organizacion = datos.filas[0]
        const salidaPDF = 'Cobros de agua'

        const cobrosMeses = totalCobroMes(this.datosCobroAgua)

        const datosPDF = {
          registros: cobrosMeses.length - 1,
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
              'Cliente',
              'Ene',
              'Feb',
              'Mar',
              'Abr',
              'May',
              'Jun',
              'Jul',
              'Ago',
              'Sep',
              'Oct',
              'Nov',
              'Dic'
            ],
            estilos: {
              0: {columnWidth: 40}, // Folio
              1: {columnWidth: 130}, // Nombre
              2: {columnWidth: 50}, // Enero
              3: {columnWidth: 50}, // Febrero
              4: {columnWidth: 50}, // Marzo
              5: {columnWidth: 50}, // Abril
              6: {columnWidth: 50}, // Mayo
              7: {columnWidth: 50}, // Junio
              8: {columnWidth: 50}, // Julio
              9: {columnWidth: 50}, // Agosto
              10: {columnWidth: 50}, // Septiembre
              11: {columnWidth: 50}, // Octubre
              12: {columnWidth: 50}, // Noviembre
              13: {columnWidth: 50}, // Diciembre
            }
          },
          filas: cobrosMeses
        }

        new generadorPDF('registros-landscape', datosPDF)
      }
    })
  }

} const bCobroAgua = new buscarCobroAgua()


/**
 * @class
 * @constructor cargarEntregaDatos, eventoSubmit, eventoLimpiar
 * @method
 * @description Manipulación de datos sensibles del formulario
 */
class cobroAgua {
  constructor () {
    this.cargarEntregaDatos()
    this.eventoRegistroAgua()
    this.eventoDesgloseAgua()
    this.eventoSubmit()
    this.eventoLimpiar()
    this.eventoCadenaInicial()

    this.desglosePagos = []
    $('#dinero_recibido').attr('disabled', 'disabled')
    $('#dinero_cambio').attr('disabled', 'disabled')
  }

  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @returns {null}
   * @description Carga los selects usuario_tipo y manzanas
   * @event Constructor de la clase
  */
  cargarEntregaDatos () {
    ipcRenderer.on('cobroAgua_entregaComponentes', (e, componentes) => {
      let optionCliente = ['<option value="" disabled selected>Escoge un Cliente</option>']

      componentes.clientes.filas.forEach(cliente => {
        if (cliente.imagen !== null) {
          optionCliente.push(`<option value="${cliente.medidor}" data-icon="${path.join(__dirname, '../../assets/img/usuarios/', cliente.manzana, cliente.imagen)}" class="circle">${cliente.nombre} ${cliente.apellidos}</option>`)
        } else {
          optionCliente.push(`<option value="${cliente.medidor}">${cliente.nombre} ${cliente.apellidos}</option>`)
        }
      })

      $('select[name="cliente"]').html(optionCliente.join(''))
      $('#clienteBuscar').html(optionCliente.join(''))

      let optionRegistro = ['<option value="" disabled selected>Esperando por Registros de Agua</option>']

      $('select[name="registro_agua"]').html(optionRegistro.join(''))

      $('select').material_select()
      $('select').closest('.input-field').children('span.caret').remove()

      ipcRenderer.removeAllListeners('cobroAgua_entregaComponentes')
    })
  }

  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @returns {null}
   * @description Evento que despliega todas las fechas de registro de agua realizados
   * @event boton submit [type="submit"]
  */
  eventoRegistroAgua () {
    $('select[name="cliente"]').change(() => {
      this.eventoResetearPago()

      $('select[name="registro_agua"]').prop('selectedIndex', 0)
      $('select[name="registro_agua"]').material_select()

      this.serverFechas()
    })
  }

  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @returns {null}
   * @description Función que manda a llamar todas las fechas disponibles para generar su desglose de pagos
   * @event Todo el documento
  */
  serverFechas () {
    const medidor = $('select[name="cliente"]').val()

    ipcRenderer.send('cobroAgua_cargaRegistrosAgua', medidor)

    ipcRenderer.on('cobroAgua_entregaRegistrosAgua', (e, registros) => {
      let optionRegistroAgua = ['<option value="" disabled selected>Escoge un Registro de Agua</option>']

      if (registros.filas.length) {
        registros.filas.forEach(registro => {
          optionRegistroAgua.push(`<option value="${registro.fechaRegistro}">${fechas.fixDate()(registro.fechaRegistro, 'longDate')}</option>`)
        })
      } else {
        optionRegistroAgua[0] = '<option value="" disabled selected>No hay registros de agua por cobrar</option>'
      }

      $('select[name="registro_agua"]').html(optionRegistroAgua.join(''))

      $('select').material_select()
      $('select').closest('.input-field').children('span.caret').remove()

      ipcRenderer.removeAllListeners('cobroAgua_entregaRegistrosAgua')
    })
  }

  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @returns {null}
   * @description Recolecta los datos ingresados por la persona y los envia al servidor (ventana.js) para su tratamiento
   * @event boton submit [type="submit"]
  */
  eventoCadenaInicial () {
    $('#cadenaInicial').change(() => {
      eCobroAgua.limpiarDatos()

      this.eventoResetearPago()

      $('select[name="registro_agua"]').prop('selectedIndex', 0)
      $('select[name="registro_agua"]').material_select()
    })
  }

  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @returns {null}
   * @description Recolecta los datos ingresados por la persona y los envia al servidor (ventana.js) para su tratamiento
   * @event boton submit [type="submit"]
  */
  eventoDesgloseAgua () {
    const registroAgua = document.getElementsByName('registro_agua')

    $(registroAgua).change(() => {
      eCobroAgua.limpiarDatos()

      const datos = {
        fechaRegistro: $(registroAgua).val(),
        medidor: $('select[name="cliente"]').val()
      }
      ipcRenderer.send('cobroAgua_cargaDesgloseAgua', datos)

      ipcRenderer.on('cobroAgua_entregaDesgloseAgua', (e, datos) => {
        const errores = {
          registro_agua: [],
          desglose_pagos: [],
          dinero_total: [],
          dinero_recibido: [],
          dinero_cambio: []
        }

        Object.keys(errores).forEach(key => eCobroAgua.estadosErrores(key, errores[key]))

        // Datos devuelte objetos: Trabajador, cobradosAgua, desglose, tarifas
        // Información que se enviará al servidor para armar el registro cobro de agua
        let desgloseJSON = []
        // Información que se usará para desplegar los detalles de cobro de agua al cliente
        let desgloseHTML = []

        // Registros ya pagados
        let registrosPagados = Object.keys(datos.cobradosAgua)

        // Rangos Maximos y cuotas maximas de las tarifas
        let cuoMax = cuotasMaximos(datos.tarifas.filas)
        let ranMax = Object.keys(cuoMax)

        let mC = 0.00

        // Variables de dinero
        let pagoTotalAcumulado = 0.00
        let pagoAguaFecha = 0.00

        // Variables de detalles
        let lecturaAnterior = 0
        let tarifaAplicadaDetalles = null

        let ceroInicial = $('#cadenaInicial').prop('checked')

        datos.desglose.filas.forEach((regAgua, index) => {
          let tarifaAplicada = {}

          if (ceroInicial) {
            mC = 0
            ceroInicial = false
          } else mC = regAgua.lectura - lecturaAnterior

          for (const tarifa of datos.tarifas.filas) {
            if ( mC >= tarifa.rango_minimo && mC <= tarifa.rango_maximo ) tarifaAplicada = tarifa
          }

          if (Object.keys(tarifaAplicada).length || mC <= 0) {

            if (ranMax.includes(mC.toString())) {
              pagoAguaFecha = cuoMax[mC]

              if (!registrosPagados.includes(regAgua.idRegistroAgua.toString())) {
                pagoTotalAcumulado = pagoTotalAcumulado + pagoAguaFecha
              }

              tarifaAplicadaDetalles = `${pagoAguaFecha} -> [${tarifaAplicada.rango_minimo}m<sup>2</sup>-${tarifaAplicada.rango_maximo}m<sup>2</sup> ${tarifaAplicada.tipoTarifa ? '(+' + tarifaAplicada.tarifa + ')' : '(=' + tarifaAplicada.tarifa + ')'}]`
            } else if (mC <= 0) {
              pagoAguaFecha = 0.0

              tarifaAplicadaDetalles = `${pagoAguaFecha} -> [0m<sup>2</sup>-0m<sup>2</sup> (#0)}]`
            } else {
              if (tarifaAplicada.tipoTarifa) {
                // Tarifa Incrementada

                let ranMaxAnterior = null
                for (const rango of ranMax) {
                  // Aqui obtengo el rango maximo cercano, ejemplo: 24, su rango más cercano es 20 y retornará solo su tarifa
                  if (parseInt(rango) < mC) ranMaxAnterior = cuoMax[parseInt(rango)]
                }

                pagoAguaFecha = cuotaTarifa(ranMaxAnterior, mC, tarifaAplicada.rango_minimo, tarifaAplicada.tarifa)

                if (!registrosPagados.includes(regAgua.idRegistroAgua.toString())) {
                  pagoTotalAcumulado = pagoTotalAcumulado + pagoAguaFecha
                }
              } else {
                // Tarifa Fija

                pagoAguaFecha = tarifaAplicada.tarifa

                if (!registrosPagados.includes(regAgua.idRegistroAgua.toString())) {
                  pagoTotalAcumulado = pagoTotalAcumulado + pagoAguaFecha
                }
              }


              tarifaAplicadaDetalles = `${pagoAguaFecha} -> [${tarifaAplicada.rango_minimo}m<sup>2</sup> - ${tarifaAplicada.rango_maximo}m<sup>2</sup> ${tarifaAplicada.tipoTarifa ? '(+' + tarifaAplicada.tarifa + ')' : '(=' + tarifaAplicada.tarifa + ')'}]`
            }

            if (!registrosPagados.includes(regAgua.idRegistroAgua.toString())) {
              desgloseJSON.push({
                lecturista: `${datos.Trabajador.nombre} ${datos.Trabajador.apellidos}`,
                cliente: `${regAgua.nombre} ${regAgua.apellidos}`,
                registroAgua: regAgua.idRegistroAgua,
                lecturaAgua: `${regAgua.lectura}m<sup>2</sup>`,
                fechaRegistro: fechas.fixDate()(regAgua.fecha_cambio, 'longDate'),
                metrosConsumidos: `${mC}m<sup>2</sup>`,
                tarifaAplicada: `${tarifaAplicadaDetalles}`,
                tipoTarifa: tarifaAplicada.tipoTarifa ? 'Incremento * m<sup>2</sup> Consumido' : 'Tarifa Fija',
                fechaCobro: fechas.fixDate()(new Date(), 'longDate'),
                pagoAgua: pagoAguaFecha
              })

              desgloseHTML.push(`
                <ul class="desglose-pagos">
                  <li class="desglose-pagos-numero">
                    ${index + 1 - registrosPagados.length}
                  </li>
                  <li>
                    <b>Folio:</b> ${regAgua.idRegistroAgua}
                  </li>
                  <li>
                    <b>Lectura:</b> ${regAgua.lectura}m<sup>2</sup>
                  </li>
                  <li>
                    <b>Fecha de Registro:</b> ${fechas.fixDate()(regAgua.fecha_cambio, 'longDate')}
                  </li>
                  <li>
                    <b>M<sup>2</sup> consumidos:</b> ${mC}m<sup>2</sup>
                  </li>
                  <li>
                    <b>Tarifa aplicada:</b> ${tarifaAplicadaDetalles}
                  </li>
                  <li>
                    <b>Tipo de tarifa:</b> ${tarifaAplicada.tipoTarifa ? 'Incremento * m<sup>2</sup> Consumido' : 'Tarifa Fija'}
                  </li>
                  <li>
                    <b>Fecha de Cobro:</b> ${fechas.fixDate()(new Date(), 'longDate')}
                  </li>
                  <li>
                    <b>Pago Agua:</b> $${pagoAguaFecha}
                  </li>
                </ul>
              `)
            }

            lecturaAnterior = regAgua.lectura
          } else {
            const errores = {
              desglose_pagos: [`Faltan rangos por definir, no hay rango para incrustar para el valor ${mC}`]
            }

            Object.keys(errores).forEach(key => eCobroAgua.estadosErrores(key, errores[key]))

            pagoTotalAcumulado = 0.00
            desgloseHTML = []
            desgloseJSON = []
          }
        })

        this.desglosePagos = desgloseJSON
        $('#desglose_pagos').html(desgloseHTML.join(''))


        $('#dinero_total').val(parseFloat(pagoTotalAcumulado))
        $('#dinero_total').siblings('label').addClass("active")

        this.eventoDinero()

        ipcRenderer.removeAllListeners('cobroAgua_entregaDesgloseAgua')
      })
    })
  }

  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @returns {null}
   * @description Añade la funcionalidad del comportamiento del dinero recibido y cambio de dinero
   * @event boton submit [type="submit"]
  */
  eventoDinero () {
    const recibido = document.getElementById('dinero_recibido')
    const cambio = document.getElementById('dinero_cambio')
    const totalPagar = document.getElementById('dinero_total')

    if (totalPagar.value) {
      $(recibido).removeAttr('disabled', 'disabled')
      // $(cambio).removeAttr('disabled', 'disabled')

      recibido.addEventListener('blur', e => {
        const devolver = (parseFloat(recibido.value) - parseFloat(totalPagar.value)).toFixed(2)

        $(cambio).val(devolver)
        $(cambio).siblings('label').addClass("active")
      })

      recibido.addEventListener('keyup', e => {
        if (e.keyCode === 13) {
          const devolver = (parseFloat(recibido.value) - parseFloat(totalPagar.value)).toFixed(2)

          $(cambio).val(devolver)
          $(cambio).siblings('label').addClass("active")
        }
      })
    } else {
      $(recibido).attr('disabled', 'disabled')
      $(cambio).attr('disabled', 'disabled')
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

      var datosCobroAgua = {}

      formData.forEach((dato, key) => {
        if (key === 'dinero_cambio' || key === 'dinero_recibido' || key === 'dinero_total') {
          datosCobroAgua[key] = dato ? parseFloat(dato) : 0.00
        } else datosCobroAgua[key] = dato.length ? dato : null
      })

      const nombreCampos = Object.keys(datosCobroAgua)

      if (!nombreCampos.includes('dinero_total')) datosCobroAgua['dinero_total'] = parseFloat($('#dinero_total').val()) ? parseFloat($('#dinero_total').val()) : 0.00
      if (!nombreCampos.includes('dinero_cambio')) datosCobroAgua['dinero_cambio'] = parseFloat($('#dinero_cambio').val()) ? parseFloat($('#dinero_cambio').val()) : 0.00

      datosCobroAgua['desglose_pagos'] = this.desglosePagos

      datosCobroAgua.desglose_pagos.forEach((desglose, index, array) => {
        array[index]['pagoConjunto'] = this.desglosePagos.map(reg => reg.registroAgua)
      })

      if (Object.keys(modificarCobroAgua).length) {
        datosCobroAgua['ESTADO'] = 'cambiar'

        // datosCobroAgua['viajeTiempo'] = modificarCobroAgua
      } else datosCobroAgua['ESTADO'] = 'crear'

      /**
       * @description Proceso de envio de datos usuario al servidor (ventana.js)
       */
      ipcRenderer.send('cobroAgua_datosCobroAgua', datosCobroAgua)

      /**
       * @description Proceso de recepción de errores despues de manipularlos en el servidor
       */
      ipcRenderer.on('cobroAgua_errores', (e, errores) => {

        Object.keys(errores).forEach(key => eCobroAgua.estadosErrores(key, errores[key]))

        datosCobroAgua = {}

        ipcRenderer.removeAllListeners('cobroAgua_errores')
      })

      /**
       * @description Proceso de recepción del mensaje de éxito al finalizar todo el proceso del lado del servidor
       */
      ipcRenderer.on('cobroAgua_respuesta', (e, datos) => {
        Object.keys(datos.errores).forEach(key => eCobroAgua.estadosErrores(key, datos.errores[key]))

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

        if (Object.keys(modificarCobroAgua).length) {
          // eCobroAgua.nuevo(false)
          // let tiempo = 2000
          // const cerrarModal = setTimeout(() => {
            // $('#modal').empty()

            // ipcRenderer.send('usuario_cargaTabla')
            // bCobroAgua.tablaCrear()

            // eCobroAgua.limpiarDatos()

            // $('ul.tabs').tabs('select_tab', 'buscar')
          // }, tiempo)
        } else {
          eCobroAgua.nuevo()
          this.eventoResetearPago()
          this.serverFechas()

          $('select[name="registro_agua"]').prop('selectedIndex', 0)
          $('select[name="registro_agua"]').material_select()

          let tiempo = 5000
          const cerrarModal = setTimeout(() => {
            $('#modal').empty()
          }, tiempo)
        }


        ipcRenderer.removeAllListeners('cobroAgua_respuesta')
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
  eventoResetearPago () {
    $('#desglose_pagos').html('')
    $('#dinero_cambio').attr('disabled', 'disabled')
    $('#dinero_recibido').attr('disabled', 'disabled')

    eCobroAgua.limpiarDatos()

    const errores = {
      registro_agua: [],
      desglose_pagos: [],
      dinero_total: [],
      dinero_recibido: [],
      dinero_cambio: []
    }

    Object.keys(errores).forEach(key => eCobroAgua.estadosErrores(key, errores[key]))
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
      eCobroAgua.limpiarDatos()
      this.eventoResetearPago()

      $('select[name="registro_agua"]').prop('selectedIndex', 0)
      $('select[name="registro_agua"]').material_select()

      const errores = {
        registro_agua: [],
        desglose_pagos: [],
        dinero_total: [],
        dinero_recibido: [],
        dinero_cambio: []
      }

      Object.keys(errores).forEach(key => eCobroAgua.estadosErrores(key, errores[key]))
    })
  }
} new cobroAgua()

function cuotaTarifa (ranMaxAnterior, ranMax, ranMin, tarifa) {
  // Formula
  // (Rango Maximo Anterior + tarifa) + ((rango Maximo - rango Minimo) * tarifa)
  return (ranMaxAnterior + tarifa) + ((ranMax - ranMin) * tarifa)
}

function cuotasMaximos (tarifas) {
  // Formula
  // (Rango Maximo Anterior + tarifa) + ((rango Maximo - rango Minimo) * tarifa)
  let rangosReturn = {}

  let rangoMaximoAnterior = 0.00

  for (const tarifa of tarifas) {
    let rangoMaximoActual = tarifa.tarifa

    if (tarifa.tipoTarifa) {
      rangoMaximoActual = ((rangoMaximoAnterior + tarifa.tarifa) + ((tarifa.rango_maximo - tarifa.rango_minimo) * tarifa.tarifa))
    }

    rangoMaximoAnterior = rangoMaximoActual

    rangosReturn[tarifa.rango_maximo] = rangoMaximoActual
  }

  return rangosReturn
}


function totalCobroMes (datos) {
  let clientes = {}

  for (const dato of datos) {
    clientes[dato.nombre + ' ' + dato.apellidos] = []
  }

  for (const dato of datos) {
    clientes[dato.nombre + ' ' + dato.apellidos].push(dato)
  }

  let llavesClientes = Object.keys(clientes)

  let returnCobros = []

  for (const llacli of llavesClientes) {
    let mesesCompletos = {
      'Enero': [],
      'Febrero': [],
      'Marzo': [],
      'Abril': [],
      'Mayo': [],
      'Junio': [],
      'Julio': [],
      'Agosto': [],
      'Septiembre': [],
      'Octubre': [],
      'Noviembre': [],
      'Diciembre': []
    }

    for (const dato of clientes[llacli]) {
      let desglosePagos = JSON.parse(dato.desglose_pagos)
      let miDesglose = {}

      for (const des of desglosePagos) {
        if (des.registroAgua === dato.registro_agua) miDesglose = des
      }

      switch (new Date(miDesglose.fechaRegistro).getMonth()) {
        case 0:
          mesesCompletos.Enero.push(dato.dinero_total)
          break
        case 1:
          mesesCompletos.Febrero.push(dato.dinero_total)
          break
        case 2:
          mesesCompletos.Marzo.push(dato.dinero_total)
          break
        case 3:
          mesesCompletos.Abril.push(dato.dinero_total)
          break
        case 4:
          mesesCompletos.Mayo.push(dato.dinero_total)
          break
        case 5:
          mesesCompletos.Junio.push(dato.dinero_total)
          break
        case 6:
          mesesCompletos.Julio.push(dato.dinero_total)
          break
        case 7:
          mesesCompletos.Agosto.push(dato.dinero_total)
          break
        case 8:
          mesesCompletos.Septiembre.push(dato.dinero_total)
          break
        case 9:
          mesesCompletos.Octubre.push(dato.dinero_total)
          break
        case 10:
          mesesCompletos.Noviembre.push(dato.dinero_total)
          break
        case 11:
          mesesCompletos.Diciembre.push(dato.dinero_total)
          break
      }

    }

    let mesesCobros = [
      clientes[llacli][0].idCobroAgua,
      clientes[llacli][0].nombre + ' ' + clientes[llacli][0].apellidos,
      '---',
      '---',
      '---',
      '---',
      '---',
      '---',
      '---',
      '---',
      '---',
      '---',
      '---',
      '---'
    ]

    if (mesesCompletos.Enero.length) mesesCobros[2] = '$' + mesesCompletos.Enero.reduce((total, num) => total + num)
    if (mesesCompletos.Febrero.length) mesesCobros[3] = '$' + mesesCompletos.Febrero.reduce((total, num) => total + num)
    if (mesesCompletos.Marzo.length) mesesCobros[4] = '$' + mesesCompletos.Marzo.reduce((total, num) => total + num)
    if (mesesCompletos.Abril.length) mesesCobros[5] = '$' + mesesCompletos.Abril.reduce((total, num) => total + num)
    if (mesesCompletos.Mayo.length) mesesCobros[6] = '$' + mesesCompletos.Mayo.reduce((total, num) => total + num)
    if (mesesCompletos.Junio.length) mesesCobros[7] = '$' + mesesCompletos.Junio.reduce((total, num) => total + num)
    if (mesesCompletos.Julio.length) mesesCobros[8] = '$' + mesesCompletos.Julio.reduce((total, num) => total + num)
    if (mesesCompletos.Agosto.length) mesesCobros[9] = '$' + mesesCompletos.Agosto.reduce((total, num) => total + num)
    if (mesesCompletos.Septiembre.length) mesesCobros[10] = '$' + mesesCompletos.Septiembre.reduce((total, num) => total + num)
    if (mesesCompletos.Octubre.length) mesesCobros[11] = '$' + mesesCompletos.Octubre.reduce((total, num) => total + num)
    if (mesesCompletos.Noviembre.length) mesesCobros[12] = '$' + mesesCompletos.Noviembre.reduce((total, num) => total + num)
    if (mesesCompletos.Diciembre.length) mesesCobros[13] = '$' + mesesCompletos.Diciembre.reduce((total, num) => total + num)

    returnCobros.push(mesesCobros)
  }

  let totalesMes = [
    ,
    'TOTALES:',
    0.00,
    0.00,
    0.00,
    0.00,
    0.00,
    0.00,
    0.00,
    0.00,
    0.00,
    0.00,
    0.00,
    0.00
  ]

  for (const cobros of returnCobros) {
    for (const [index, dato] of cobros.entries()) {
      if (dato.toString().charAt(0) === '$') {
        let numero = parseFloat(dato.toString().split('$').pop())
        totalesMes[index] = totalesMes[index] +  numero
      }
    }
  }

  for (const [index, dato] of totalesMes.entries()) {
    if (!isNaN(dato)) {
      totalesMes[index] = '$' + totalesMes[index]
    }
  }

  returnCobros.push(totalesMes)

  return returnCobros
}
