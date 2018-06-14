/**
 * @file Servidor ventana usuarios 16 de Marzo del 2018
 * @copyright Joaquin Reyes Sanchez 2018
 * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
 * @version 1.0.0
 */

const electron = require('electron')
const electronLocalshortcut = require('electron-localshortcut')

const path = require('path')

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
    this.ventanaUsuarioTipo = new BrowserWindow({
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
    this.ventanaUsuarioTipo.setMenu(null)

    /**
     * @description Agregar icono a la aplicacion
     */
    this.ventanaUsuarioTipo.setIcon(path.join(__dirname, '../../assets/img/aplicacion/icon.ico'))

    /**
     * @description Activar DevTools del la ventana
     */
    // this.ventanaUsuarioTipo.webContents.openDevTools()

    /**
     * @description Conectar la vista html con esta ventana
     */
    this.ventanaUsuarioTipo.loadURL(conexionVistas('usuarioTipo'))

    /**
     * @description Ejecutor de funciones al preparar la ventana para mostrar
     */
    this.ventanaUsuarioTipo.once('ready-to-show', () => {
      this.ventanaUsuarioTipo.show()

      /**
       * @description Ejecutor de funciones al finalizar la carga de la ventana
       */
      this.ventanaUsuarioTipo.webContents.on('did-finish-load', async() => {
        this.recepcionLinea()
        this.cargaDatos()
        this.entregaDatos().entregaComponentes()
        this.erroresDatos()
        this.recepcionDatos()

        this.combinacionTeclas()
      })

      this.ventanaUsuarioTipo.on('close', function (event) {
        ipcMain.removeAllListeners('usuarioTipo_cargaTabla')
        ipcMain.removeAllListeners('usuarioTipo_datosUsuarioTipo')
        ipcMain.removeAllListeners('usuarioTipo_datosInputBuscar')

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
    electronLocalshortcut.register(this.ventanaUsuarioTipo, 'Ctrl+I', () => {
      this.ventanaUsuarioTipo.webContents.openDevTools()
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
    ipcMain.on('usuarioTipo_cargaTabla', async (e, datos) => {
      const tiposUsuarios = await this.consultasBD().get_todosTiposUsuario()

      e.sender.send('usuarioTipo_entregaTabla', tiposUsuarios)
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
      usuario_tipo: []
    }
  }

/**
 * @method
 * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
 * @returns {null}
 * @description Función que resetea todos los errores de los componentes del modelo usuario
 */
  limpiarErrores () {
    this.errores.usuario_tipo = []
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
    ipcMain.on('usuarioTipo_datosUsuarioTipo', (e, json) => {
/**
 * @description Inicia el proceso de tratamiento
 */
      const tratamiento = new Promise(resolve => {
        json.usuario_tipo = tratar.treatTrimSizeCharacters(json.usuario_tipo, 'capitalize')

        resolve()
      })
        .then(() => {
/**
 * @description Inicia el proceso de validación basica
 */
          this.limpiarErrores()
          let err = null

          const validacionBasica = new Promise (resolve => {
            err = validar.valBasicMain(json.usuario_tipo, 'text', 4, 20)
            if (err !== null) this.errores.usuario_tipo.push(err)

            resolve()
          })
            .then(() => {
              if (this.errores.usuario_tipo.length) {
                e.sender.send('usuarioTipo_errores', this.errores)
              } else {
/**
 * @description Inicia el proceso de validación base de datos
 */
                const validacionBaseDatos = new Promise (async resolve => {
                  if (typeof (json.usuario_tipo) === 'string') {
                    this.limpiarErrores()

                    await this.consultasBD().val_usuarioTipoUnico(json.usuario_tipo)

                    resolve()
                  } else resolve()
                })
                  .then(async () => {
/**
 * @description Inicia el proceso de subida, actualización o eliminacion base de datos
 */
                    if (this.errores.usuario_tipo.length) {
                      e.sender.send('usuarioTipo_errores', this.errores)
                    } else {
                      const datos = [
                        json.usuario_tipo
                      ]
/**
 * @description Desviación del flujo de estado de los datos sensibles
 */
                      switch (json.ESTADO) {
                        case 'crear':
                          const _UsuarioTipoCrear = await this.consultasBD().crearUsuarioTipo(datos)

                          if (_UsuarioTipoCrear.filas.insertId) {
                            this.funcionesGrabadas().Crear_MensajeExitoso(e, json)
                          }
                          break
                        case 'cambiar':
                          datos.push(json.viajeTiempo.idUsuarioTipo)

                          let _UsuarioTipoCambiar = await this.consultasBD().cambiarUsuarioTipo(datos)

                          if (_UsuarioTipoCambiar.filas.affectedRows === 1) {
                            this.funcionesGrabadas().Cambiar_MensajeExitoso(e, json)
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
    ipcMain.on('usuarioTipo_datosInputBuscar', async (e, dato) => {
      if (dato) {
        const tabla = await this.consultasBD().get_tiposUsuario_tipoUsuario(dato)

        e.sender.send('usuarioTipo_entregaTabla', tabla)
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
        e.sender.send('usuarioTipo_respuesta', {errores: self.errores,mensaje: `Se ha creado el tipo de usuario ${dato.usuario_tipo}`})
      },

      Cambiar_MensajeExitoso (e, dato) {
        e.sender.send('usuarioTipo_respuesta', {errores: self.errores,mensaje: `Se ha cambiado el usuario ${dato.usuario_tipo}`})
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
      async get_todosTiposUsuario () {
        try {

          const consulta = 'SELECT id AS idUsuarioTipo, tipo AS tipoUsuario FROM usuario_tipo ORDER BY tipo'

          return await bd.consulta(self.cBD, consulta, null)

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar conseguir todos los tipos de usuario:\n ${error} \n\n`)
        }
      },

      async get_tiposUsuario_tipoUsuario (tipoUsuario) {
        try {
          const consulta = 'SELECT id AS idUsuarioTipo, tipo AS tipoUsuario FROM usuario_tipo WHERE tipo LIKE ? ORDER BY tipo'
          const datos = ['%' + tipoUsuario + '%']

          return await bd.consulta(self.cBD, consulta, datos)

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar conseguir todos los tipos de usuario:\n ${error} \n\n`)
        }
      },

      async val_usuarioTipoUnico (usuarioTipo) {
        try {

          const consulta = 'SELECT id FROM usuario_tipo WHERE tipo = ?'
          const datos = [usuarioTipo]

          const _usuarioTipoID = await bd.consulta(self.cBD, consulta, datos)

          if (_usuarioTipoID.filas.length) {
            self.errores.usuario_tipo.push('Existe otro tipo de usuario igual al que intentas registrar')
          }

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar validar si el tipo de usuario ${usuarioTipo} ya se encuentra dentro de la base de datos:\n ${error} \n\n`)
        }
      },

      async crearUsuarioTipo (datos) {
        try {

          const consulta = 'INSERT INTO usuario_tipo (tipo) VALUES(?)'

          return await bd.consulta(self.cBD, consulta, datos)

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar crear el tipo de usuario:\n ${error} \n\n`)
        }
      },

      async cambiarUsuarioTipo (datos) {
        try {

          const consulta = 'UPDATE usuario_tipo SET tipo = ? WHERE id = ?'

          return await bd.consulta(self.cBD, consulta, datos)

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar cambiar el tipo de usuario:\n ${error} \n\n`)
        }
      }
    }
  }
}

module.exports = {ventana}
