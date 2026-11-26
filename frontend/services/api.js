// ============================================================================
// CLIENTE HTTP CENTRALIZADO PARA COMUNICARSE CON EL BACKEND (/api/...)
// ============================================================================

/**
 * apiFetch: Envuelve fetch() añadiendo automáticamente el token JWT si existe
 * y devolviendo el JSON parseado o lanzando un error legible si la API falla.
 */
const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://anecaevo.onrender.com' : '');

export async function apiFetch(ruta, opciones = {}) {
  const token = localStorage.getItem('aneca_token'); // Leemos el token guardado al hacer login

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(opciones.headers || {})
  };

    const respuesta = await fetch(`${API_BASE}/api${ruta}`, {
      ...opciones,
      headers
    });

    const datos = await respuesta.json().catch(() => ({}));

    if(!respuesta.ok) {
      if (respuesta.status >= 500 && !datos.error) {
    throw new Error('No hay conexión con el servidor backend (puerto 4000). Enciende MySQL en XAMPP y ejecuta el backend.');
  }
  throw new Error(datos.error || 'Ocurrió un error al conectar con el servidor.');
}

return datos;
}
