// ============================================================================
// PÁGINA DE SERVICIOS (Agrupados por categorías + Venta Cruzada personalizada)
// ============================================================================
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Clock, Sparkles, ShoppingBag } from 'lucide-react';
import { apiFetch } from '../../services/api';
import { useCart } from '../../context/CartContext';

const CATEGORIAS = [
  { id: 'todas', label: 'Todas las terapias' },
  { id: 'masajes', label: 'Terapias Corporales (Masajes)' },
  { id: 'terapias_energeticas', label: 'Terapias Energéticas (Reiki)' },
  { id: 'crecimiento_alma', label: 'Crecimiento y Alma' }
];

export default function ServiciosPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoriaActual = searchParams.get('cat') || 'todas';
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const { agregarProducto } = useCart();

  useEffect(() => {
    apiFetch('/servicios')
      .then((res) => setServicios(res.servicios || []))
      .finally(() => setCargando(false));
  }, []);

  const filtrados = categoriaActual === 'todas'
    ? servicios
    : servicios.filter((s) => s.categoria === categoriaActual);

  return (
    <div className="seccion">
      <div className="contenedor">
        <div style={{ marginBottom: '2.5rem' }}>
          <span className="etiqueta" style={{ marginBottom: '0.6rem' }}>Carta de Terapias</span>
          <h1 style={{ fontSize: '2.8rem', marginBottom: '0.6rem' }}>Servicios y Acompañamientos</h1>
          <p style={{ color: 'var(--texto-suave)', maxWidth: '680px', marginBottom: '1rem' }}>
            Elige el acompañamiento que tu cuerpo o tu alma necesitan hoy. En cada terapia te sugerimos también productos naturales de nuestra tienda para prolongar sus beneficios en casa.
          </p>
          <Link to="/bonos" className="btn btn-salvia" style={{ padding: '0.5rem 1.1rem', fontSize: '0.88rem' }}>
            🎟️ Ver Bonos de Sesiones con descuento
          </Link>
        </div>

        {/* Filtros por categoría */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '2rem' }}>
          {CATEGORIAS.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSearchParams(cat.id === 'todas' ? {} : { cat: cat.id })}
              className={`btn ${categoriaActual === cat.id ? 'btn-primario' : 'btn-suave'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {cargando ? (
          <p>Cargando terapias...</p>
        ) : (
          <div className="grid-2" style={{ gap: '2rem' }}>
            {filtrados.map((servicio) => (
              <article key={servicio.id} className="tarjeta" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  {servicio.imagen_url && (
                    <img
                      src={servicio.imagen_url}
                      alt={servicio.nombre}
                      style={{ width: '100%', height: '220px', objectFit: 'cover' }}
                    />
                  )}
                  <div style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span className="etiqueta">{servicio.modalidad}</span>
                      <strong style={{ fontSize: '1.35rem', color: 'var(--terracota)' }}>
                        {Number(servicio.precio).toFixed(2)} €
                      </strong>
                    </div>
                    <h2 style={{ fontSize: '1.65rem', marginBottom: '0.5rem' }}>{servicio.nombre}</h2>
                    <p style={{ color: 'var(--texto-suave)', fontSize: '0.95rem', marginBottom: '1rem' }}>
                      {servicio.descripcion}
                    </p>
                    <div style={{ display: 'flex', gap: '1.2rem', fontSize: '0.85rem', color: 'var(--texto-suave)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={15} /> {servicio.duracion_minutos} min sesión
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Sparkles size={15} /> +{servicio.margen_descanso_minutos} min pausa sala
                      </span>
                    </div>

                    {/* Venta cruzada: Productos recomendados para esta terapia */}
                    {servicio.productos_recomendados?.length > 0 && (
                      <div style={{ marginTop: '1.2rem', paddingTop: '1rem', borderTop: '1px dashed var(--borde-suave)' }}>
                        <strong style={{ fontSize: '0.82rem', color: 'var(--salvia)', textTransform: 'uppercase' }}>
                          Complemento recomendado en tienda:
                        </strong>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                          {servicio.productos_recomendados.map((prod) => (
                            <button
                              key={prod.id}
                              type="button"
                              className="btn btn-suave"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                              onClick={() => agregarProducto(prod)}
                            >
                              <ShoppingBag size={13} /> {prod.nombre} ({Number(prod.precio).toFixed(2)}€)
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ padding: '0 1.5rem 1.5rem' }}>
                  <Link to={`/reservar?servicio=${servicio.id}`} className="btn btn-primario" style={{ width: '100%' }}>
                    Reservar esta terapia
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
