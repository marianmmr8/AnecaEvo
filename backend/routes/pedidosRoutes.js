// ============================================================================
// RUTAS DE PEDIDOS (/api/pedidos)
// ============================================================================
const express = require('express');
const router = express.Router();
const {
  crearPedido,
  misPedidos,
  listarTodosPedidos,
  confirmarPedidoAdmin,
  modificarPedidoCliente,
  cancelarPedidoCliente
} = require('../controllers/pedidosController');
const { verificarToken, soloAdmin } = require('../middlewares/authMiddleware');

router.post('/', verificarToken, crearPedido);                               // Cliente: finalizar compra y descontar stock
router.get('/mios', verificarToken, misPedidos);                             // Cliente: historial de pedidos
router.patch('/:id/modificar', verificarToken, modificarPedidoCliente);      // Cliente: modificar envío (primeras 12h)
router.patch('/:id/cancelar', verificarToken, cancelarPedidoCliente);        // Cliente: cancelar pedido (primeras 12h)
router.get('/admin', verificarToken, soloAdmin, listarTodosPedidos);         // Admin: ver todos los pedidos
router.patch('/:id/confirmar', verificarToken, soloAdmin, confirmarPedidoAdmin); // Admin: confirmar pedido y avisar

module.exports = router;
