-- Script para restaurar políticas RLS en tablas ingresos y gastos
-- Permite que el endpoint de clasificación pueda insertar datos

-- ===== TABLA INGRESOS =====
ALTER TABLE ingresos ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas viejas
DROP POLICY IF EXISTS "Allow all operations" ON ingresos;
DROP POLICY IF EXISTS "Allow authenticated users" ON ingresos;
DROP POLICY IF EXISTS "Public read access" ON ingresos;

-- Crear política que permita TODO (lectura y escritura)
CREATE POLICY "Allow all for classification" ON ingresos
  FOR ALL
  TO authenticated, anon, service_role
  USING (true)
  WITH CHECK (true);

-- ===== TABLA GASTOS =====
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas viejas
DROP POLICY IF EXISTS "Allow all operations" ON gastos;
DROP POLICY IF EXISTS "Allow authenticated users" ON gastos;
DROP POLICY IF EXISTS "Public read access" ON gastos;

-- Crear política que permita TODO (lectura y escritura)
CREATE POLICY "Allow all for classification" ON gastos
  FOR ALL
  TO authenticated, anon, service_role
  USING (true)
  WITH CHECK (true);

-- ===== TABLA CATEGORIAS =====
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations" ON categorias;
DROP POLICY IF EXISTS "Allow authenticated users" ON categorias;

CREATE POLICY "Allow all for categories" ON categorias
  FOR ALL
  TO authenticated, anon, service_role
  USING (true)
  WITH CHECK (true);

-- ===== TABLA CATEGORIAS_INGRESOS =====
ALTER TABLE categorias_ingresos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations" ON categorias_ingresos;
DROP POLICY IF EXISTS "Allow authenticated users" ON categorias_ingresos;

CREATE POLICY "Allow all for income categories" ON categorias_ingresos
  FOR ALL
  TO authenticated, anon, service_role
  USING (true)
  WITH CHECK (true);
