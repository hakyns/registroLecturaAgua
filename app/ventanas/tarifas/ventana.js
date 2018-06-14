/**
 * @file Servidor ventana usuarios 9 de Marzo del 2018
 * @copyright Joaquin Reyes Sanchez 2018
 * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
 * @version 1.0.0
 */

const electron = require('electron')
const electronLocalshortcut = require('electron-localshortcut')

const path = require('path')

const conexionVistas = require('../../tools/vista')

const {validador} = require('../../tools/maquinaDatos')
const validar = new validador()

const {baseDatos} = require('../../tools/mysql')
const bd = new baseDatos()

const {BrowserWindow, ipcMain} = electron

/**
 * @class
 * @constructor
 * @param {Object} ventanas: ventanas creadas fuera de este archivo
 * @param {Object} lineas: busEmitter para realizar comunicaciones entre las diversas ventanas creadas
 * @method nuevo, cambiar, limpiarDatos, eliminarImagen, estadosErrores
 * @description Servidor de datos sensibles del cliente usuario
 */
class ventana {
  constructor (conexionBD, ventanas, lineas) {
    this.cBD = conexionBD
    this.lineasEventBus = lineas
    /**
     * @description Caracteristicas Basicas de la ventana
     */
    this.ventanaTarifa = new BrowserWindow({
      width: 600,
      height: 400,
      resizable: false,
      parent: ventanas.principal,
      modal: true,
      backgroundColor: '#e3f2fd',
      minimizable: false,
      movable: false,
      show: false
    })

    /**
     * @description Eliminar la barra de menus de la ventana
     */
    this.ventanaTarifa.setMenu(null)

    /**
     * @description Agregar icono a la aplicacion
     */
    this.ventanaTarifa.setIcon(path.join(__dirname, '../../assets/img/aplicacion/icon.ico'))

    /**
     * @description Activar DevTools del la ventana
     */
    // this.ventanaTarifa.webContents.openDevTools()

    /**
     * @description Conectar la vista html con esta ventana
     */
    this.ventanaTarifa.loadURL(conexionVistas('tarifas'))

    /**
     * @description Ejecutor de funciones al preparar la ventana para mostrar
     */
    this.ventanaTarifa.once('ready-to-show', () => {
      this.ventanaTarifa.show()

      /**
       * @description Ejecutor de funciones al finalizar la carga de la ventana
       */
      this.ventanaTarifa.webContents.on('did-finish-load', async() => {
        this.recepcionLinea()
        this.cargaDatos()
        this.entregaDatos().entregaComponentes()
        this.erroresDatos()
        this.recepcionDatos()

        this.combinacionTeclas()
      })

      this.ventanaTarifa.on('close', function (event) {
        ipcMain.removeAllListeners('tarifas_cargaTabla')
        ipcMain.removeAllListeners('tarifa_datosTarifa')
        ipcMain.removeAllListeners('tarifas_borrarRegistro')

        event.preventDefault()
        this.hide()
      })

    })

  }

  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @returns {null}
   * @description Función que almacena multiples shortcuts
   */
    combinacionTeclas () {
      electronLocalshortcut.register(this.ventanaTarifa, 'Ctrl+I', () => {
        this.ventanaTarifa.webContents.openDevTools()
      })
    }

  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @returns {null}
   * @description Función especial para manipular las funciones busEmitter
   */
    recepcionLinea () {
      /**
       * @default
       */
    }

/**
 * @method
 * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
 * @returns {null}
 * @description Función especial para recepcion de solicitudes globales desde la vista html
 */
  cargaDatos () {
    ipcMain.on('tarifas_cargaTabla', async (e, datos) => {
      const tarifas = await this.consultasBD().get_todasTarifas()
      e.sender.send('tarifas_entregaTabla', tarifas)
    })
  }

/**
 * @method
 * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
 * @returns {null}
 * @description Función especial para envio de solicitudes globales a la vista html
 */
  entregaDatos () {
    var self = this
    return {
      async entregaComponentes () {
        /**
         * @default
         */
      }
    }
  }

/**
 * @method
 * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
 * @returns {null}
 * @description Función que almacena los errores de todos los componentes del modelo usuario
 */
  erroresDatos () {
    this.errores = {
      rango_minimo: [],
      rango_maximo: [],
      tarifa: [],
      fija_incrementada: []
    }
  }

/**
 * @method
 * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
 * @returns {null}
 * @description Función que resetea todos los errores de los componentes del modelo usuario
 */
  limpiarErrores () {
    this.errores.rango_minimo = []
    this.errores.rango_maximo = []
    this.errores.tarifa = []
    this.errores.fija_incrementada = []
  }

/**
 * @method
 * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
 * @returns {null}
 * @description Función especial para recepcion de solicitudes que contenga los datos sensibles de la vista html
 */
  recepcionDatos () {
/**
 * @description Recepción de datos del formulario
 */
    ipcMain.on('tarifa_datosTarifa', (e, json) => {
/**
 * @description Inicia el proceso de validación basica
 */
    this.limpiarErrores()
    let err = null

    const validacionBasica = new Promise (resolve => {
      if (typeof (json.viajeTiempo) !== 'object') {
        err = validar.valNumbers('bigger', json.rango_minimo, 1, 'Debe de ser superior a cero 0')
        if (err !== null) this.errores.rango_minimo.push(err)

        err = validar.valNumbers('bigger', json.rango_maximo, 1, 'Debe de ser superior a cero 0')
        if (err !== null) this.errores.rango_maximo.push(err)

        err = validar.valNumbers('bigger', json.rango_maximo, json.rango_minimo, 'Debes de ser superior a '+json.rango_minimo)
        if (err !== null) this.errores.rango_maximo.push(err)
      }

      err = validar.valNumbers('bigger', json.tarifa, 1, 'Debe de ser superior a cero 0')
      if (err !== null) this.errores.tarifa.push(err)

      resolve()
    })
      .then(async () => {
        if (this.errores.rango_minimo.length || this.errores.rango_maximo.length || this.errores.tarifa.length) {
          e.sender.send('tarifa_errores', this.errores)
        } else {
    /**
    * @description Inicia el proceso de validación base de datos
    */
          if (typeof (json.viajeTiempo) !== 'object') {
            await this.consultasBD().val_mayorUltimoRangoMaximo(json.rango_minimo)
            await this.consultasBD().val_rangoMinimoUnico(json.rango_minimo)
            await this.consultasBD().val_rangoMaximoUnico(json.rango_maximo)
          }


          if (this.errores.rango_minimo.length || this.errores.rango_maximo.length) {
            e.sender.send('tarifa_errores', this.errores)
          } else {
    /**
    * @description Inicia el proceso de subida, actualización o eliminacion base de datos
    */
            const datos = [
              json.rango_minimo,
              json.rango_maximo,
              json.tarifa,
              json.fija_incrementada
            ]
    /**
    * @description Desviación del flujo de estado de los datos sensibles
    */
            switch (json.ESTADO) {
              case 'crear':
                const _TarifaCreada = await this.consultasBD().crearTarifa(datos)

                if (_TarifaCreada.filas.insertId) {
                  this.funcionesGrabadas().Crear_MensajeExitoso(e, json)
                }
                break
              case 'cambiar':
                datos.splice(0, 2)
                datos.push(json.viajeTiempo.idTarifa)

                const _TarifaCambiada = await this.consultasBD().cambiarTarifa(datos)

                if (_TarifaCambiada.filas.affectedRows) {
                  this.funcionesGrabadas().Cambiar_MensajeExitoso(e, json)
                }
                break
            }
          }
        }
      })

    })

  /**
 * @description Borrar registro cobro agua
 */
    ipcMain.on('tarifas_borrarRegistro', async (e, dato) => {
      let _TarifaBorrar = await this.consultasBD().borrarTarifa()

      if (_TarifaBorrar.filas.affectedRows) {
        this.funcionesGrabadas().Borrar_MensajeExitoso(e, dato)
      }
    })
  }

/**
 * @method
 * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
 * @returns {null}
 * @description Función que almacena algunas funciones reutilizables para cualquier parte de la propia clase
 */
  funcionesGrabadas () {
    var self = this

    return {
      Crear_MensajeExitoso (e, dato) {
        e.sender.send('tarifa_respuesta', {errores: self.errores, mensaje: `Se ha creado la Tarifa`})
      },

      Cambiar_MensajeExitoso (e, dato) {
        e.sender.send('tarifa_respuesta', {errores: self.errores, mensaje: `Se ha cambiado la tarifa`})
      },

      Borrar_MensajeExitoso (e, dato) {
        e.sender.send('tarifa_respuestaBorrarRegistro', {mensaje: `Se ha borrado todo el registro de tarifas; tendrás que volver a crear la nueva lista de tarifas lo antes posible`})
      }
    }
  }

/**
 * @method
 * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
 * @returns {null}
 * @description Función que almacena las funciones requeridas para la consulta a la base de datos
 */
  consultasBD () {
    var self = this
    return {
      async get_todasTarifas () {
        try {
          const consulta = 'SELECT id AS idTarifa, rango_minimo, rango_maximo, tarifa, fija_incrementada FROM tarifas'
          return await bd.consulta(self.cBD, consulta, null)

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar conseguir todas las tarifas:\n ${error} \n\n`)
        }
      },

      async val_mayorUltimoRangoMaximo (minimo) {
        try {
          const consulta = `
             SELECT MAX(rango_maximo) AS rangoSupremo
             FROM tarifas
             WHERE rango_maximo >= ?
          `

          const _tarifaID = await bd.consulta(self.cBD, consulta, [minimo])

          let valor = 0

          if (_tarifaID.filas.length && _tarifaID.filas[0].rangoSupremo !== null) {
            self.errores.rango_minimo.push(`El rango mínimo ingresado debe de ser mayor a ${_tarifaID.filas[0].rangoSupremo}`)
          }

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al validar si el rango minimo es menor a los rango maximos ya registrado en el sistema:\n ${error} \n\n`)
        }
      },

      async val_rangoMinimoUnico (minimo) {
        try {

          const consulta = 'SELECT id FROM tarifas WHERE rango_minimo = ?'
          const datos = [minimo]

          const _tarifaID = await bd.consulta(self.cBD, consulta, datos)

          if (_tarifaID.filas.length) {
            self.errores.rango_minimo.push('El rango mínimo ingresado ya se encuentra registrado en la base de datos')
          }

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar validar si el rango mínimo ${minimo} ya se encuentra dentro de la base de datos:\n ${error} \n\n`)
        }
      },

      async val_rangoMaximoUnico (maximo) {
        try {

          const consulta = 'SELECT id FROM tarifas WHERE rango_maximo = ?'
          const datos = [maximo]

          const _tarifaID = await bd.consulta(self.cBD, consulta, datos)

          if (_tarifaID.filas.length) {
            self.errores.rango_maximo.push('El rango máximo ingresado ya se encuentra registrado en la base de datos')
          }

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar validar si el rango máximo ${maximo} ya se encuentra dentro de la base de datos:\n ${error} \n\n`)
        }
      },

      async crearTarifa (datos) {
        try {

          const consulta = 'INSERT INTO tarifas (rango_minimo, rango_maximo, tarifa, fija_incrementada) VALUES(?, ?, ?, ?)'

          return await bd.consulta(self.cBD, consulta, datos)

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar crear la tarifa:\n ${error} \n\n`)
        }
      },

      async cambiarTarifa (datos) {
        try {

          const consulta = 'UPDATE tarifas SET tarifa = ?, fija_incrementada = ? WHERE id = ?'

          return await bd.consulta(self.cBD, consulta, datos)

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar cambiar la tarifa:\n ${error} \n\n`)
        }
      },

      async borrarTarifa () {
        try {

          const consulta = 'DELETE FROM tarifas'

          return await bd.consulta(self.cBD, consulta, null)

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar borrar la tarifa:\n ${error} \n\n`)
        }
      }
    }
  }
}

module.exports = {ventana}
