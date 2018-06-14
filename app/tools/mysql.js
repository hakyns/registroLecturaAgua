const mysql = require('mysql2/promise')
const config = require('../config/config')

class baseDatos {
  async consulta (conexion, consulta, datos) {
    try {
      if (Array.isArray(datos)) {
        const [filas, campos] = await conexion.execute(consulta, datos)
        return {filas: filas, campos: campos}
      }
      else {
        const [filas, campos] = await conexion.execute(consulta)
        return {filas: filas, campos: campos}
      }
    } catch (error) {
      console.log(error)
    }
  }
}

module.exports = {baseDatos}
