// ============================================================================
// RUTA DEL ASISTENTE HOLÍSTICO CON IA (/api/asistente)
// ============================================================================
const express = require('express');
const router = express.Router();
const { recomendarConAsistente } = require('../controllers/asistenteController');

router.post('/', recomendarConAsistente); // Público: recomienda terapia y producto según síntomas

module.exports = router;
