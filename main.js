// nodemon --exec npm start
const electron = require('electron')
const mysql = require('mysql2/promise')
const path = require('path')
const {lineas} = require(path.join(__dirname, './app/tools/eventBus'))
const config = require(path.join(__dirname, './app/config/config'))

const {principalVentana} = require(path.join(__dirname, './app/ventanas/principal/ventana'))
const {principal, usuarios, usuarioTipo, manzana, organizacion, trabajo, medidores, login, registroAgua, tarifas, cobroAgua} = require(path.join(__dirname, './app/ventanas/cargadorVentanas'))

const {app} = electron

const ventanas = {}


app.on('ready', async () => {
  const conexionBD = await mysql.createPool({
    connectionLimit: 100,
    host: config.DB.host,
    port: config.DB.port,
    user: config.DB.username,
    password: config.DB.password,
    database: config.DB.dataBase
  })

  // Area de creación de ventanas
  new login.ventana(conexionBD, lineas)

  /**
   * @description Se ejecutan desde la ventana LOGIN
   */
  lineas.on('login-main_crearPrincipal', () => {
    let ventanaPrincipal = new principal.ventana(conexionBD, lineas)
    ventanas['principal'] = ventanaPrincipal.conseguirVentana()
  })

  /**
   * @description Se ejecutan desde la ventana PRINCIPAL
   */
  lineas.on('principal-usuarios_crearVentana', () => {
    new usuarios.ventana(conexionBD, ventanas, lineas)
  })

  lineas.on('principal-tiposUsuarios_crearVentana', () => {
    new usuarioTipo.ventana(conexionBD, ventanas, lineas)
  })

  lineas.on('principal-manzanas_crearVentana', () => {
    new manzana.ventana(conexionBD, ventanas, lineas)
  })

  lineas.on('principal-trabajo_crearVentana', () => {
    new trabajo.ventana(conexionBD, ventanas, lineas)
  })

  lineas.on('principal-medidores_crearVentana', () => {
    new medidores.ventana(conexionBD, ventanas, lineas)
  })

  lineas.on('principal-registroAgua_crearVentana', () => {
    new registroAgua.ventana(conexionBD, ventanas, lineas)
  })

  lineas.on('principal-organizacion_crearVentana', () => {
    new organizacion.ventana(conexionBD, ventanas, lineas)
  })

  lineas.on('principal-tarifas_crearVentana', () => {
    new tarifas.ventana(conexionBD, ventanas, lineas)
  })

  lineas.on('principal-cobroAgua_crearVentana', () => {
    new cobroAgua.ventana(conexionBD, ventanas, lineas)
  })
})
