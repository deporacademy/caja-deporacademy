-- MIGRACIÓN: SOPORTE MULTIMONEDA (USD y UYU)
-- Ejecuta este script en tu Supabase SQL Editor

-- 1. Agregar campo 'moneda' a la tabla gastos
ALTER TABLE gastos 
ADD COLUMN IF NOT EXISTS moneda TEXT DEFAULT 'UYU' CHECK (moneda IN ('USD', 'UYU'));

-- 2. Agregar campo 'moneda' a la tabla ingresos
ALTER TABLE ingresos 
ADD COLUMN IF NOT EXISTS moneda TEXT DEFAULT 'UYU' CHECK (moneda IN ('USD', 'UYU'));

-- 3. Crear tabla para conversiones de moneda
CREATE TABLE IF NOT EXISTS conversiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL,
  monto_origen DECIMAL(12, 2) NOT NULL,
  moneda_origen TEXT NOT NULL CHECK (moneda_origen IN ('USD', 'UYU')),
  monto_destino DECIMAL(12, 2) NOT NULL,
  moneda_destino TEXT NOT NULL CHECK (moneda_destino IN ('USD', 'UYU')),
  tipo_cambio DECIMAL(10, 4) NOT NULL,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Validación: no se puede convertir de una moneda a la misma
  CONSTRAINT different_currencies CHECK (moneda_origen != moneda_destino)
);

-- 4. Habilitar RLS (Row Level Security) para conversiones
ALTER TABLE conversiones ENABLE ROW LEVEL SECURITY;

-- 5. Política RLS: permitir todas las operaciones (ajusta según tus necesidades)
CREATE POLICY "Enable all operations for conversiones" ON conversiones
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 6. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_gastos_moneda ON gastos(moneda);
CREATE INDEX IF NOT EXISTS idx_ingresos_moneda ON ingresos(moneda);
CREATE INDEX IF NOT EXISTS idx_conversiones_fecha ON conversiones(fecha);
CREATE INDEX IF NOT EXISTS idx_conversiones_moneda_origen ON conversiones(moneda_origen);
CREATE INDEX IF NOT EXISTS idx_conversiones_moneda_destino ON conversiones(moneda_destino);

-- 7. Comentarios para documentación
COMMENT ON COLUMN gastos.moneda IS 'Moneda del gasto: USD (dólares) o UYU (pesos uruguayos)';
COMMENT ON COLUMN ingresos.moneda IS 'Moneda del ingreso: USD (dólares) o UYU (pesos uruguayos)';
COMMENT ON TABLE conversiones IS 'Registro de conversiones entre USD y UYU';
COMMENT ON COLUMN conversiones.tipo_cambio IS 'Tasa de cambio aplicada (monto_destino / monto_origen)';

-- Verificar que todo se creó correctamente
SELECT 
  'gastos' as tabla,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'gastos' AND column_name = 'moneda'
UNION ALL
SELECT 
  'ingresos' as tabla,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'ingresos' AND column_name = 'moneda'
UNION ALL
SELECT 
  'conversiones' as tabla,
  'tabla_creada' as column_name,
  'table' as data_type
FROM information_schema.tables
WHERE table_name = 'conversiones';
