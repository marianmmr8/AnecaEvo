// ============================================================================
// RUTAS DE TARJETAS REGALO (/api/tarjetas)
// ============================================================================
const express = require('express');
const router = express.Router();
const { comprarTarjetaRegalo, crearTarjetaAdmin, validarCodigoRegalo, canjearTarjetaAdmin } = require('../controllers/tarjetasController');
const { verificarToken, soloAdmin } = require('../middlewares/authMiddleware');

router.post('/comprar', verificarToken, comprarTarjetaRegalo);          // Cliente: comprar tarjeta regalo en tienda
router.post('/admin', verificarToken, soloAdmin, crearTarjetaAdmin);    // Admin: crear tarjeta regalo con descripción
router.get('/validar/:codigo', verificarToken, validarCodigoRegalo);    // Cliente: validar código al reservar cita
router.patch('/:codigo/canjear', verificarToken, soloAdmin, canjearTarjetaAdmin); // Admin: marcar código como canjeado

module.exports = router;
