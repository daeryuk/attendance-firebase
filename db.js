const mysql = require('mysql2/promise');
const config = require('./config');

const pool = mysql.createPool(config.database);

module.exports = pool; 