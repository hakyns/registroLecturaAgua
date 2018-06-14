const {fechas} = require('./herramietasCustomizadas.js')
const image2base64 = require('image-to-base64')
const jsPDF = require('jspdf')
require('jspdf-autotable')


class generadorPDF {
  constructor (tipoReporte, datos) {
    switch (tipoReporte) {
      case 'registros':
        this.reporteRegistros(datos)
        break
      case 'registros-landscape':
        this.reporteRegistrosLandscape(datos)
        break
      case 'plantilla':
        this.plantillaRegistros(datos)
        break
    }
  }

  cabeceraPDF (doc, PDF, fecha) {
    doc.setFontSize(24)
    doc.setFont('courier')
    doc.setFontType('bold')
    doc.text(40, 50, PDF.cabecera.titulo)

    doc.setFontSize(18)
    doc.text(60, 90, PDF.cabecera.subtitulo)
    // doc.addImage('data:image/jpeg;base64,' + imagen, 'JPEG', 380, 70, 160, 100)
    doc.setFontSize(12)
    doc.setFontType('normal')
    doc.text(40, 120, `L: ${PDF.cabecera.ciudad}  EDO: ${PDF.cabecera.estado}`)
    doc.text(40, 135, `DIR: ${PDF.cabecera.domicilio}`)
    doc.text(40, 150, `TEL: ${PDF.cabecera.telefono}  CP: ${PDF.cabecera.codigo_postal}`)
    doc.text(40, 165, `FECHA: ${fecha[1]}`)
  }

  piePagina (doc) {
    const totalPagesExp = '{total_pages_count_string}'

    let piePagina = 'Software propiedad de: Joaquin Reyes Sanchez <joaquin.seyer21@gmail.com> 2018 - Pagina ' + doc.internal.getNumberOfPages()
    if (typeof doc.putTotalPages === 'function') piePagina += ' de ' + totalPagesExp
    doc.setFontSize(10)
    doc.text(piePagina, 15, doc.internal.pageSize.height - 10)

    if (typeof doc.putTotalPages === 'function') doc.putTotalPages(totalPagesExp)
  }

  async plantillaRegistros (PDF) {
    const doc = new jsPDF('p', 'pt')

    const date = new Date()
    const fechaActual = [fechas.fixDate()(date, 'default'), fechas.fixDate()(date, 'fullDate')]

    const imagen = await image2base64(path.join(__dirname, '../assets/img/organizacion/', PDF.cabecera.imagen))
    doc.addImage('data:image/jpeg;base64,' + imagen, 'JPEG', 380, 70, 160, 100)

    this.cabeceraPDF(doc, PDF, fechaActual)

    this.piePagina(doc)

    doc.save(PDF.salida.replace('#####', fechaActual[0]))
  }

  async reporteRegistros (PDF) {
    const doc = new jsPDF('p', 'pt')

    const date = new Date()
    const fechaActual = [fechas.fixDate()(date, 'default'), fechas.fixDate()(date, 'fullDate')]

    const imagen = await image2base64(path.join(__dirname, '../assets/img/organizacion/', PDF.cabecera.imagen))
    doc.addImage('data:image/jpeg;base64,' + imagen, 'JPEG', 380, 70, 160, 100)

    this.cabeceraPDF(doc, PDF, fechaActual)

    this.piePagina(doc)

    doc.autoTable(PDF.columnas.titulares, PDF.filas, {
      theme: 'plain',
      columnStyles: PDF.columnas.estilos,
      styles: {
        fontSize: 10,
        font: 'courier',
        overflow: 'linebreak',
        valign: 'middle'
      },
      margin: {top: 200},
      addPageContent: function(data) {
        doc.setFontStyle('bold')
        doc.text(40, 190, `Numero de Registros: ${PDF.registros}`)
      }
    })

    doc.save(PDF.salida.replace('#####', fechaActual[0]))
  }

  async reporteRegistrosLandscape (PDF) {
    const doc = new jsPDF('l', 'pt')

    const date = new Date()
    const fechaActual = [fechas.fixDate()(date, 'default'), fechas.fixDate()(date, 'fullDate')]

    const imagen = await image2base64(path.join(__dirname, '../assets/img/organizacion/', PDF.cabecera.imagen))
    doc.addImage('data:image/jpeg;base64,' + imagen, 'JPEG', 620, 70, 160, 100)

    this.cabeceraPDF(doc, PDF, fechaActual)

    this.piePagina(doc)

    doc.autoTable(PDF.columnas.titulares, PDF.filas, {
      theme: 'plain',
      columnStyles: PDF.columnas.estilos,
      styles: {
        fontSize: 10,
        font: 'courier',
        overflow: 'linebreak',
        valign: 'middle'
      },
      margin: {top: 200},
      addPageContent: function(data) {
        doc.setFontStyle('bold')
        doc.text(40, 190, `Numero de Registros: ${PDF.registros}`)
      }
    })

    doc.save(PDF.salida.replace('#####', fechaActual[0]))
  }
}

module.exports = {generadorPDF}
