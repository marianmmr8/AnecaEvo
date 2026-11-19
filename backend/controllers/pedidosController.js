// ============================================================================
// CONTROLADOR DE PEDIDOS (Compra en tienda con descuento automático de stock)
// ============================================================================
const { randomUUID } = require('crypto');
const { pool } = require('../config/db');
const { procesarPago } = require('../services/pagoService');

/**
 * POST /api/pedidos - Crea un pedido verificando y restando el stock dentro de una transacción
 */
async function crearPedido(req, res) {
  const conexion = await pool.getConnection();
  try {
    const { items, direccion_envio, metodo_pago } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'El carrito está vacío.' });
    }
    if (!direccion_envio || direccion_envio.trim().length < 5) {
      return res.status(400).json({ error: 'Indica una dirección de envío válida.' });
    }

    await conexion.beginTransaction(); // Iniciamos transacción para garantizar integridad de stock

    let total = 0;
    const detallesValidados = [];

    for (const item of items) {
      const cantidad = Number(item.cantidad);
      if (!item.producto_id || cantidad <= 0) {
        await conexion.rollback();
        return res.status(400).json({ error: 'Cantidad o producto no válido en el carrito.' });
      }

      // Bloqueamos la fila del producto (FOR UPDATE) para evitar ventas simultáneas sin stock
      const [filas] = await conexion.query(
        'SELECT id, nombre, precio, stock, activo FROM productos WHERE id = ? FOR UPDATE',
        [item.producto_id]
      );

      if (filas.length === 0 || !filas[0].activo) {
        await conexion.rollback();
        return res.status(404).json({ error: 'Uno de los productos ya no está disponible.' });
      }

      const prod = filas[0];
      if (prod.stock < cantidad) {
        await conexion.rollback();
        return res.status(409).json({
          error: `Stock insuficiente para "${prod.nombre}". Disponible: ${prod.stock} uds.`
        });
      }

      // Restamos el stock en la tabla productos
      await conexion.query('UPDATE productos SET stock = stock - ? WHERE id = ?', [cantidad, prod.id]);

      const subtotal = Number(prod.precio) * cantidad;
      total += subtotal;
      detallesValidados.push({ producto_id: prod.id, cantidad, precio_unitario: prod.precio });
    }

    // Procesamos el pago mediante la pasarela
    const pago = await procesarPago({
      importe: total,
      metodo: metodo_pago || 'tarjeta',
      concepto: `Pedido Tienda Aneca Evo (${detallesValidados.length} productos)`
    });

    const pedidoId = randomUUID();
    await conexion.query(
      `INSERT INTO pedidos (id, usuario_id, total, estado, direccion_envio, metodo_pago, referencia_pago)
       VALUES (?, ?, ?, 'pagado', ?, ?, ?)`,
      [pedidoId, req.usuario.id, total.toFixed(2), direccion_envio.trim(), pago.metodo, pago.referencia]
    );

    // Insertamos cada línea en detalle_pedidos
    for (const det of detallesValidados) {
      await conexion.query(
        'INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
        [pedidoId, det.producto_id, det.cantidad, det.precio_unitario]
      );
    }

    await conexion.commit();
    return res.status(201).json({
      mensaje: '¡Pedido confirmado! Tu paquete holístico está en preparación.',
      pedido: { id: pedidoId, total: Number(total.toFixed(2)), estado: 'pagado', referencia_pago: pago.referencia }
    });
  } catch (error) {
    await conexion.rollback();
    console.error('Error al crear pedido:', error);
    return res.status(500).json({ error: 'No se pudo procesar el pedido.' });
  } finally {
    conexion.release();
  }
}

/**
 * GET /api/pedidos/mios - Lista los pedidos del usuario autenticado con sus líneas de detalle
 */
async function misPedidos(req, res) {
  try {
    const [pedidos] = await pool.query(
      'SELECT * FROM pedidos WHERE usuario_id = ? ORDER BY fecha_pedido DESC',
      [req.usuario.id]
    );

    for (const pedido of pedidos) {
      const [detalles] = await pool.query(
        `SELECT dp.*, p.nombre AS producto_nombre, p.imagen_url
         FROM detalle_pedidos dp
         JOIN productos p ON dp.producto_id = p.id
         WHERE dp.pedido_id = ?`,
        [pedido.id]
      );
      pedido.detalles = detalles;
    }

    return res.json({ pedidos });
  } catch (error) {
    console.error('Error al cargar mis pedidos:', error);
    return res.status(500).json({ error: 'Error al cargar tus pedidos.' });
  }
}

module.exports = { crearPedido, misPedidos };
