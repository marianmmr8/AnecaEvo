// ============================================================================
// CONFIGURACIÓN DE CONEXIÓN A MYSQL (Base de datos: `aneca evo`)
// ============================================================================
const mysql = require('mysql2/promise'); // Cliente MySQL con soporte para async/await
require('dotenv').config(); // Carga las variables de entorno desde el archivo .env

// Creamos un pool de conexiones para reutilizar conexiones de forma eficiente
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',         // Servidor de base de datos (localhost en XAMPP)
  port: Number(process.env.DB_PORT) || 3306,        // Puerto estándar de MySQL
  user: process.env.DB_USER || 'root',              // Usuario de MySQL
  password: process.env.DB_PASSWORD ?? '',          // Contraseña (vacía por defecto en XAMPP)
  database: process.env.DB_NAME || 'aneca evo',     // Nombre exacto de tu base de datos
  waitForConnections: true,                         // Esperar si todas las conexiones están ocupadas
  connectionLimit: 10,                              // Máximo 10 conexiones simultáneas
  queueLimit: 0,                                    // Sin límite en la cola de espera
  charset: 'utf8mb4',                               // Soporte completo de acentos y emojis
  dateStrings: true                                 // Devuelve DATE y DATETIME como texto YYYY-MM-DD sin desfases horarios
});

// Función auxiliar para comprobar si la conexión responde al iniciar el servidor
async function verificarConexion() {
  const conexion = await pool.getConnection(); // Pide una conexión del pool
  await conexion.ping();                       // Envía un ping de prueba a MySQL
  conexion.release();                          // Libera la conexión de vuelta al pool
}

module.exports = { pool, verificarConexion };
