// ============================================================================
// CONTROLADOR DE CLIENTES, FICHAS PRIVADAS Y BONOS
// ============================================================================
const { randomUUID } = require('crypto');
const { pool } = require('../config/db');
const { procesarPago } = require('../services/pagoService');

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

/**
 * PUT /api/clientes/fichas/:fichaId - Modifica una ficha privada de evolución (Solo Admin)
 */
async function actualizarFichaCliente(req, res) {
  try {
    const { fichaId } = req.params;
    const { motivo_consulta, contraindicaciones, notas_privadas_terapeuta } = req.body;
    await pool.query(
      `UPDATE fichas_clientes
       SET motivo_consulta = ?, contraindicaciones = ?, notas_privadas_terapeuta = ?
       WHERE id = ?`,
      [motivo_consulta || null, contraindicaciones || null, notas_privadas_terapeuta || null, fichaId]
    );
    return res.json({ mensaje: 'Ficha privada actualizada.' });
  } catch (error) {
    return res.status(500).json({ error: 'No se pudo actualizar la ficha privada.' });
  }
}

/**
 * DELETE /api/clientes/fichas/:fichaId - Elimina una ficha privada de evolución (Solo Admin)
 */
async function eliminarFichaCliente(req, res) {
  try {
    await pool.query('DELETE FROM fichas_clientes WHERE id = ?', [req.params.fichaId]);
    return res.json({ mensaje: 'Ficha privada eliminada.' });
  } catch (error) {
    return res.status(500).json({ error: 'No se pudo eliminar la ficha privada.' });
  }
}

/**
 * POST /api/clientes/bonos/comprar - Permite al cliente comprar un bono de sesiones desde la tienda
 */
async function comprarBono(req, res) {
  try {
    const { servicio_id, sesiones, metodo_pago } = req.body;
    const numSesiones = Number(sesiones);
    if (!servicio_id || ![3, 5, 10].includes(numSesiones)) {
      return res.status(400).json({ error: 'Selecciona una terapia y un bono de 3, 5 o 10 sesiones.' });
    }

    const [servs] = await pool.query('SELECT id, nombre, precio FROM servicios WHERE id = ? AND activo = TRUE', [servicio_id]);
    if (servs.length === 0) {
      return res.status(404).json({ error: 'Terapia no encontrada.' });
    }

    const servicio = servs[0];
    const descuento = numSesiones === 10 ? 0.15 : numSesiones === 5 ? 0.10 : 0.05;
    const total = Number((Number(servicio.precio) * numSesiones * (1 - descuento)).toFixed(2));
    const nombreBono = `Bono ${numSesiones}x ${servicio.nombre}`;

    await procesarPago({
      importe: total,
      metodo: metodo_pago || 'tarjeta',
      concepto: nombreBono
    });

    const id = randomUUID();
    await pool.query(
      `INSERT INTO bonos_clientes (id, usuario_id, servicio_id, nombre_bono, sesiones_totales, sesiones_restantes, activo)
       VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
      [id, req.usuario.id, servicio.id, nombreBono, numSesiones, numSesiones]
    );

    return res.status(201).json({
      mensaje: `¡${nombreBono} añadido a tu cuenta! Ya puedes usarlo al reservar cita.`,
      bono: { id, nombre_bono: nombreBono, sesiones_totales: numSesiones, total }
    });
  } catch (error) {
    console.error('Error al comprar bono:', error);
    return res.status(500).json({ error: 'No se pudo completar la compra del bono.' });
  }
}

/**
 * GET /api/clientes/:id/bonos - Lista los bonos de un cliente (Solo Admin)
 */
async function obtenerBonosCliente(req, res) {
  try {
    const [bonos] = await pool.query(
      'SELECT * FROM bonos_clientes WHERE usuario_id = ? AND activo = TRUE ORDER BY creado_en DESC',
      [req.params.id]
    );
    return res.json({ bonos });
  } catch (error) {
    return res.status(500).json({ error: 'Error al cargar los bonos del cliente.' });
  }
}

/**
 * PATCH /api/clientes/bonos/:bonoId/descontar - Descuenta 1 sesión del bono (Solo Admin)
 */
async function descontarSesionBono(req, res) {
  try {
    const [resUpd] = await pool.query(
      'UPDATE bonos_clientes SET sesiones_restantes = sesiones_restantes - 1 WHERE id = ? AND sesiones_restantes > 0',
      [req.params.bonoId]
    );
    if (resUpd.affectedRows === 0) {
      return res.status(400).json({ error: 'El bono ya no tiene sesiones restantes.' });
    }
    return res.json({ mensaje: 'Se ha descontado 1 sesión del bono.' });
  } catch (error) {
    return res.status(500).json({ error: 'No se pudo descontar la sesión del bono.' });
  }
}

/**
 * PATCH /api/clientes/bonos/:bonoId/sumar - Devuelve 1 sesión al bono por excepción del admin (Solo Admin)
 */
async function sumarSesionBono(req, res) {
  try {
    await pool.query(
      'UPDATE bonos_clientes SET sesiones_restantes = LEAST(sesiones_totales, sesiones_restantes + 1) WHERE id = ?',
      [req.params.bonoId]
    );
    return res.json({ mensaje: 'Se ha devuelto 1 sesión al bono.' });
  } catch (error) {
    return res.status(500).json({ error: 'No se pudo devolver la sesión al bono.' });
  }
}

module.exports = {
  misBonos,
  comprarBono,
  obtenerBonosCliente,
  descontarSesionBono,
  sumarSesionBono,
  listarClientes,
  actualizarCliente,
  eliminarCliente,
  obtenerFichasCliente,
  crearFichaCliente,
  actualizarFichaCliente,
  eliminarFichaCliente,
  asignarBono
};
