module.exports = {
  DB: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || '3306',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'hakyn',
    dataBase: process.env.DB_NAME || 'registroagua'
  }
}
