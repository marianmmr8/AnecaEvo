// ============================================================================
// CONFIGURACIÓN DE CONEXIÓN A POSTGRESQL / SUPABASE (Compatible con los controladores)
// ============================================================================
const { Pool, types } = require('pg');
require('dotenv').config();

// Devuelve DATE (1082) y TIMESTAMP (1114) como texto plano sin desfases de zona horaria
types.setTypeParser(1082, (val) => val);
  types.setTypeParser(1114, (val) => val);

  const pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
  });

  // Convierte placeholders '?' de estilo MySQL a '$1, $2...' de PostgreSQL
  function adaptarSql(sql) {
  let idx = 0;
  let adaptado = sql.replace(/\?/g, () => `$${++idx}`);
  // Convierte LIKE a ILIKE en búsquedas para que no distinga mayúsculas/minúsculas
  adaptado = adaptado.replace(/\bLIKE\b/g, 'ILIKE');
  return adaptado;
}

async function ejecutarConsulta(cliente, sql, params = []) {
    const sqlAdaptado = adaptarSql(sql);
    const res = await cliente.query(sqlAdaptado, params);
    if (/^\s*(INSERT|UPDATE|DELETE)/i.test(sqlAdaptado)) {
      return [{ affectedRows: res.rowCount, insertId: res.rows?.[0]?.id || null }];
    }
    return [res.rows];
  }

const pool = {
  query: (sql, params) => ejecutarConsulta(pgPool, sql, params),
  getConnection: async () => {
    const client = await pgPool.connect();
    return {
      query: (sql, params) => ejecutarConsulta(client, sql, params),
      beginTransaction: () => client.query('BEGIN'),
      commit: () => client.query('COMMIT'),
      rollback: () => client.query('ROLLBACK'),
      release: () => client.release()
    };
  }
};

async function verificarConexion() {
  const client = await pgPool.connect();
  await client.query('SELECT 1');
  client.release();
}

module.exports = { pool, verificarConexion };
