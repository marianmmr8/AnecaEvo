// ============================================================================
// WIDGET ASISTENTE HOLÍSTICO CON IA (Recomendación personalizada del catálogo)
// ============================================================================
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageCircleHeart, Send, X } from 'lucide-react';
import { apiFetch } from '../../services/api';

export default function AsistenteHolistico() {
  const { pathname } = useLocation();
  const [abierto, setAbierto] = useState(false);
  const [consulta, setConsulta] = useState('');
  const [respuesta, setRespuesta] = useState(null);
  const [cargando, setCargando] = useState(false);

  // En el panel privado de administración ocultamos el asistente flotante de visitantes
  if (pathname.startsWith('/admin')) return null;

  async function enviarConsulta(e) {
    e.preventDefault();
    if (!consulta.trim()) return;
    setCargando(true);
    try {
      const res = await apiFetch('/asistente', {
        method: 'POST',
        body: JSON.stringify({ mensaje: consulta })
      });
      setRespuesta(res);
    } catch {
      setRespuesta({ respuesta: 'Ahora mismo no puedo consultar el catálogo, pero puedes explorar nuestras terapias.' });
    } finally {
      setCargando(false);
    }
  }

  return (
    <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 90 }}>
      {!abierto ? (
        <button
          type="button"
          className="btn btn-salvia"
          onClick={() => setAbierto(true)}
          style={{ boxShadow: 'var(--sombra-suave)' }}
        >
          <MessageCircleHeart size={18} /> ¿Te ayudo a elegir?
        </button>
      ) : (
        <div className="tarjeta" style={{ width: 'min(350px, 90vw)', padding: '1.1rem', boxShadow: 'var(--sombra-suave)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <strong style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem' }}>Guía Holístico IA</strong>
            <button type="button" className="icono-btn" style={{ width: 30, height: 30 }} onClick={() => setAbierto(false)}>
              <X size={16} />
            </button>
          </div>

          <p style={{ fontSize: '0.84rem', color: 'var(--texto-suave)', marginBottom: '0.75rem' }}>
            Cuéntame cómo te sientes (ej: "estoy muy estresado y no duermo bien" o "me duele la espalda").
          </p>

          <form onSubmit={enviarConsulta} style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <input
              type="text"
              placeholder="Escribe cómo te sientes..."
              value={consulta}
              onChange={(e) => setConsulta(e.target.value)}
              style={{ flex: 1, padding: '0.55rem 0.75rem', borderRadius: 10, border: '1px solid var(--borde-suave)' }}
            />
            <button type="submit" className="btn btn-primario" style={{ padding: '0.55rem 0.85rem' }} disabled={cargando}>
              <Send size={15} />
            </button>
          </form>

          {respuesta && (
            <div style={{ background: 'var(--bg-arena)', padding: '0.8rem', borderRadius: 10, fontSize: '0.86rem' }}>
              <p style={{ marginBottom: '0.5rem' }}>{respuesta.respuesta}</p>
              {respuesta.terapia_recomendada && (
                <div style={{ marginBottom: '0.35rem' }}>
                  <strong>Terapia:</strong>{' '}
                  <Link to="/reservar" style={{ color: 'var(--terracota)', textDecoration: 'underline' }}>
                    {respuesta.terapia_recomendada.nombre}
                  </Link>
                </div>
              )}
              {respuesta.producto_recomendado && (
                <div>
                  <strong>En tienda:</strong>{' '}
                  <Link to="/tienda" style={{ color: 'var(--salvia)', textDecoration: 'underline' }}>
                    {respuesta.producto_recomendado.nombre}
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
