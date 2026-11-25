// ============================================================================
// PÁGINA DEDICADA DE TARJETAS REGALO (/tarjetas-regalo)
// ============================================================================
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Download } from 'lucide-react';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { descargarTarjetaRegaloPDF } from '../../services/tarjetaPdf';

export default function TarjetasRegaloPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [servicios, setServicios] = useState([]);
  const [regaloServId, setRegaloServId] = useState('');
  const [regaloImporte, setRegaloImporte] = useState('55');
  const [regaloPara, setRegaloPara] = useState('');
  const [regaloDedicatoria, setRegaloDedicatoria] = useState('');
  const [regaloCreada, setRegaloCreada] = useState(null);
  const [regaloError, setRegaloError] = useState('');

  useEffect(() => {
    apiFetch('/servicios').then((res) => setServicios(res.servicios || [])).catch(() => {});
  }, []);

  async function comprarTarjeta(e) {
    e.preventDefault();
    setRegaloError('');
    if (!usuario) {
      navigate('/mi-cuenta', { state: { aviso: 'Inicia sesión o regístrate para comprar una Tarjeta Regalo.' } });
      return;
    }
    try {
      const res = await apiFetch('/tarjetas/comprar', {
        method: 'POST',
        body: JSON.stringify({
          servicio_id: regaloServId || null,
          precio_maximo: Number(regaloImporte),
          nombre_destinatario: regaloPara,
          dedicatoria: regaloDedicatoria
        })
      });
      setRegaloCreada(res.tarjeta);
      setRegaloPara('');
      setRegaloDedicatoria('');
    } catch (err) {
      setRegaloError(err.message);
    }
  }

  return (
    <div className="seccion">
      <div className="contenedor" style={{ maxWidth: '820px' }}>
        <span className="etiqueta" style={{ marginBottom: '0.6rem' }}>Regala Bienestar</span>
        <h1 style={{ fontSize: '2.7rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Gift size={30} color="var(--terracota)" /> Tarjetas Regalo Aneca Evo
        </h1>
        <p style={{ color: 'var(--texto-suave)', marginBottom: '2rem' }}>
          Elige un masaje o terapia concreta, o deja que la persona elija dentro del mismo valor. Recibirás un código único para entregarle; al canjearlo en su cuenta <strong>no verá el precio</strong>.
        </p>

        <div className="tarjeta" style={{ padding: '2rem', background: '#fdf8f2' }}>
          {regaloError && <div className="alerta-error">{regaloError}</div>}

          {regaloCreada ? (
            <div className="alerta-exito">
              <strong>¡Tarjeta Regalo lista!</strong> Entrega este código a <strong>{regaloCreada.nombre_destinatario || 'tu persona especial'}</strong>:{' '}
              <span style={{ fontSize: '1.15rem', fontWeight: 700 }}>{regaloCreada.codigo}</span>
              <div style={{ marginTop: '0.9rem', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-primario"
                  onClick={() => descargarTarjetaRegaloPDF(regaloCreada)}
                >
                  <Download size={16} /> Descargar Tarjeta Regalo (PDF)
                </button>
                <button type="button" className="btn btn-suave" onClick={() => setRegaloCreada(null)}>
                  Comprar otra tarjeta regalo
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={comprarTarjeta}>
              <div className="grid-2">
                <div className="campo">
                  <label>¿Qué quieres regalar?</label>
                  <select
                    value={regaloServId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRegaloServId(val);
                      if (val) {
                        const s = servicios.find((x) => String(x.id) === val);
                        if (s) setRegaloImporte(String(s.precio));
                      }
                    }}
                  >
                    <option value="">A elección de la persona (según importe)</option>
                    {servicios.map((s) => (
                      <option key={s.id} value={s.id}>{s.nombre} — {Number(s.precio).toFixed(2)} €</option>
                    ))}
                  </select>
                </div>

                {!regaloServId ? (
                  <div className="campo">
                    <label>Nivel de regalo (terapias incluidas hasta ese precio)</label>
                    <select value={regaloImporte} onChange={(e) => setRegaloImporte(e.target.value)}>
                      <option value="55">55 € — Masajes esenciales / Reiki</option>
                      <option value="65">65 € — Maderoterapia / Descontracturante</option>
                      <option value="75">75 € — Registros Akáshicos / Ritual completo</option>
                      <option value="90">90 € — Experiencia Premium / Regresión</option>
                    </select>
                  </div>
                ) : (
                  <div className="campo">
                    <label>Nombre de quien recibe el regalo</label>
                    <input type="text" required placeholder="Ej: María" value={regaloPara} onChange={(e) => setRegaloPara(e.target.value)} />
                  </div>
                )}
              </div>

              {!regaloServId && (
                <div className="campo">
                  <label>Nombre de quien recibe el regalo</label>
                  <input type="text" required placeholder="Ej: María" value={regaloPara} onChange={(e) => setRegaloPara(e.target.value)} />
                </div>
              )}

              <div className="campo">
                <label>Dedicatoria personalizada</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Escribe unas palabras bonitas para acompañar tu regalo..."
                  value={regaloDedicatoria}
                  onChange={(e) => setRegaloDedicatoria(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primario">
                {usuario ? `Comprar Tarjeta Regalo (${Number(regaloImporte).toFixed(2)} €)` : 'Inicia sesión para regalar'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
