-- ⚡ SCRIPT PARA RESTAURAR SINCRONIZACIÓN DE MERCADOPAGO
-- Ejecuta esto en Supabase SQL Editor: https://app.supabase.com/project/[tu-proyecto]/sql/new

-- 1️⃣ CREAR TABLA DE MOVIMIENTOS PENDIENTES (si no existe)
CREATE TABLE IF NOT EXISTS movimientos_pendientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mercadopago_id TEXT UNIQUE NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  descripcion TEXT,
  fecha TIMESTAMP WITH TIME ZONE NOT NULL,
  estado TEXT NOT NULL,
  comprador_email TEXT,
  metadata JSONB,
  clasificado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2️⃣ HABILITAR ROW LEVEL SECURITY
ALTER TABLE movimientos_pendientes ENABLE ROW LEVEL SECURITY;

-- 3️⃣ ELIMINAR POLÍTICAS ANTIGUAS (para evitar conflictos)
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados" ON movimientos_pendientes;
DROP POLICY IF EXISTS "Allow all operations" ON movimientos_pendientes;
DROP POLICY IF EXISTS "Public read access" ON movimientos_pendientes;

-- 4️⃣ CREAR NUEVA POLÍTICA PERMISIVA (IMPORTANTE: Permite inserciones del webhook)
CREATE POLICY "Allow all operations for service role" ON movimientos_pendientes
  FOR ALL
  TO authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- 5️⃣ CREAR ÍNDICES PARA RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_movimientos_pendientes_mercadopago_id 
  ON movimientos_pendientes(mercadopago_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_pendientes_fecha 
  ON movimientos_pendientes(fecha);
CREATE INDEX IF NOT EXISTS idx_movimientos_pendientes_clasificado 
  ON movimientos_pendientes(clasificado);

-- 6️⃣ VERIFICAR CAMPOS EN TABLA INGRESOS
ALTER TABLE ingresos 
ADD COLUMN IF NOT EXISTS moneda TEXT DEFAULT 'UYU' CHECK (moneda IN ('USD', 'UYU'));

-- 7️⃣ VERIFICAR CAMPOS EN TABLA GASTOS
ALTER TABLE gastos 
ADD COLUMN IF NOT EXISTS moneda TEXT DEFAULT 'UYU' CHECK (moneda IN ('USD', 'UYU'));

-- 8️⃣ VALIDAR QUE TODO ESTÁ BIEN
SELECT 
  'movimientos_pendientes' as tabla,
  COUNT(*) as registros,
  'RLS Habilitado' as estado
FROM movimientos_pendientes
UNION ALL
SELECT 
  'ingresos',
  COUNT(*),
  'Listo'
FROM ingresos
UNION ALL
SELECT 
  'gastos',
  COUNT(*),
  'Listo'
FROM gastos;

-- ✅ Si ves 3 filas, todo está configurado correctamente.
-- El webhook de MercadoPago debería funcionar ahora.
