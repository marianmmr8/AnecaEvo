// ============================================================================
// CONTROLADOR DE TARJETAS REGALO (Compra en tienda, creación Admin y canje)
// ============================================================================
const { randomUUID } = require('crypto');
const { pool } = require('../config/db');
const { procesarPago } = require('../services/pagoService');

let tablaTarjetasVerificada = false;

// Crea la tabla `tarjetas_regalo` automáticamente si aún no existe en `aneca evo`
async function asegurarTablaTarjetas() {
  if (tablaTarjetasVerificada) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tarjetas_regalo (
      id CHAR(36) NOT NULL,
      codigo VARCHAR(30) NOT NULL,
      comprador_usuario_id CHAR(36) NULL,
      canjeada_por_usuario_id CHAR(36) NULL,
      servicio_id INT NULL,
      precio_maximo DECIMAL(10, 2) NOT NULL,
      nombre_destinatario VARCHAR(150) NULL,
      dedicatoria TEXT NULL,
      descripcion_admin TEXT NULL,
      estado ENUM('activa', 'canjeada', 'cancelada') NOT NULL DEFAULT 'activa',
      creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uk_tarjeta_codigo (codigo)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  tablaTarjetasVerificada = true;
}

function generarCodigoRegalo() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let sufijo = '';
  for (let i = 0; i < 6; i += 1) {
    sufijo += chars[Math.floor(Math.random() * chars.length)];
  }
  return `ANECA-${sufijo}`;
}

/**
 * POST /api/tarjetas/comprar - Compra una tarjeta regalo desde la Tienda
 */
async function comprarTarjetaRegalo(req, res) {
  try {
    await asegurarTablaTarjetas();
    const { servicio_id, precio_maximo, nombre_destinatario, dedicatoria, metodo_pago } = req.body;

    let importe = Number(precio_maximo || 0);
    let servicioIdFinal = servicio_id ? Number(servicio_id) : null;
    let descripcion = 'Tarjeta Regalo a elección del destinatario';

    if (servicioIdFinal) {
      const [servs] = await pool.query('SELECT id, nombre, precio FROM servicios WHERE id = ? AND activo = TRUE', [servicioIdFinal]);
      if (servs.length === 0) {
        return res.status(404).json({ error: 'La terapia seleccionada no existe.' });
      }
      importe = Number(servs[0].precio);
      descripcion = `Tarjeta Regalo: ${servs[0].nombre}`;
    } else if (importe <= 0) {
      return res.status(400).json({ error: 'Selecciona una terapia o un importe válido.' });
    }

    await procesarPago({
      importe,
      metodo: metodo_pago || 'tarjeta',
      concepto: `${descripcion} para ${nombre_destinatario || 'Regalo'}`
    });

    const id = randomUUID();
    const codigo = generarCodigoRegalo();

    await pool.query(
      `INSERT INTO tarjetas_regalo
       (id, codigo, comprador_usuario_id, servicio_id, precio_maximo, nombre_destinatario, dedicatoria, descripcion_admin, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'activa')`,
      [id, codigo, req.usuario.id, servicioIdFinal, importe, nombre_destinatario || null, dedicatoria || null, descripcion]
    );

    return res.status(201).json({
      mensaje: '¡Tarjeta Regalo creada con éxito!',
      tarjeta: { id, codigo, nombre_destinatario, dedicatoria, descripcion_admin: descripcion }
    });
  } catch (error) {
    console.error('Error al comprar tarjeta regalo:', error);
    return res.status(500).json({ error: 'No se pudo generar la tarjeta regalo.' });
  }
}

/**
 * POST /api/tarjetas/admin - El administrador crea una tarjeta regalo personalizada
 */
async function crearTarjetaAdmin(req, res) {
  try {
    await asegurarTablaTarjetas();
    const { servicio_id, precio_maximo, nombre_destinatario, dedicatoria, descripcion_admin } = req.body;

    let importe = Number(precio_maximo || 0);
    const servicioIdFinal = servicio_id ? Number(servicio_id) : null;

    if (servicioIdFinal && importe <= 0) {
      const [servs] = await pool.query('SELECT precio FROM servicios WHERE id = ?', [servicioIdFinal]);
      if (servs.length > 0) importe = Number(servs[0].precio);
    }

    if (importe <= 0) {
      return res.status(400).json({ error: 'Indica el valor/precio de la tarjeta regalo.' });
    }

    const id = randomUUID();
    const codigo = generarCodigoRegalo();

    await pool.query(
      `INSERT INTO tarjetas_regalo
       (id, codigo, servicio_id, precio_maximo, nombre_destinatario, dedicatoria, descripcion_admin, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'activa')`,
      [id, codigo, servicioIdFinal, importe, nombre_destinatario || null, dedicatoria || null, descripcion_admin || null]
    );

    return res.status(201).json({
      mensaje: `Tarjeta Regalo creada. Código: ${codigo}`,
      tarjeta: { id, codigo, descripcion_admin, dedicatoria }
    });
  } catch (error) {
    console.error('Error al crear tarjeta admin:', error);
    return res.status(500).json({ error: 'No se pudo crear la tarjeta regalo.' });
  }
}

/**
 * GET /api/tarjetas/validar/:codigo - Valida un código sin mostrar el precio al destinatario
 */
async function validarCodigoRegalo(req, res) {
  try {
    await asegurarTablaTarjetas();
    const codigo = (req.params.codigo || '').trim().toUpperCase();
    const [filas] = await pool.query(
      `SELECT t.id, t.codigo, t.servicio_id, t.precio_maximo, t.nombre_destinatario, t.dedicatoria, t.descripcion_admin, t.estado,
              s.nombre AS servicio_nombre
       FROM tarjetas_regalo t
       LEFT JOIN servicios s ON t.servicio_id = s.id
       WHERE t.codigo = ?`,
      [codigo]
    );

    if (filas.length === 0) {
      return res.status(404).json({ error: 'Código de tarjeta regalo no encontrado.' });
    }
    const tarjeta = filas[0];
    if (tarjeta.estado !== 'activa') {
      return res.status(400).json({ error: 'Esta tarjeta regalo ya ha sido canjeada o cancelada.' });
    }

    // Devolvemos la info necesaria para reservar SIN exponer el precio al destinatario
    return res.json({
      tarjeta: {
        codigo: tarjeta.codigo,
        servicio_id: tarjeta.servicio_id,
        servicio_nombre: tarjeta.servicio_nombre,
        precio_maximo: Number(tarjeta.precio_maximo),
        nombre_destinatario: tarjeta.nombre_destinatario,
        dedicatoria: tarjeta.dedicatoria,
        descripcion_admin: tarjeta.descripcion_admin
      }
    });
  } catch (error) {
    console.error('Error al validar tarjeta regalo:', error);
    return res.status(500).json({ error: 'No se pudo validar el código.' });
  }
}

/**
 * PATCH /api/tarjetas/:codigo/canjear - El administrador marca una tarjeta regalo como canjeada
 */
async function canjearTarjetaAdmin(req, res) {
  try {
    await asegurarTablaTarjetas();
    const codigo = (req.params.codigo || '').trim().toUpperCase();
    const [resUpd] = await pool.query(
      "UPDATE tarjetas_regalo SET estado = 'canjeada' WHERE codigo = ? AND estado = 'activa'",
      [codigo]
    );
    if (resUpd.affectedRows === 0) {
      return res.status(404).json({ error: 'Código no encontrado o ya estaba canjeado.' });
    }
    return res.json({ mensaje: `Tarjeta Regalo ${codigo} marcada como canjeada.` });
  } catch (error) {
    return res.status(500).json({ error: 'No se pudo canjear la tarjeta.' });
  }
}

module.exports = {
  asegurarTablaTarjetas,
  comprarTarjetaRegalo,
  crearTarjetaAdmin,
  validarCodigoRegalo,
  canjearTarjetaAdmin
};
