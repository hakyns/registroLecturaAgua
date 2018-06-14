const electron = require('electron')
const path = require('path')
const storage = require('electron-json-storage')
const conexionVistas = require('../../tools/vista')

const {app, BrowserWindow, ipcMain} = electron

class ventana {
  constructor (conexionBD, lineas) {
    this.cBD = conexionBD
    this.lineasEventBus = lineas

    this.ventanaPrincipal = new BrowserWindow({
      // fullscreen: true,
      backgroundColor: '#e3f2fd',
      resizable: false,
      show: false
    })

    this.ventanaPrincipal.on('closed', () => {
      storage.remove('Trabajador', err => {
        if (err) throw err
        app.quit()
      })
    })

    this.ventanaPrincipal.loadURL(conexionVistas('principal'))

    /**
     * @description Eliminar la barra de menus de la ventana
     */
    this.ventanaPrincipal.setMenu(null)

    /**
     * @description Agregar icono a la aplicacion
     */
    this.ventanaPrincipal.setIcon(path.join(__dirname, '../../assets/img/aplicacion/icon.ico'))

    /**
     * @description Activar DevTools del la ventana
     */
    // this.ventanaPrincipal.webContents.openDevTools()

    this.ventanaPrincipal.maximize()

    this.ventanaPrincipal.once('ready-to-show', () => {
      this.ventanaPrincipal.show()
      this.recepcionLinea()
      this.recepcionDatos()
      this.entregaDatos().entregaComponentes()
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
      case 'usuarios_crearVentana':
        this.lineasEventBus.emit('principal-usuarios_crearVentana')
        break
      case 'tiposUsuarios_crearVentana':
        this.lineasEventBus.emit('principal-tiposUsuarios_crearVentana')
        break
      case 'manzanas_crearVentana':
        this.lineasEventBus.emit('principal-manzanas_crearVentana')
        break
      case 'trabajo_crearVentana':
        this.lineasEventBus.emit('principal-trabajo_crearVentana')
        break
      case 'medidores_crearVentana':
        this.lineasEventBus.emit('principal-medidores_crearVentana')
        break
      case 'registroAgua_crearVentana':
        this.lineasEventBus.emit('principal-registroAgua_crearVentana')
        break
      case 'tarifas_crearVentana':
        this.lineasEventBus.emit('principal-tarifas_crearVentana')
        break
      case 'organizacion_crearVentana':
        this.lineasEventBus.emit('principal-organizacion_crearVentana')
        break
      case 'cobroAgua_crearVentana':
        this.lineasEventBus.emit('principal-cobroAgua_crearVentana')
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
    let self = this
    this.lineasEventBus.on('trabajo-principal_cerrarVentanaLlamarLogin', () => {
      self.ventanaPrincipal.close()
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

          self.ventanaPrincipal.webContents.send('principal_datosIniciales', {trabajador})
        })
      }
    }
  }

  /**
   * @method
   * @author Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com>
   * @returns {null}
   * @description Función especial para recepcion de solicitudes que contenga los datos sensibles de la vista html
   */
  recepcionDatos () {
    ipcMain.on('principal_salirSistema', (e, json) => {
      this.ventanaPrincipal.close()
    })

    ipcMain.on('principal_activarUsuarios', (e, json) => {
      this.envioLinea('usuarios_crearVentana')
    })

    ipcMain.on('principal_activarTiposUsuarios', (e, json) => {
      this.envioLinea('tiposUsuarios_crearVentana')
    })

    ipcMain.on('principal_activarManzanas', (e, json) => {
      this.envioLinea('manzanas_crearVentana')
    })

    ipcMain.on('principal_activarTrabajo', (e, json) => {
      this.envioLinea('trabajo_crearVentana')
    })

    ipcMain.on('principal_activarMedidores', (e, json) => {
      this.envioLinea('medidores_crearVentana')
    })

    ipcMain.on('principal_activarRegistroAgua', (e, json) => {
      this.envioLinea('registroAgua_crearVentana')
    })

    ipcMain.on('principal_activarTarifas', (e, json) => {
      this.envioLinea('tarifas_crearVentana')
    })

    ipcMain.on('principal_activarOrganizacion', (e, json) => {
      this.envioLinea('organizacion_crearVentana')
    })

    ipcMain.on('principal_activarCobroAgua', (e, json) => {
      this.envioLinea('cobroAgua_crearVentana')
    })

  }

  conseguirVentana () {
    return this.ventanaPrincipal
  }
}

module.exports = {ventana}
