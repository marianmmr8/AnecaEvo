// ============================================================================
// CONTROLADOR DE CLIENTES, FICHAS PRIVADAS Y BONOS
// ============================================================================
const { randomUUID } = require('crypto');
const { pool } = require('../config/db');

/**
 * GET /api/clientes/bonos/mios - Devuelve los bonos activos del cliente autenticado
 */
async function misBonos(req, res) {
  try {
    const [bonos] = await pool.query(
      `SELECT b.*, s.nombre AS servicio_nombre
       FROM bonos_clientes b
       LEFT JOIN servicios s ON b.servicio_id = s.id
       WHERE b.usuario_id = ? AND b.activo = TRUE
       ORDER BY b.creado_en DESC`,
      [req.usuario.id]
    );
    return res.json({ bonos });
  } catch (error) {
    return res.status(500).json({ error: 'Error al consultar tus bonos.' });
  }
}

/**
 * GET /api/clientes - Listado de clientes con resumen de citas y fichas (Solo Admin)
 */
async function listarClientes(req, res) {
  try {
    const [clientes] = await pool.query(
      `SELECT u.id, u.nombre, u.apellidos, u.email, u.telefono, u.activo, u.fecha_registro,
              (SELECT COUNT(*) FROM citas c WHERE c.usuario_id = u.id) AS total_citas
       FROM usuarios u
       WHERE u.rol = 'cliente'
       ORDER BY u.fecha_registro DESC`
    );
    return res.json({ clientes });
  } catch (error) {
    return res.status(500).json({ error: 'Error al cargar el listado de clientes.' });
  }
}

/**
 * GET /api/clientes/:id/fichas - Fichas privadas de evolución y contraindicaciones (Solo Admin)
 */
async function obtenerFichasCliente(req, res) {
  try {
    const [fichas] = await pool.query(
      `SELECT f.*, c.fecha AS cita_fecha, s.nombre AS servicio_nombre
       FROM fichas_clientes f
       LEFT JOIN citas c ON f.cita_id = c.id
       LEFT JOIN servicios s ON c.servicio_id = s.id
       WHERE f.usuario_id = ?
       ORDER BY f.creado_en DESC`,
      [req.params.id]
    );
    return res.json({ fichas });
  } catch (error) {
    return res.status(500).json({ error: 'Error al cargar las fichas del cliente.' });
  }
}

/**
 * POST /api/clientes/:id/fichas - Añade una ficha privada de evolución (Solo Admin)
 */
async function crearFichaCliente(req, res) {
  try {
    const { motivo_consulta, contraindicaciones, notas_privadas_terapeuta, cita_id } = req.body;
    const id = randomUUID();
    await pool.query(
      `INSERT INTO fichas_clientes (id, usuario_id, cita_id, motivo_consulta, contraindicaciones, notas_privadas_terapeuta)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, req.params.id, cita_id || null, motivo_consulta || null, contraindicaciones || null, notas_privadas_terapeuta || null]
    );
    return res.status(201).json({ mensaje: 'Ficha privada guardada.', id });
  } catch (error) {
    return res.status(500).json({ error: 'No se pudo guardar la ficha privada.' });
  }
}

/**
 * POST /api/clientes/:id/bonos - Asigna un bono de sesiones o tarjeta regalo a un cliente (Solo Admin)
 */
async function asignarBono(req, res) {
  try {
    const { servicio_id, nombre_bono, sesiones_totales, fecha_caducidad } = req.body;
    if (!nombre_bono || !sesiones_totales) {
      return res.status(400).json({ error: 'Nombre del bono y número de sesiones son obligatorios.' });
    }
    const id = randomUUID();
    await pool.query(
      `INSERT INTO bonos_clientes (id, usuario_id, servicio_id, nombre_bono, sesiones_totales, sesiones_restantes, fecha_caducidad, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [id, req.params.id, servicio_id || null, nombre_bono, Number(sesiones_totales), Number(sesiones_totales), fecha_caducidad || null]
    );
    return res.status(201).json({ mensaje: 'Bono asignado correctamente.', id });
  } catch (error) {
    return res.status(500).json({ error: 'No se pudo asignar el bono.' });
  }
}

/**
 * PUT /api/clientes/:id - Modifica los datos de un cliente (Solo Admin)
 */
async function actualizarCliente(req, res) {
  try {
    const { id } = req.params;
    const { nombre, apellidos, email, telefono, activo } = req.body;
    if (!nombre || !apellidos || !email) {
      return res.status(400).json({ error: 'Nombre, apellidos y email son obligatorios.' });
    }

    await pool.query(
      `UPDATE usuarios
       SET nombre = ?, apellidos = ?, email = ?, telefono = ?, activo = ?
       WHERE id = ? AND rol = 'cliente'`,
      [nombre.trim(), apellidos.trim(), email.trim().toLowerCase(), telefono || null, activo !== undefined ? Boolean(activo) : true, id]
    );
    return res.json({ mensaje: 'Datos del cliente actualizados.' });
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    return res.status(500).json({ error: 'No se pudo actualizar el cliente (revisa que el email no esté repetido).' });
  }
}

/**
 * DELETE /api/clientes/:id - Elimina un cliente o lo desactiva si tiene historial (Solo Admin)
 */
async function eliminarCliente(req, res) {
  try {
    const { id } = req.params;
    const [citas] = await pool.query('SELECT COUNT(*) AS total FROM citas WHERE usuario_id = ?', [id]);
    const [pedidos] = await pool.query('SELECT COUNT(*) AS total FROM pedidos WHERE usuario_id = ?', [id]);
    const [bonos] = await pool.query('SELECT COUNT(*) AS total FROM bonos_clientes WHERE usuario_id = ?', [id]);

    if (citas[0].total > 0 || pedidos[0].total > 0 || bonos[0].total > 0) {
      await pool.query("UPDATE usuarios SET activo = FALSE WHERE id = ? AND rol = 'cliente'", [id]);
      return res.json({ mensaje: 'Cliente desactivado (se conserva su historial de citas, pedidos o bonos).' });
    }

    await pool.query("DELETE FROM usuarios WHERE id = ? AND rol = 'cliente'", [id]);
    return res.json({ mensaje: 'Cliente eliminado definitivamente.' });
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    return res.status(500).json({ error: 'No se pudo eliminar el cliente.' });
  }
}

module.exports = { misBonos, listarClientes, actualizarCliente, eliminarCliente, obtenerFichasCliente, crearFichaCliente, asignarBono };
