// ============================================================================
// ARRANQUE CONJUNTO DE BACKEND Y FRONTEND DESDE LA RAÍZ (`npm run dev`)
// ============================================================================
const { spawn } = require('child_process');
const path = require('path');

function lanzar(nombre, carpeta) {
  const proc = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, carpeta),
    stdio: 'inherit',
    shell: true
  });
  proc.on('error', (err) => {
    console.error(`[${nombre}] Error al iniciar:`, err.message);
  });
  return proc;
}

console.log('🌿 Iniciando Aneca Evo (Backend en :4000 + Frontend en :5173)...');
lanzar('BACKEND', 'backend');
lanzar('FRONTEND', 'frontend');
