/**
 * @file Servidor ventana manzana 16 de Marzo del 2018
 * @copyright Joaquin Reyes Sanchez 2018
 * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
 * @version 1.0.0
 */

const electron = require('electron')
const electronLocalshortcut = require('electron-localshortcut')

const path = require('path')
const fs = require('fs')
const renameOverwrite = require('rename-overwrite')

const conexionVistas = require('../../tools/vista')

const {tratamiento, validador} = require('../../tools/maquinaDatos')
const tratar = new tratamiento()
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
    this.ventanaManzana = new BrowserWindow({
      width: 500,
      height: 300,
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
    this.ventanaManzana.setMenu(null)

    /**
     * @description Agregar icono a la aplicacion
     */
    this.ventanaManzana.setIcon(path.join(__dirname, '../../assets/img/aplicacion/icon.ico'))

    /**
     * @description Activar DevTools del la ventana
     */
    // this.ventanaManzana.webContents.openDevTools()

    /**
     * @description Conectar la vista html con esta ventana
     */
    this.ventanaManzana.loadURL(conexionVistas('manzana'))

    /**
     * @description Ejecutor de funciones al preparar la ventana para mostrar
     */
    this.ventanaManzana.once('ready-to-show', () => {
      this.ventanaManzana.show()

      /**
       * @description Ejecutor de funciones al finalizar la carga de la ventana
       */
      this.ventanaManzana.webContents.on('did-finish-load', async() => {
        this.recepcionLinea()
        this.cargaDatos()
        this.entregaDatos().entregaComponentes()
        this.erroresDatos()
        this.recepcionDatos()

        this.combinacionTeclas()
      })

      this.ventanaManzana.on('close', function (event) {
        ipcMain.removeAllListeners('manzana_cargaTabla')
        ipcMain.removeAllListeners('manzana_datosManzana')
        ipcMain.removeAllListeners('manzana_manzanaBuscar')

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
    electronLocalshortcut.register(this.ventanaManzana, 'Ctrl+I', () => {
      this.ventanaManzana.webContents.openDevTools()
    })
  }

/**
 * @method
 * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
 * @returns {null}
 * @description Función especial para manipular las funciones busEmitter
 */
  recepcionLinea (linea) {
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
    ipcMain.on('manzana_cargaTabla', async (e, datos) => {
      const manzanas = await this.consultasBD().get_todasManzanas()

      e.sender.send('manzana_entregaTabla', manzanas)
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
         * @readonly
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
      manzana: []
    }
  }

/**
 * @method
 * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
 * @returns {null}
 * @description Función que resetea todos los errores de los componentes del modelo usuario
 */
  limpiarErrores () {
    this.errores.manzana = []
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
    ipcMain.on('manzana_datosManzana', (e, json) => {
/**
 * @description Inicia el proceso de tratamiento
 */
      const tratamiento = new Promise(resolve => {
        json.manzana = tratar.treatFolderFile(json.manzana)
        json.manzana = tratar.treatTrimSizeCharacters(json.manzana, 'lowerCase')

        resolve()
      })
        .then(() => {
/**
 * @description Inicia el proceso de validación basica
 */
          this.limpiarErrores()
          let err = null

          const validacionBasica = new Promise (resolve => {
            err = validar.valBasicMain(json.manzana, 'text', 4, 20)
            if (err !== null) this.errores.manzana.push(err)

            resolve()
          })
            .then(() => {
              if (this.errores.manzana.length) {
                e.sender.send('manzana_errores', this.errores)
              } else {
/**
 * @description Inicia el proceso de validación base de datos
 */
                const validacionBaseDatos = new Promise (async resolve => {
                  if (typeof (json.manzana) === 'string') {
                    this.limpiarErrores()

                    await this.consultasBD().val_manzanaUnica(json.manzana)

                    resolve()
                  } else resolve()
                })
                  .then(async () => {
/**
 * @description Inicia el proceso de subida, actualización o eliminacion base de datos
 */
                    if (this.errores.manzana.length) {
                      e.sender.send('manzana_errores', this.errores)
                    } else {
                      const datos = [
                        json.manzana
                      ]
/**
 * @description Desviación del flujo de estado de los datos sensibles
 */
                      switch (json.ESTADO) {
                        case 'crear':
                          const _ManzanaCrear = await this.consultasBD().crearManzana(datos)

                          if (_ManzanaCrear.filas.insertId) {
                            this.funcionesGrabadas().Crear_MensajeExitoso(e, json)
                          }
                          break
                        case 'cambiar':
                          datos.push(json.viajeTiempo.idManzana)

                          let _ManzanaCambiar = await this.consultasBD().cambiarManzana(datos)

                          if (_ManzanaCambiar.filas.affectedRows === 1) {
                            if (fs.existsSync(path.join(__dirname, '../../assets/img/usuarios', json.viajeTiempo.manzana))) {
                              renameOverwrite(path.join(__dirname, '../../assets/img/usuarios', json.viajeTiempo.manzana), path.join(__dirname, '../../assets/img/usuarios', json.manzana)).then(() => {
                                this.funcionesGrabadas().Cambiar_MensajeExitoso(e, json)
                              })
                            } else {
                              this.funcionesGrabadas().Cambiar_MensajeExitoso(e, json)
                            }
                          } else console.error('Se han cambiado más de un registro O quizás sea un error')
                          break
                      }
                    }
                  })
              }
            })
      })

    })

/**
 * @description Recepción de datos del input buscar [Usuario Tipo] de la tarjeta de funciones ubicado debajo de la tabla en el tab buscar
 */
    ipcMain.on('manzana_manzanaBuscar', async (e, dato) => {
      if (dato) {
        const tabla = await this.consultasBD().get_manzana_manzana(dato)

        e.sender.send('manzana_entregaTabla', tabla)
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
        e.sender.send('manzana_respuesta', {errores: self.errores,mensaje: `Se ha creado la manzana ${dato.manzana}`})
      },

      Cambiar_MensajeExitoso (e, dato) {
        e.sender.send('manzana_respuesta', {errores: self.errores,mensaje: `Se ha cambiado la manzana ${dato.manzana}`})
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
      async get_todasManzanas () {
        try {

          const consulta = 'SELECT id AS idManzana, manzana FROM manzana ORDER BY manzana'

          return await bd.consulta(self.cBD, consulta, null)

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar conseguir todas las manzanas:\n ${error} \n\n`)
        }
      },

      async get_manzana_manzana (manzana) {
        try {
          const consulta = 'SELECT id AS idManzana, manzana FROM manzana WHERE manzana LIKE ? ORDER BY manzana'
          const datos = ['%' + manzana + '%']

          return await bd.consulta(self.cBD, consulta, datos)

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar conseguir todas las manzanas:\n ${error} \n\n`)
        }
      },

      async val_manzanaUnica (manzana) {
        try {

          const consulta = 'SELECT id FROM manzana WHERE manzana = ?'
          const datos = [manzana]

          const _manzanaID = await bd.consulta(self.cBD, consulta, datos)

          if (_manzanaID.filas.length) {
            self.errores.manzana.push('Existe otra manzana igual al que intentas registrar')
          }

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar validar si la manzana ${manzana} ya se encuentra dentro de la base de datos:\n ${error} \n\n`)
        }
      },

      async crearManzana (datos) {
        try {

          const consulta = 'INSERT INTO manzana (manzana) VALUES(?)'

          return await bd.consulta(self.cBD, consulta, datos)

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar crear la manzana:\n ${error} \n\n`)
        }
      },

      async cambiarManzana (datos) {
        try {

          const consulta = 'UPDATE manzana SET manzana = ? WHERE id = ?'

          return await bd.consulta(self.cBD, consulta, datos)

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar cambiar la manzana:\n ${error} \n\n`)
        }
      }
    }
  }
}

module.exports = {ventana}
