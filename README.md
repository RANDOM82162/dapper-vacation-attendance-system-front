# Sistema de vacaciones y asistencia — frontend

Aplicación Angular para empleados, jefes y administradores de Dapper Technologies. El backend se encuentra en el repositorio `dapper-vacation-attendance-system-back`.

## Requisitos

- Node.js 20 y npm.
- Backend, MongoDB y Firebase Authentication configurados.
- Inicio de sesión con correo y contraseña habilitado en Firebase.

## Configuración local

1. Instala las dependencias con `npm ci`.
2. Copia `src/environments/environment.example.ts` como `src/environments/environment.ts`.
3. Configura `firebaseApiKey` y `firebaseAuthUrl` del proyecto Firebase. Para desarrollo local, configura también `apiBaseUrl`.
4. Ejecuta `npm start` y abre `http://localhost:4200`.

`environment.ts` es local y está ignorado por Git. La clave web de Firebase identifica el proyecto; las credenciales privadas de servicio pertenecen solo al backend.

**Integración pendiente:** varios servicios de vacaciones, empleados y asistencia todavía apuntan directamente a `http://localhost:8080`. Deben centralizarse antes de publicar el frontend en otro dominio o integrarlo al ERP. Esta modificación quedó fuera de la limpieza aprobada.

## Acceso y recuperación

- No existe registro público. Un administrador crea empleados y cuentas Firebase en `/admin/empleados`. Al crear la cuenta, la aplicación pide a Firebase un enlace para que el empleado defina su contraseña; si falla el envío, el administrador recibe un aviso y el empleado puede usar la recuperación del inicio de sesión.
- El usuario inicia sesión en `/auth/login`.
- `/auth/forgotpassword` pide a Firebase que envíe el correo de restablecimiento. La respuesta visible no revela si existe la cuenta.
- Firebase puede completar el cambio en su página predeterminada. Si se desea que el enlace abra esta aplicación, configura en Firebase Authentication → Templates la URL de acción personalizada `https://TU-DOMINIO/auth/newpassword`. Esa ruta valida el código de Firebase y guarda la nueva contraseña. El dominio debe estar autorizado y el servidor web debe servir `index.html` para rutas Angular.
- El usuario también puede cambiar su contraseña desde `/cuenta/configuracion` cuando ya inició sesión.

## Pantallas principales

- `/`: panel según el rol.
- `/vacaciones/*`: solicitudes, aprobaciones, historial y saldos.
- `/asistencia/*`: carga de Excel, reporte y dashboard semanal.
- `/admin/empleados`: gestión de cuentas por administradores.
- `/cuenta/*`: perfil, notificaciones y configuración.

Las rutas requieren un token Firebase y el backend valida los permisos. Las pantallas de muestra de Verona se retiraron.

## Compilación y verificación

Ejecuta `npm run build` para generar `dist/verona-ng`. El build debe hacerse con un `environment.ts` correspondiente al destino.

`npm test -- --watch=false --browsers=ChromeHeadless` ejecuta las pruebas del flujo Firebase de recuperación de contraseña.

Antes de entregar una versión al ERP, verifica con cuentas de cada rol el inicio de sesión, la recuperación de contraseña, las solicitudes y aprobaciones de vacaciones, el saldo, la carga repetida de un Excel y las consultas de asistencia. Las reglas pendientes sobre el alcance de los jefes y las autorizaciones del departamento Dirección requieren definición funcional; esta limpieza no las cambió.
