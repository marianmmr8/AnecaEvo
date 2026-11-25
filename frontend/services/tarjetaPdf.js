// ============================================================================
// GENERADOR DE TARJETA REGALO IMPRIMIBLE / DESCARGABLE EN PDF
// ============================================================================

/**
 * Abre una vista diseñada en tonos tierra/calma lista para Guardar como PDF
 * con imagen de masaje, nombre del destinatario, dedicatoria y código de canje.
 */
function escaparHtml(texto) {
  return String(texto || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function descargarTarjetaRegaloPDF(tarjeta) {
  const ventana = window.open('', '_blank', 'width=900,height=700');
  if (!ventana) return;

  const destinatario = escaparHtml(tarjeta.nombre_destinatario || 'Para ti');
  const dedicatoria = escaparHtml(tarjeta.dedicatoria || 'Un momento de calma y bienestar para reconectar contigo.');
  const descripcion = escaparHtml(tarjeta.descripcion_admin || 'Experiencia holística en Aneca Evo');

  ventana.document.write(`
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>Tarjeta Regalo Aneca Evo - ${tarjeta.codigo}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,500&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet" />
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background: #f8f5f0;
            color: #2e2a27;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 24px;
          }
          .vale {
            width: 780px;
            background: #fffcf7;
            border: 2px solid #e2d9cd;
            border-radius: 22px;
            overflow: hidden;
            box-shadow: 0 18px 45px rgba(46, 42, 39, 0.12);
            display: grid;
            grid-template-columns: 310px 1fr;
          }
          .foto {
            width: 100%;
            height: 100%;
            min-height: 400px;
            object-fit: cover;
          }
          .contenido {
            padding: 36px 34px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .marca {
            font-family: 'Cormorant Garamond', serif;
            font-size: 28px;
            font-weight: 700;
            color: #a45d43;
            margin-bottom: 6px;
          }
          .etiqueta {
            display: inline-block;
            background: #e6ede7;
            color: #6b7f6e;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            padding: 4px 12px;
            border-radius: 999px;
            margin-bottom: 14px;
          }
          h1 {
            font-family: 'Cormorant Garamond', serif;
            font-size: 32px;
            line-height: 1.15;
            margin-bottom: 10px;
          }
          .descripcion {
            font-size: 14px;
            color: #665e57;
            margin-bottom: 16px;
          }
          .dedicatoria {
            background: #f8f5f0;
            border-left: 4px solid #a45d43;
            padding: 14px 16px;
            border-radius: 10px;
            font-style: italic;
            font-size: 15px;
            margin-bottom: 20px;
          }
          .caja-codigo {
            border: 1.5px dashed #a45d43;
            border-radius: 12px;
            padding: 12px 16px;
            text-align: center;
            background: #fdf8f2;
          }
          .caja-codigo small {
            display: block;
            font-size: 11px;
            color: #665e57;
            text-transform: uppercase;
            letter-spacing: 0.06em;
          }
          .caja-codigo strong {
            font-size: 22px;
            letter-spacing: 0.08em;
            color: #a45d43;
          }
          .pie {
            margin-top: 12px;
            font-size: 11px;
            color: #665e57;
            text-align: center;
          }
          @media print {
            body { background: #fff; padding: 0; }
            .vale { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="vale">
          <img
            class="foto"
            src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=900&q=80"
            alt="Masaje holístico Aneca Evo"
          />
          <div class="contenido">
            <div>
              <div class="marca">Aneca Evo</div>
              <span class="etiqueta">Tarjeta Regalo</span>
              <h1>Para ${destinatario}</h1>
              <p class="descripcion">${descripcion}</p>
              <div class="dedicatoria">“${dedicatoria}”</div>
            </div>
            <div>
              <div class="caja-codigo">
                <small>Código para canjear tu cita online</small>
                <strong>${tarjeta.codigo}</strong>
              </div>
              <p class="pie">
                Entra en <strong>anecaevo</strong> → <em>Reservar cita</em>, introduce este código y elige tu día y hora.
              </p>
            </div>
          </div>
        </div>
        <script>
          window.onload = function() { setTimeout(function() { window.print(); }, 450); };
        </script>
      </body>
    </html>
  `);
  ventana.document.close();
}
