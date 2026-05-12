# Sistema de Caja DeporAcademy - Guía de Configuración

## 📋 Requisitos Previos

1. Cuenta en [Supabase](https://supabase.com)
2. Cuenta en [Vercel](https://vercel.com)
3. Cuenta en [MercadoPago](https://www.mercadopago.com.uy)
4. Cuenta en [GitHub](https://github.com)
5. Node.js 18+ instalado

## 🗄️ Paso 1: Configurar Supabase

### 1.1 Crear Proyecto
1. Ve a [app.supabase.com](https://app.supabase.com)
2. Crea un nuevo proyecto llamado "deporacademy-caja"
3. Guarda la URL y la API Key (anon public)

### 1.2 Crear Tablas
En el SQL Editor de Supabase, ejecuta el siguiente script:

```sql
-- Habilitar UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de Categorías de Gastos
CREATE TABLE categorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tabla de Ingresos (desde MercadoPago)
CREATE TABLE ingresos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mercadopago_id TEXT UNIQUE NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  descripcion TEXT,
  fecha TIMESTAMP WITH TIME ZONE NOT NULL,
  estado TEXT NOT NULL, -- approved, pending, rejected
  comprador_email TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tabla de Gastos (manual)
CREATE TABLE gastos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  monto DECIMAL(10,2) NOT NULL,
  descripcion TEXT NOT NULL,
  fecha DATE NOT NULL,
  categoria_id UUID REFERENCES categorias(id),
  comprobante_url TEXT,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Insertar categorías predeterminadas
INSERT INTO categorias (nombre, color) VALUES
  ('Operativos', '#3B82F6'),
  ('Marketing', '#8B5CF6'),
  ('Administrativos', '#10B981'),
  ('Tecnología', '#F59E0B'),
  ('Otros', '#6B7280');

-- Índices para mejor performance
CREATE INDEX idx_ingresos_fecha ON ingresos(fecha DESC);
CREATE INDEX idx_gastos_fecha ON gastos(fecha DESC);
CREATE INDEX idx_gastos_categoria ON gastos(categoria_id);

-- Row Level Security (RLS)
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingresos ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso (permitir todo para usuarios autenticados)
CREATE POLICY "Permitir todo a usuarios autenticados" ON categorias
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir todo a usuarios autenticados" ON ingresos
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir todo a usuarios autenticados" ON gastos
  FOR ALL USING (auth.role() = 'authenticated');
```

### 1.3 Configurar Autenticación
1. Ve a Authentication → Providers
2. Habilita "Email"
3. En Authentication → Users, crea tu usuario manualmente

## 🔑 Paso 2: Configurar MercadoPago

### 2.1 Obtener Credenciales
1. Ve a [developers.mercadopago.com.uy](https://www.mercadopago.com.uy/developers/panel)
2. Crea una aplicación
3. Obtén tu Access Token de Producción

### 2.2 Configurar Webhook (después del deploy)
1. En MercadoPago → Tu aplicación → Webhooks
2. Configura la URL: `https://tu-app.vercel.app/api/webhook/mercadopago`
3. Selecciona el evento: `payment`

## 💻 Paso 3: Clonar y Configurar el Proyecto

```bash
# Clonar el repositorio (después de crearlo en GitHub)
git clone https://github.com/tu-usuario/deporacademy-caja.git
cd deporacademy-caja

# Instalar dependencias
npm install

# Crear archivo .env.local
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu-url-de-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-de-supabase

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=tu-access-token-de-mercadopago
MERCADOPAGO_WEBHOOK_SECRET=tu-webhook-secret (opcional pero recomendado)
```

## 🚀 Paso 4: Deploy en Vercel

### 4.1 Desde GitHub
1. Ve a [vercel.com](https://vercel.com)
2. Conecta tu repositorio de GitHub
3. Agrega las variables de entorno (las mismas del .env.local)
4. Deploy!

### 4.2 Configurar Dominio (opcional)
1. En Vercel → Settings → Domains
2. Agrega tu dominio personalizado

## 🔄 Paso 5: Sincronizar Pagos de MercadoPago

### Opción A: Sincronización Manual (Inicial)
1. Una vez desplegada la app, ve a Settings
2. Usa el botón "Sincronizar MercadoPago" para importar pagos existentes

### Opción B: Webhooks (Automático)
Los nuevos pagos se sincronizarán automáticamente vía webhook

## ✅ Verificar Instalación

1. Visita tu app en Vercel
2. Inicia sesión con el usuario que creaste
3. Verifica que puedas:
   - Ver el dashboard
   - Agregar gastos
   - Ver ingresos sincronizados

## 🛠️ Desarrollo Local

```bash
# Ejecutar en modo desarrollo
npm run dev

# Abrir en http://localhost:3000
```

## 📞 Soporte

Si necesitas ayuda:
1. Verifica que todas las variables de entorno estén configuradas
2. Revisa los logs en Vercel → Deployments → Functions
3. Revisa los logs en Supabase → Logs

## 🔐 Seguridad

- ✅ Row Level Security habilitado en Supabase
- ✅ Variables de entorno en Vercel (no en el código)
- ✅ Autenticación requerida para todas las operaciones
- ✅ Webhook signature validation (si configuras el secret)
