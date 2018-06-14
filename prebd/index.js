const {baseDatos} = require('../tools/mysql')

const Promise = require('bluebird')

const usuario_tipoJSON = require('./json/usuario_tipo.json')
const manzanaJSON = require('./json/manazana.json')

const bd = new baseDatos()

const requeridos = [
  'usuario_tipo',
  'manzana'
]

const consultas = {
  usuario_tipo: async () => {
    await Promise.all(
      usuario_tipoJSON.map(async u_t => {
        const _usuario_tipo = await bd.consulta('INSERT INTO usuario_tipo (id, tipo) VALUES (?, ?)', [u_t.id, u_t.tipo])
        console.log(`¡Usuario ${u_t.tipo} creado!`)
      })
    )
    console.log('---------------------')
    console.log('TERMINADO: usuario_tipo \n')
  },

  manzana: async () => {
    await Promise.all(
      manzanaJSON.map(async m => {
        const _manzana = await bd.consulta('INSERT INTO manzana (id, manzana) VALUES (?, ?)', [m.id, m.manzana])
        console.log(`Manzana ${m.manzana} creada!`)
      })
    )
    console.log('---------------------')
    console.log('TERMINADO: manzana \n')
  }
}

new Promise (async resolve => {
  if (requeridos.includes('usuario_tipo')) await consultas.usuario_tipo()
  if (requeridos.includes('manzana')) await consultas.manzana()
})

