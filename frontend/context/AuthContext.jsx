// ============================================================================
// CONTEXTO DE AUTENTICACIÓN (Usuario actual, Login, Registro y Logout)
// ============================================================================
import { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    // Recupera el usuario guardado en localStorage al recargar la página
    const guardado = localStorage.getItem('aneca_usuario');
    return guardado ? JSON.parse(guardado) : null;
  });
  const [cargando, setCargando] = useState(false);

  // Verifica que el token siga siendo válido al iniciar la app
  useEffect(() => {
    const token = localStorage.getItem('aneca_token');
    if (!token) return;
    setCargando(true);
    apiFetch('/auth/perfil')
      .then((res) => {
        setUsuario(res.usuario);
        localStorage.setItem('aneca_usuario', JSON.stringify(res.usuario));
      })
      .catch(() => {
        cerrarSesion();
      })
      .finally(() => setCargando(false));
  }, []);

  function guardarSesion(token, datosUsuario) {
    localStorage.setItem('aneca_token', token);
    localStorage.setItem('aneca_usuario', JSON.stringify(datosUsuario));
    setUsuario(datosUsuario);
  }

  function cerrarSesion() {
    localStorage.removeItem('aneca_token');
    localStorage.removeItem('aneca_usuario');
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, guardarSesion, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
