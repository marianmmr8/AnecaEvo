// ============================================================================
// SCRIPT DE INICIALIZACIÓN DE BASE DE DATOS (`npm run init-db`)
// Carga schema.sql, seed.sql (si no hay servicios) y crea cuentas demo seguras
// Carga ../datos/aneca_evo.sql, ./seed.sql (si no hay servicios) y crea cuentas demo seguras
// ============================================================================
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');
require('dotenv').config();

async function inicializar() {
  const conexion = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD ?? '',
    multipleStatements: true
  });

  try {
    // Comprobamos si la base de datos y las tablas ya fueron importadas (por ejemplo desde phpMyAdmin)
    const [dbs] = await conexion.query("SHOW DATABASES LIKE 'aneca evo'");
    let tablaServiciosExiste = false;
    if (dbs.length > 0) {
      const [tablas] = await conexion.query("SHOW TABLES FROM `aneca evo` LIKE 'servicios'");
      tablaServiciosExiste = tablas.length > 0;
    }

    if (!tablaServiciosExiste) {
      const schemaPath = path.join(__dirname, '..', 'datos', 'aneca_evo.sql'); // Lee directamente tu archivo SQL original en la carpeta datos/
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await conexion.query(schemaSql);
      console.log('✅ Estructura de tablas de `aneca evo` verificada/creada.');
    } else {
      console.log('✅ Base de datos `aneca evo` y sus tablas ya están importadas.');
    }

    // Comprobamos si ya existen servicios para no duplicar el seed
    const [servicios] = await conexion.query('SELECT COUNT(*) AS total FROM `aneca evo`.servicios');
    if (servicios[0].total === 0) {
      const seedPath = path.join(__dirname, 'seed.sql'); // Datos iniciales de ejemplo (servicios, horarios y productos)
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      await conexion.query(seedSql);
      console.log('✅ Datos iniciales (servicios, horarios y productos) insertados.');
    }

    // Asegura que Masaje con Maderoterapia exista también en bases de datos ya creadas
    await conexion.query(
      `INSERT IGNORE INTO \`aneca evo\`.servicios
       (nombre, slug, categoria, descripcion, duracion_minutos, margen_descanso_minutos, precio, modalidad, imagen_url, activo)
       VALUES ('Masaje con Maderoterapia', 'masaje-maderoterapia', 'masajes',
       'Técnica natural con instrumentos de madera anatómicos para remodelar, activar la circulación linfática, tonificar y liberar tensión profunda.',
       60, 20, 65.00, 'presencial',
       'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=900&q=80', TRUE)`
    );

    // Creamos cuenta Admin demo y Cliente demo si no existen
    const [admins] = await conexion.query("SELECT id FROM `aneca evo`.usuarios WHERE email = 'admin@anecaevo.com'");
    if (admins.length === 0) {
      const hashAdmin = await bcrypt.hash('Admin123!', 10);
      await conexion.query(
        `INSERT INTO \`aneca evo\`.usuarios (id, nombre, apellidos, email, password_hash, telefono, rol)
         VALUES (?, 'Elena', 'Aneca (Terapeuta)', 'admin@anecaevo.com', ?, '600111222', 'admin')`,
        [randomUUID(), hashAdmin]
      );
      console.log('✅ Cuenta Admin creada: admin@anecaevo.com / Admin123!');
    }

    const [clientes] = await conexion.query("SELECT id FROM `aneca evo`.usuarios WHERE email = 'cliente@anecaevo.com'");
    if (clientes.length === 0) {
      const clienteId = randomUUID();
      const hashCliente = await bcrypt.hash('Cliente123!', 10);
      await conexion.query(
        `INSERT INTO \`aneca evo\`.usuarios (id, nombre, apellidos, email, password_hash, telefono, rol)
         VALUES (?, 'Lucía', 'García', 'cliente@anecaevo.com', ?, '600333444', 'cliente')`,
        [clienteId, hashCliente]
      );
      // Bono de regalo de ejemplo para el cliente demo
      await conexion.query(
        `INSERT INTO \`aneca evo\`.bonos_clientes (id, usuario_id, nombre_bono, sesiones_totales, sesiones_restantes, activo)
         VALUES (?, ?, 'Bono Bienvenida 5 Sesiones', 5, 5, TRUE)`,
        [randomUUID(), clienteId]
      );
      console.log('✅ Cuenta Cliente demo creada: cliente@anecaevo.com / Cliente123!');
    }
  } finally {
    await conexion.end();
  }
}

inicializar().catch((err) => {
  console.error('❌ Error al inicializar la base de datos:', err.message);
  process.exit(1);
});
