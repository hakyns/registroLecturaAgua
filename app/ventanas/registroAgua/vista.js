/**
 * @file Cliente ventana usuarios 9 de Marzo del 2018
 * @copyright Joaquin Reyes Sanchez 2018
 * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
 * @version 1.0.0
 */

const electron = require('electron')
const path = require('path')
const {fechas, numbers, googleMaps} = require('../../tools/herramietasCustomizadas.js')
const { ipcRenderer } = electron
const dialog = electron.remote.dialog
const BrowserWindow = electron.remote.BrowserWindow
const Chart = require('chart.js')

const {tratamiento} = require('../../tools/maquinaDatos')
const {generadorPDF} = require('../../tools/reportes')

var modificarRegistroAgua = {}
var mapaMedidores = []
var mapaTrabajador = {}

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
class estadoRegistroAgua {
  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @param {boolean} limpiar: Si es true limpiara los datos del formulario y además lva variable global modificarRegistroAgua, de lo contrario no lo hará
   * @returns {null}
   * @description Devuelve a su estado original el tab del formulario principal
   * @event boton nuevo [id="volverTabNuevo"] del tab cambiar y metodos de este archivo
  */
  nuevo (limpiar = true) {
    $('#registroAgua').text('Nuevo')
    $('button[type="submit"]').text('Registrar')

    $('#volverTabNuevo').remove()

    if (limpiar) {
      this.limpiarDatos()
      modificarRegistroAgua = {}

      ipcRenderer.send('registroAgua_componentes')
      regAgua.cargarEntregaDatos()
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

    $('#registroAgua').text('Cambio')
    $('button[type="submit"]').text('Cambiar')

    const botonNuevo = `
      <div class="row" id="volverTabNuevo">
        <div class="container">
          <div class="col s12 right-align">
            <button class="btn waves-effect waves-light center-align cyan darken-2" type="button" onclick="eRegistroAgua.nuevo()"> Nuevo
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
    $('#medidor').val('')
    $('#lectura').val('')

    $('select[name="numeroMedidor"]').html('')
    $('select[name="medidor"]').prop('selectedIndex', 0)
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
} const eRegistroAgua = new estadoRegistroAgua()

/**
 * @class
 * @constructor
 * @method tablaCrear, eventoTabla, eventoTablaPanel, eventoResetarTabla, seleccionUsuario, seleccionUsuario, cargarDatos
 * @description Creación y manipulación de la tabla de usuarios
 */
class buscarRegistroAgua {
  constructor() {
    this.eventoTabla()
    this.eventoTablaPanel()
    this.eventoResetarTabla()
    this.generarPDF()

    this.datosRegistroAgua = null
  }

  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @returns {null}
   * @description Crea la tabla de registros de usuarios creados y modificados
   * @event tab buscar y metodos de este archivo
  */
  tablaCrear () {
    ipcRenderer.on('registroAgua_entregaTabla', (e, datos) => {
      const filas = []
      let jsonCambios = null
      this.datosRegistroAgua = datos.tabla.filas

      datos.tabla.filas.forEach(dato => {
        if (dato.json_cambios) jsonCambios = JSON.stringify(dato.json_cambios).replace(/"/gi, '&quot;')
        else jsonCambios = null

        delete(dato.json_cambios)
        filas.push(`
          <tr onclick="bRegistroAgua.seleccionRegistro('${JSON.stringify(dato).replace(/"/gi, '&quot;')}', ${jsonCambios})">
            <td>${dato.idRegistroAgua}</td>
            <td>${dato.nombre} ${dato.apellidos}</td>
            <td>${numbers.pad(dato.lectura, 4)} m<sup>2</sup></td>
            <td>${fechas.fixDate()(dato.fecha_cambio, 'longDate')}</td>
          </tr>
        `)
      })

      $('table').find('tbody').html(filas.join(''))
      $('table').find('caption').html(`<b>Lecturista:</b>  ${datos.Trabajador.nombre.toUpperCase()} ${datos.Trabajador.apellidos.toUpperCase()}  &nbsp&nbsp&nbsp <b>Zona de Trabajo:</b>  ${datos.Trabajador.zona_trabajo.toUpperCase()}`)

      const calendario = $('.datepicker').pickadate()
      const picker = calendario.pickadate('picker')
      picker.set({})

      ipcRenderer.removeAllListeners('registroAgua_entregaTabla')
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
      const clienteBuscar = document.getElementById('clienteBuscar')

      if (!clienteBuscar.value) {
        ipcRenderer.send('registroAgua_cargaTabla')
        this.tablaCrear()
      }
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
    const select = document.getElementById('clienteBuscar')

    const modificar = document.getElementById('modalModificar')
    const borrar = document.getElementById('modalBorrar')
    const cancelar = document.getElementById('modalCancelar')

    const pdf = document.getElementById('botonPDF')
    const graficar = document.getElementById('botonGrafica')

    $(select).change(() => {
      const valorInput = $(select).val()

      if (valorInput) {
        ipcRenderer.send('registroAgua_medidorBuscar', valorInput)

        this.tablaCrear()
      }
    })

    modificar.addEventListener('click', e => {
      eRegistroAgua.cambiar()

      $('ul.tabs').tabs('select_tab', 'nuevo')

      this.cargarDatos()
    })

    borrar.addEventListener('click', e => {
      $('body').addClass('bloquear-vista')

      const mensaje = `Esta a punto de borrar la lectura con folio: ${modificarRegistroAgua.idRegistroAgua}`

      const detalles = `
        Cliente: ${modificarRegistroAgua.nombre} ${modificarRegistroAgua.apellidos}
        Lectura: ${modificarRegistroAgua.lectura} metros cuadrados
        Fecha de Registro: ${fechas.fixDate()(modificarRegistroAgua.fecha_cambio, 'longDate')}

        Considere los cambios que podrá generar al ejercer esta acción:

        1.-Este y todos los demás registros están ligados directamente al módulo "cobro agua", por lo que si usted borra este registro de lectura, también se borrará su registro de cobro de agua (si es que ya ha sido realizada). Antes de estar seguro de borrarlo, le recomiendo tener un respaldo en PDF.

        2.-NO HAY SOPORTE DE HISTORIAL PARA REGISTROS BORRADOS... Una vez que decidas borrarlo, se eliminará por completo la información de la base de datos y "no será recuperable". Una alternativa a esto es crear informes PDF cada determinado tiempo.
      `

      let botones = ['Cancelar', 'Borrar']

      dialog.showMessageBox(new BrowserWindow({show: false, alwaysOnTop: true}), { type: 'error', buttons: botones, message: mensaje, detail: detalles }, respuesta => {
        $('body').removeClass('bloquear-vista')

        if (respuesta) ipcRenderer.send('registroAgua_borrarRegistro', modificarRegistroAgua)

        ipcRenderer.on('registroAgua_respuestaBorrarRegistro', (e, mensaje) => {
          $('#modalB').html(`
            <div class="row">
              <div class="col s12">
                <div class="card-panel teal">
                  <span class="white-text">${mensaje.mensaje}</span>
                </div>
              </div>
            </div>
          `)

          modificarRegistroAgua = {}
          eRegistroAgua.nuevo()

          ipcRenderer.send('registroAgua_cargaTabla')
          this.tablaCrear()

          let tiempo = 5000
          const cerrarModal = setTimeout(() => {
            $('#modalB').empty()
          }, tiempo)

          ipcRenderer.removeAllListeners('registroAgua_respuestaBorrarRegistro')
        })
      })
    })

    cancelar.addEventListener('click', e => {
      modificarRegistroAgua = {}
    })

    pdf.addEventListener('click', async e => {
      ipcRenderer.send('usuario_organizacion')
    })

    graficar.addEventListener('click', e => {
      const selectCliente = document.getElementById('clienteBuscar')

      if (selectCliente.value) {
        $('.modal').modal({
          dismissible: false
        })

        let mesesLabels = this.datosRegistroAgua.map(dato => {
          return fechas.fixDate()(dato.fecha_cambio, 'mediumDate')
        })

        let lecturasData = this.datosRegistroAgua.map(dato => {
          return dato.lectura
        })

        let coloresBackground = this.datosRegistroAgua.map(dato => '#00838f')

        const char = {
          type: 'line',
          data: {
            labels: mesesLabels.reverse(),
            datasets: [{
              label: `Lecturas: ${this.datosRegistroAgua[0].nombre} ${this.datosRegistroAgua[0].apellidos}`,
              data: lecturasData.reverse(),
              borderColor: '#00838f',
              backgroundColor: coloresBackground,
              fill: '#ffff'
            }],
            options: {
              responsive: true
            }
          }
        }

        const canvas = document.getElementById('chart').getContext('2d')
        const grafico = new Chart(canvas, char)


        $('#modalGrafico').modal('open')
      } else {
        alert('Necesitas filtrar un cliente para poder crear el grafico')
      }
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
      ipcRenderer.send('registroAgua_cargaTabla')

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
  seleccionRegistro (registroAguaString, jsonCambios) {
    const registroAguaJSON = JSON.parse(registroAguaString.replace(/&quot;/gi, '"'))

    modificarRegistroAgua = registroAguaJSON

    $('.modal').modal({
      dismissible: false
    })

    if (registroAguaJSON.imagen) {
      const rutaImagen = path.join(__dirname, '../../assets/img/usuarios', registroAguaJSON.manzanaCliente, registroAguaJSON.imagen)

      $('#modalRegistroAgua').find('.card').find('img').attr('src', rutaImagen)
    } else $('#modalRegistroAgua').find('.card').find('img').removeAttr('src')

    $('#modalRegistroAgua').find('.card').find('h3').text(registroAguaJSON.nombre + ' ' + registroAguaJSON.apellidos)

    $('#modalRegistroAgua').find('.card').find('div:first-child').find('h4').text(registroAguaJSON.manzanaCliente)
    $('#modalRegistroAgua').find('.card').find('div:last-child').find('h4').text(fechas.fixDate()(registroAguaJSON.fecha_cambio, 'longDate'))

    $('#modalRegistroAgua').find('.card').find('.fechas').find('div:first-child').find('h4').text(registroAguaJSON.medidor ? registroAguaJSON.medidor : 'Sin Identificar')
    $('#modalRegistroAgua').find('.card').find('.fechas').find('div:last-child').find('h4').text(numbers.pad(registroAguaJSON.lectura, 4))

    if (jsonCambios && jsonCambios !== 'null') {
      const registroAguaJsonCambios = JSON.parse(jsonCambios.replace(/&quot;/gi, '"'))

      let registros = Object.keys(registroAguaJsonCambios).reverse().map(registro => {
        return `
        <p style="background: #FAFAFA; margin-bottom: 10px; padding: 10px; font-style: normal;">
        Fecha del cambio: <b>${fechas.fixDate()(registroAguaJsonCambios[registro].fecha, 'longDate')}</b> <br>
        Fecha alterada: <b>${fechas.fixDate()(registroAguaJsonCambios[registro].fechaRegistro, 'longDate')}</b> <br>
        Lecturista a cargo: <b style="text-transform: capitalize;">${registroAguaJsonCambios[registro].trabajador}</b> <br>
        Cliente a registrar: <b style="text-transform: capitalize;">${registroAguaJsonCambios[registro].cliente}</b> <br>
        Lectura a esta fecha: <b>${numbers.pad(registroAguaJsonCambios[registro].lectura, 4)}</b> <br>
        </p>
        `
      })

      $('#modalRegistroAgua').find('.card').find('p').html(registros.join(''))
    } else $('#modalRegistroAgua').find('.card').find('p').html('Sin Cambios')

    $('#modalRegistroAgua').modal('open')
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
    if (Object.keys(modificarRegistroAgua).length) {
      $('#lectura').val(numbers.pad(modificarRegistroAgua.lectura, 4))
      $('#lectura').siblings('label').addClass("active")

      $(`select[name="medidor"] option[value="${modificarRegistroAgua.nombre + ' ' + modificarRegistroAgua.apellidos}"]`).prop('selected', true)
      $('select[name="medidor"]').material_select()

      $('select[name="numeroMedidor"]').html(`<option value="${modificarRegistroAgua.idMedidor}"  selected>${modificarRegistroAgua.medidor ? modificarRegistroAgua.medidor : 'Sin Identificar'}</option>`)
      $('select[name="numeroMedidor"]').material_select()
      $('select[name="numeroMedidor"]').closest('.input-field').children('span.caret').remove()

      const calendarioA = $('#fecha_registro').pickadate()
      const pickerA = calendarioA.pickadate('picker')
      pickerA.set('select', new Date(modificarRegistroAgua.fecha_cambio).toISOString().slice(0,10), { format: 'yyyy-mm-dd' })
      $('#fecha_registro').siblings('label').addClass("active")
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
      if (this.datosRegistroAgua !== null) {
        const organizacion = datos.filas[0]
        const salidaPDF = 'Lecturas de agua'

        const lecturasMeses = ultimaLecturaMes(this.datosRegistroAgua)

        const datosPDF = {
          registros: lecturasMeses.length,
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
          filas: lecturasMeses
        }

        new generadorPDF('registros-landscape', datosPDF)
      }
    })
  }

} const bRegistroAgua = new buscarRegistroAgua()


/**
 * @class
 * @constructor cargarEntregaDatos, eventoSubmit, eventoLimpiar
 * @method
 * @description Manipulación de datos sensibles del formulario
 */
class registroAgua {
  constructor () {
    this.cargarEntregaDatos()
    this.eventoSubmit()
    this.eventoCliente()
    this.eventoLimpiar()

    this.medidores = []
  }

  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @returns {null}
   * @description Carga los selects usuario_tipo y manzanas
   * @event Constructor de la clase
  */
  cargarEntregaDatos () {
    ipcRenderer.on('registroAgua_entregaComponentes', (e, componentes) => {
      mapaMedidores = componentes.medidores.filas
      mapaTrabajador = componentes.trabajador

      $('select[name="trabajador"]').html(`<option value="${componentes.trabajador.idTrabajo}" disabled selected>${componentes.trabajador.nombre} ${componentes.trabajador.apellidos}</option>`)

      $('#zona_trabajo').val(componentes.trabajador.zona_trabajo)

      $('#medidor').attr('placeholder', componentes.medidores.filas.length+ ' Clientes')

      let optionCliente = ['<option value="" disabled selected>Escoge un Cliente</option>']
      let optionClienteBuscar = ['<option value="" disabled selected>Escoge un Cliente</option>']

      componentes.medidores.filas.forEach(medidor => {
        if (medidor.imagen !== null) {
          optionCliente.push(`<option value="${medidor.nombre + ' ' + medidor.apellidos}" data-icon="${path.join(__dirname, '../../assets/img/usuarios/', medidor.manzana, medidor.imagen)}" class="circle">${medidor.nombre} ${medidor.apellidos}</option>`)
          optionClienteBuscar.push(`<option value="${medidor.idMedidor}" data-icon="${path.join(__dirname, '../../assets/img/usuarios/', medidor.manzana, medidor.imagen)}" class="circle">${medidor.nombre} ${medidor.apellidos}</option>`)
        } else {
          optionCliente.push(`<option value="${medidor.nombre + ' ' + medidor.apellidos}">${medidor.nombre} ${medidor.apellidos}</option>`)
          optionClienteBuscar.push(`<option value="${medidor.idMedidor}">${medidor.nombre} ${medidor.apellidos}</option>`)
        }
      })

      $('select[name="medidor"]').html(optionCliente.join(''))
      $('#clienteBuscar').html(optionClienteBuscar.join(''))

      this.medidores = componentes.medidores.filas

      $('select').material_select()
      $('select').closest('.input-field').children('span.caret').remove()

      /**
       * @description Se calcula cuales son las fechas validas para subir una lectura, solo se podrán habilidar de acuerdo a los parametros de #numero de dias iniciales por cada mes desde el inicio del trabajo y como opcional la disponibilidad de registrar lecturas todos los sabados
       */
      // indica cuantos días apartir del 1° de cada mes se habilitará el registro
      const diasLectura = 5

      let fecha_inicio = new Date(componentes.trabajador.fecha_inicio)

      let fecha_fin = new Date(componentes.trabajador.fecha_fin)

      // indica que todas las fechas serán inhabilitadas, para que los siguientes parametros sean los unicos que se podrán elegir
      const fechasRescatadas = [true]

      // Este bucle calcula las fechas validas para el registro de la lectura, siempre y cuando se encuentre entre el rango comprendido de las fechas de trabajo del trabajador
      while (fecha_inicio <= fecha_fin) {
        fecha_inicio = new Date(fecha_inicio.getFullYear(), fecha_inicio.getMonth()+1, 1)
        // Agrega el primer día de cada mes
        fechasRescatadas.push([fecha_inicio.getFullYear(), fecha_inicio.getMonth(), fecha_inicio.getDate()])

        // Agrega los dias restantes -1 de cada mes
        for (let i = 1; i < diasLectura; i++) {
          let fechaCambiante = new Date(fecha_inicio.setDate(fecha_inicio.getDate() + 1))
          fechasRescatadas.push([fechaCambiante.getFullYear(), fechaCambiante.getMonth(), fechaCambiante.getDate()])
        }

        // Agrega todos los sabados que se encuentren en la fecha adecuada
        for (let i = 1; i < new Date(fecha_inicio.getFullYear(), fecha_inicio.getMonth(), 0).getDate(); i++) {
          let fechaFinSemana = new Date(fecha_inicio.getFullYear(), fecha_inicio.getMonth(), i)
          // if (fechaFinSemana.getDay() === 0) {   //Si es Domingo
          //     sun.push(i)
          //     console.log(fechaFinSemana.getFullYear(), fechaFinSemana.getMonth(), fechaFinSemana.getDate())
          // }

          if (fechaFinSemana.getDay() === 6) {   //Si es Sabado
            if (fechaFinSemana <= fecha_fin) {
              fechasRescatadas.push([fechaFinSemana.getFullYear(), fechaFinSemana.getMonth(), fechaFinSemana.getDate()])
            }
          }
        }

        if (new Date(fecha_inicio.getFullYear(), fecha_inicio.getMonth()+1, 1) > fecha_fin) fecha_inicio = new Date(fecha_inicio.getFullYear(), fecha_inicio.getMonth()+1, 1)
      }

      // Esto habilita todos los sabados de todos los años
      // fechasRescatadas.push(7)

      $('.datepicker').pickadate({
        selectMonths: true, // Creates a dropdown to control month
        selectYears: 15, // Creates a dropdown of 15 years to control year,
        today: 'Today',
        clear: 'Clear',
        close: 'Ok',
        format: 'yyyy-mm-dd',
        disable: fechasRescatadas,
        closeOnSelect: false // Close upon selecting a date,
      })

      ipcRenderer.removeAllListeners('registroAgua_entregaComponentes')
    })
  }

  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @returns {null}
   * @description Ejecuta el evento cuando se ha seleccionado un cliente a registrar
   * @event boton submit [type="submit"]
  */
  eventoCliente () {
    $('select[name="medidor"]').change(() => {
      let valor = $('select[name="medidor"]').val()
      this.medidores.forEach(med => {
        if ((med.nombre + ' ' + med.apellidos) === valor) {
          $('select[name="numeroMedidor"]').html(`<option value="${med.idMedidor}"  selected>${med.medidor ? med.medidor : 'Sin Identificar'}</option>`)

          $('select').material_select()
          $('select').closest('.input-field').children('span.caret').remove()
        }
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
  eventoSubmit () {
    const form = document.querySelector('form')

    form.addEventListener('submit', e => {
      e.preventDefault()

      const formData = new FormData(document.querySelector('form'))

      var datosRegistroAgua = {}

      formData.forEach((dato, key) => {
        if (key === 'numeroMedidor' || key === 'lectura') {
          datosRegistroAgua[key] = parseInt(dato)
        } else datosRegistroAgua[key] = dato.length ? dato : null
      })

      const nombreCampos = Object.keys(datosRegistroAgua)

      if (!nombreCampos.includes('numeroMedidor')) datosRegistroAgua['numeroMedidor'] = 0

      if (Object.keys(modificarRegistroAgua).length) {
        datosRegistroAgua['ESTADO'] = 'cambiar'

        datosRegistroAgua['viajeTiempo'] = modificarRegistroAgua
      } else datosRegistroAgua['ESTADO'] = 'registrar'

      /**
       * @description Proceso de envio de datos usuario al servidor (ventana.js)
       */
      ipcRenderer.send('registroAgua_datosRegistroAgua', datosRegistroAgua)

      /**
       * @description Proceso de recepción de errores despues de manipularlos en el servidor
       */
      ipcRenderer.on('registroAgua_errores', (e, errores) => {

        Object.keys(errores).forEach(key => eRegistroAgua.estadosErrores(key, errores[key]))

        datosRegistroAgua = {}

        ipcRenderer.removeAllListeners('registroAgua_errores')
      })

      /**
       * @description Proceso de recepción del mensaje de éxito al finalizar todo el proceso del lado del servidor
       */
      ipcRenderer.on('registroAgua_respuesta', (e, datos) => {
        Object.keys(datos.errores).forEach(key => eRegistroAgua.estadosErrores(key, datos.errores[key]))

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

        if (Object.keys(modificarRegistroAgua).length) {
          eRegistroAgua.nuevo(false)
          modificarRegistroAgua = {}
          let tiempo = 2000
          const cerrarModal = setTimeout(() => {
            $('#modal').empty()

            const clienteBuscar = document.getElementById('clienteBuscar')

            if (clienteBuscar.value) ipcRenderer.send('registroAgua_medidorBuscar', clienteBuscar.value)
            else ipcRenderer.send('registroAgua_cargaTabla')

            bRegistroAgua.tablaCrear()

            eRegistroAgua.limpiarDatos()

            $('ul.tabs').tabs('select_tab', 'buscar')
          }, tiempo)
        } else {
          eRegistroAgua.nuevo()

          let tiempo = 4000
          const cerrarModal = setTimeout(() => {
            $('#modal').empty()
          }, tiempo)
        }


        ipcRenderer.removeAllListeners('registroAgua_respuesta')
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
      eRegistroAgua.limpiarDatos()

      const errores = {
        medidor: [],
        lectura: [],
        fecha_registro:[]
      }

      Object.keys(errores).forEach(key => eRegistroAgua.estadosErrores(key, errores[key]))
    })
  }
} const regAgua = new registroAgua()


/**
 * @class
 * @constructor cargarEntregaDatos, eventoSubmit, eventoLimpiar
 * @method
 * @description Carga el mapa de Google maps San Miguel
 */
var activarFullScreen = true
class mapa {
  constructor () {
    this.activarMapa()
  }

  activarMapa () {
    const activador = document.getElementById('activadorMapa')

    activador.addEventListener('click', e => {
      this.initMap()

      $(activador).hide('fast')
      $('#mapaLugar').find('h2').focus()
    })
  }

  eventosControles (fullscreenC, origenMap, opciones) {
    fullscreenC.addEventListener('click', () => {
      const map = document.getElementById('map')

      if (activarFullScreen) {
        map.webkitRequestFullscreen()
        $(map).addClass('map-fullscreen')
        activarFullScreen = false
      } else if (!activarFullScreen) {
        document.webkitExitFullscreen()
        $(map).removeClass('map-fullscreen')
        activarFullScreen = true
      }
    })

    origenMap.addEventListener('click', () => {
      opciones.map.setCenter(opciones.opcionesMapa.origen)
      opciones.map.setZoom(opciones.opcionesMapa.zoom)
    })
  }

  initMap () {
    // Nuevo Mapa
    const opcionesMapa = {
      zoom: 14,
      origen: {lat: 20.4833, lng: -99.6167}
    }
    const map = new google.maps.Map(document.getElementById('map'), {
      zoom: opcionesMapa.zoom,
      center: opcionesMapa.origen,
      fullscreenControl: false
    })

    // Añadiendo botones personalizados
    const rightControl = document.createElement('div')
    const fullscreenC = new FSControl(rightControl, map)

    const centerControl = document.createElement('div')
    const origenMap = new OrigenControl(centerControl, map)
    this.eventosControles(fullscreenC, origenMap, {map, opcionesMapa})

    rightControl.index = 1
    origenMap.index = 1
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(fullscreenC)
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(origenMap)


    // Añadiendo marcador principal
    googleMaps.marcadores({
      position: opcionesMapa.origen,
      map: map,
      information: {
        title: 'SAN MIGUEL CALTEPANTLA',
        text: `${mapaMedidores.length} clientes esperando "${mapaTrabajador.nombre.toUpperCase()} ${mapaTrabajador.apellidos.toUpperCase()}"`
      }
    })

    // Añadiendo marcadores de los medidores
    mapaMedidores.forEach(medidor => {
      googleMaps.marcadores({
        position: {lat: parseFloat(medidor.latitud), lng: parseFloat(medidor.longitud)},
        map: map,
        icon: path.join(__dirname, '../../assets/img/marcadores/agua.ico'),
        information: {
          title: medidor.nombre.toUpperCase() + ' ' + medidor.apellidos.toUpperCase(),
          text: medidor.notas ? medidor.notas : 'No hay notas para este cliente'
        }
      }, medidor, data => this.marcadorRecibido(data))
    })
  }

  marcadorRecibido (datos) {
    $(`select[name="medidor"] option[value="${datos.nombre} ${datos.apellidos}"]`).prop('selected', true)
    $('select[name="numeroMedidor"]').html(`<option value="${datos.idMedidor}"  selected>${datos.medidor ? datos.medidor : 'Sin Identificar'}</option>`)

    $('select').material_select()
    $('select').closest('.input-field').children('span.caret').remove()

    $('ul.tabs').tabs('select_tab', 'nuevo')

    activarFullScreen = true
    document.webkitExitFullscreen()
    $(map).removeClass('map-fullscreen')
  }
} new mapa()

function OrigenControl (controlDiv, map) {
  // Set CSS for the control border.
  var origenUI = document.createElement('div')
  origenUI.style.backgroundColor = '#fff'
  origenUI.style.border = '2px solid #fff'
  origenUI.style.borderRadius = '3px'
  origenUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)'
  origenUI.style.cursor = 'pointer'
  origenUI.style.marginBottom = '22px'
  origenUI.style.textAlign = 'center'
  origenUI.title = 'Click to recenter the map'
  controlDiv.appendChild(origenUI)

  // Set CSS for the control interior.
  var controlText = document.createElement('div')
  controlText.style.color = 'rgb(25,25,25)'
  controlText.style.fontFamily = 'Roboto,Arial,sans-serif'
  controlText.style.fontSize = '15px'
  controlText.style.lineHeight = '32px'
  controlText.style.paddingLeft = '5px'
  controlText.style.paddingRight = '5px'
  controlText.innerHTML = 'San Miguel Caltepantla'
  origenUI.appendChild(controlText)

  return origenUI
}

function FSControl (controlDiv, map) {
  // Set CSS for the control border.
  var fullScreenUI = document.createElement('div')
  fullScreenUI.style.backgroundColor = '#fff'
  fullScreenUI.style.border = '2px solid #fff'
  fullScreenUI.style.borderRadius = '3px'
  fullScreenUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)'
  fullScreenUI.style.cursor = 'pointer'
  fullScreenUI.style.marginBottom = '22px'
  fullScreenUI.style.textAlign = 'center'
  fullScreenUI.title = 'Click to recenter the map'
  controlDiv.appendChild(fullScreenUI)

  // Set CSS for the control interior.
  var controlText = document.createElement('div')
  controlText.style.color = 'rgb(25,25,25)'
  controlText.style.fontFamily = 'Roboto,Arial,sans-serif'
  controlText.style.fontSize = '13px'
  controlText.style.lineHeight = '20px'
  controlText.style.paddingLeft = '5px'
  controlText.style.paddingRight = '5px'
  controlText.innerHTML = 'Pantalla Completa'
  fullScreenUI.appendChild(controlText)

  return fullScreenUI
}

function ultimaLecturaMes (datos) {
  let clientes = {}

  for (const dato of datos) {
    clientes[dato.idMedidor] = []
  }

  for (const dato of datos) {
    clientes[dato.idMedidor].push(dato)
  }

  let llavesClientes = Object.keys(clientes)

  let returnLecturas = []

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
      switch (new Date(dato.fecha_cambio).getMonth()) {
        case 0:
          if (dato.lectura) mesesCompletos.Enero.push(dato.lectura)
          break
        case 1:
          if (dato.lectura) mesesCompletos.Febrero.push(dato.lectura)
          break
        case 2:
          if (dato.lectura) mesesCompletos.Marzo.push(dato.lectura)
          break
        case 3:
          if (dato.lectura) mesesCompletos.Abril.push(dato.lectura)
          break
        case 4:
          if (dato.lectura) mesesCompletos.Mayo.push(dato.lectura)
          break
        case 5:
          if (dato.lectura) mesesCompletos.Junio.push(dato.lectura)
          break
        case 6:
          if (dato.lectura) mesesCompletos.Julio.push(dato.lectura)
          break
        case 7:
          if (dato.lectura) mesesCompletos.Agosto.push(dato.lectura)
          break
        case 8:
          if (dato.lectura) mesesCompletos.Septiembre.push(dato.lectura)
          break
        case 9:
          if (dato.lectura) mesesCompletos.Octubre.push(dato.lectura)
          break
        case 10:
          if (dato.lectura) mesesCompletos.Noviembre.push(dato.lectura)
          break
        case 11:
          if (dato.lectura) mesesCompletos.Diciembre.push(dato.lectura)
          break
      }
    }

    let mesesLecturas = [
      clientes[llacli][0].idRegistroAgua,
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

    if (mesesCompletos.Enero.length) mesesLecturas[2] = Math.max.apply(null, mesesCompletos.Enero)
    if (mesesCompletos.Febrero.length) mesesLecturas[3] = Math.max.apply(null, mesesCompletos.Febrero)
    if (mesesCompletos.Marzo.length) mesesLecturas[4] = Math.max.apply(null, mesesCompletos.Marzo)
    if (mesesCompletos.Abril.length) mesesLecturas[5] = Math.max.apply(null, mesesCompletos.Abril)
    if (mesesCompletos.Mayo.length) mesesLecturas[6] = Math.max.apply(null, mesesCompletos.Mayo)
    if (mesesCompletos.Junio.length) mesesLecturas[7] = Math.max.apply(null, mesesCompletos.Junio)
    if (mesesCompletos.Julio.length) mesesLecturas[8] = Math.max.apply(null, mesesCompletos.Julio)
    if (mesesCompletos.Agosto.length) mesesLecturas[9] = Math.max.apply(null, mesesCompletos.Agosto)
    if (mesesCompletos.Septiembre.length) mesesLecturas[10] = Math.max.apply(null, mesesCompletos.Septiembre)
    if (mesesCompletos.Octubre.length) mesesLecturas[11] = Math.max.apply(null, mesesCompletos.Octubre)
    if (mesesCompletos.Noviembre.length) mesesLecturas[12] = Math.max.apply(null, mesesCompletos.Noviembre)
    if (mesesCompletos.Diciembre.length) mesesLecturas[13] = Math.max.apply(null, mesesCompletos.Diciembre)


    returnLecturas.push(mesesLecturas)
  }

  return returnLecturas
}
