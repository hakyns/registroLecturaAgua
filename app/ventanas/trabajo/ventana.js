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
    this.ventanaTrabajo = new BrowserWindow({
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
    this.ventanaTrabajo.setMenu(null)

    /**
     * @description Agregar icono a la aplicacion
     */
    this.ventanaTrabajo.setIcon(path.join(__dirname, '../../assets/img/aplicacion/icon.ico'))

    /**
     * @description Activar DevTools del la ventana
     */
    // this.ventanaTrabajo.webContents.openDevTools()

    /**
     * @description Conectar la vista html con esta ventana
     */
    this.ventanaTrabajo.loadURL(conexionVistas('trabajo'))

    /**
     * @description Ejecutor de funciones al preparar la ventana para mostrar
     */
    this.ventanaTrabajo.once('ready-to-show', () => {
      this.ventanaTrabajo.show()

      /**
       * @description Ejecutor de funciones al finalizar la carga de la ventana
       */
      this.ventanaTrabajo.webContents.on('did-finish-load', async() => {
        this.recepcionLinea()
        this.cargaDatos()
        this.entregaDatos().entregaComponentes()
        this.erroresDatos()
        this.recepcionDatos()

        this.combinacionTeclas()
      })

      this.ventanaTrabajo.on('close', function (event) {
        ipcMain.removeAllListeners('trabajo_componentes')
        ipcMain.removeAllListeners('trabajo_cargaTabla')
        ipcMain.removeAllListeners('usuario_organizacion')
        ipcMain.removeAllListeners('trabajo_datosTrabajador')
        ipcMain.removeAllListeners('trabajo_datosTrabajadorBuscar')
        ipcMain.removeAllListeners('trabajo_datosZonaTrabajoBuscar')
        ipcMain.removeAllListeners('trabajo_borrarRegistro')
        ipcMain.removeAllListeners('trabajo_enviarALogin')

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
  electronLocalshortcut.register(this.ventanaTrabajo, 'Ctrl+I', () => {
    this.ventanaTrabajo.webContents.openDevTools()
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
    ipcMain.on('trabajo_componentes', async (e, datos) => {
      await this.entregaDatos().entregaComponentes()
    })

    ipcMain.on('trabajo_cargaTabla', async (e, datos) => {
      const tabla = await this.consultasBD().get_trabajos()

      e.sender.send('trabajo_entregaTabla', tabla)
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
        const usuariosTrabajando = await self.consultasBD().get_todosUsuariosTrabajando()
        const manzanas = await self.consultasBD().get_todasManzanas()

        self.ventanaTrabajo.webContents.send('trabajo_entregaComponentes', {usuarios, usuariosTrabajando, manzanas})
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
      llave: [],
      zona_trabajo: [],
      fecha_inicio: [],
      fecha_fin: [],
      minutos_trabajados: [],
      estado: []
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
    this.errores.zona_trabajo = []
    this.errores.fecha_inicio = []
    this.errores.fecha_fin = []
    this.errores.minutos_trabajados = []
    this.errores.estado = []
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
    ipcMain.on('trabajo_datosTrabajador', (e, json) => {
/**
 * @description Inicia el proceso de tratamiento
 */
      const tratamiento = new Promise(resolve => {

        json.llave = tratar.treatTrimSizeCharacters(json.llave, 'normal')

        resolve()
      })
        .then(async () => {
/**
 * @description Inicia el proceso de validación basica
 */
          this.limpiarErrores()
          let err = null

          const validacionBasica = new Promise (resolve => {
            err = validar.valBasicMain(json.llave, 'text', 4, 20)
            if (err !== null) this.errores.llave.push(err)

            if (typeof (json.viajeTiempo) !== 'object') {
              err = validar.valNumbers('bigger', json.usuario, 1, 'Debes de escoger un lecturista')
              if (err !== null) this.errores.usuario.push(err)
            }

            err = validar.valNumbers('bigger', json.zona_trabajo, 1, 'Debes de escoger una zona de trabajo')
            if (err !== null) this.errores.zona_trabajo.push(err)

            err = validar.valEmpty(json.fecha_inicio)
            if (err !== null) this.errores.fecha_inicio.push(err)

            err = validar.valEmpty(json.fecha_fin)
            if (err !== null) this.errores.fecha_fin.push(err)

            if (json.fecha_inicio !== null && typeof (json.viajeTiempo) !== 'object') {
              err = validar.valNumbers('bigger', Date.parse(json.fecha_inicio), Date.parse(new Date().toISOString().split('T')[0]), 'La fecha de inicio no debe de ser menor a la fecha de Hoy')
              if (err !== null) this.errores.fecha_inicio.push(err)

              if (json.fecha_fin !== null) {
                err = validar.valNumbers('bigger', Date.parse(json.fecha_fin), Date.parse(json.fecha_inicio), 'La fecha final no debe de ser menor a la fecha de inicio')
                if (err !== null) this.errores.fecha_fin.push(err)
              }
            } else if (json.fecha_inicio !== null && typeof (json.viajeTiempo) === 'object') {
              err = validar.valNumbers('bigger', fechas.DateNumber(json.fecha_inicio), fechas.DateNumber(json.viajeTiempo.fecha_inicio), 'La fecha inicial no debe de ser menor a la fecha de inicio original ' + json.viajeTiempo.fecha_inicio)
              if (err !== null) this.errores.fecha_inicio.push(err)

              if (json.fecha_fin !== null) {
                err = validar.valNumbers('bigger', fechas.DateNumber(json.fecha_fin), fechas.DateNumber(json.fecha_inicio), 'La fecha final no debe de ser menor a la fecha de inicio')
                if (err !== null) this.errores.fecha_fin.push(err)
              }
            }

            resolve()
          })
            .then(async () => {
/**
 * @description Inicia el proceso de validación con base datos
 */
              if (this.errores.llave.length || this.errores.usuario.length || this.errores.zona_trabajo.length || this.errores.fecha_inicio.length || this.errores.fecha_fin.length) {
                e.sender.send('trabajo_errores', this.errores)
              } else {
                if (typeof (json.viajeTiempo) !== 'object') {
                  await this.consultasBD().val_usuarioExiste(json.usuario)
                  await this.consultasBD().val_usuarioUnico(json.usuario, json.LECTURISTA.toUpperCase())
                  await this.consultasBD().val_llaveUnica(json.llave, 'crear')
                } else if (typeof (json.viajeTiempo) === 'object') {
                  await this.consultasBD().val_llaveUnica(json.llave, 'modificar', json.viajeTiempo.idTrabajo)
                }

                await this.consultasBD().val_zonaTrabajoExiste(json.zona_trabajo)

                if (this.errores.usuario.length || this.errores.zona_trabajo.length || this.errores.llave.length) {
                  e.sender.send('trabajo_errores', this.errores)
                } else {
/**
 * @description Inicia el proceso de subida, actualización o eliminacion base de datos
 */
                  const datos = [
                    json.usuario,
                    json.llave,
                    json.zona_trabajo,
                    json.fecha_inicio,
                    json.fecha_fin,
                    json.minutos_trabajados,
                    json.estado
                  ]

                  switch (json.ESTADO) {
                    case 'asignar':
                      const _TrabajoAsignado = await this.consultasBD().crearTrabajo(datos)

                      if (_TrabajoAsignado.filas.insertId) {
                        this.funcionesGrabadas().Crear_MensajeExitoso(e, json)
                      }
                      break
                    case 'reasignar':
                      datos.splice(0,1)
                      datos.splice(4, 1)
                      datos.push(json.viajeTiempo.idTrabajo)
                      const _TrabajoReasignado = await this.consultasBD().cambiarTrabajo(datos)

                      if (_TrabajoReasignado.filas.affectedRows === 1) {
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
    ipcMain.on('trabajo_datosTrabajadorBuscar', async (e, dato) => {
      if (dato) {
        const tabla = await this.consultasBD().get_trabajosTrabajador(dato)

        e.sender.send('trabajo_entregaTabla', tabla)
      }
    })

/**
 * @description Recepción de datos del input zona de trabajo [Select Zona de trabajo] de la tarjeta de funciones ubicado debajo de la tabla en el tab buscar
 */
    ipcMain.on('trabajo_datosZonaTrabajoBuscar', async (e, dato) => {
      if (dato) {
        const tabla = await this.consultasBD().get_trabajosZonaTrabajo(dato)

        e.sender.send('trabajo_entregaTabla', tabla)
      }
    })

  /**
 * @description Borrar registro cobro agua
 */
    ipcMain.on('trabajo_borrarRegistro', async (e, dato) => {
      let _TrabajadorBorrar = await this.consultasBD().borrarTrabajador(dato.idTrabajo)

      if (_TrabajadorBorrar.filas.affectedRows) {
        this.funcionesGrabadas().Borrar_MensajeExitoso(e, dato)
      }
    })

  /**
 * @description Enviar al Login
 */
    ipcMain.on('trabajo_enviarALogin', async (e, dato) => {
      this.lineasEventBus.emit('trabajo-principal_cerrarVentanaLlamarLogin')
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
      Global_DirectorioImagen (manzana, imagen = null) {
        if (imagen !== null) return path.join(__dirname, '../../assets/img/usuarios', manzana, imagen)
        else return path.join(__dirname, '../../assets/img/usuarios', manzana)
      },

      Crear_MensajeExitoso (e, dato) {
        e.sender.send('trabajo_respuesta', {errores: self.errores, mensaje: `Se ha creado el trabajo para el lecturista "${dato.LECTURISTA.toUpperCase()}"`})
      },

      Cambiar_MensajeExitoso (e, dato) {
        e.sender.send('trabajo_respuesta', {errores: self.errores, mensaje: `Se ha cambiado el trabajo para el lecturista "${dato.LECTURISTA.toUpperCase()}"`})
      },

      Borrar_MensajeExitoso (e, dato) {
        e.sender.send('trabajo_respuestaBorrarRegistro', {mensaje: `
        <h5>Se cerrará el sistema para terminar este proceso de borrado, vuelve a ingresar ... ... ;)</h5>
        Se ha borrado el lecturista con folio ${dato.idTrabajo} <br>
          <ul>
            <li><b>Cliente:</b> ${dato.nombre} ${dato.apellidos}</li>
            <li><b>Zona de Trabajo:</b> ${dato.zona_trabajo}</li>
            <li><b>Fecha final de Trabajo:</b> ${fechas.fixDate()(dato.fecha_fin, 'longDate')}</li>
            <li><b>Estado:</b> ${dato.estado ? 'Habilitado' : 'Deshabilitado'}</li>
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
      async get_todosUsuariosTrabajando () {
        try {
          const consulta = 'SELECT U.id AS idUsuario, U.nombre, U.apellidos, U.imagen, M.manzana FROM usuario U INNER JOIN manzana M ON U.manzana = M.id INNER JOIN usuario_tipo UT ON U.usuario_tipo = UT.id WHERE UT.tipo = ? ORDER BY U.nombre'

          return await bd.consulta(self.cBD, consulta, ['Lecturista'])

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar conseguir todos los usuarios:\n ${error} \n\n`)
        }
      },

      async get_todosUsuarios () {
        try {
          const consulta = 'SELECT U.id AS idUsuario, U.nombre, U.apellidos, U.imagen, M.manzana FROM usuario U INNER JOIN manzana M ON U.manzana = M.id INNER JOIN usuario_tipo UT ON U.usuario_tipo = UT.id WHERE UT.tipo = ? AND U.id NOT IN (SELECT usuario FROM trabajo) ORDER BY U.nombre'

          return await bd.consulta(self.cBD, consulta, ['Lecturista'])

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

      async get_trabajos () {
        try {

          const consulta = 'SELECT T.id AS idTrabajo, T.llave, T.fecha_inicio, T.fecha_fin, T.minutos_trabajados, T.estado, U.nombre, U.apellidos, U.imagen, M_T.id AS idZona_trabajo, M_T.manzana AS zona_trabajo, M_U.manzana AS manzana_usuario FROM trabajo T INNER JOIN usuario U ON T.usuario = U.id INNER JOIN manzana M_T ON T.zona_trabajo = M_T.id INNER JOIN manzana M_U ON U.manzana = M_U.id ORDER BY T.fecha_fin'

          return await bd.consulta(self.cBD, consulta, null)

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar conseguir todos los trabajos:\n ${error} \n\n`)
        }
      },

      async get_trabajosTrabajador (idUsuario) {
        try {

          const consulta = 'SELECT T.id AS idTrabajo, T.llave, T.fecha_inicio, T.fecha_fin, T.minutos_trabajados, T.estado, U.nombre, U.apellidos, U.imagen, M_T.id AS idZona_trabajo, M_T.manzana AS zona_trabajo, M_U.manzana AS manzana_usuario FROM trabajo T INNER JOIN usuario U ON T.usuario = U.id INNER JOIN manzana M_T ON T.zona_trabajo = M_T.id INNER JOIN manzana M_U ON U.manzana = M_U.id WHERE T.usuario = ? ORDER BY T.fecha_fin'

          return await bd.consulta(self.cBD, consulta, [idUsuario])

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar conseguir todos los trabajos:\n ${error} \n\n`)
        }
      },

      async get_trabajosZonaTrabajo (idZonaTrabajo) {
        try {

          const consulta = 'SELECT T.id AS idTrabajo, T.llave, T.fecha_inicio, T.fecha_fin, T.minutos_trabajados, T.estado, U.nombre, U.apellidos, U.imagen, M_T.id AS idZona_trabajo, M_T.manzana AS zona_trabajo, M_U.manzana AS manzana_usuario FROM trabajo T INNER JOIN usuario U ON T.usuario = U.id INNER JOIN manzana M_T ON T.zona_trabajo = M_T.id INNER JOIN manzana M_U ON U.manzana = M_U.id WHERE T.zona_trabajo = ? ORDER BY T.fecha_fin'

          return await bd.consulta(self.cBD, consulta, [idZonaTrabajo])

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar conseguir todos los trabajos:\n ${error} \n\n`)
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
          const datos = [idUsuario, 'Lecturista']

          const _usuarioID = await bd.consulta(self.cBD, consulta, datos)

          if (!_usuarioID.filas.length) {
            self.errores.usuario.push('No existe el lecturista en la base de datos; asegurate de seleccionar un usuario lecturista idóneo para el trabajo')
          }

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar validar si el lecturista seleccionado existe en nuestra base de datos:\n ${error} \n\n`)
        }
      },

      async val_usuarioUnico (idUsuario, lecturista) {
        try {

          const consulta = 'SELECT id FROM trabajo WHERE usuario = ?'
          const datos = [idUsuario]

          const _usuarioID = await bd.consulta(self.cBD, consulta, datos)

          if (_usuarioID.filas.length) {
            self.errores.usuario.push(`El lecturista "${lecturista}" ya cuenta con un trabajo; solo se permite un trabajo por lecturista`)
          }

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar validar si el lecturista seleccionado existe en nuestra base de datos:\n ${error} \n\n`)
        }
      },

      async val_zonaTrabajoExiste (idManzana) {
        try {

          const consulta = 'SELECT id FROM manzana WHERE id = ?'
          const datos = [idManzana]

          const _manzanaID = await bd.consulta(self.cBD, consulta, datos)
          if (!_manzanaID.filas.length) {
            self.errores.zona_trabajo.push('No existe la manzana (Zona de trabajo) en la base de datos; asegurate de seleccionar una manzana existente')
          }

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar validar si la zona de trabajo seleccionada existe en nuestra base de datos:\n ${error} \n\n`)
        }
      },

      async val_llaveUnica (llave, estado, id = 0) {
        try {
          let consulta = null
          let datos = null

          switch (estado) {
            case 'crear':
              consulta = 'SELECT id FROM trabajo WHERE llave = ?'
              datos = [llave]
              break
            case 'modificar':
              consulta = 'SELECT id FROM trabajo WHERE llave = ? AND id <> ?'
              datos = [llave, id]
              break
          }

          if (consulta !== null && datos !== null) {
            const _trabajoID = await bd.consulta(self.cBD, consulta, datos)

            if (_trabajoID.filas.length) {
              self.errores.llave.push(`La llave de acceso "${llave}" existe actualmente en nuestra base de datos; asegurate de cambiar esta llave de acceso por otra que no haya sido registrada en otro lecturista`)
            }
          } else console.error(`\n\nERROR: La consulta y los datos no pueden ser nulos:\n\n`)


        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar validar si la llave de acceso no esta duplicada en nuestra base de datos:\n ${error} \n\n`)
        }
      },

      async crearTrabajo (datos) {
        try {

          const consulta = 'INSERT INTO trabajo (usuario, llave, zona_trabajo, fecha_inicio, fecha_fin, minutos_trabajados, estado) VALUES(?, ?, ?, ?, ?, ?, ?)'

          return await bd.consulta(self.cBD, consulta, datos)

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar crear el trabajo:\n ${error} \n\n`)
        }
      },

      async cambiarTrabajo (datos) {
        try {

          const consulta = 'UPDATE trabajo SET llave = ?, zona_trabajo = ?, fecha_inicio = ?, fecha_fin = ?, estado = ? WHERE id = ?'

          return await bd.consulta(self.cBD, consulta, datos)

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar cambiar el trabajo:\n ${error} \n\n`)
        }
      },

      async borrarTrabajador (id) {
        try {

          const consulta = 'DELETE FROM trabajo WHERE id = ?'

          return await bd.consulta(self.cBD, consulta, [id])

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar borrar el trabajo:\n ${error} \n\n`)
        }
      }
    }
  }
}

module.exports = {ventana}
