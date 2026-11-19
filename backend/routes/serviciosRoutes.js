// ============================================================================
// RUTAS DE SERVICIOS (/api/servicios)
// ============================================================================
const express = require('express');
const router = express.Router();
const { listarServicios, crearServicio, actualizarServicio } = require('../controllers/serviciosController');
const { verificarToken, soloAdmin } = require('../middlewares/authMiddleware');

router.get('/', listarServicios);                                       // Público: ver terapias y venta cruzada
router.post('/', verificarToken, soloAdmin, crearServicio);             // Admin: crear nueva terapia
router.put('/:id', verificarToken, soloAdmin, actualizarServicio);      // Admin: editar terapia

module.exports = router;
