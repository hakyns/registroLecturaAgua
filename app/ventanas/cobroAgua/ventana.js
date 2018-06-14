/**
 * @file Servidor ventana usuarios 9 de Marzo del 2018
 * @copyright Joaquin Reyes Sanchez 2018
 * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
 * @version 1.0.0
 */

const electron = require('electron')
const path = require('path')
const electronLocalshortcut = require('electron-localshortcut')

const storage = require('electron-json-storage')

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
    this.ventanaCobroAgua = new BrowserWindow({
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
    this.ventanaCobroAgua.setMenu(null)

    /**
     * @description Agregar icono a la aplicacion
     */
    this.ventanaCobroAgua.setIcon(path.join(__dirname, '../../assets/img/aplicacion/icon.ico'))

    /**
     * @description Activar DevTools del la ventana
     */
    // this.ventanaCobroAgua.webContents.openDevTools()

    /**
     * @description Conectar la vista html con esta ventana
     */
    this.ventanaCobroAgua.loadURL(conexionVistas('cobroAgua'))

    /**
     * @description Ejecutor de funciones al preparar la ventana para mostrar
     */
    this.ventanaCobroAgua.once('ready-to-show', () => {
      this.ventanaCobroAgua.show()

      /**
       * @description Ejecutor de funciones al finalizar la carga de la ventana
       */
      this.ventanaCobroAgua.webContents.on('did-finish-load', async() => {
        this.recepcionLinea()
        this.cargaDatos()
        this.entregaDatos().entregaComponentes()
        this.erroresDatos()
        this.recepcionDatos()

        this.combinacionTeclas()
      })

      this.ventanaCobroAgua.on('close', function (event) {
        ipcMain.removeAllListeners('cobroAgua_cargaRegistrosAgua')
        ipcMain.removeAllListeners('cobroAgua_cargaDesgloseAgua')
        ipcMain.removeAllListeners('cobroAgua_cargaTabla')
        ipcMain.removeAllListeners('usuario_organizacion')
        ipcMain.removeAllListeners('cobroAgua_datosCobroAgua')
        ipcMain.removeAllListeners('cobroAgua_clienteBuscar')
        ipcMain.removeAllListeners('cobroAgua_borrarRegistro')

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
      electronLocalshortcut.register(this.ventanaCobroAgua, 'Ctrl+I', () => {
        this.ventanaCobroAgua.webContents.openDevTools()
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
    var self = this

    ipcMain.on('cobroAgua_cargaRegistrosAgua', async (e, medidor) => {
      const registros = await this.consultasBD().get_registrosAgua(medidor)

      e.sender.send('cobroAgua_entregaRegistrosAgua', registros)
    })

    ipcMain.on('cobroAgua_cargaDesgloseAgua', async (e, datos) => {
      storage.get('Trabajador', async (err, Trabajador) => {
        if (err) throw err

        const desglose = await self.consultasBD().get_desgloseAgua(datos)
        const tarifas = await self.consultasBD().get_tarifas()

        let cobradosAgua = {}

        for (const des of desglose.filas) {
          let cA = await self.consultasBD().get_cobradosAgua(des.idRegistroAgua)
          if (cA.filas.length) cobradosAgua[des.idRegistroAgua] = cA.filas
        }

        e.sender.send('cobroAgua_entregaDesgloseAgua', {desglose, Trabajador, tarifas, cobradosAgua})
      })
    })

    ipcMain.on('cobroAgua_cargaTabla', async (e, datos) => {
      const cobrosAgua = await this.consultasBD().get_todosCobrosAgua()

      e.sender.send('cobroAgua_entregaTabla', cobrosAgua)
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
        storage.get('Trabajador', async (err, Trabajador) => {
          if (err) throw err

          const clientes = await self.consultasBD().get_clientes(Trabajador.idZonaTrabajo)
          self.ventanaCobroAgua.webContents.send('cobroAgua_entregaComponentes', {clientes})
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
      registro_agua: [],
      desglose_pagos: [],
      dinero_total: [],
      dinero_recibido: [],
      dinero_cambio: []
    }
  }

/**
 * @method
 * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
 * @returns {null}
 * @description Función que resetea todos los errores de los componentes del modelo usuario
 */
  limpiarErrores () {
    this.errores.registro_agua = []
    this.errores.desglose_pagos = []
    this.errores.dinero_total = []
    this.errores.dinero_recibido = []
    this.errores.dinero_cambio = []
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
    ipcMain.on('cobroAgua_datosCobroAgua', (e, json) => {

/**
 * @description Inicia el proceso de validación basica
 */
      this.limpiarErrores()
      let err = null

      new Promise (resolve => {
        err = validar.valNumbers('bigger', json.dinero_total, 1, 'No se ha generado el total a pagar, no se puede continuar')
        if (err !== null) this.errores.dinero_total.push(err)

        err = validar.valNumbers('bigger', json.desglose_pagos.length, 1, 'No se ha generado el desglose de pagos, no se puede continuar')
        if (err !== null) this.errores.desglose_pagos.push(err)

        err = validar.valNumbers('bigger', json.dinero_recibido, 1, 'Dinero insuficiente, es necesario agregar un valor monetario')
        if (err !== null) this.errores.dinero_recibido.push(err)

        err = validar.valNumbers('bigger', json.dinero_cambio, 0, 'Dinero insuficiente, es necesario pagar toda la totalidad del consumo de agua')
        if (err !== null) this.errores.dinero_cambio.push(err)

        resolve()
      })
        .then(async () => {
          if (this.errores.dinero_cambio.length || this.errores.dinero_recibido.length || this.errores.dinero_total.length || this.errores.desglose_pagos.length) {
            e.sender.send('cobroAgua_errores', this.errores)
          } else {
            this.limpiarErrores()

            new Promise (async resolve => {
              for (const desglose of json.desglose_pagos) {
                await this.consultasBD().val_registroAguaExiste(desglose.registroAgua)
                await this.consultasBD().val_registroAguaUnica(desglose.registroAgua)
              }
              resolve()
            })
              .then(() => {
                if (this.errores.desglose_pagos.length) {
                  e.sender.send('cobroAgua_errores', this.errores)
                } else {
                  let dineroRecibido = json.dinero_recibido

                  new Promise (async resolve => {
                    let contador = 0

                    let fechaCobro = new Date()
                    for (const desglose of json.desglose_pagos) {
                      let fechaSumada = fechaCobro.setSeconds(fechaCobro.getSeconds() + contador)

                      let desglosePagos = []
                      for(let i = 0; i < json.desglose_pagos.length; i++) {
                        desglosePagos.push(json.desglose_pagos[i])
                        desglosePagos[i].fechaCobro = fechaSumada
                      }

                      let datos = [
                        desglose.registroAgua,
                        desglosePagos,
                        parseFloat(desglose.pagoAgua),
                        dineroRecibido,
                        (parseFloat(dineroRecibido) - parseFloat(desglose.pagoAgua)).toFixed(2),
                        new Date(fechaSumada).toISOString().slice(0, 19).replace('T', ' '),
                        desglose.pagoConjunto.length > 1 ? desglose.pagoConjunto.join(',') : null
                      ]

                      dineroRecibido = datos[4]

                      // NO HABRÁ SWITCH DEBIDO A LA ESTRUCTURA DE BUCLE
                      let _CobroAguaCrear = await this.consultasBD().crearCobroAgua(datos)

                      if (_CobroAguaCrear.filas.insertId) contador++
                    }

                    resolve(contador)
                  })
                    .then(contador => {
                      if (contador === json.desglose_pagos.length) {
                        this.funcionesGrabadas().Crear_MensajeExitoso(e, json.desglose_pagos)
                      }
                    })
                }
              })
          }
        })

    })

/**
 * @description Borrar registro cobro agua
 */
    ipcMain.on('cobroAgua_borrarRegistro', async (e, dato) => {
      let _CobroAguaBorrar = await this.consultasBD().borrarCobroAgua(dato.idCobroAgua)

      if (_CobroAguaBorrar.filas.affectedRows) {
        this.funcionesGrabadas().Borrar_MensajeExitoso(e, dato)
      }
    })

/**
 * @description Recepción de datos del input buscar [Nombre y Apellidos] de la tarjeta de funciones ubicado debajo de la tabla en el tab buscar
 */
    ipcMain.on('cobroAgua_clienteBuscar', async (e, dato) => {
      if (dato) {
        const tabla = await this.consultasBD().get_todosCobrosAgua_cliente(dato)

        e.sender.send('cobroAgua_entregaTabla', tabla)
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
        let fechas = dato.map(reg => `<li>${reg.fechaRegistro}</li>`)
        e.sender.send('cobroAgua_respuesta', {errores: self.errores, mensaje: `Se han creado el cobro de agua para las fechas: <br> <ul>${fechas.join('')}</ul>`})
      },

      Borrar_MensajeExitoso (e, dato) {
        e.sender.send('cobroA_respuestaBorrarRegistro', {mensaje: `Se ha borrado el folio ${dato.registro_agua} perteneciente al cliente ${dato.nombre} ${dato.apellidos}`})
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
      async get_clientes (manzana) {
        try {
          const consulta = `
              SELECT RA.medidor, U.nombre, U.apellidos, U.imagen, MA.manzana
              FROM registro_agua RA
              INNER JOIN medidores M ON RA.medidor = M.id
              INNER JOIN usuario U ON M.usuario = U.id
              INNER JOIN manzana MA ON U.manzana = MA.id
              WHERE U.manzana = ?
              GROUP BY RA.medidor
              ORDER BY U.apellidos
          `

          return await bd.consulta(self.cBD, consulta, [manzana])

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar conseguir todos los clientes disponibles:\n ${error} \n\n`)
        }
      },

      async get_registrosAgua (medidor) {
        try {
          const consulta = `
             SELECT fecha_cambio AS fechaRegistro
             FROM registro_agua
             WHERE medidor = ? AND id NOT IN (SELECT registro_agua FROM cobro_agua)
             ORDER BY fecha_cambio DESC
          `

          return await bd.consulta(self.cBD, consulta, [medidor])

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar conseguir todos los registros de agua del medidor seleccionado:\n ${error} \n\n`)
        }
      },

      async get_desgloseAgua (datos) {
        try {
          const consulta = `
             SELECT RA.id AS idRegistroAgua, RA.fecha_cambio, RA.lectura, U.nombre, U.apellidos
             FROM registro_agua RA
             INNER JOIN medidores M ON RA.medidor = M.id
             INNER JOIN usuario U ON M.usuario = U.id
             WHERE RA.fecha_cambio <= ? AND RA.medidor = ?
             ORDER BY RA.fecha_cambio ASC
          `
          // const consulta = `
          //    SELECT RA.id AS idRegistroAgua, RA.fecha_cambio, RA.lectura, U.nombre, U.apellidos
          //    FROM registro_agua RA
          //    INNER JOIN medidores M ON RA.medidor = M.id
          //    INNER JOIN usuario U ON M.usuario = U.id
          //    WHERE RA.fecha_cambio <= ? AND RA.medidor = ? AND RA.id NOT IN (SELECT registro_agua FROM cobro_agua)
          //    ORDER BY RA.fecha_cambio ASC
          // `

          return await bd.consulta(self.cBD, consulta, [datos.fechaRegistro, datos.medidor])

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar conseguir todos los registros anteriores a la fecha de registro seleccionado:\n ${error} \n\n`)
        }
      },

      async get_tarifas () {
        try {
          const consulta = `
             SELECT id AS idTarifa, rango_minimo, rango_maximo, tarifa, fija_incrementada AS tipoTarifa FROM tarifas
          `

          return await bd.consulta(self.cBD, consulta, null)

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar conseguir las tarifas:\n ${error} \n\n`)
        }
      },

      async get_cobradosAgua (registroAgua) {
        try {
          const consulta = `
             SELECT registro_agua AS idRegistroAguaCobrado, dinero_total, dinero_recibido, dinero_cambio, fecha_cobro
             FROM cobro_agua
             WHERE registro_agua = ?
          `

          return await bd.consulta(self.cBD, consulta, [registroAgua])

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar conseguir los registros pagados:\n ${error} \n\n`)
        }
      },

      async get_todosCobrosAgua () {
        try {
          const consulta = `
             SELECT CA.id AS idCobroAgua, CA.registro_agua, CA.desglose_pagos, CA.dinero_total, CA.dinero_recibido, CA.dinero_cambio, CA.fecha_cobro, CA.pago_conjunto, U.nombre, U.apellidos, U.imagen, MA.manzana
             FROM cobro_agua CA
             INNER JOIN registro_agua RA ON CA.registro_agua = RA.id
             INNER JOIN medidores M ON RA.medidor = M.id
             INNER JOIN usuario U ON M.usuario = U.id
             INNER JOIN manzana MA ON U.manzana = MA.id
             ORDER BY U.apellidos ASC, RA.lectura DESC
          `

          return await bd.consulta(self.cBD, consulta, null)

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar conseguir los cobros de agua:\n ${error} \n\n`)
        }
      },

      async get_todosCobrosAgua_cliente (cliente) {
        try {
          const consulta = `
             SELECT CA.id AS idCobroAgua, CA.registro_agua, CA.desglose_pagos, CA.dinero_total, CA.dinero_recibido, CA.dinero_cambio, CA.fecha_cobro, CA.pago_conjunto, U.nombre, U.apellidos, U.imagen, MA.manzana
             FROM cobro_agua CA
             INNER JOIN registro_agua RA ON CA.registro_agua = RA.id
             INNER JOIN medidores M ON RA.medidor = M.id
             INNER JOIN usuario U ON M.usuario = U.id
             INNER JOIN manzana MA ON U.manzana = MA.id
             WHERE M.id = ?
             ORDER BY CA.fecha_cobro DESC, CA.pago_conjunto ASC
          `

          return await bd.consulta(self.cBD, consulta, [cliente])

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar conseguir los cobros de agua:\n ${error} \n\n`)
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

      async val_registroAguaExiste (registro) {
        try {

          const consulta = 'SELECT id FROM registro_agua WHERE id = ?'
          const datos = [registro]

          const _registroAguaID = await bd.consulta(self.cBD, consulta, datos)

          if (!_registroAguaID.filas.length) {
            self.errores.desglose_pagos.push(`El folio ${registro} perteneciente al registro de agua no se logra encontrar la base de datos`)
          }

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar validar si el registro de agua con id ${registro} se encuentra dentro de la base de datos:\n ${error} \n\n`)
        }
      },

      async val_registroAguaUnica (registro) {
        try {

          const consulta = 'SELECT id FROM cobro_agua WHERE registro_agua = ?'
          const datos = [registro]

          const _registroAguaID = await bd.consulta(self.cBD, consulta, datos)

          if (_registroAguaID.filas.length) {
            self.errores.desglose_pagos.push(`El folio ${registro} perteneciente al registro de agua ya ha sido pagado por lo que no se puede volver a pagar`)
          }

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar validar si el registro de agua con id ${registro} ya se ha pagado:\n ${error} \n\n`)
        }
      },

      async crearCobroAgua (datos) {
        try {

          const consulta = 'INSERT INTO cobro_agua (registro_agua, desglose_pagos, dinero_total, dinero_recibido, dinero_cambio, fecha_cobro, pago_conjunto) VALUES(?, ?, ?, ?, ?, ?, ?)'

          return await bd.consulta(self.cBD, consulta, datos)

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar crear el cobro de agua:\n ${error} \n\n`)
        }
      },

      async borrarCobroAgua (id) {
        try {

          const consulta = 'DELETE FROM cobro_agua WHERE id = ?'

          return await bd.consulta(self.cBD, consulta, [id])

        } catch (error) {
          console.error(`\n\nERROR: Se ha presentado un error al intentar borrar el registro de cobro de agua:\n ${error} \n\n`)
        }
      }
    }
  }
}

module.exports = {ventana}
