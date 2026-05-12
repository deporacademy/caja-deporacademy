# 🚀 Inicio Rápido - 5 Pasos

Esta guía te lleva de 0 a tener tu sistema de caja funcionando en menos de 15 minutos.

## Paso 1: Supabase (3 minutos)

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto llamado "deporacademy-caja"
3. Espera a que se cree (toma ~2 minutos)
4. Ve a **Settings** → **API** y copia:
   - `URL` (Project URL)
   - `anon public` key

## Paso 2: Base de Datos (2 minutos)

1. En Supabase, ve a **SQL Editor**
2. Abre el archivo `SETUP.md` de este proyecto
3. Copia todo el código SQL de la sección "1.2 Crear Tablas"
4. Pégalo en el SQL Editor y haz clic en "RUN"
5. ✅ Verás "Success. No rows returned"

## Paso 3: Usuario (1 minuto)

1. En Supabase, ve a **Authentication** → **Users**
2. Haz clic en "Add user" → "Create new user"
3. Email: `tu@email.com`
4. Password: `tu-password-segura`
5. Haz clic en "Create user"

## Paso 4: MercadoPago (2 minutos)

1. Ve a [mercadopago.com.uy/developers](https://www.mercadopago.com.uy/developers/panel)
2. Crea una aplicación (o usa una existente)
3. Ve a **Credenciales**
4. Copia tu **Access Token de Producción**
   - Empieza con `APP_USR-...`

## Paso 5: Configurar Proyecto (5 minutos)

```bash
# 1. Clonar o descargar el proyecto
cd deporacademy-caja

# 2. Instalar dependencias
npm install

# 3. Crear archivo .env.local
# Copia el contenido de .env.example y reemplaza con tus valores:

NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
MERCADOPAGO_ACCESS_TOKEN=APP_USR-tu-access-token-aqui

# 4. Ejecutar en desarrollo
npm run dev

# 5. Abrir http://localhost:3000
```

## ✅ ¡Listo!

Ahora puedes:
1. Iniciar sesión con el usuario que creaste
2. Ver el dashboard
3. Hacer clic en "Sincronizar MP" para importar tus pagos
4. Agregar gastos manualmente

## 🚀 Deploy a Producción (Opcional)

### Vercel (Recomendado - 3 minutos)

1. Sube tu código a GitHub
2. Ve a [vercel.com](https://vercel.com)
3. Conecta tu repositorio
4. Agrega las mismas variables de entorno del `.env.local`
5. Deploy!

### Configurar Webhook en MercadoPago

Una vez desplegado en Vercel:

1. Ve a MercadoPago → Tu aplicación → **Webhooks**
2. URL: `https://tu-app.vercel.app/api/webhook/mercadopago`
3. Eventos: Selecciona `payment`
4. Guarda

Ahora los pagos se sincronizarán automáticamente en tiempo real.

## 🆘 ¿Problemas?

### Error de conexión a Supabase
- Verifica que las URLs y keys estén correctas en `.env.local`
- Asegúrate de haber ejecutado el script SQL

### No aparecen los pagos
- Verifica que tu Access Token sea de **Producción**
- Haz clic en "Sincronizar MP" en la página de Ingresos

### Error al iniciar sesión
- Verifica que hayas creado el usuario en Supabase Auth
- Usa el email y password exactos que configuraste

## 📚 Documentación Completa

Para instrucciones detalladas, consulta `SETUP.md`

---

**¿Todo funcionó? ¡Perfecto! Ahora tienes un sistema profesional de gestión de caja.**
