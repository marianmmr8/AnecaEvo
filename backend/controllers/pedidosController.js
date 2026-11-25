// ============================================================================
// CONTROLADOR DE PEDIDOS (Compra en tienda con descuento automático de stock)
// ============================================================================
const { randomUUID } = require('crypto');
const { pool } = require('../config/db');
const { procesarPago } = require('../services/pagoService');
const { enviarConfirmacionPedido } = require('../services/emailService');

let columnaNotaPedidoVerificada = false;
async function asegurarColumnaNotaPedido() {
  // La columna nota_cliente_cambio ya está incluida en aneca_evo_postgres.sql
  columnaNotaPedidoVerificada = true;
}

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

/**
 * GET /api/pedidos/admin - Lista todos los pedidos de la tienda (Solo Admin)
 */
async function listarTodosPedidos(req, res) {
  try {
    const [pedidos] = await pool.query(
      `SELECT p.*, u.nombre AS cliente_nombre, u.apellidos AS cliente_apellidos, u.email AS cliente_email, u.telefono AS cliente_telefono
       FROM pedidos p
       JOIN usuarios u ON p.usuario_id = u.id
       ORDER BY p.fecha_pedido DESC`
    );

    for (const pedido of pedidos) {
      const [detalles] = await pool.query(
        `SELECT dp.*, pr.nombre AS producto_nombre
         FROM detalle_pedidos dp
         JOIN productos pr ON dp.producto_id = pr.id
         WHERE dp.pedido_id = ?`,
        [pedido.id]
      );
      pedido.detalles = detalles;
    }

    return res.json({ pedidos });
  } catch (error) {
    console.error('Error al listar pedidos admin:', error);
    return res.status(500).json({ error: 'Error al cargar los pedidos.' });
  }
}

/**
 * PATCH /api/pedidos/:id/confirmar - El administrador acepta el pedido y avisa al cliente (Solo Admin)
 */
async function confirmarPedidoAdmin(req, res) {
  try {
    const { id } = req.params;
    const { estado = 'preparando' } = req.body;

    await pool.query('UPDATE pedidos SET estado = ? WHERE id = ?', [estado, id]);

    const [filas] = await pool.query(
      `SELECT p.id, p.total, u.email, u.nombre
       FROM pedidos p
       JOIN usuarios u ON p.usuario_id = u.id
       WHERE p.id = ?`,
      [id]
    );
    if (filas.length > 0) {
      const info = filas[0];
      enviarConfirmacionPedido({
        email: info.email,
        nombre: info.nombre,
        pedidoId: info.id,
        total: info.total
      }).catch(() => { });
    }

    return res.json({ mensaje: 'Pedido confirmado y notificación enviada al cliente.' });
  } catch (error) {
    console.error('Error al confirmar pedido:', error);
    return res.status(500).json({ error: 'No se pudo confirmar el pedido.' });
  }
}

/**
 * PATCH /api/pedidos/:id/modificar - Permite al cliente modificar dirección/notas en las primeras 12 horas
 */
async function modificarPedidoCliente(req, res) {
  try {
    await asegurarColumnaNotaPedido();
    const { id } = req.params;
    const { direccion_envio } = req.body;
    if (!direccion_envio || direccion_envio.trim().length < 5) {
      return res.status(400).json({ error: 'Indica una dirección de envío válida.' });
    }

    const [filas] = await pool.query('SELECT * FROM pedidos WHERE id = ? AND usuario_id = ?', [id, req.usuario.id]);
    if (filas.length === 0) return res.status(404).json({ error: 'Pedido no encontrado.' });

    const pedido = filas[0];
    const horasTranscurridas = (Date.now() - new Date(pedido.fecha_pedido).getTime()) / (1000 * 60 * 60);
    if (horasTranscurridas > 12 || ['enviado', 'entregado', 'cancelado'].includes(pedido.estado)) {
      return res.status(400).json({ error: 'Solo se puede modificar el pedido durante las primeras 12 horas.' });
    }

    const ahora = new Date();
    const fechaTxt = `${ahora.toLocaleDateString('es-ES')} ${ahora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    const aviso = `Dirección/datos modificados por el cliente el ${fechaTxt}`;

    await pool.query('UPDATE pedidos SET direccion_envio = ?, nota_cliente_cambio = ? WHERE id = ?', [direccion_envio.trim(), aviso, id]);
    return res.json({ mensaje: 'Datos de envío del pedido actualizados.' });
  } catch (error) {
    return res.status(500).json({ error: 'No se pudo modificar el pedido.' });
  }
}

/**
 * PATCH /api/pedidos/:id/cancelar - Cancela el pedido en las primeras 12 horas y devuelve el stock
 */
async function cancelarPedidoCliente(req, res) {
  const conexion = await pool.getConnection();
  try {
    await asegurarColumnaNotaPedido();
    const { id } = req.params;
    const { motivo } = req.body;
    const [filas] = await conexion.query('SELECT * FROM pedidos WHERE id = ? AND usuario_id = ?', [id, req.usuario.id]);
    if (filas.length === 0) return res.status(404).json({ error: 'Pedido no encontrado.' });

    const pedido = filas[0];
    const horasTranscurridas = (Date.now() - new Date(pedido.fecha_pedido).getTime()) / (1000 * 60 * 60);
    if (horasTranscurridas > 12 || ['enviado', 'entregado', 'cancelado'].includes(pedido.estado)) {
      return res.status(400).json({ error: 'Solo se puede cancelar el pedido durante las primeras 12 horas.' });
    }

    await conexion.beginTransaction();
    const [detalles] = await conexion.query('SELECT producto_id, cantidad FROM detalle_pedidos WHERE pedido_id = ?', [id]);
    for (const det of detalles) {
      await conexion.query('UPDATE productos SET stock = stock + ? WHERE id = ?', [det.cantidad, det.producto_id]);
    }
    const ahora = new Date();
    const fechaTxt = `${ahora.toLocaleDateString('es-ES')} ${ahora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    const aviso = `Cancelado por el cliente (${fechaTxt})${motivo ? ` · Motivo: ${motivo}` : ''}`;

    await conexion.query("UPDATE pedidos SET estado = 'cancelado', nota_cliente_cambio = ? WHERE id = ?", [aviso, id]);
    await conexion.commit();

    return res.json({ mensaje: 'Pedido cancelado correctamente.' });
  } catch (error) {
    await conexion.rollback();
    return res.status(500).json({ error: 'No se pudo cancelar el pedido.' });
  } finally {
    conexion.release();
  }
}

module.exports = {
  crearPedido,
  misPedidos,
  listarTodosPedidos,
  confirmarPedidoAdmin,
  modificarPedidoCliente,
  cancelarPedidoCliente
};
