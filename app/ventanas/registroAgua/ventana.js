/**
 * @file Servidor ventana usuarios 23 de Marzo del 2018
 * @copyright Joaquin Reyes Sanchez 2018
 * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
 * @version 1.0.0
 */

const electron = require('electron')
const electronLocalshortcut = require('electron-localshortcut')

const path = require('path')

const storage = require('electron-json-storage')

const conexionVistas = require('../../tools/vista')

const {fechas} = require('../../tools/herramietasCustomizadas')
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
    this.ventanaRegistroAgua = new BrowserWindow({
      width: 800,
      height: 500,
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
    this.ventanaRegistroAgua.setMenu(null)

    /**
     * @description Agregar icono a la aplicacion
     */
    this.ventanaRegistroAgua.setIcon(path.join(__dirname, '../../assets/img/aplicacion/icon.ico'))

    /**
     * @description Activar DevTools del la ventana
     */
    // this.ventanaRegistroAgua.webContents.openDevTools()

    /**
     * @description Conectar la vista html con esta ventana
     */
    this.ventanaRegistroAgua.loadURL(conexionVistas('registroAgua'))

    /**
     * @description Ejecutor de funciones al preparar la ventana para mostrar
     */
    this.ventanaRegistroAgua.once('ready-to-show', () => {
      this.ventanaRegistroAgua.show()

      /**
       * @description Ejecutor de funciones al finalizar la carga de la ventana
       */
      this.ventanaRegistroAgua.webContents.on('did-finish-load', async() => {
        this.recepcionLinea()
        this.cargaDatos()
        this.entregaDatos().entregaComponentes()
        this.erroresDatos()
        this.recepcionDatos()

        this.combinacionTeclas()
      })

      this.ventanaRegistroAgua.on('close', function (event) {
        ipcMain.removeAllListeners('registroAgua_componentes')
        ipcMain.removeAllListeners('registroAgua_cargaTabla')
        ipcMain.removeAllListeners('usuario_organizacion')
        ipcMain.removeAllListeners('registroAgua_datosRegistroAgua')
        ipcMain.removeAllListeners('registroAgua_medidorBuscar')
        ipcMain.removeAllListeners('registroAgua_borrarRegistro')

        event.preventDefault()
        this.hide()
      })

    })

  }

/**
 * @method
 * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
 * @returns {null}
 * @description Función especial para la combinacion de teclas
 */
  combinacionTeclas () {
    electronLocalshortcut.register(this.ventanaRegistroAgua, 'Ctrl+I', () => {
      this.ventanaRegistroAgua.webContents.openDevTools()
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
    ipcMain.on('registroAgua_componentes', async (e, datos) => {
      await this.entregaDatos().entregaComponentes()
    })

    ipcMain.on('registroAgua_cargaTabla', (e, datos) => {
      storage.get('Trabajador', async (err, Trabajador) => {
        if (err) throw err

        const tabla = await this.consultasBD().get_registroAgua(Trabajador.idTrabajo)

        e.sender.send('registroAgua_entregaTabla', {tabla, Trabajador})
      })

    })

    ipcMain.on('usuario_organizacion', async (e, datos) => {
      const organizacion = await this.consultasBD().get_organizacion()

      e.sender.send('usuario_datosOrganizacion', organizacion)
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
      entregaComponentes () {
        storage.get('Trabajador', async (err, trabajador) => {
          if (err) throw err

          const medidores = await self.consultasBD().get_medidores(trabajador.idZonaTrabajo)

          self.ventanaRegistroAgua.webContents.send('registroAgua_entregaComponentes', {medidores, trabajador})
        })
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
      medidor: [],
      lectura: [],
      fecha_registro: []
    }
  }

/**
 * @method
 * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
 * @returns {null}
 * @description Función que resetea todos los errores de los componentes del modelo usuario
 */
  limpiarErrores () {
    this.errores.medidor = []
    this.errores.lectura = []
    this.errores.fecha_registro = []
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
    ipcMain.on('registroAgua_datosRegistroAgua', (e, json) => {
/**
 * @description Inicia el proceso de tratamiento
 */
      const tratamiento = new Promise(resolve => {

        json.fecha_registro = tratar.treatTrim(json.fecha_registro)

        resolve()
      })
        .then(async () => {
/**
 * @description Inicia el proceso de validación basica
 */
          this.limpiarErrores()
          let err = null

          const validacionBasica = new Promise (resolve => {
            err = validar.valNumbers('bigger', json.lectura, 1, 'Debes de ingresar una lectura valida')
            if (err !== null) this.errores.lectura.push(err)

            err = validar.valNumbers('bigger', json.numeroMedidor, 1, 'Debes de seleccionar un cliente')
            if (err !== null) this.errores.medidor.push(err)

            err = validar.valEmpty(json.fecha_registro)
            if (err !== null) this.errores.fecha_registro.push(err)


            resolve()
          })
            .then(async () => {
/**
 * @description Inicia el proceso de validación con base datos
 */
              if (this.errores.lectura.length || this.errores.medidor.length || this.errores.fecha_registro.length) {
                e.sender.send('registroAgua_errores', this.errores)
              } else {
                await this.consultasBD().val_medidorExiste(json.numeroMedidor, 'crear')

                if (typeof (json.viajeTiempo) !== 'object') {
                  await this.consultasBD().val_lecturaRegistrada(json.numeroMedidor, json.fecha_registro)
                } else if (typeof (json.viajeTiempo) === 'object') {
                  await this.consultasBD().val_lecturaRegistrada(json.numeroMedidor, json.fecha_registro, json.viajeTiempo.idRegistroAgua)
                  await this.consultasBD().val_registroExiste(json.viajeTiempo.idRegistroAgua)
                }

                if (this.errores.medidor.length || this.errores.lectura.length || this.errores.fecha_registro.length) {
                  e.sender.send('registroAgua_errores', this.errores)
                } else {
/**
 * @description Inicia el proceso de subida, actualización o eliminacion base de datos
 */
                  let self = this

                  storage.get('Trabajador', async (err, trabajador) => {
                    if (err) throw err

                    const datos = [
                      json.numeroMedidor,
                      trabajador.idTrabajo,
                      json.lectura,
                      json.fecha_registro,
                      json.fecha_registro
                    ]

                    switch (json.ESTADO) {
                      case 'registrar':
                        const _LecturaRegistrada = await self.consultasBD().registrarLectura(datos)

                        if (_LecturaRegistrada.filas.insertId) {
                          self.funcionesGrabadas().Crear_MensajeExitoso(e, json)
                        }
                        break
                      case 'cambiar':
                        datos.splice(1,1)
                        datos.splice(2, 1)

                        let selfA = self
                        storage.get('Trabajador', async (err, trabajador) => {
                          const jsonCambiosAnteriorString = await selfA.consultasBD().get_jsonCambios(json.viajeTiempo.idRegistroAgua)

                          const jsonCambiosNuevo = {}

                          jsonCambiosNuevo[new Date().toISOString()] = {
                            fecha: new Date(),
                            fechaRegistro: json.viajeTiempo.fecha_cambio,
                            trabajador: trabajador.nombre + ' ' + trabajador.apellidos,
                            cliente: json.medidor,
                            lectura: json.viajeTiempo.lectura
                          }

                          if (jsonCambiosAnteriorString.filas[0].json_cambios) {
                            const jsonCambiosAnteriorJSON = JSON.parse(jsonCambiosAnteriorString.filas[0].json_cambios)

                            datos.push(JSON.stringify(Object.assign(jsonCambiosAnteriorJSON, jsonCambiosNuevo)))
                          } else {
                            datos.push(JSON.stringify(jsonCambiosNuevo))
                          }

                          datos.push(json.viajeTiempo.idRegistroAgua)

                          const _LecturaRegistrada = await selfA.consultasBD().cambiarLectura(datos)

                          if (_LecturaRegistrada.filas.affectedRows === 1) {
                            selfA.funcionesGrabadas().Cambiar_MensajeExitoso(e, json)
                          }
                        })

                        break
                    }
                  })
                }
              }
            })
      })
    })

/**
 * @description Recepción de datos del input lecturista [Select Lecturista] de la tarjeta de funciones ubicado debajo de la tabla en el tab buscar
 */
    ipcMain.on('registroAgua_medidorBuscar', async (e, dato) => {
      if (dato) {
        storage.get('Trabajador', async (err, Trabajador) => {
          if (err) throw err

          const tabla = await this.consultasBD().get_registroAguaMedidor(Trabajador.idTrabajo, dato)

          e.sender.send('registroAgua_entregaTabla', {tabla, Trabajador})
        })
      }
    })

  /**
 * @description Borrar registro cobro agua
 */
    ipcMain.on('registroAgua_borrarRegistro', async (e, dato) => {
      let _RegistroAguaBorrar = await this.consultasBD().borrarRegistroAgua(dato.idRegistroAgua)

      if (_RegistroAguaBorrar.filas.affectedRows) {
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
        e.sender.send('registroAgua_respuesta', {errores: self.errores, mensaje: `Se ha registrado la lectura del cliente "${dato.medidor.toUpperCase()}"`})
      },

      Cambiar_MensajeExitoso (e, dato) {
        e.sender.send('registroAgua_respuesta', {errores: self.errores, mensaje: `Se ha cambiado la lectura del cliente "${dato.medidor.toUpperCase()}"`})
      },

      Borrar_MensajeExitoso (e, dato) {
        e.sender.send('registroAgua_respuestaBorrarRegistro', {mensaje: `Se ha borrado todo el registro de agua con folio ${dato.idRegistroAgua} <br>
          <ul>
            <li><b>Cliente:</b> ${dato.nombre} ${dato.apellidos}</li>
            <li><b>Lectura:</b> ${dato.lectura}m<sup>2</sup></li>
            <li><b>Fecha de Registro:</b> ${fechas.fixDate()(dato.fecha_cambio, 'longDate')}</li>
          </ul>
        `})
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
      async get_medidores (idZonaTrabajo) {
        try {
          const consulta = `
             SELECT ME.id AS idMedidor, ME.medidor, ME.latitud, ME.longitud, ME.notas, U.nombre, U.apellidos, U.imagen, M.manzana
             FROM medidores ME
             INNER JOIN usuario U ON ME.usuario = U.id
             INNER JOIN manzana M ON U.manzana = M.id
             WHERE U.manzana = ?
             ORDER BY U.apellidos
          `

          return await bd.consulta(self.cBD, consulta, [idZonaTrabajo])

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar conseguir los medidores:\n ${error} \n\n`)
        }
      },

      async get_registroAgua (idTrabajador) {
        try {
          const consulta = `
             SELECT R.id AS idRegistroAgua, R.lectura, R.fecha_registro, R.fecha_cambio, R.json_cambios, R.trabajador, ME.medidor, ME.id AS idMedidor, UME.nombre, UME.apellidos, UME.imagen, MUME.manzana AS manzanaCliente
             FROM registro_agua R
             INNER JOIN medidores ME ON R.medidor = ME.id
             INNER JOIN usuario UME ON ME.usuario = UME.id
             INNER JOIN manzana MUME ON UME.manzana = MUME.id
             WHERE R.trabajador = ?
             ORDER BY R.fecha_cambio DESC
          `

          return await bd.consulta(self.cBD, consulta, [idTrabajador])

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar conseguir los registro de agua:\n ${error} \n\n`)
        }
      },

      async get_registroAguaMedidor (idTrabajador, idMedidor) {
        try {
          const consulta = `
             SELECT R.id AS idRegistroAgua, R.lectura, R.fecha_registro, R.fecha_cambio, R.json_cambios, R.trabajador, ME.medidor, ME.id AS idMedidor, UME.nombre, UME.apellidos, UME.imagen, MUME.manzana AS manzanaCliente
             FROM registro_agua R
             INNER JOIN medidores ME ON R.medidor = ME.id
             INNER JOIN usuario UME ON ME.usuario = UME.id
             INNER JOIN manzana MUME ON UME.manzana = MUME.id
             WHERE R.trabajador = ? AND R.medidor = ?
             ORDER BY R.fecha_cambio DESC
          `

          return await bd.consulta(self.cBD, consulta, [idTrabajador, idMedidor])

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar conseguir los registro de agua:\n ${error} \n\n`)
        }
      },

      async get_jsonCambios (idRegistroAgua) {
        try {
          const consulta = 'SELECT json_cambios FROM registro_agua WHERE id = ?'

          return await bd.consulta(self.cBD, consulta, [idRegistroAgua])

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar conseguir el historial de cambios:\n ${error} \n\n`)
        }
      },

      async get_organizacion () {
        try {
          const consulta = 'SELECT * FROM organizacion'

          return await bd.consulta(self.cBD, consulta, null)

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar conseguir la organización:\n ${error} \n\n`)
        }
      },

      async val_medidorExiste (idMedidor) {
        try {

          const consulta = 'SELECT id FROM medidores WHERE id = ?'
          const datos = [idMedidor]

          const _medidorID = await bd.consulta(self.cBD, consulta, datos)

          if (!_medidorID.filas.length) {
            self.errores.medidor.push('No existe el cliente en nuestra base de datos... Asegurate de seleccionar un usuario existente.')
          }

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar validar si el medidor seleccionado existe en nuestra base de datos:\n ${error} \n\n`)
        }
      },

      async val_lecturaRegistrada (medidor, fecha_registro, id = 0) {
        try {
          let consulta = null
          let datos = []
          let _lecturaID = null
          let fechaObtenida = null

          if (!id) {
            consulta = 'SELECT fecha_cambio FROM registro_agua WHERE medidor = ? AND fecha_cambio = ?'
            datos = [medidor, fecha_registro]

            _lecturaID = await bd.consulta(self.cBD, consulta, datos)

            if (_lecturaID.filas.length) fechaObtenida = _lecturaID.filas[0].fecha_cambio
          } else if (id > 0) {
            consulta = 'SELECT fecha_cambio FROM registro_agua WHERE medidor = ? AND (fecha_cambio = ? AND id <> ?)'
            datos = [medidor, fecha_registro, id]

            _lecturaID = await bd.consulta(self.cBD, consulta, datos)

            if (_lecturaID.filas.length) fechaObtenida = _lecturaID.filas[0].fecha_cambio
          }

          if (_lecturaID.filas.length) {
            self.errores.fecha_registro.push(`Ya se ha registrado la lectura de este cliente para la fecha ${fechas.fixDate()(fechaObtenida, 'longDate')}; selecciona otra fecha o ve a la sección de cambiar lecturas`)
          }

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar validar si el medidor seleccionado existe en nuestra base de datos:\n ${error} \n\n`)
        }
      },

      async val_registroExiste (idRegistroAgua) {
        try {

          const consulta = 'SELECT id FROM registro_agua WHERE id = ?'
          const datos = [idRegistroAgua]

          const _registroAguaID = await bd.consulta(self.cBD, consulta, datos)

          if (!_registroAguaID.filas.length) {
            self.errores.lectura.push(`El registro que deseas cambiar, no se lográ encontrar en la base de datos del sistema`)
          }

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar verificar si el registro de agua existe en nuestra base de datos:\n ${error} \n\n`)
        }
      },

      async registrarLectura (datos) {
        try {

          const consulta = 'INSERT INTO registro_agua (medidor, trabajador, lectura, fecha_registro, fecha_cambio) VALUES(?, ?, ?, ?, ?)'

          return await bd.consulta(self.cBD, consulta, datos)

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar registrar la lectura:\n ${error} \n\n`)
        }
      },

      async cambiarLectura (datos) {
        try {

          const consulta = 'UPDATE registro_agua SET medidor = ?, lectura = ?, fecha_cambio = ?, json_cambios = ? WHERE id = ?'

          return await bd.consulta(self.cBD, consulta, datos)

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar cambiar el registro de agua:\n ${error} \n\n`)
        }
      },

      async borrarRegistroAgua (id) {
        try {

          const consulta = 'DELETE FROM registro_agua WHERE id = ?'

          return await bd.consulta(self.cBD, consulta, [id])

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar borrar el registro de agua:\n ${error} \n\n`)
        }
      }
    }
  }
}

module.exports = {ventana}
