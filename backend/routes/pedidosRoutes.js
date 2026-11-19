// ============================================================================
// RUTAS DE PEDIDOS (/api/pedidos)
// ============================================================================
const express = require('express');
const router = express.Router();
const { crearPedido, misPedidos } = require('../controllers/pedidosController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.post('/', verificarToken, crearPedido);    // Cliente: finalizar compra y descontar stock
router.get('/mios', verificarToken, misPedidos);  // Cliente: historial de pedidos

module.exports = router;
