// ============================================================================
// PIE DE PÁGINA (Redes, Contacto, Ubicación y Aviso Legal)
// ============================================================================
import { Link, useLocation } from 'react-router-dom';
import { MapPin, Phone, Mail, Instagram, Clock } from 'lucide-react';

export default function Footer() {
  const { pathname } = useLocation();

  // Ocultamos el pie de página público cuando estamos en el Panel Admin
  if (pathname.startsWith('/admin')) return null;

  return (
    <footer style={{ background: '#2e2a27', color: '#ede6dc', padding: '3.5rem 0 2rem', marginTop: '4rem' }}>
      <div className="contenedor grid-3" style={{ gap: '2rem' }}>
        {/* Columna 1: Esencia */}
        <div>
          <h3 style={{ color: '#fff', fontSize: '1.6rem', marginBottom: '0.75rem' }}>Aneca Evo</h3>
          <p style={{ color: '#cfc5b9', fontSize: '0.92rem' }}>
            Un refugio de calma para reconectar cuerpo, mente y alma a través de terapias conscientes y productos naturales de cercanía.
          </p>
        </div>

        {/* Columna 2: Contacto y Ubicación */}
        <div>
          <h4 style={{ color: '#fff', fontSize: '1.15rem', marginBottom: '0.75rem' }}>Contacto y Horario</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', color: '#cfc5b9' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={16} /> Calle de la Calma 18, Madrid
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Phone size={16} /> +34 600 111 222 (WhatsApp)
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mail size={16} /> hola@anecaevo.com
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={16} /> Lun-Vie 9:30-20:00 · Sáb 10:00-14:00
            </li>
          </ul>
        </div>

        {/* Columna 3: Enlaces y Aviso Legal */}
        <div>
          <h4 style={{ color: '#fff', fontSize: '1.15rem', marginBottom: '0.75rem' }}>Información</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.9rem', color: '#cfc5b9' }}>
            <li><Link to="/servicios">Terapias y Tarifas</Link></li>
            <li><Link to="/tienda">Tienda Natural</Link></li>
            <li><Link to="/sobre-mi#faq">Política de cancelación (24h)</Link></li>
            <li><Link to="/sobre-mi#espacio">Aviso legal y privacidad</Link></li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.3rem', color: '#e6ede7' }}>
              <Instagram size={16} /> @anecaevo.holistico
            </li>
          </ul>
        </div>
      </div>

      <div className="contenedor" style={{ borderTop: '1px solid rgba(255,255,255,0.12)', marginTop: '2rem', paddingTop: '1.25rem', fontSize: '0.84rem', color: '#a89f94', textAlign: 'center' }}>
        © {new Date().getFullYear()} Aneca Evo · Espacio Holístico. Todos los derechos reservados.
      </div>
    </footer>
  );
}
