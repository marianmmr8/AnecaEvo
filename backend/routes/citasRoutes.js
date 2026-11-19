// ============================================================================
// RUTAS DE CITAS Y AGENDA (/api/citas)
// ============================================================================
const express = require('express');
const router = express.Router();
const {
  obtenerHorasLibres, crearCita, misCitas, cancelarCita,
  listarTodasCitas, actualizarEstadoCita, listarBloqueos, crearBloqueo, eliminarBloqueo
} = require('../controllers/citasController');
const { verificarToken, soloAdmin } = require('../middlewares/authMiddleware');

router.get('/disponibilidad', obtenerHorasLibres);                               // Público: calcular huecos libres con buffer
router.post('/', verificarToken, crearCita);                                     // Cliente: confirmar cita
router.get('/mias', verificarToken, misCitas);                                   // Cliente: ver mis citas
router.patch('/:id/cancelar', verificarToken, cancelarCita);                     // Cliente/Admin: cancelar cita (regla 24h)

// Rutas exclusivas de administración
router.get('/admin', verificarToken, soloAdmin, listarTodasCitas);               // Admin: toda la agenda
router.patch('/:id/estado', verificarToken, soloAdmin, actualizarEstadoCita);    // Admin: cambiar estado o pago
router.get('/bloqueos', verificarToken, soloAdmin, listarBloqueos);              // Admin: ver días bloqueados
router.post('/bloqueos', verificarToken, soloAdmin, crearBloqueo);               // Admin: bloquear festivos/vacaciones
router.delete('/bloqueos/:id', verificarToken, soloAdmin, eliminarBloqueo);      // Admin: quitar bloqueo

module.exports = router;
