/**
 * @file Servidor ventana usuarios 9 de Marzo del 2018
 * @copyright Joaquin Reyes Sanchez 2018
 * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
 * @version 1.0.0
 */

const electron = require('electron')
const electronLocalshortcut = require('electron-localshortcut')

const storage = require('electron-json-storage')

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
    this.ventanaUsuarios = new BrowserWindow({
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
    this.ventanaUsuarios.setMenu(null)

    /**
     * @description Agregar icono a la aplicacion
     */
    this.ventanaUsuarios.setIcon(path.join(__dirname, '../../assets/img/aplicacion/icon.ico'))

    /**
     * @description Activar DevTools del la ventana
     */
    // this.ventanaUsuarios.webContents.openDevTools()

    /**
     * @description Conectar la vista html con esta ventana
     */
    this.ventanaUsuarios.loadURL(conexionVistas('usuarios'))

    /**
     * @description Ejecutor de funciones al preparar la ventana para mostrar
     */
    this.ventanaUsuarios.once('ready-to-show', () => {
      this.ventanaUsuarios.show()

      /**
       * @description Ejecutor de funciones al finalizar la carga de la ventana
       */
      this.ventanaUsuarios.webContents.on('did-finish-load', async() => {
        this.recepcionLinea()
        this.cargaDatos()
        this.entregaDatos().entregaComponentes()
        this.erroresDatos()
        this.recepcionDatos()

        this.combinacionTeclas()
      })

      this.ventanaUsuarios.on('close', function (event) {
        ipcMain.removeAllListeners('usuario_cargaTabla')
        ipcMain.removeAllListeners('usuario_organizacion')
        ipcMain.removeAllListeners('usuario_datosUsuario')
        ipcMain.removeAllListeners('usuario_datosInputBuscar')
        ipcMain.removeAllListeners('usuario_datosUsuarioTipoBuscar')
        ipcMain.removeAllListeners('usuario_datosManzanaBuscar')
        ipcMain.removeAllListeners('usuarios_borrarRegistro')
        ipcMain.removeAllListeners('usuario_enviarALogin')

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
      electronLocalshortcut.register(this.ventanaUsuarios, 'Ctrl+I', () => {
        this.ventanaUsuarios.webContents.openDevTools()
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
    ipcMain.on('usuario_cargaTabla', async (e, datos) => {
      const usuarios = await this.consultasBD().get_todosUsuarios()

      e.sender.send('usuario_entregaTabla', usuarios)
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
        const manzanas = await self.consultasBD().get_todasManzanas()
        const usuarioTipo = await self.consultasBD().get_todosTiposUsuario()

        self.ventanaUsuarios.webContents.send('usuario_entregaComponentes', {manzanas,usuarioTipo})
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
      apellidos: [],
      notas: [],
      usuario_tipo: [],
      manzana: [],
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
    this.errores.apellidos = []
    this.errores.notas = []
    this.errores.usuario_tipo = []
    this.errores.manzana = []
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
    ipcMain.on('usuario_datosUsuario', (e, json) => {
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
        json.apellidos = tratar.treatTrimSizeCharacters(json.apellidos, 'lowerCase')
        json.notas = tratar.treatTrimSizeCharacters(json.notas, 'capitalize')

        resolve()
      })
        .then(() => {
/**
 * @description Inicia el proceso de validación basica
 */
          this.limpiarErrores()
          let err = null

          const validacionBasica = new Promise (resolve => {
            err = validar.valBasicMain(json.nombre, 'text', 4, 20)
            if (err !== null) this.errores.nombre.push(err)

            err = validar.valBasicMain(json.apellidos, 'text', 4, 25)
            if (err !== null) this.errores.apellidos.push(err)

            err = validar.valBasicEmptyFull(json.notas, 'text', 4, 120)
            if (err !== null) this.errores.notas.push(err)

            err = validar.valNumbers('bigger', json.usuario_tipo, 1, 'Debes de escoger una opción')
            if (err !== null) this.errores.usuario_tipo.push(err)

            err = validar.valNumbers('bigger', json.manzana, 1, 'Debes de escoger una opción')
            if (err !== null) this.errores.manzana.push(err)

            err = validar.valBasicEmptyFull(json.imagen.name, 'text', 2, 150)
            if (err !== null) this.errores.imagen.push(err)

            resolve()
          })
            .then(() => {
              if (this.errores.nombre.length || this.errores.apellidos.length || this.errores.notas.length || this.errores.usuario_tipo.length || this.errores.manzana.length || this.errores.imagen.length) {
                e.sender.send('usuario_errores', this.errores)
              } else {
/**
 * @description Inicia el proceso de validación base de datos
 */
                const validacionBaseDatos = new Promise (async resolve => {
                  if (typeof (json.rutaImagen) === 'string') {
                    this.limpiarErrores()

                    await this.consultasBD().val_imagenUnica(json.rutaImagen)

                    resolve()
                  } else resolve()
                })
                  .then(async () => {
/**
 * @description Inicia el proceso de subida, actualización o eliminacion base de datos
 */
                    if (this.errores.imagen.length) {
                      e.sender.send('usuario_errores', this.errores)
                    } else {
                      const datos = [
                        json.nombre,
                        json.apellidos,
                        json.notas ? json.notas : null,
                        json.rutaImagen ? json.rutaImagen : null,
                        json.usuario_tipo,
                        json.manzana
                      ]
/**
 * @description Desviación del flujo de estado de los datos sensibles
 */
                      switch (json.ESTADO) {
                        case 'crear':
                          const _UsuarioCrear = await this.consultasBD().crearUsuario(datos)

                          if (_UsuarioCrear.filas.insertId) {
                            if (typeof (json.rutaImagen) === 'string') {
/**
 * @name Crear
 * @description Se ejecuta cuando el usuario va a subir una imagen
 */
                              new Promise (async resolve => {
                                resolve(await this.consultasBD().get_manzana(json.manzana))
                              })
                                .then(manzana => {
                                  const directorio = [
                                    this.funcionesGrabadas().Global_DirectorioImagen(manzana.filas[0].manzana),
                                    this.funcionesGrabadas().Global_DirectorioImagen(manzana.filas[0].manzana, json.rutaImagen)
                                  ]

                                  fs.mkdir(directorio[0], () => {
                                    fs.copy(json.imagen.path, directorio[1], err => {
                                      if (err) console.error('ERROR: No se pudo guardar la imagen')

                                      this.funcionesGrabadas().Crear_MensajeExitoso(e, json)
                                    })
                                  })
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
                          datos.push(json.viajeTiempo.idUsuario)

                          if (json.viajeTiempo.imagen !== null && datos[3] === null && !json.viajeTiempo.eliminarImagen) datos[3] = json.viajeTiempo.imagen

                          let _UsuarioCambiar = await this.consultasBD().cambiarUsuario(datos)

                          if (_UsuarioCambiar.filas.affectedRows === 1) {
                            if (typeof (json.rutaImagen) === 'string') {
/**
 * @name Cambiar
 * @description Se ejecuta cuando el usuario desea realizar cambios en su imagen
 */
                              if (json.viajeTiempo.imagen !== null) {
/**
 * @name Cambiar
 * @description Se ejecuta cuando el usuario cuenta con una imagen en la base de datos y requiere ahora una actualizacion; primero eliminará la imagen viejita para posterior intentar agregar la imagen nueva
 */
                                const directorioViejo = this.funcionesGrabadas().Global_DirectorioImagen(json.viajeTiempo.manzana, json.viajeTiempo.imagen)

                                fsN.unlink(directorioViejo, err => {
                                  if (err) console.error('ERROR: No se pudo eliminar la imagen vieja' +  err)

                                  new Promise (async resolve => {
                                    resolve(await this.consultasBD().get_manzana(json.manzana))
                                  })
                                    .then(manzana => {
                                      const directorioNuevo = [
                                        this.funcionesGrabadas().Global_DirectorioImagen(manzana.filas[0].manzana),
                                        this.funcionesGrabadas().Global_DirectorioImagen(manzana.filas[0].manzana, json.rutaImagen)
                                      ]

                                      fs.mkdir(directorioNuevo[0], () => {
                                        fs.copy(json.imagen.path, directorioNuevo[1], err => {
                                          if (err) console.error('ERROR: No se pudo guardar la imagen')

                                          this.funcionesGrabadas().Cambiar_MensajeExitoso(e, json)
                                        })
                                      })
                                    })
                                })
                              } else {
/**
 * @name Cambiar
 * @description Se ejecuta cuando el usuario requiere por primera vez una imagen en la base de datos
 */
                                new Promise (async resolve => {
                                  resolve(await this.consultasBD().get_manzana(json.manzana))
                                })
                                  .then(manzana => {
                                    const directorioNuevo = [
                                      this.funcionesGrabadas().Global_DirectorioImagen(manzana.filas[0].manzana),
                                      this.funcionesGrabadas().Global_DirectorioImagen(manzana.filas[0].manzana, json.rutaImagen)
                                    ]

                                    fs.mkdir(directorioNuevo[0], () => {
                                      fs.copy(json.imagen.path, directorioNuevo[1], err => {
                                        if (err) console.error('ERROR: No se pudo guardar la imagen')

                                        this.funcionesGrabadas().Cambiar_MensajeExitoso(e, json)
                                      })
                                    })
                                  })
                              }
                            } else {
/**
 * @name Cambiar
 * @description Se ejecuta cuando el usuario no desea subir o actualizar su imagen
 */
                              new Promise (async resolve => {
                                resolve(await this.consultasBD().get_manzanaUsuario(json.viajeTiempo.idUsuario))
                              })
                                .then(manzana => {
                                  if (json.viajeTiempo.manzana !== manzana.filas[0].manzana) {
/**
 * @name Cambiar
 * @description Se ejecuta cuando el usuario realiza un cambio en el campo manzana, originando que su imagen (si es que tiene una ya en base de datos) se desvincule; por lo que será necesario mover su imagen al nuevo directorio
 */
                                    const directorioMovimiento = [
                                      this.funcionesGrabadas().Global_DirectorioImagen(manzana.filas[0].manzana),
                                      this.funcionesGrabadas().Global_DirectorioImagen(json.viajeTiempo.manzana, json.viajeTiempo.imagen),
                                      this.funcionesGrabadas().Global_DirectorioImagen(manzana.filas[0].manzana, json.viajeTiempo.imagen)
                                    ]

                                    fs.mkdir(directorioMovimiento[0], () => {
                                      fsN.rename(directorioMovimiento[1], directorioMovimiento[2], err => {
                                        if (err) console.error('ERROR: No se pudo eliminar la imagen vieja ' +  err)

                                        this.funcionesGrabadas().Cambiar_MensajeExitoso(e, json)
                                      })
                                    })
                                  } else if (json.viajeTiempo.eliminarImagen) {
/**
 * @name Cambiar
 * @description Se ejecuta cuando el usuario realiza la petición de eliminar su imagen ya subida a la base de datos
 */
                                    const directorioViejo = this.funcionesGrabadas().Global_DirectorioImagen(json.viajeTiempo.manzana, json.viajeTiempo.imagen)

                                    fsN.unlink(directorioViejo, err => {
                                      if (err) console.error('ERROR: No se pudo eliminar la imagen vieja ' +  err)

                                      this.funcionesGrabadas().Cambiar_MensajeExitoso(e, json)
                                    })
                                  } else {
/**
 * @name Cambiar
 * @description Se ejecuta cuando el usuario no actualizo el campo manzana ni tampoco cuando no requiere una imagen nueva o actualizada
 */
                                    this.funcionesGrabadas().Cambiar_MensajeExitoso(e, json)
                                  }
                                })
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
 * @description Recepción de datos del input buscar [Nombre y Apellidos] de la tarjeta de funciones ubicado debajo de la tabla en el tab buscar
 */
    ipcMain.on('usuario_datosInputBuscar', async (e, dato) => {
      if (dato) {
        const tabla = await this.consultasBD().get_usuarios_nombreApellidos(dato)

        e.sender.send('usuario_entregaTabla', tabla)
      }
    })

/**
 * @description Recepción de datos del input buscar [Usuario_Tipo] de la tarjeta de funciones ubicado debajo de la tabla en el tab buscar
 */
    ipcMain.on('usuario_datosUsuarioTipoBuscar', async (e, dato) => {
      if (dato) {
        const tabla = await this.consultasBD().get_usuarios_usuarioTipo(dato)

        e.sender.send('usuario_entregaTabla', tabla)
      }
    })

/**
 * @description Recepción de datos del input buscar [Manzana] de la tarjeta de funciones ubicado debajo de la tabla en el tab buscar
 */
    ipcMain.on('usuario_datosManzanaBuscar', async (e, dato) => {
      if (dato) {
        const tabla = await this.consultasBD().get_usuarios_manzana(dato)

        e.sender.send('usuario_entregaTabla', tabla)
      }
    })

  /**
 * @description Borrar registro cobro agua
 */
    ipcMain.on('usuarios_borrarRegistro', async (e, dato) => {
      // Borrar primero la imagen
      let datosUsuario = await this.consultasBD().get_usuarioDatos(dato.idUsuario)

      if (datosUsuario.filas[0].imagen) {
        let directorio = path.join(__dirname, '../../assets/img/usuarios/', datosUsuario.filas[0].manzanaNombre, datosUsuario.filas[0].imagen)

        let self = this

        fsN.unlink(directorio, async err => {
          if (err) throw err

          let _UsuarioBorrar = await self.consultasBD().borrarUsuario(dato.idUsuario)

          if (_UsuarioBorrar.filas.affectedRows) {
            this.funcionesGrabadas().Borrar_MensajeExitoso(e, dato)
          }
        })
      } else {
        let _UsuarioBorrar = await this.consultasBD().borrarUsuario(dato.idUsuario)

        if (_UsuarioBorrar.filas.affectedRows) {
          this.funcionesGrabadas().Borrar_MensajeExitoso(e, dato)
        }
      }
    })

  /**
 * @description Enviar al Login
 */
    ipcMain.on('usuario_enviarALogin', async (e, dato) => {
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
        e.sender.send('usuario_respuesta', {errores: self.errores,mensaje: `Se ha creado el usuario ${dato.nombre} ${dato.apellidos}`})
      },

      Cambiar_MensajeExitoso (e, dato) {
        e.sender.send('usuario_respuesta', {errores: self.errores,mensaje: `Se ha cambiado el usuario ${dato.nombre} ${dato.apellidos}`})
      },

      Borrar_MensajeExitoso (e, dato) {
        storage.get('Trabajador', async (err, trabajador) => {
          if (err) throw err

          e.sender.send('usuarios_respuestaBorrarRegistro', {trabajador: trabajador, mensaje: `
          ${dato.idUsuario === trabajador.idTrabajador ? `<h5>Se cerrará el sistema para terminar este proceso de borrado del usuario con folio ${dato.idUsuario}, vuelve a ingresar ... ... ;)</h5> <br>` : `Se ha borrado todo el registro del usuario con folio ${dato.idUsuario} <br>`}
            <ul>
              <li><b>Cliente:</b> ${dato.nombre} ${dato.apellidos}</li>
              <li><b>Manzana:</b> ${dato.manzana}</li>
              <li><b>Tipo de Usuario:</b> ${dato.usuario_tipo}</li>
              <li><b>Notas del Usuario:</b> ${dato.notas ? dato.notas : 'No hay notas'}</li>
            </ul>
          `})
        })
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
      async get_manzana (id) {
        try {
          const consulta = 'SELECT manzana FROM manzana WHERE id = ?'
          const datos = [id]

          return await bd.consulta(self.cBD, consulta, datos)

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar conseguir el valor de la manzana:\n ${error} \n\n`)
        }
      },

      async get_todasManzanas () {
        try {

          const consulta = 'SELECT id, manzana FROM manzana ORDER BY manzana'

          return await bd.consulta(self.cBD, consulta, null)

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar conseguir todas las manzanas:\n ${error} \n\n`)
        }
      },

      async get_todosTiposUsuario () {
        try {

          const consulta = 'SELECT id, tipo FROM usuario_tipo ORDER BY tipo'

          return await bd.consulta(self.cBD, consulta, null)

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar conseguir todos los tipos de usuario:\n ${error} \n\n`)
        }
      },

      async get_basicosUsuario (id) {
        try {

          const consulta = 'SELECT id, nombre, apellidos FROM usuario WHERE id = ?'
          const datos = [id]

          return await bd.consulta(self.cBD, consulta, datos)

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar conseguir los datos del usuario:\n ${error} \n\n`)
        }
      },

      async get_manzanaUsuario (usuario) {
        try {

          const consulta = 'SELECT M.manzana FROM usuario U INNER JOIN manzana M ON U.manzana = M.id WHERE U.id = ?'
          const datos = [usuario]

          return await bd.consulta(self.cBD, consulta, datos)

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar conseguir la manzana del usuario:\n ${error} \n\n`)
        }
      },

      async get_todosUsuarios () {
        try {

          const consulta = 'SELECT U.id AS idUsuario, U.nombre, U.apellidos, M.id AS idManzana, M.manzana, UT.id AS idUsuario_tipo, UT.tipo AS usuario_tipo, U.notas, U.imagen, U.creado, U.actualizado FROM usuario U INNER JOIN manzana M ON U.manzana = M.id INNER JOIN usuario_tipo UT ON U.usuario_tipo = UT.id ORDER BY actualizado DESC'

          return await bd.consulta(self.cBD, consulta, null)

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar conseguir todos los usuarios:\n ${error} \n\n`)
        }
      },

      async get_usuarios_nombreApellidos (nombreApellidos) {
        try {
          // const consulta = 'SELECT U.id, U.nombre, U.apellidos, M.manzana, UT.tipo, U.notas, U.imagen, U.creado, U.actualizado FROM usuario U INNER JOIN manzana M ON U.manzana = M.id INNER JOIN usuario_tipo UT ON U.usuario_tipo = UT.id WHERE U.nombre LIKE ? OR U.apellidos LIKE ? ORDER BY actualizado DESC'
          // const datos = ['%'+ nombreApellidos + '%', '%'+ nombreApellidos + '%']
          const consulta = 'SELECT U.id AS idUsuario, U.nombre, U.apellidos, M.id AS idManzana, M.manzana, UT.id AS idUsuario_tipo, UT.tipo AS usuario_tipo, U.notas, U.imagen, U.creado, U.actualizado FROM usuario U INNER JOIN manzana M ON U.manzana = M.id INNER JOIN usuario_tipo UT ON U.usuario_tipo = UT.id WHERE MATCH(U.nombre, U.apellidos) AGAINST(?) ORDER BY actualizado DESC'
          const datos = [nombreApellidos]

          return await bd.consulta(self.cBD, consulta, datos)

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar conseguir todos los usuarios:\n ${error} \n\n`)
        }
      },

      async get_usuarios_usuarioTipo (usuarioTipo) {
        try {
          const consulta = 'SELECT U.id AS idUsuario, U.nombre, U.apellidos, M.id AS idManzana, M.manzana, UT.id AS idUsuario_tipo, UT.tipo AS usuario_tipo, U.notas, U.imagen, U.creado, U.actualizado FROM usuario U INNER JOIN manzana M ON U.manzana = M.id INNER JOIN usuario_tipo UT ON U.usuario_tipo = UT.id WHERE U.usuario_tipo = ? ORDER BY actualizado DESC'
          const datos = [usuarioTipo]

          return await bd.consulta(self.cBD, consulta, datos)

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar conseguir todos los usuarios:\n ${error} \n\n`)
        }
      },

      async get_usuarios_manzana (manzana) {
        try {
          const consulta = 'SELECT U.id AS idUsuario, U.nombre, U.apellidos, M.id AS idManzana, M.manzana, UT.id AS idUsuario_tipo, UT.tipo AS usuario_tipo, U.notas, U.imagen, U.creado, U.actualizado FROM usuario U INNER JOIN manzana M ON U.manzana = M.id INNER JOIN usuario_tipo UT ON U.usuario_tipo = UT.id WHERE U.manzana = ? ORDER BY actualizado DESC'
          const datos = [manzana]

          return await bd.consulta(self.cBD, consulta, datos)

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar conseguir todos los usuarios:\n ${error} \n\n`)
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

      async get_usuarioDatos (id) {
        try {
          const consulta = 'SELECT U.id, U.nombre, U.apellidos, U.usuario_tipo, U.manzana, U.notas, U.imagen, U.creado, U.actualizado, M.manzana AS manzanaNombre FROM usuario U INNER JOIN manzana M ON U.manzana = M.id WHERE U.id = ?'

          return await bd.consulta(self.cBD, consulta, [id])

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar conseguir los datos del usuario:\n ${error} \n\n`)
        }
      },

      async val_imagenUnica (imagen) {
        try {

          const consulta = 'SELECT id FROM usuario WHERE imagen = ?'
          const datos = [imagen]

          const _imagenID = await bd.consulta(self.cBD, consulta, datos)

          if (_imagenID.filas.length) {
            self.errores.imagen.push('Existe otra imagen igual a la que intentas registrar')
          }

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar validar si la imagen ${imagen} ya se encuentra dentro de la base de datos:\n ${error} \n\n`)
        }
      },

      async crearUsuario (datos) {
        try {

          const consulta = 'INSERT INTO usuario (nombre, apellidos, notas, imagen, usuario_tipo, manzana, creado, actualizado) VALUES(?, ?, ?, ?, ?, ?, NOW(), NOW())'

          return await bd.consulta(self.cBD, consulta, datos)

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar crear el usuario:\n ${error} \n\n`)
        }
      },

      async cambiarUsuario (datos) {
        try {

          const consulta = 'UPDATE usuario SET nombre = ?, apellidos = ?, notas = ?, imagen = ?, usuario_tipo = ?, manzana = ?, actualizado = NOW() WHERE id = ?'

          return await bd.consulta(self.cBD, consulta, datos)

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar cambiar el usuario:\n ${error} \n\n`)
        }
      },

      async borrarUsuario (id) {
        try {

          const consulta = 'DELETE FROM usuario WHERE id = ?'

          return await bd.consulta(self.cBD, consulta, [id])

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar borrar el usuario:\n ${error} \n\n`)
        }
      }
    }
  }
}

module.exports = {ventana}
