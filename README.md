# 💰 Sistema de Caja - DeporAcademy

Sistema completo de gestión de caja que integra pagos de MercadoPago y permite registrar gastos manualmente. Construido con Next.js, Supabase y deployable en Vercel.

![Dashboard Preview](https://via.placeholder.com/800x400/22c55e/ffffff?text=Sistema+de+Caja+DeporAcademy)

## 🚀 Características

- ✅ **Integración con MercadoPago**: Sincronización automática de pagos
- ✅ **Gestión de Gastos**: Registro manual con categorías
- ✅ **Dashboard Interactivo**: Visualización de estadísticas y gráficos
- ✅ **Reportes**: Exportación de datos a CSV
- ✅ **Autenticación**: Sistema seguro con Supabase Auth
- ✅ **Responsive**: Funciona perfecto en móvil y desktop
- ✅ **Tiempo Real**: Webhooks para sincronización automática

## 📋 Tecnologías

- **Frontend**: Next.js 14 + React + TypeScript
- **Base de Datos**: Supabase (PostgreSQL)
- **Pagos**: MercadoPago API
- **Estilos**: Tailwind CSS
- **Deploy**: Vercel
- **Gráficos**: Recharts

## 🛠️ Instalación Rápida

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/deporacademy-caja.git
cd deporacademy-caja
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-tu-access-token
```

### 4. Configurar Supabase

Ejecuta el script SQL que está en `SETUP.md` para crear las tablas necesarias.

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📦 Despliegue en Vercel

### Opción 1: Deploy Button

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tu-usuario/deporacademy-caja)

### Opción 2: Manual

1. Conecta tu repositorio en [vercel.com](https://vercel.com)
2. Configura las variables de entorno
3. Deploy!

## 📖 Documentación Completa

Lee el archivo `SETUP.md` para instrucciones detalladas paso a paso sobre:
- Configuración de Supabase
- Configuración de MercadoPago
- Setup de webhooks
- Troubleshooting

## 🎯 Uso

### Sincronizar Pagos de MercadoPago

1. Ve a **Ingresos**
2. Haz clic en "Sincronizar MP"
3. Los pagos de los últimos 3 meses se importarán automáticamente

### Registrar un Gasto

1. Ve a **Gastos**
2. Haz clic en "Nuevo Gasto"
3. Completa el formulario
4. Guarda

### Ver Reportes

- El **Dashboard** muestra un resumen del mes actual
- En **Ingresos** y **Gastos** puedes filtrar y exportar a CSV

## 🔐 Seguridad

- Row Level Security habilitado en Supabase
- Autenticación requerida para todas las operaciones
- Variables sensibles en variables de entorno
- Validación de webhooks de MercadoPago

## 🤝 Contribuir

Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT.

## 🆘 Soporte

¿Necesitas ayuda? 

- 📧 Email: contacto@deporacademy.com
- 🐛 Issues: [GitHub Issues](https://github.com/tu-usuario/deporacademy-caja/issues)

## 🙏 Créditos

Desarrollado con ❤️ para DeporAcademy

---

**⭐ Si este proyecto te fue útil, dale una estrella en GitHub!**
