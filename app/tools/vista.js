const url = require('url')
const path = require('path')

module.exports = (ventana) => {
  return url.format({
    protocol: 'file',
    slashes: true,
    pathname: path.join(__dirname, '../ventanas/', ventana, 'vista.html'),
  })
}
