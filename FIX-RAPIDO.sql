-- ⚡ FIX RÁPIDO - Ejecuta esto AHORA en Supabase SQL Editor
-- Esto arreglará el error "Error al guardar el ingreso/gasto"

-- 1. Agregar campo moneda a ingresos
ALTER TABLE ingresos 
ADD COLUMN IF NOT EXISTS moneda TEXT DEFAULT 'UYU' CHECK (moneda IN ('USD', 'UYU'));

-- 2. Agregar campo moneda a gastos
ALTER TABLE gastos 
ADD COLUMN IF NOT EXISTS moneda TEXT DEFAULT 'UYU' CHECK (moneda IN ('USD', 'UYU'));

-- Verificar que se creó correctamente
SELECT 'ingresos - moneda' as tabla, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'ingresos' AND column_name = 'moneda'
UNION ALL
SELECT 'gastos - moneda' as tabla, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'gastos' AND column_name = 'moneda';

-- Si ves 2 filas en el resultado, ¡está listo! ✅
