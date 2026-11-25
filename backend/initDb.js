// ============================================================================
// SCRIPT DE INICIALIZACIÓN PARA POSTGRESQL / SUPABASE (`npm run init-db`)
// ============================================================================
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');
require('dotenv').config();

async function inicializar() {
  const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
    });

    try {
const schemaPath = path.join(__dirname, '..', 'datos', 'aneca_evo_postgres.sql');
const schemaSql = fs.readFileSync(schemaPath, 'utf8');
await pool.query(schemaSql);
console.log('✅ Tablas creadas/verificadas en Supabase (PostgreSQL).');

  const { rows: servs } = await pool.query('SELECT COUNT(*)::int AS total FROM servicios');
  if (servs[0].total === 0) {
    const seedPath = path.join(__dirname, 'seed.sql');
    let seedSql = fs.readFileSync(seedPath, 'utf8');
    seedSql = seedSql.replace(/USE\s+`aneca evo`;/gi, '');
    await pool.query(seedSql);
    console.log('✅ Datos iniciales (servicios, horarios y productos) insertados.');
  }

  const { rows: admins } = await pool.query("SELECT id FROM usuarios WHERE email = 'anecaevo@gmail.com'");
  if (admins.length === 0) {
    const hashAdmin = await bcrypt.hash('Admin123!', 10);
      await pool.query(
        `INSERT INTO usuarios (id, nombre, apellidos, email, password_hash, telefono, rol)
         VALUES ($1, 'Elena', 'Aneca (Terapeuta)', 'anecaevo@gmail.com', $2, '600111222', 'admin')`,
        [randomUUID(), hashAdmin]
      );
    console.log('✅ Cuenta Admin creada: anecaevo@gmail.com / Admin123!');
  }

  const { rows: clientes } = await pool.query("SELECT id FROM usuarios WHERE email = 'cliente@anecaevo.com'");
  if (clientes.length === 0) {
    const clienteId = randomUUID();
    const hashCliente = await bcrypt.hash('Cliente123!', 10);
      await pool.query(
        `INSERT INTO usuarios (id, nombre, apellidos, email, password_hash, telefono, rol)
         VALUES ($1, 'Lucía', 'García', 'cliente@anecaevo.com', $2, '600333444', 'cliente')`,
        [clienteId, hashCliente]
      );
      await pool.query(
        `INSERT INTO bonos_clientes (id, usuario_id, nombre_bono, sesiones_totales, sesiones_restantes, activo)
         VALUES ($1, $2, 'Bono Bienvenida 5 Sesiones', 5, 5, TRUE)`,
        [randomUUID(), clienteId]
      );
    console.log('✅ Cuenta Cliente demo creada: cliente@anecaevo.com / Cliente123!');
  }
} finally {
  await pool.end();
}
}

inicializar().catch((err) => {
  console.error('❌ Error al inicializar Supabase:', err.message);
  process.exit(1);
});
