const fechas = {
  fixDate () {
    var dateFormat = require('dateformat')
    dateFormat.i18n = {
      dayNames: [
        "Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"
      ],
      monthNames: [
        "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
      ],
      timeNames: [
        'a', 'p', 'am', 'pm', 'A', 'P', 'AM', 'PM'
      ]
    }

    return dateFormat
  },

  DateNumber (date) {
    // Solo funciona para formatos yyyy/mm/dd
    return new Date(date).toISOString().slice(0,10)
  }
}

const time = {
  currentTime (time) {
    let res = null
    let currentTime = new Date()

    switch (time) {
      case 'ms':
        res = currentTime.getTime()
        break
    }

    return res
  }
}

const text = {
  clearSpaces (data) {
    return data.replace(/ /g, '_')
  },
  masterKey (size) {
    let key = ''
    const characters = '0HJK19LQW8mn0bzlE2RTv9cxYUIO31PkjhgfdsB4NM87ap2SDFG5oi6uyt3rew6qZXC75VA4'
    for (let c = 0; c < size; c++) key += characters.charAt(Math.floor(Math.random() * characters.length))
    return key
  }
}

const email = {
  sendEmail (msg) {
    const nodemailer = require('nodemailer')
    const config = require('../../config/config')

    let transport = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: true,
      auth: {
        user: config.email.account.user,
        pass: config.email.account.password
      }
    })
    // console.log(msg)
    return transport.sendMail(msg)
  }
}

const numbers = {
  pad (number, size) {
    let num = String(number)

    while (num.length < (size || 2)) num = "0" + num
    return num
  }
}

const googleMaps = {
  marcadores (options, data, callback) {
    let markerSwitch = true
    let markerClose = false

    const marker = new google.maps.Marker({
      position: options.position,
      map: options.map,
      icon: options.icon ? options.icon : null
    })

    const infoWindow = new google.maps.InfoWindow({
      content: `
      <h5>${options.information.title}</h5>
      <p class="textoMapa">${options.information.text}</p>
      `
    })

    marker.addListener('mouseover', () => {
      if (!infoWindow.getMap() && markerSwitch) {
        infoWindow.open(options.map, marker)
        markerClose = true
      }
    })

    marker.addListener('mouseout', () => {
      if (markerClose) {
        infoWindow.close()
        markerClose = false
      }
    })

    marker.addListener('click', () => {
      infoWindow.open(options.map, marker)
      markerSwitch = false
      markerClose = false
    })

    marker.addListener('dblclick', () => {
      callback(data)
    })

    google.maps.event.addListener(infoWindow, 'closeclick', () => {
      markerSwitch = true
    })

    return marker
  }
}

module.exports = {fechas, time, text, email, numbers, googleMaps}
