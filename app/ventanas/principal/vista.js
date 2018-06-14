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

/**
 * @description Iniciadores de componentes materialize
 */
$('.collapsible').collapsible()

/**
 * @class
 * @constructor cargarEntregaDatos, eventoSubmit, eventoLimpiar
 * @method
 * @description Manipulación de datos sensibles del formulario
 */
class principal {
  constructor () {
    this.cargaDatos()
    this.eventoSalirSistema()

    $('.collapsible').collapsible('open', 0)

    this.trabajador = {}
  }

  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @returns {null}
   * @description Carga de datos iniciales
   * @event Constructor de la clase
  */
  cargaDatos () {
    ipcRenderer.on('principal_datosIniciales', (e, datos) => {
      this.trabajador = datos.trabajador

      $('#lecturistaFolio').text(datos.trabajador.idTrabajo)
      $('#lecturistaNombre').text(`${datos.trabajador.nombre} ${datos.trabajador.apellidos}`)
      $('#lecturistaZonaTrabajo').text(`${datos.trabajador.zona_trabajo}`)
      $('#lecturistaFechaInicio').text(`${fechas.fixDate()(datos.trabajador.fecha_inicio, 'longDate')}`)
      $('#lecturistaFechaFin').text(`${fechas.fixDate()(datos.trabajador.fecha_fin, 'longDate')}`)
      $('#lecturistaMinutosTrabajados').text(`${datos.trabajador.minutos_trabajados}`)

      this.eventosModulos()
      this.eventoUsuarios()
    })
  }

  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @returns {null}
   * @description Carga los selects usuario_tipo y manzanas
   * @event Constructor de la clase
  */
  eventoSalirSistema () {
    $('#salirSistema').click(() => {
      ipcRenderer.send('principal_salirSistema')
    })
  }

  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @returns {null}
   * @description Guarda los eventos de espera de llamada de cada modulo creado
   * @event Constructor de la clase
  */
  eventosModulos () {
    const modUsuario = document.getElementById('moduloUsuarios')
    const modAgua = document.getElementById('moduloAgua')
    const modOrganizacion = document.getElementById('moduloOrganizacion')

    modUsuario.addEventListener('click', e => {
      this.eventoUsuarios()
    })

    modAgua.addEventListener('click', e => {
      this.eventoAgua()
    })

    modOrganizacion.addEventListener('click', e => {
      this.eventoOrganizacion()
    })
  }

  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @returns {null}
   * @description Carga los selects usuario_tipo y manzanas
   * @event Constructor de la clase
  */
  eventoUsuarios () {
    const moduloUsuarios = [
      {
        titulo: 'Usuarios',
        id: 'usuario',
        imagen: path.join(__dirname, '../../assets/img/principal/usuarios.jpg'),
        texto: 'Agrega, modifica y elimina los usuarios que tengas dentro de tu organización. No te preocupes por la organización de ellos, aqui almacenarás cualquier tipo de usuario y el software se encargará de la organización'
      },
      {
        titulo: 'Tipos de Usuarios',
        id: 'tiposUsuarios',
        imagen: path.join(__dirname, '../../assets/img/principal/tipos_usuarios.jpeg'),
        texto: 'Por defecto existen tres tipos de usuarios: Lecturistas, Clientes y Administradores... Debido a la seguridad y eficiencia del sistema, este módulo solo servirá en modo de lectura, por lo que no podrás hacer ajustes en estos datos. Para más detalles contactar con el creador del software'
      },
      {
        titulo: 'Manzanas',
        id: 'manzanas',
        imagen: path.join(__dirname, '../../assets/img/principal/manzanas.jpg'),
        texto: 'Aqui podrás gestionar las manzanas (lugares estrategicos de vivienda) de tus usuarios. Asegurate de no duplicar manzanas, ya que pondrás en riesgo la veracidad de tu información'
      },
      {
        titulo: 'Lecturistas',
        id: 'trabajo',
        imagen: path.join(__dirname, '../../assets/img/principal/trabajo.jpeg'),
        texto: 'Justifica el trabajo de los lecturistas; agrega su periodo de tiempo laboral y además la zona geografica de acción. Es obligatorio que cada lecturista tenga un trabajo justificado ya que ésta será su llave de acceso a este sistema'
      },
      {
        titulo: 'Clientes',
        id: 'medidores',
        imagen: path.join(__dirname, '../../assets/img/principal/medidores.jpeg'),
        texto: 'Cada cliente deberá contener un medidor de agua. En este apartado tu podrás registrar los medidores de todos los clientes registrados, además de su ubicación geográfica'
      }
    ]

    if (this.trabajador.idTrabajo) {
      moduloUsuarios.splice(1, 1)
    }

    const html = moduloUsuarios.map(mU => {
      return `
        <div class="col s4" id="${mU.id}">
          <div class="card card-modulos">
            <div class="card-image">
              <img src="${mU.imagen}">
            </div>
            <div class="card-content">
              <div class="card-title">${mU.titulo}</div>
            </div>
            <p>${mU.texto}</p>
          </div>
        </div>
      `
    })

    $('#modulos').html(html.join(''))

    const usuarios = document.getElementById('usuario')
    const tipoUsuarios = document.getElementById('tiposUsuarios')
    const manzanas = document.getElementById('manzanas')
    const trabajo = document.getElementById('trabajo')
    const medidores = document.getElementById('medidores')

    if (!this.trabajador.idTrabajo) {
      tipoUsuarios.addEventListener('click', e => {
        ipcRenderer.send('principal_activarTiposUsuarios')
      })
    }

    usuarios.addEventListener('click', e => {
      ipcRenderer.send('principal_activarUsuarios')
    })

    manzanas.addEventListener('click', e => {
      ipcRenderer.send('principal_activarManzanas')
    })

    trabajo.addEventListener('click', e => {
      ipcRenderer.send('principal_activarTrabajo')
    })

    medidores.addEventListener('click', e => {
      ipcRenderer.send('principal_activarMedidores')
    })

  }

  eventoAgua () {
    const moduloUsuarios = [
      {
        titulo: 'Registro de Agua',
        id: 'registroAgua',
        imagen: path.join(__dirname, '../../assets/img/principal/registro_agua.jpeg'),
        texto: 'Registra los cambios del suministro de agua; de acuerdo al lecturista se podrá acceder a los clientes que tenga como zona de trabajo, por ende un lecturista podrá registrar el agua a solo sus clientes definidos por su zona de trabajo'
      },
      {
        titulo: 'Tarifas',
        id: 'tarifas',
        imagen: path.join(__dirname, '../../assets/img/principal/tarifas.jpg'),
        texto: 'Registra las tarifas que se cobrarán por la diferencia de metros cuadrados ocupados durante cada registro de lectura de agua potable. Ajusta los rangos de cobro y asegurate de establecer correctamente tarifas fijas o tarifas de incremento'
      },
      {
        titulo: 'Cobro Agua',
        id: 'cobroAgua',
        imagen: path.join(__dirname, '../../assets/img/principal/cobro_agua.jpeg'),
        texto: 'Registra los cobros de agua de las lecturas registradas. Este modulo utilizará los datos establecidos del módulo tarifas. Se cobrará la lectura seleccionada y sus lecturas previas hasta que encuentre el último cobro de agua establecido'
      }
    ]

    if (!this.trabajador.idTrabajo) {
      moduloUsuarios.splice(0, 1)
      moduloUsuarios.splice(1, 1)
    }

    const html = moduloUsuarios.map(mU => {
      return `
        <div class="col s4" id="${mU.id}">
          <div class="card card-modulos">
            <div class="card-image">
              <img src="${mU.imagen}">
            </div>
            <div class="card-content">
              <div class="card-title">${mU.titulo}</div>
            </div>
            <p>${mU.texto}</p>
          </div>
        </div>
      `
    })

    $('#modulos').html(html.join(''))

    const registroAgua = document.getElementById('registroAgua')
    const tarifas = document.getElementById('tarifas')


    if (this.trabajador.idTrabajo) {
      registroAgua.addEventListener('click', e => {
        ipcRenderer.send('principal_activarRegistroAgua')
      })

      cobroAgua.addEventListener('click', e => {
        ipcRenderer.send('principal_activarCobroAgua')
      })
    }

    tarifas.addEventListener('click', e => {
      ipcRenderer.send('principal_activarTarifas')
    })


  }

  eventoOrganizacion () {
    const moduloOrganizacion = [
      {
        titulo: 'Organización',
        id: 'organizacion',
        imagen: path.join(__dirname, '../../assets/img/principal/organizacion.jpg'),
        texto: 'Agrega los parámetros que definen a tu organización... Nombre, domicilio, telefono, entre otras cosas; al final esto te ayudará a crear las hojas membretadas PDF, disponibles en puntos estratégicos del sistema'
      }
    ]

    const html = moduloOrganizacion.map(mU => {
      return `
        <div class="col s4" id="${mU.id}">
          <div class="card card-modulos">
            <div class="card-image">
              <img src="${mU.imagen}">
            </div>
            <div class="card-content">
              <div class="card-title">${mU.titulo}</div>
            </div>
            <p>${mU.texto}</p>
          </div>
        </div>
      `
    })

    $('#modulos').html(html.join(''))

    const organizacion = document.getElementById('organizacion')

    organizacion.addEventListener('click', e => {
      ipcRenderer.send('principal_activarOrganizacion')
    })
  }

} const trab = new principal()
