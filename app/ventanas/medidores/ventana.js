/**
 * @file Servidor ventana usuarios 18 de Marzo del 2018
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
    this.ventanaMedidores = new BrowserWindow({
      width: 800,
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
    this.ventanaMedidores.setMenu(null)

    /**
     * @description Agregar icono a la aplicacion
     */
    this.ventanaMedidores.setIcon(path.join(__dirname, '../../assets/img/aplicacion/icon.ico'))

    /**
     * @description Activar DevTools del la ventana
     */
    // this.ventanaMedidores.webContents.openDevTools()

    /**
     * @description Conectar la vista html con esta ventana
     */
    this.ventanaMedidores.loadURL(conexionVistas('medidores'))

    /**
     * @description Ejecutor de funciones al preparar la ventana para mostrar
     */
    this.ventanaMedidores.once('ready-to-show', () => {
      this.ventanaMedidores.show()

      /**
       * @description Ejecutor de funciones al finalizar la carga de la ventana
       */
      this.ventanaMedidores.webContents.on('did-finish-load', async() => {
        this.recepcionLinea(lineas)
        this.cargaDatos()
        this.entregaDatos().entregaComponentes()
        this.erroresDatos()
        this.recepcionDatos()

        this.combinacionTeclas()
      })

      this.ventanaMedidores.on('close', function (event) {
        ipcMain.removeAllListeners('medidores_componentes')
        ipcMain.removeAllListeners('medidores_cargaTabla')
        ipcMain.removeAllListeners('usuario_organizacion')
        ipcMain.removeAllListeners('medidores_datosMedidor')
        ipcMain.removeAllListeners('medidores_datosClienteBuscar')
        ipcMain.removeAllListeners('medidores_datosManzanaBuscar')
        ipcMain.removeAllListeners('medidores_borrarRegistro')

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
  electronLocalshortcut.register(this.ventanaMedidores, 'Ctrl+I', () => {
    this.ventanaMedidores.webContents.openDevTools()
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
    ipcMain.on('medidores_componentes', async (e, datos) => {
      await this.entregaDatos().entregaComponentes()
    })

    ipcMain.on('medidores_cargaTabla', async (e, datos) => {
      const tabla = await this.consultasBD().get_medidores()

      e.sender.send('medidores_entregaTabla', tabla)
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
      async entregaComponentes () {
        const usuarios = await self.consultasBD().get_todosUsuarios()
        const usuariosClientes = await self.consultasBD().get_todosUsuariosClientes()
        const manzanas = await self.consultasBD().get_todasManzanas()

        self.ventanaMedidores.webContents.send('medidores_entregaComponentes', {usuarios, usuariosClientes, manzanas})
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
      medidor: [],
      latitud: [],
      longitud: [],
      notas: []
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
    this.errores.medidor = []
    this.errores.latitud = []
    this.errores.longitud = []
    this.errores.notas = []
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
    ipcMain.on('medidores_datosMedidor', (e, json) => {
/**
 * @description Inicia el proceso de tratamiento
 */
      const tratamiento = new Promise(resolve => {

        json.medidor = tratar.treatTrim(json.medidor, 'normal')
        json.notas = tratar.treatTrimSizeCharacters(json.notas, 'capitalize')

        resolve()
      })
        .then(async () => {
/**
 * @description Inicia el proceso de validación basica
 */
          this.limpiarErrores()
          let err = null

          const validacionBasica = new Promise (resolve => {
            if (typeof (json.viajeTiempo) !== 'object') {
              err = validar.valNumbers('bigger', json.usuario, 1, 'Debes de escoger un cliente')
              if (err !== null) this.errores.usuario.push(err)
            }

            err = validar.valBasicEmptyFull(json.medidor, 'text', 4, 255)
            if (err !== null) this.errores.medidor.push(err)

            err = validar.valBasicEmptyFull(json.latitud, 'number', 4, 255)
            if (err !== null) this.errores.latitud.push(err)

            err = validar.valBasicEmptyFull(json.longitud, 'number', 4, 255)
            if (err !== null) this.errores.longitud.push(err)

            err = validar.valBasicEmptyFull(json.notas, 'text', 4, 120)
            if (err !== null) this.errores.notas.push(err)

            resolve()
          })
            .then(async () => {
/**
 * @description Inicia el proceso de validación con base datos
 */
              if (this.errores.usuario.length || this.errores.medidor.length || this.errores.latitud.length || this.errores.longitud.length || this.errores.notas.length) {
                e.sender.send('medidores_errores', this.errores)
              } else {
                if (typeof (json.viajeTiempo) !== 'object') {
                  await this.consultasBD().val_usuarioExiste(json.usuario)
                  await this.consultasBD().val_usuarioUnico(json.usuario, json.CLIENTE.toUpperCase())

                  if (json.medidor !== null) {
                    await this.consultasBD().val_medidorUnico(json.medidor, 'crear')
                  }
                } else if (typeof (json.viajeTiempo) === 'object') {
                  if (json.medidor !== null) {
                    await this.consultasBD().val_medidorUnico(json.medidor, 'modificar', json.viajeTiempo.idMedidor)
                  }
                }

                if (this.errores.usuario.length || this.errores.medidor.length) {
                  e.sender.send('medidores_errores', this.errores)
                } else {
/**
 * @description Inicia el proceso de subida, actualización o eliminacion base de datos
 */
                  const datos = [
                    json.usuario,
                    json.medidor,
                    json.latitud,
                    json.longitud,
                    json.notas ? json.notas : null
                  ]

                  switch (json.ESTADO) {
                    case 'crear':
                      const _MedidorCreado = await this.consultasBD().crearMedidor(datos)

                      if (_MedidorCreado.filas.insertId) {
                        this.funcionesGrabadas().Crear_MensajeExitoso(e, json)
                      }
                      break
                    case 'cambiar':
                      datos.splice(0,1)
                      datos.push(json.viajeTiempo.idMedidor)
                      const _MedidorCambiado = await this.consultasBD().cambiarMedidor(datos)

                      if (_MedidorCambiado.filas.affectedRows === 1) {
                        this.funcionesGrabadas().Cambiar_MensajeExitoso(e, json)
                      }
                      break
                  }
                }
              }
            })
      })

    })

/**
 * @description Recepción de datos del input lecturista [Select Lecturista] de la tarjeta de funciones ubicado debajo de la tabla en el tab buscar
 */
    ipcMain.on('medidores_datosClienteBuscar', async (e, dato) => {
      if (dato) {
        const tabla = await this.consultasBD().get_medidoresCliente(dato)

        e.sender.send('medidores_entregaTabla', tabla)
      }
    })

/**
 * @description Recepción de datos del input zona de trabajo [Select Zona de trabajo] de la tarjeta de funciones ubicado debajo de la tabla en el tab buscar
 */
    ipcMain.on('medidores_datosManzanaBuscar', async (e, dato) => {
      if (dato) {
        const tabla = await this.consultasBD().get_medidoresManzana(dato)

        e.sender.send('medidores_entregaTabla', tabla)
      }
    })

  /**
 * @description Borrar registro cobro agua
 */
    ipcMain.on('medidores_borrarRegistro', async (e, dato) => {
      let _MedidorBorrar = await this.consultasBD().borrarMedidores(dato.idMedidor)

      if (_MedidorBorrar.filas.affectedRows) {
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
        e.sender.send('medidores_respuesta', {errores: self.errores, mensaje: `Se ha creado el medidor para el cliente "${dato.CLIENTE.toUpperCase()}"`})
      },

      Cambiar_MensajeExitoso (e, dato) {
        e.sender.send('medidores_respuesta', {errores: self.errores, mensaje: `Se ha cambiado el medidor para el cliente "${dato.CLIENTE.toUpperCase()}"`})
      },

      Borrar_MensajeExitoso (e, dato) {
        e.sender.send('medidores_respuestaBorrarRegistro', {mensaje: `Se ha borrado el medidor cliente con folio ${dato.idMedidor} <br>
        <ul>
          <li><b>Cliente:</b> ${dato.nombre} ${dato.apellidos}</li>
          <li><b>Medidor:</b> ${dato.medidor ? dato.medidor : 'Sin medidor'}</li>
          <li><b>Mapa Latitud:</b> ${dato.latitud}</li>
          <li><b>Mapa Longitud:</b> ${dato.longitud}</li>
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
      async get_todosUsuariosClientes () {
        try {
          const consulta = 'SELECT U.id AS idUsuario, U.nombre, U.apellidos, U.imagen, M.manzana FROM usuario U INNER JOIN manzana M ON U.manzana = M.id INNER JOIN usuario_tipo UT ON U.usuario_tipo = UT.id WHERE UT.tipo = ? ORDER BY U.nombre'

          return await bd.consulta(self.cBD, consulta, ['Cliente'])

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar conseguir todos los usuarios:\n ${error} \n\n`)
        }
      },

      async get_todosUsuarios () {
        try {
          const consulta = 'SELECT U.id AS idUsuario, U.nombre, U.apellidos, U.imagen, M.manzana FROM usuario U INNER JOIN manzana M ON U.manzana = M.id INNER JOIN usuario_tipo UT ON U.usuario_tipo = UT.id WHERE UT.tipo = ? AND U.id NOT IN (SELECT usuario FROM medidores) ORDER BY U.nombre'

          return await bd.consulta(self.cBD, consulta, ['Cliente'])

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar conseguir todos los usuarios:\n ${error} \n\n`)
        }
      },

      async get_todasManzanas () {
        try {

          const consulta = 'SELECT id AS idManzana, manzana FROM manzana ORDER BY manzana'

          return await bd.consulta(self.cBD, consulta, null)

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar conseguir todas las manzanas:\n ${error} \n\n`)
        }
      },

      async get_medidores () {
        try {

          const consulta = 'SELECT ME.id AS idMedidor, ME.medidor, ME.longitud, ME.latitud, ME.notas, U.nombre, U.apellidos, U.imagen, M.manzana FROM medidores ME INNER JOIN usuario U ON ME.usuario = U.id INNER JOIN manzana M ON U.manzana = M.id ORDER BY U.apellidos'

          return await bd.consulta(self.cBD, consulta, null)

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar conseguir todos los medidores:\n ${error} \n\n`)
        }
      },

      async get_medidoresCliente (idUsuario) {
        try {

          const consulta = 'SELECT ME.id AS idMedidor, ME.medidor, ME.longitud, ME.latitud, ME.notas, U.nombre, U.apellidos, U.imagen, M.manzana FROM medidores ME INNER JOIN usuario U ON ME.usuario = U.id INNER JOIN manzana M ON U.manzana = M.id WHERE ME.usuario = ? ORDER BY U.apellidos'

          return await bd.consulta(self.cBD, consulta, [idUsuario])

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar conseguir todos los medidores:\n ${error} \n\n`)
        }
      },

      async get_medidoresManzana (idManzana) {
        try {

          const consulta = 'SELECT ME.id AS idMedidor, ME.medidor, ME.longitud, ME.latitud, ME.notas, U.nombre, U.apellidos, U.imagen, M.manzana FROM medidores ME INNER JOIN usuario U ON ME.usuario = U.id INNER JOIN manzana M ON U.manzana = M.id WHERE U.manzana = ? ORDER BY U.apellidos'

          return await bd.consulta(self.cBD, consulta, [idManzana])

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar conseguir todos los medidores:\n ${error} \n\n`)
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

      async val_usuarioExiste (idUsuario) {
        try {

          const consulta = 'SELECT U.id FROM usuario U INNER JOIN usuario_tipo UT ON U.usuario_tipo = UT.id WHERE U.id = ? AND UT.tipo = ?'
          const datos = [idUsuario, 'Cliente']

          const _usuarioID = await bd.consulta(self.cBD, consulta, datos)

          if (!_usuarioID.filas.length) {
            self.errores.usuario.push('No existe el lecturista en la base de datos; asegurate de seleccionar un usuario lecturista idóneo para el trabajo')
          }

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar validar si el cliente seleccionado existe en nuestra base de datos:\n ${error} \n\n`)
        }
      },

      async val_usuarioUnico (idUsuario, cliente) {
        try {

          const consulta = 'SELECT id FROM medidores WHERE usuario = ?'
          const datos = [idUsuario]

          const _usuarioID = await bd.consulta(self.cBD, consulta, datos)

          if (_usuarioID.filas.length) {
            self.errores.usuario.push(`El cliente "${cliente}" ya cuenta con un registro de su medidor; solo se permite un medidor por cliente`)
          }

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar validar si el cliente seleccionado existe en nuestra base de datos:\n ${error} \n\n`)
        }
      },

      async val_medidorUnico (medidor, estado, id = 0) {
        try {
          let consulta = null
          let datos = null

          switch (estado) {
            case 'crear':
              consulta = 'SELECT id FROM medidores WHERE medidor = ?'
              datos = [medidor]
              break
            case 'modificar':
              consulta = 'SELECT id FROM medidores WHERE medidor = ? AND id <> ?'
              datos = [medidor, id]
              break
          }

          if (consulta !== null && datos !== null) {
            const _medidorID = await bd.consulta(self.cBD, consulta, datos)

            if (_medidorID.filas.length) {
              self.errores.medidor.push(`El medidor "${medidor}" existe actualmente en nuestra base de datos; asegurate de revisar esta información para no duplicar registros`)
            }
          } else console.error(`\n\nERROR: La consulta y los datos no pueden ser nulos:\n\n`)


        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar validar si el medidor no esta duplicada en nuestra base de datos:\n ${error} \n\n`)
        }
      },

      async crearMedidor (datos) {
        try {

          const consulta = 'INSERT INTO medidores (usuario, medidor, latitud, longitud, notas) VALUES(?, ?, ?, ?, ?)'

          return await bd.consulta(self.cBD, consulta, datos)

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar crear el medidor:\n ${error} \n\n`)
        }
      },

      async cambiarMedidor (datos) {
        try {

          const consulta = 'UPDATE medidores SET medidor = ?, latitud = ?, longitud = ?, notas = ? WHERE id = ?'

          return await bd.consulta(self.cBD, consulta, datos)

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar cambiar el medidor:\n ${error} \n\n`)
        }
      },

      async borrarMedidores (id) {
        try {

          const consulta = 'DELETE FROM medidores WHERE id = ?'

          return await bd.consulta(self.cBD, consulta, [id])

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar borrar el medidor:\n ${error} \n\n`)
        }
      }
    }
  }
}

module.exports = {ventana}
