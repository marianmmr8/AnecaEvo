// ============================================================================
// PÁGINA SOBRE MÍ (Historia, Formación y Linaje, El Espacio y FAQ)
// ============================================================================
export default function SobreMiPage() {
  return (
    <div className="seccion">
      <div className="contenedor" style={{ maxWidth: '880px' }}>
        <span className="etiqueta" style={{ marginBottom: '0.8rem' }}>Sobre mí</span>
        <h1 style={{ fontSize: '2.8rem', marginBottom: '1.5rem' }}>Hola, soy Elena · Fundadora de Aneca Evo</h1>

        <section id="historia" className="tarjeta" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.9rem', marginBottom: '0.75rem' }}>Mi historia</h2>
          <p style={{ color: 'var(--texto-suave)' }}>
            Aneca Evo nació tras más de diez años acompañando procesos de sanación física y emocional. Entendí que el cuerpo guarda la memoria de lo que callamos y que, cuando le ofrecemos un espacio seguro, cálido y sin prisas, sabe exactamente cómo volver al equilibrio.
          </p>
        </section>

        <section id="formacion" className="tarjeta" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.9rem', marginBottom: '0.75rem' }}>Formación y linaje</h2>
          <ul style={{ paddingLeft: '1.25rem', color: 'var(--texto-suave)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>Quiromasaje Terapéutico y Aromaterapia Clínica.</li>
            <li>Maestría en Reiki Usui Tradicional Japonés (linaje directo).</li>
            <li>Lectora certificada de Registros Akáshicos y Terapia Regresiva Consciente.</li>
          </ul>
        </section>

        <section id="espacio" className="tarjeta" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.9rem', marginBottom: '0.75rem' }}>El espacio</h2>
          <p style={{ color: 'var(--texto-suave)' }}>
            Nuestra sala está diseñada con materiales nobles, luz cálida, difusión de aceites ecológicos y ventilación natural. Entre cada cliente reservamos automáticamente un margen de 15 a 30 minutos para limpiar energéticamente el espacio y preparar cada detalle para ti.
          </p>
        </section>

        <section id="faq" className="tarjeta" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.9rem', marginBottom: '1rem' }}>Preguntas frecuentes</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--texto-suave)' }}>
            <div>
              <strong style={{ color: 'var(--texto-principal)' }}>¿Cuál es la política de cancelación?</strong>
              <p>Puedes cancelar o reprogramar tu cita desde "Mi cuenta" con al menos 24 horas de antelación.</p>
            </div>
            <div>
              <strong style={{ color: 'var(--texto-principal)' }}>¿Por qué pedís un cuestionario previo (Anamnesis)?</strong>
              <p>Para conocer posibles alergias a aceites esenciales, lesiones o embarazo antes de tu primera sesión y adaptar la terapia con total seguridad.</p>
            </div>
            <div>
              <strong style={{ color: 'var(--texto-principal)' }}>¿Tenéis bonos o tarjetas regalo?</strong>
              <p>Sí, puedes adquirir bonos de 5 sesiones o tarjetas regalo; aparecerán directamente en tu cuenta para canjearlos al reservar.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
