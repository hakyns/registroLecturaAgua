CREATE DATABASE IF NOT EXISTS  registroagua
    DEFAULT CHARACTER SET utf8;
USE registroagua;

    CREATE TABLE IF NOT EXISTS manzana (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      manzana VARCHAR(30) NOT NULL UNIQUE,
      FULLTEXT KEY search(manzana)
    );

    CREATE TABLE IF NOT EXISTS usuario_tipo (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        tipo VARCHAR(30) NOT NULL UNIQUE,
        FULLTEXT KEY search(tipo)
    );

CREATE TABLE IF NOT EXISTS usuario (
id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL,
    apellidos VARCHAR(35) NOT NULL,
usuario_tipo INT NOT NULL,
manzana INT NOT NULL,
    notas VARCHAR(130),
    imagen VARCHAR(255) UNIQUE,
    creado DATETIME NOT NULL,
    actualizado DATETIME NOT NULL,
    FULLTEXT KEY search(nombre, apellidos),
    FOREIGN KEY (usuario_tipo)
      REFERENCES usuario_tipo(id)
          ON DELETE RESTRICT
          ON UPDATE CASCADE,
    FOREIGN KEY (manzana)
      REFERENCES manzana(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS organizacion (
id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  ciudad VARCHAR(35) NOT NULL,
  estado VARCHAR(35) NOT NULL,
  telefono VARCHAR(30) NOT NULL,
  codigo_postal VARCHAR(20) NOT NULL,
  domicilio VARCHAR(80) NOT NULL,
  imagen VARCHAR(255) NOT NULL,
  FULLTEXT KEY search(ciudad, estado)
);

CREATE TABLE IF NOT EXISTS trabajo (
id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
usuario INT NOT NULL,
  llave VARCHAR(255) NOT NULL UNIQUE,
zona_trabajo INT NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  minutos_trabajados DOUBLE NOT NULL,
  estado TINYINT(2),
  FULLTEXT KEY search(llave),
  FOREIGN KEY (usuario)
    REFERENCES usuario(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE,
  FOREIGN KEY (zona_trabajo)
      REFERENCES manzana(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS medidores (
id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
usuario INT NOT NULL,
  medidor VARCHAR(255) UNIQUE,
  longitud DOUBLE,
  latitud DOUBLE,
  notas VARCHAR(255),
  FULLTEXT KEY searrch(medidor),
  FOREIGN KEY (usuario)
    REFERENCES usuario(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS registro_agua (
id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
medidor INT NOT NULL,
trabajador INT NOT NULL,
  lectura INT NOT NULL,
  fecha_registro DATE NOT NULL,
  fecha_cambio DATE NOT NULL,
  json_cambios TEXT,
  FOREIGN KEY (medidor)
    REFERENCES medidores(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE,
  FOREIGN KEY (trabajador)
    REFERENCES trabajo(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS tarifas (
id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  rango_minimo INT NOT NULL UNIQUE,
  rango_maximo INT NOT NULL UNIQUE,
  tarifa DOUBLE NOT NULL,
  fija_incrementada TINYINT(2) NOT NULL
);

CREATE TABLE IF NOT EXISTS cobro_agua (
id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
registro_agua INT NOT NULL,
  desglose_pagos TEXT NOT NULl,
  dinero_total DOUBLE NOT NULL,
  dinero_recibido DOUBLE NOT NULL,
  dinero_cambio DOUBLE NOT NULL,
  fecha_cobro DATETIME NOT NULL,
  pago_conjunto TEXT,
  FOREIGN KEY (registro_agua)
    REFERENCES registro_agua(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);
