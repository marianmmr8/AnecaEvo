// ============================================================================
// PÁGINA DE INICIO (Portada, Esencia del Centro y Accesos Rápidos)
// ============================================================================
import { Link } from 'react-router-dom';
import { Calendar, Sparkles, ShoppingBag, HeartHandshake } from 'lucide-react';

export default function InicioPage() {
  return (
    <div>
      {/* Hero / Portada serena */}
      <section style={{ background: 'linear-gradient(135deg, #f8f5f0 0%, #ede6dc 100%)', padding: '5rem 0' }}>
        <div className="contenedor grid-2" style={{ alignItems: 'center', gap: '3rem' }}>
          <div>
            <span className="etiqueta" style={{ marginBottom: '1rem' }}>Centro Holístico & Tienda Natural</span>
            <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.8rem)', marginBottom: '1.2rem' }}>
              Un espacio de calma para volver a tu centro.
            </h1>
            <p style={{ fontSize: '1.08rem', color: 'var(--texto-suave)', marginBottom: '2rem' }}>
              En <strong>Aneca Evo</strong> acompañamos tu bienestar integral a través de masajes terapéuticos, Reiki Usui, lectura de Registros Akáshicos y remedios naturales seleccionados con conciencia.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              <Link to="/reservar" className="btn btn-primario">
                <Calendar size={18} /> Reservar tu sesión
              </Link>
              <Link to="/servicios" className="btn btn-contorno">
                Explorar terapias
              </Link>
            </div>
          </div>

          <div className="tarjeta" style={{ borderRadius: '24px', overflow: 'hidden' }}>
            <img
              src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80"
              alt="Sala de terapias holísticas Aneca Evo"
              style={{ width: '100%', height: '420px', objectFit: 'cover' }}
            />
          </div>
        </div>
      </section>

      {/* Accesos rápidos por afinidad */}
      <section className="seccion">
        <div className="contenedor">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3rem' }}>
            <h2 style={{ fontSize: '2.4rem', marginBottom: '0.6rem' }}>Nuestra esencia</h2>
            <p style={{ color: 'var(--texto-suave)' }}>
              Cuidamos cada detalle: desde el margen de descanso entre citas para armonizar la sala, hasta la pureza de cada aceite esencial.
            </p>
          </div>

          <div className="grid-3">
            <div className="tarjeta" style={{ padding: '1.8rem' }}>
              <HeartHandshake size={28} color="var(--terracota)" style={{ marginBottom: '0.8rem' }} />
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Terapias Corporales</h3>
              <p style={{ color: 'var(--texto-suave)', fontSize: '0.94rem', marginBottom: '1rem' }}>
                Masajes relajantes con aromaterapia y descontracturantes profundos para liberar el cuerpo.
              </p>
              <Link to="/servicios?cat=masajes" style={{ color: 'var(--terracota)', fontWeight: 600 }}>
                Ver masajes →
              </Link>
            </div>

            <div className="tarjeta" style={{ padding: '1.8rem' }}>
              <Sparkles size={28} color="var(--salvia)" style={{ marginBottom: '0.8rem' }} />
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Energía y Alma</h3>
              <p style={{ color: 'var(--texto-suave)', fontSize: '0.94rem', marginBottom: '1rem' }}>
                Reiki Usui, cuencos tibetanos, Registros Akáshicos y regresiones conscientes presenciales u online.
              </p>
              <Link to="/servicios?cat=terapias_energeticas" style={{ color: 'var(--salvia)', fontWeight: 600 }}>
                Ver terapias energéticas →
              </Link>
            </div>

            <div className="tarjeta" style={{ padding: '1.8rem' }}>
              <ShoppingBag size={28} color="var(--oro-suave)" style={{ marginBottom: '0.8rem' }} />
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Tienda Botánica</h3>
              <p style={{ color: 'var(--texto-suave)', fontSize: '0.94rem', marginBottom: '1rem' }}>
                Aceites esenciales puros, bálsamos, infusiones nocturnas, especias y libros recomendados.
              </p>
              <Link to="/tienda" style={{ color: 'var(--terracota)', fontWeight: 600 }}>
                Visitar tienda →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
