const fs = require('fs')
const path = require('path')

const ventanas = {}

fs
  .readdirSync(__dirname)
  .filter(elementos => elementos !== 'cargadorVentanas.js')
  .forEach(carpeta => {
    ventanas[carpeta] = require(path.join(__dirname, '/', carpeta, '/ventana.js'))
  })

module.exports = ventanas
