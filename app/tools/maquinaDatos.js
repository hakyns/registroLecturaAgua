const {text} = require('./herramietasCustomizadas')

class tratamiento {
  treatTrim (data) {
    if (data !== null) return data.trim()
    return data
  }

  treatSize (data, option) {
    let res = data

    if (res !== null) {
      if (option === 'lowerCase') return res.toLowerCase()
      else if (option === 'capitalize') return res.charAt(0).toUpperCase() + res.slice(1).toLowerCase()
    }

    return res
  }

  treatFolderFile (data) {
    if (data !== null) return data.replace(/[^\w\s]/gi, '_')
  }

  treatCharacters (data) {
    if (data !== null) return data.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  }

  treatReplace (data, search, change) {
    if (data !== null) return data.replace(search, change)
    return data
  }

  treatReplaceSpaces (data, mode) {
    switch (mode) {
      case 'underscore_space':
        if (data !== null) return data.replace(/_/g, ' ')
        break
      case 'space_underscore':
        if (data !== null) return data.replace(/ /g, '_')
        break
      case 'space_camelCase':
        let dataArray = data.split(' ').map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        if (dataArray.length) return dataArray.toString().replace(',', '')
        break
      case 'space_void':
        if (data !== null) return data.replace(/ /g, '')
        break
    }
  }

  // Funciones Especiales
  treatTrimSizeCharacters (data, size) {
    const a = this.treatTrim(data)
    const b = this.treatSize(a, size)
    const c = this.treatCharacters(b)

    return c
  }

  treatTrimReplaceSpaces (data, mode) {
    const a = this.treatTrim(data)
    const b = this.treatReplaceSpaces(a, 'underscore_space')

    return b
  }

  treatRouteFile (data, file) {
    let extension = file.split('.').pop()

    const a = this.treatTrim(data)
    const b = this.treatReplaceSpaces(a, 'space_underscore')
    const c = this.treatSize(b, 'lowerCase')
    const d = this.treatCharacters(c)

    const res = d + text.masterKey(10) + '.' + extension

    return res
  }
}

class validador {
  valEmpty (data) {
    let res = null

    if (data === null || data === 'null' || typeof (data) === 'undefined') res = 'No debe de estar vacio'

    return res
  }

  valType (data, option) {
    let res = null

    switch (option) {
      case 'text':
        if (typeof (data) !== 'string' || !isNaN(data)) res = 'Debe de contener solo texto (letras)'
        break
      case 'number':
        if (isNaN(data)) res = 'Debe de contener solo números'
        break
      case 'email':
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        if (!re.test(data)) res = 'Debe de ser un email correctamente escrito como este: correo@correo.com'
        break
      case 'password':
        if (data.search(/[!@#$%^&*_+].*[!@#$%^&*_+].*[!@#$%^&*_+]/) < 0) res = 'Debe de contener al menos 3 caracteres especiales como: _, -, @, &, etc...'
        if (data.search(/[a-z].*[a-z].*[a-z]/i) < 0) res = 'Debe de contener al menos 3 letras'
        if (data.search(/[0-9].*[0-9].*[0-9]/) < 0) res = 'Debe de contener al menos 3 números'
        break
      case 'boolean':
        if (typeof (data.value) !== 'boolean') res = 'Se ha presentado un error con el tipo de dato para el campo #####'
        if (typeof (data.response) !== 'undefined') {
          if (data.response) {
            if (!data.value) res = 'Se ha presentado un error con el tipo de dato para el campo #####'
          } else if (!data.response) {
            if (data.value) res = 'Se ha presentado un error con el tipo de dato para el campo #####'
          }
        }
        break
    }

    return res
  }

  valMin (data, min) {
    let res = null

    if (data !== null) {
      if (data.length < min) res = `Debe de contener como mínimo ${min} caracteres`
    }


    return res
  }

  valMax (data, max) {
    let res = null

    if (data !== null) {
      if (data.length > max) res = `Debe de contener como máximo ${max} caracteres`
    }

    return res
  }

  valEqual (data, compare) {
    let res = null

    if (data !== compare.data) res = `Debe de coincidir con el campo ?????`

    return res
  }

  valUnequal (data, compare, option) {
    let res = null

    switch (option) {
      case 'simple':
        if (data === compare.data) res = `No debe de ser igual al campo ?????`
        break
      case 'array':
        if (compare.indexOf(data) >= 0) res = `No existe en la lista`
        break
    }

    return res
  }

  valNumbers (mode, number, limit, msgMergeError) {
    let res = null

    switch (mode) {
      case 'bigger':
        const missing = limit - number
        if (typeof (msgMergeError) === 'string') {
          if (number < limit) res = msgMergeError
        } else {
          if (number < limit) res = `Debe de ser mayor a ${limit}`
        }
        break
      case 'lower':
        const exceeded = number - limit
        if (typeof (msgMergeError) === 'string') {
          if (number > limit) res = msgMergeError
        } else {
          if (number > limit) res = `Debe de ser menor a ${limit}`
        }
        break
    }

    return res
  }

  valExtensions (file, listExtensions, data) {
    let res = null

    switch (file) {
      case 'image':
        if (!listExtensions.includes(data)) res = `Debe de ser un archivo de tipo: ${listExtensions}`
        break
    }

    return res
  }

  valBasicMain (data, type, min, max) {
    let res = null

    res = this.valEmpty(data)
    if (res === null) {
      res = this.valType(data, type)
      if (res === null) {
        res = this.valMin(data, min)
        if (res === null) {
          res = this.valMax(data, max)
          if (res === null) return null
        }
      }
    }

    return res
  }

  valBasicEmptyFull (data, type, min, max) {
    let res = null

    if (this.valEmpty(data) === null) {
      res = this.valType(data, type)
      if (res === null) {
        res = this.valMin(data, min)
        if (res === null) {
          res = this.valMax(data, max)
          if (res === null) return null
        }
      }
    }

    return res
  }
}


module.exports = {tratamiento, validador}
