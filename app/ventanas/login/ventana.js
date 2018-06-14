/**
 * @file Servidor ventana usuarios 18 de Marzo del 2018
 * @copyright Joaquin Reyes Sanchez 2018
 * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
 * @version 1.0.0
 */

const electron = require('electron')
const path = require('path')
const storage = require('electron-json-storage')

const conexionVistas = require('../../tools/vista')

const {tratamiento, validador} = require('../../tools/maquinaDatos')
const tratar = new tratamiento()
const validar = new validador()

const {fechas} = require('../../tools/herramietasCustomizadas')

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
  constructor (conexionBD, lineas) {
    this.cBD = conexionBD
    this.lineasEventBus = lineas

    /**
     * @description Caracteristicas Basicas de la ventana
     */
    this.ventanaLogin = new BrowserWindow({
      width: 400,
      height: 550,
      resizable: false,
      backgroundColor: '#e3f2fd',
      show: false
    })

    /**
     * @description Eliminar la barra de menus de la ventana
     */
    this.ventanaLogin.setMenu(null)

    /**
     * @description Agregar icono a la aplicacion
     */
    this.ventanaLogin.setIcon(path.join(__dirname, '../../assets/img/aplicacion/icon.ico'))

    /**
     * @description Activar DevTools del la ventana
     */
    // this.ventanaLogin.webContents.openDevTools()

    /**
     * @description Conectar la vista html con esta ventana
     */
    this.ventanaLogin.loadURL(conexionVistas('login'))

    /**
     * @description Ejecutor de funciones al preparar la ventana para mostrar
     */
    this.ventanaLogin.once('ready-to-show', () => {
      this.ventanaLogin.show()

      /**
       * @description Ejecutor de funciones al finalizar la carga de la ventana
       */
      this.ventanaLogin.webContents.on('did-finish-load', async() => {
        this.recepcionLinea()
        this.cargaDatos()
        this.entregaDatos().entregaComponentes()
        this.erroresDatos()
        this.recepcionDatos()
      })

      // this.ventanaLogin.on('closed', function () {
      //   this.ventanaLogin = null
      // })

    })

  }

/**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @returns {null}
   * @description Envio instrucciones busEmitter
   */
  envioLinea (llave) {
    switch (llave) {
      case 'main_crearPrincipal':
        this.lineasEventBus.emit('login-main_crearPrincipal')
        break
    }
  }

/**
 * @method
 * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
 * @returns {null}
 * @description Recepción de instrucciones busEmitter
 */
  recepcionLinea () {
    /**
     * @readonly
     */
  }

/**
 * @method
 * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
 * @returns {null}
 * @description Función especial para recepcion de solicitudes globales desde la vista html
 */
  cargaDatos () {
    /**
     * @readonly
     */
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
        const usuarios = await self.consultasBD().get_todosUsuarios()

        self.ventanaLogin.webContents.send('login_entregaComponentes', {usuarios})
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
      usuario: [],
      llave: []
    }
  }

/**
 * @method
 * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
 * @returns {null}
 * @description Función que resetea todos los errores de los componentes del modelo usuario
 */
  limpiarErrores () {
    this.errores.usuario = []
    this.errores.llave = []
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
    ipcMain.on('login_datosLogin', (e, json) => {
      if (json.usuario === -1990) {
        if (json.llave === 'jrs-hs-RLA') {
          storage.setDataPath(path.join(__dirname, '../../storage'))

          const trabajador = {
            "idTrabajo":0,
            "minutos_trabajados":0,
            "fecha_inicio": null,
            "fecha_fin":null,
            "idZonaTrabajo":0,
            "idTrabajador":0,
            "nombre":"Admin",
            "apellidos":"Root",
            "manzana":null,
            "zona_trabajo":null
          }

          storage.set('Trabajador', trabajador, err => {
            if (err) throw err

            this.funcionesGrabadas().Crear_MensajeExitoso(e, json)
          })
        } else {
          this.errores.usuario.push('No se pudo acceder a la cuenta del Admin Root; asegurate de ingresar la información correcta')
          e.sender.send('login_errores', this.errores)
        }
      } else {
/**
 * @description Inicia el proceso de tratamiento
 */
      const tratamiento = new Promise(resolve => {
        json.llave = tratar.treatTrim(json.llave)

        resolve()
      })
        .then(async () => {
/**
 * @description Inicia el proceso de validación basica
 */
          this.limpiarErrores()
          let err = null

          const validacionBasica = new Promise (resolve => {
            err = validar.valNumbers('bigger', json.usuario, 1, 'Debes de escoger un usuario')
            if (err !== null) this.errores.usuario.push(err)

            err = validar.valBasicMain(json.llave, 'text', 4, 20)
            if (err !== null) this.errores.llave.push(err)

            resolve()
          })
            .then(async () => {
/**
 * @description Inicia el proceso de validación con base datos
 */
              if (this.errores.usuario.length || this.errores.llave.length) {
                e.sender.send('login_errores', this.errores)
              } else {
                await this.consultasBD().val_usuarioExiste(json.usuario, json.llave)
                await this.consultasBD().val_trabajadorExpirado(json.usuario)
                if (this.errores.usuario.length || this.errores.llave.length) {
                  e.sender.send('login_errores', this.errores)
                } else {
/**
 * @description Finalización con éxito
 */
                  storage.setDataPath(path.join(__dirname, '../../storage'))

                  const trabajador = await this.consultasBD().get_trabajador(json.usuario)

                  storage.set('Trabajador', trabajador.filas[0], err => {
                    if (err) throw err

                    this.funcionesGrabadas().Crear_MensajeExitoso(e, json)
                  })
                }
              }
            })
        })
      }
    })

    ipcMain.on('login_terminado', (e, json) => {
      this.envioLinea('main_crearPrincipal')
      this.ventanaLogin.close()
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
        e.sender.send('login_respuesta', {errores: self.errores, mensaje: `Bienvenido "${dato.USUARIO.toUpperCase()}"`})
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
      async get_todosUsuarios () {
        try {
          const consulta = `
             SELECT U.id AS idUsuario, U.nombre, U.apellidos, U.imagen, UT.tipo, M.manzana
             FROM trabajo T
             INNER JOIN usuario U ON T.usuario = U.id
             INNER JOIN manzana M ON U.manzana = M.id
             INNER JOIN usuario_tipo UT ON U.usuario_tipo = UT.id
             WHERE UT.tipo = ? OR UT.tipo = ? ORDER BY U.apellidos
          `

          return await bd.consulta(self.cBD, consulta, ['Lecturista', 'Administrador'])

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar conseguir todos los usuarios:\n ${error} \n\n`)
        }
      },

      async get_trabajador (idTrabajador) {
        try {
          const consulta = `
             SELECT T.id AS idTrabajo, T.minutos_trabajados, T.fecha_inicio, T.fecha_fin, T.zona_trabajo AS idZonaTrabajo, U.id AS idTrabajador, U.nombre, U.apellidos, M.manzana, MZ.manzana AS zona_trabajo
             FROM trabajo T
             INNER JOIN usuario U ON T.usuario = U.id
             INNER JOIN manzana M ON U.manzana = M.id
             INNER JOIN manzana MZ ON T.zona_trabajo = MZ.id
             WHERE T.usuario = ?
          `

          return await bd.consulta(self.cBD, consulta, [idTrabajador])

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar conseguir el trabajador:\n ${error} \n\n`)
        }
      },

      async val_usuarioExiste (idUsuario, llave) {
        try {

          const consulta = `
             SELECT T.id
             FROM trabajo T
             INNER JOIN usuario U ON T.usuario = U.id
             INNER JOIN usuario_tipo UT ON U.usuario_tipo = UT.id
             WHERE U.id = ? AND BINARY T.llave = ? AND UT.tipo = ? OR UT.tipo = ?
          `
          const datos = [idUsuario, llave, 'Lecturista', 'Administrador']

          const _usuarioID = await bd.consulta(self.cBD, consulta, datos)

          if (!_usuarioID.filas.length) {
            self.errores.usuario.push('No se pudo acceder a esta cuenta; asegurate de ingresar la información correcta')
          }

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar validar si el usuario seleccionado existe en nuestra base de datos:\n ${error} \n\n`)
        }
      },

      async val_trabajadorExpirado (idTrabajador) {
        try {
          const fechaActual = Date.parse(new Date().toISOString().split('T')[0])

          const consulta = `
             SELECT fecha_fin
             FROM trabajo
             WHERE usuario = ?
          `
          const datos = [idTrabajador]

          const _fechaFinal = await bd.consulta(self.cBD, consulta, datos)

          const fechaFin = Date.parse(_fechaFinal.filas[0].fecha_fin.toISOString().split('T')[0])

          if (fechaActual > fechaFin) {
            self.errores.usuario.push(`Lamentablemente tu cargo como lecturista ha expirado el dia ${fechas.fixDate()(_fechaFinal.filas[0].fecha_fin.toISOString().split('T')[0], 'longDate')}, contacta al administrador del sistema para verificar tu expiración de trabajo`)
          }

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar validar si el trabajador seleccionado no ha expirado como lecturista:\n ${error} \n\n`)
        }
      }
    }
  }
}

module.exports = {ventana}
