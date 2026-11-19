// ============================================================================
// CONTROLADOR DE ASISTENTE HOLÍSTICO CON IA (Recomendador basado en catálogo real)
// ============================================================================
const { pool } = require('../config/db');

/**
 * POST /api/asistente - Analiza la consulta del visitante y recomienda terapias y productos
 * directamente desde la base de datos `aneca evo`.
 */
async function recomendarConAsistente(req, res) {
  try {
    const { mensaje = '' } = req.body;
    const texto = mensaje.toLowerCase();

    const [servicios] = await pool.query('SELECT id, nombre, slug, categoria, precio, duracion_minutos FROM servicios WHERE activo = TRUE');
    const [productos] = await pool.query('SELECT id, nombre, slug, categoria, precio, stock FROM productos WHERE activo = TRUE AND stock > 0');

    let terapiaSugerida = servicios[0] || null;
    let productoSugerido = productos[0] || null;
    let consejo = 'Te invitamos a regalarte un momento de pausa consciente.';

    if (texto.includes('estres') || texto.includes('estrés') || texto.includes('duermo') || texto.includes('dormir') || texto.includes('insomnio') || texto.includes('ansiedad')) {
      terapiaSugerida = servicios.find((s) => s.slug.includes('relajante') || s.categoria === 'terapias_energeticas') || terapiaSugerida;
      productoSugerido = productos.find((p) => p.slug.includes('lavanda') || p.slug.includes('suenos') || p.categoria === 'infusiones') || productoSugerido;
      consejo = 'Para calmar el sistema nervioso y mejorar el descanso, lo ideal es combinar una terapia suave con aromaterapia nocturna o una tisana relajante.';
    } else if (texto.includes('espalda') || texto.includes('dolor') || texto.includes('contractura') || texto.includes('muscul') || texto.includes('cuello')) {
      terapiaSugerida = servicios.find((s) => s.slug.includes('descontracturante') || s.categoria === 'masajes') || terapiaSugerida;
      productoSugerido = productos.find((p) => p.slug.includes('arnica') || p.slug.includes('curcuma') || p.categoria === 'cremas') || productoSugerido;
      consejo = 'Para liberar sobrecargas musculares te vendrá genial un trabajo corporal profundo acompañado de bálsamo de árnica y caléndula en casa.';
    } else if (texto.includes('proposito') || texto.includes('propósito') || texto.includes('alma') || texto.includes('bloqueo') || texto.includes('akash') || texto.includes('regres')) {
      terapiaSugerida = servicios.find((s) => s.categoria === 'crecimiento_alma') || terapiaSugerida;
      productoSugerido = productos.find((p) => p.categoria === 'libros') || productoSugerido;
      consejo = 'Cuando buscas claridad interior o comprender patrones emocionales, las terapias de crecimiento del alma ofrecen respuestas muy profundas.';
    }

    return res.json({
      respuesta: consejo,
      terapia_recomendada: terapiaSugerida,
      producto_recomendado: productoSugerido
    });
  } catch (error) {
    console.error('Error en asistente:', error);
    return res.status(500).json({ error: 'El asistente no pudo responder en este momento.' });
  }
}

module.exports = { recomendarConAsistente };
