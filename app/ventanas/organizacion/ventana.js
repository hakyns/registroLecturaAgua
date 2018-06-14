/**
 * @file Servidor ventana usuarios 9 de Marzo del 2018
 * @copyright Joaquin Reyes Sanchez 2018
 * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
 * @version 1.0.0
 */

const electron = require('electron')
const electronLocalshortcut = require('electron-localshortcut')

const path = require('path')
const fs = require('fs-extra')
const fsN = require('fs')

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
    this.ventanaOrganizacion = new BrowserWindow({
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
    this.ventanaOrganizacion.setMenu(null)

    /**
     * @description Agregar icono a la aplicacion
     */
    this.ventanaOrganizacion.setIcon(path.join(__dirname, '../../assets/img/aplicacion/icon.ico'))

    /**
     * @description Activar DevTools del la ventana
     */
    // this.ventanaOrganizacion.webContents.openDevTools()

    /**
     * @description Conectar la vista html con esta ventana
     */
    this.ventanaOrganizacion.loadURL(conexionVistas('organizacion'))

    /**
     * @description Ejecutor de funciones al preparar la ventana para mostrar
     */
    this.ventanaOrganizacion.once('ready-to-show', () => {
      this.ventanaOrganizacion.show()

      /**
       * @description Ejecutor de funciones al finalizar la carga de la ventana
       */
      this.ventanaOrganizacion.webContents.on('did-finish-load', async() => {
        this.recepcionLinea()
        this.cargaDatos()
        this.entregaDatos().entregaComponentes()
        this.erroresDatos()
        this.recepcionDatos()

        this.combinacionTeclas()
      })

      this.ventanaOrganizacion.on('close', function (event) {
        ipcMain.removeAllListeners('organizacion_actualizacion')
        ipcMain.removeAllListeners('organizacion_datosOrganizacion')

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
  electronLocalshortcut.register(this.ventanaOrganizacion, 'Ctrl+I', () => {
    this.ventanaOrganizacion.webContents.openDevTools()
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
    ipcMain.on('organizacion_actualizacion', (e, datos) => {
      this.entregaDatos().entregaComponentes()
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
        const existe = await self.consultasBD().get_organizacion()

        self.ventanaOrganizacion.webContents.send('organizacion_existeOrganizacion', existe)
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
      nombre: [],
      ciudad: [],
      estado: [],
      telefono: [],
      codigo_postal: [],
      domicilio: [],
      imagen: []
    }
  }

/**
 * @method
 * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
 * @returns {null}
 * @description Función que resetea todos los errores de los componentes del modelo usuario
 */
  limpiarErrores () {
    this.errores.nombre = []
    this.errores.ciudad = []
    this.errores.estado = []
    this.errores.telefono = []
    this.errores.codigo_postal = []
    this.errores.domicilio = []
    this.errores.imagen = []
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
    ipcMain.on('organizacion_datosOrganizacion', (e, json) => {
/**
 * @description Inicia el proceso de tratamiento
 */
      const tratamiento = new Promise(resolve => {
        if (json.imagen.name !== null) {
          let nombreImagen = json.imagen.name.split('.')
          nombreImagen.pop()

          json.rutaImagen = tratar.treatRouteFile(nombreImagen[0], json.imagen.name)
        }

        json.nombre = tratar.treatTrimSizeCharacters(json.nombre, 'lowerCase')
        json.ciudad = tratar.treatTrimSizeCharacters(json.ciudad, 'capitalize')
        json.estado = tratar.treatTrimSizeCharacters(json.estado, 'capitalize')
        json.domicilio = tratar.treatTrimSizeCharacters(json.domicilio, 'lowerCase')

        resolve()
      })
        .then(() => {
/**
 * @description Inicia el proceso de validación basica
 */
          this.limpiarErrores()
          let err = null

          const validacionBasica = new Promise (resolve => {
            err = validar.valBasicMain(json.nombre, 'text', 4, 35)
            if (err !== null) this.errores.nombre.push(err)

            err = validar.valBasicMain(json.ciudad, 'text', 4, 22)
            if (err !== null) this.errores.ciudad.push(err)

            err = validar.valBasicMain(json.estado, 'text', 4, 13)
            if (err !== null) this.errores.estado.push(err)

            err = validar.valNumbers('bigger', json.telefono, 1, 'Debes de escribir un telefono valido')
            if (err !== null) this.errores.telefono.push(err)
            err = validar.valMax(json.telefono, 15)
            if (err !== null) this.errores.telefono.push(err)

            err = validar.valNumbers('bigger', json.codigo_postal, 1, 'Debes de escribir un codigo postal valido')
            if (err !== null) this.errores.codigo_postal.push(err)
            err = validar.valMax(json.codigo_postal, 10)
            if (err !== null) this.errores.codigo_postal.push(err)

            err = validar.valBasicMain(json.domicilio, 'text', 4, 40)
            if (err !== null) this.errores.domicilio.push(err)

            if (typeof (json.viajeTiempo) === 'undefined') {
              err = validar.valBasicMain(json.imagen.name, 'text', 2, 150)
              if (err !== null) this.errores.imagen.push(err)
            }

            resolve()
          })
            .then(async () => {
              if (this.errores.nombre.length || this.errores.ciudad.length || this.errores.estado.length || this.errores.domicilio.length || this.errores.telefono.length || this.errores.codigo_postal.length || this.errores.imagen.length) {
                e.sender.send('organizacion_errores', this.errores)
              } else {
/**
 * @description Inicia el proceso de subida, actualización o eliminacion base de datos
 */
                const datos = [
                  json.nombre,
                  json.ciudad,
                  json.estado,
                  json.telefono,
                  json.codigo_postal,
                  json.domicilio,
                  json.rutaImagen ? json.rutaImagen : null
                ]

                switch (json.ESTADO) {
                  case 'crear':
                    const _OrganizacionCrear = await this.consultasBD().crearOrganizacion(datos)

                    if (_OrganizacionCrear.filas.insertId) {
                      if (typeof (json.rutaImagen) === 'string') {
/**
* @name Crear
* @description Se ejecuta cuando el usuario va a subir una imagen
*/
                        fs.copy(json.imagen.path, path.join(__dirname, '../../assets/img/organizacion/', json.rutaImagen), err => {
                          if (err) console.error('ERROR: No se pudo guardar la imagen')

                          this.funcionesGrabadas().Crear_MensajeExitoso(e, json)
                        })
                      } else {
/**
* @name Crear
* @description Se ejecuta cuando el usuario no va a subir una imagen
*/
                        this.funcionesGrabadas().Crear_MensajeExitoso(e, json)
                      }
                    }
                    break
                  case 'cambiar':
                    datos.push(json.viajeTiempo.id)
                    if (json.viajeTiempo.imagen !== null && datos[6] === null) datos[6] = json.viajeTiempo.imagen

                    let _OrganizacionCambiar = await this.consultasBD().cambiarOrganizacion(datos)

                    if (_OrganizacionCambiar.filas.affectedRows === 1) {
                      if (typeof (json.rutaImagen) === 'string') {
                        const directorios = [
                          path.join(__dirname, '../../assets/img/organizacion/', json.viajeTiempo.imagen),
                          path.join(__dirname, '../../assets/img/organizacion/', json.rutaImagen)
                        ]

                        fsN.unlink(directorios[0], err => {
                          if (err) console.error('ERROR: No se pudo eliminar la imagen vieja' +  err)

                          fs.copy(json.imagen.path, directorios[1], err => {
                            if (err) console.error('ERROR: No se pudo guardar la imagen')

                            this.funcionesGrabadas().Cambiar_MensajeExitoso(e, json)
                          })
                        })
                      } else this.funcionesGrabadas().Cambiar_MensajeExitoso(e, json)
                    }
                    break
                }
              }
            })
      })

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
        e.sender.send('organizacion_respuesta', {errores: self.errores,mensaje: `Se ha creado la organización ${dato.nombre}`})
      },

      Cambiar_MensajeExitoso (e, dato) {
        e.sender.send('organizacion_respuesta', {errores: self.errores,mensaje: `Se ha cambiado la organización ${dato.nombre}`})
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
      async get_organizacion () {
        try {
          const consulta = 'SELECT * FROM organizacion'

          return await bd.consulta(self.cBD, consulta, null)

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar conseguir la organización:\n ${error} \n\n`)
        }
      },

      async crearOrganizacion (datos) {
        try {

          const consulta = 'INSERT INTO organizacion (nombre, ciudad, estado, telefono, codigo_postal, domicilio, imagen) VALUES(?, ?, ?, ?, ?, ?, ?)'

          return await bd.consulta(self.cBD, consulta, datos)

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar crear la organizacion:\n ${error} \n\n`)
        }
      },

      async cambiarOrganizacion (datos) {
        try {

          const consulta = 'UPDATE organizacion SET nombre = ?, ciudad = ?, estado = ?, telefono = ?, codigo_postal = ?, domicilio = ?, imagen = ? WHERE id = ?'

          return await bd.consulta(self.cBD, consulta, datos)

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar cambiar la organización:\n ${error} \n\n`)
        }
      }
    }
  }
}

module.exports = {ventana}
