// ============================================================================
// BARRA DE NAVEGACIÓN PRINCIPAL CON DESPLEGABLES (UX Tranquila y Clara)
// ============================================================================
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, ShoppingBag, User, Menu, X, Sparkles, Shield, LogOut, ArrowLeft, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { apiFetch } from '../../services/api';

export default function Navbar() {
  const { usuario, cerrarSesion } = useAuth();
  const { totalUnidades, setAbierto } = useCart();
  const [menuMovil, setMenuMovil] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Detectamos si estamos dentro del Panel de Administración para mostrar una cabecera limpia
  const enPanelAdmin = pathname.startsWith('/admin');
  const [alertasAdmin, setAlertasAdmin] = useState([]);
  const [verAlertas, setVerAlertas] = useState(false);

  useEffect(() => {
    if (!enPanelAdmin || usuario?.rol !== 'admin') return;
    Promise.all([
      apiFetch('/pedidos/admin').catch(() => ({ pedidos: [] })),
      apiFetch('/citas/admin').catch(() => ({ citas: [] }))
    ]).then(([resP, resC]) => {
      const lista = [];
      (resP.pedidos || []).forEach((p) => {
        if (p.estado === 'pagado') {
          lista.push({
            texto: `📦 Pedido #${p.id.slice(0, 8)} pendiente de confirmar (${Number(p.total).toFixed(2)} €)`,
            ruta: '/admin?tab=pedidos'
          });
        }
        if (p.nota_cliente_cambio) {
          lista.push({
            texto: `⚠️ Pedido #${p.id.slice(0, 8)}: ${p.nota_cliente_cambio}`,
            ruta: '/admin?tab=pedidos'
          });
        }
      });
      (resC.citas || []).forEach((c) => {
        if (c.estado === 'confirmada' || c.estado === 'pendiente') {
          lista.push({
            texto: `📅 Cita: ${c.servicio_nombre} (${c.fecha} ${c.hora_inicio.slice(0, 5)})`,
            ruta: '/admin?tab=agenda'
          });
        }
      });
      setAlertasAdmin(lista.slice(0, 10));
    });
  }, [enPanelAdmin, usuario]);

  if (enPanelAdmin) {
    return (
      <header className="navbar">
        <div className="contenedor navbar-inner">
          <Link to="/admin" className="logo-marca">
            <Shield size={20} />
            <span>Aneca Evo · Administración</span>
          </Link>

          <div className="nav-acciones" style={{ position: 'relative' }}>
            <button
              type="button"
              className="icono-btn"
              onClick={() => setVerAlertas(!verAlertas)}
              title="Notificaciones y alertas"
            >
              <Bell size={18} />
              {alertasAdmin.length > 0 && <span className="badge-carrito">{alertasAdmin.length}</span>}
            </button>

            {verAlertas && (
              <div
                className="tarjeta"
                style={{
                  position: 'absolute',
                  top: '52px',
                  right: 0,
                  width: 'min(360px, 90vw)',
                  padding: '1rem',
                  zIndex: 80,
                  boxShadow: 'var(--sombra-suave)'
                }}
              >
                <strong style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.95rem' }}>
                  Alertas recientes ({alertasAdmin.length})
                </strong>
                {alertasAdmin.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--texto-suave)' }}>Sin alertas pendientes.</p>
                ) : (
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.82rem' }}>
                    {alertasAdmin.map((a, i) => (
                      <li key={i} style={{ paddingBottom: '0.4rem', borderBottom: '1px solid var(--borde-suave)' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setVerAlertas(false);
                            navigate(a.ruta);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            textAlign: 'left',
                            cursor: 'pointer',
                            color: 'var(--texto-principal)',
                            fontFamily: 'inherit',
                            fontSize: 'inherit',
                            width: '100%'
                          }}
                        >
                          {a.texto}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <Link to="/" className="btn btn-suave" style={{ padding: '0.5rem 1rem', fontSize: '0.88rem' }}>
              <ArrowLeft size={15} /> Ver web pública
            </Link>
            <button
              type="button"
              className="btn btn-contorno"
              style={{ padding: '0.5rem 1rem', fontSize: '0.88rem' }}
              onClick={cerrarSesion}
            >
              <LogOut size={15} /> Cerrar sesión
            </button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="navbar">
      <div className="contenedor navbar-inner">
        {/* Marca / Logotipo */}
        <Link to="/" className="logo-marca">
          <Sparkles size={22} />
          <span>Aneca Evo</span>
        </Link>

        {/* Menú principal con desplegables por afinidad */}
        <nav>
          <ul className={`nav-menu ${menuMovil ? 'abierto' : ''}`}>
            {/* Desplegable: Sobre mí */}
            <li className="nav-item">
              <button type="button" className="nav-trigger">
                Sobre mí <ChevronDown size={15} />
              </button>
              <div className="nav-dropdown">
                <Link to="/sobre-mi#historia" onClick={() => setMenuMovil(false)}>Mi historia</Link>
                <Link to="/sobre-mi#formacion" onClick={() => setMenuMovil(false)}>Formación y linaje</Link>
                <Link to="/sobre-mi#espacio" onClick={() => setMenuMovil(false)}>El espacio</Link>
                <Link to="/sobre-mi#faq" onClick={() => setMenuMovil(false)}>Preguntas frecuentes</Link>
              </div>
            </li>

            {/* Desplegable: Servicios agrupados */}
            <li className="nav-item">
              <button type="button" className="nav-trigger">
                Servicios <ChevronDown size={15} />
              </button>
              <div className="nav-dropdown">
                <Link to="/servicios?cat=masajes" onClick={() => setMenuMovil(false)}>
                  Terapias Corporales (Masajes)
                </Link>
                <Link to="/servicios?cat=terapias_energeticas" onClick={() => setMenuMovil(false)}>
                  Terapias Energéticas (Reiki)
                </Link>
                <Link to="/servicios?cat=crecimiento_alma" onClick={() => setMenuMovil(false)}>
                  Crecimiento y Alma (Akáshicos / Regresiones)
                </Link>
                <Link to="/servicios" onClick={() => setMenuMovil(false)}>Ver todas las terapias</Link>
              </div>
            </li>

            {/* Desplegable: Tienda */}
            <li className="nav-item">
              <button type="button" className="nav-trigger">
                Tienda <ChevronDown size={15} />
              </button>
              <div className="nav-dropdown">
                <Link to="/tienda?cat=aceites" onClick={() => setMenuMovil(false)}>💧 Aceites y Esencias</Link>
                <Link to="/tienda?cat=cremas" onClick={() => setMenuMovil(false)}>🧴 Cremas y Bálsamos</Link>
                <Link to="/tienda?cat=infusiones" onClick={() => setMenuMovil(false)}>🍵 Infusiones y Especias</Link>
                <Link to="/tienda?cat=libros" onClick={() => setMenuMovil(false)}>📚 Libros recomendados</Link>
                <Link to="/tarjetas-regalo" onClick={() => setMenuMovil(false)}>🎁 Tarjetas Regalo</Link>
                <Link to="/bonos" onClick={() => setMenuMovil(false)}>🎟️ Bonos de Sesiones</Link>
                <Link to="/tienda" onClick={() => setMenuMovil(false)}>🛍️ Toda la tienda</Link>
              </div>
            </li>

            {/* Acceso directo al panel Admin solo si el usuario tiene rol 'admin' */}
            {usuario?.rol === 'admin' && (
              <li className="nav-item">
                <Link to="/admin" className="nav-trigger" style={{ color: 'var(--terracota)' }}>
                  <Shield size={15} /> Panel Admin
                </Link>
              </li>
            )}
          </ul>
        </nav>

        {/* Acciones a la derecha: Reservar cita + Usuario + Carrito */}
        <div className="nav-acciones">
          <Link to="/reservar" className="btn btn-primario">
            Reservar cita
          </Link>

          <Link to="/mi-cuenta" className="icono-btn" title={usuario ? `Cuenta de ${usuario.nombre}` : 'Mi cuenta'}>
            <User size={19} />
          </Link>

          {usuario && (
            <button
              type="button"
              className="btn btn-suave"
              onClick={cerrarSesion}
              title="Cerrar sesión"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
            >
              <LogOut size={15} /> Salir
            </button>
          )}

          <button
            type="button"
            className="icono-btn"
            onClick={() => setAbierto(true)}
            title="Abrir carrito"
          >
            <ShoppingBag size={19} />
            {totalUnidades > 0 && <span className="badge-carrito">{totalUnidades}</span>}
          </button>

          <button
            type="button"
            className="icono-btn"
            onClick={() => setMenuMovil(!menuMovil)}
            aria-label="Menú"
            style={{ display: 'none' }}
          >
            {menuMovil ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>
    </header>
  );
}
