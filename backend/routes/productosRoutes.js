// ============================================================================
// RUTAS DE PRODUCTOS (/api/productos)
// ============================================================================
const express = require('express');
const router = express.Router();
const { listarProductos, crearProducto, actualizarProducto, eliminarProducto, subirImagenProducto } = require('../controllers/productosController');
const { verificarToken, soloAdmin } = require('../middlewares/authMiddleware');

router.get('/', listarProductos);                                                // Público: catálogo con filtros
router.post('/subir-imagen', verificarToken, soloAdmin, subirImagenProducto);    // Admin: subir foto del producto
router.post('/', verificarToken, soloAdmin, crearProducto);                      // Admin: añadir producto
router.put('/:id', verificarToken, soloAdmin, actualizarProducto);               // Admin: editar producto o stock
router.delete('/:id', verificarToken, soloAdmin, eliminarProducto);              // Admin: eliminar o retirar producto

module.exports = router;
