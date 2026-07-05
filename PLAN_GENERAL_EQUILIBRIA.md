# Plan General Equilibria - Security-First

Estado: APROBADO COMO DOCUMENTO DE TRABAJO.

Este plan reemplaza el plan anterior. El objetivo es mejorar Equilibria en orden seguro: primero cerrar riesgos criticos, despues estabilizar sesion, pagos, datos, UX, pruebas y produccion.

La aprobacion aplica al plan, no al estado actual del proyecto. Ningun dia se considera terminado sin evidencia verificable.

## Principios

- El backend es la fuente de verdad para permisos, roles admin, premium, pagos y usuarios suspendidos.
- El frontend no debe activar premium, otorgar admin ni decidir autorizaciones sensibles.
- Seguridad critica va antes que limpieza visual, UX o documentacion.
- Cada dia debe terminar con criterios de aceptacion verificables.
- Si aparece un bloqueante critico, no se avanza al dia siguiente.
- Los secretos no deben aparecer en commits, logs, documentacion real ni capturas.
- Produccion no puede depender de `debug=True`, CORS abierto ni `db.create_all()` automatico.
- Todo cambio estructural de base de datos debe pasar por migraciones.

## Orden General

| Dia | Fase | Agente principal | Agentes de revision |
| --- | --- | --- | --- |
| 1 | Diagnostico minimo y entorno | DevOps Automator | Codebase Onboarding Engineer, Reality Checker |
| 2 | Bloqueo critico de seguridad backend | Application Security Engineer | Security Architect, Backend Architect, Reality Checker |
| 3 | Autenticacion, sesion y usuarios suspendidos | Backend Architect | Application Security Engineer, Frontend Developer, API Tester |
| 4 | Proteccion de rutas frontend | Frontend Developer | Application Security Engineer, UX Architect, API Tester |
| 5 | Modelos, datos y migraciones | Database Optimizer | Backend Architect, Application Security Engineer |
| 6 | Premium y pagos seguros | Backend Architect | Application Security Engineer, Database Optimizer, API Tester |
| 7 | Centralizacion de API frontend | Frontend Developer | Backend Architect, Code Reviewer |
| 8 | Robustez general del backend | Backend Architect | Application Security Engineer, API Tester |
| 9 | Limpieza de boilerplate | Frontend Developer | Codebase Onboarding Engineer, Software Architect, Code Reviewer |
| 10 | UX, accesibilidad y responsive | UX Architect | Accessibility Auditor, Frontend Developer, Evidence Collector |
| 11 | Pruebas manuales, APIs y evidencia | API Tester | Evidence Collector, Code Reviewer, Reality Checker |
| 12 | Produccion y documentacion | DevOps Automator | Senior SecOps Engineer, Technical Writer, Database Optimizer, Reality Checker |

## Dia 1: Diagnostico Minimo Y Entorno

Objetivo: confirmar el estado real del proyecto antes de modificar seguridad, backend o frontend.

| Tarea | Agente |
| --- | --- |
| Verificar como se levantan frontend y backend | DevOps Automator |
| Confirmar puertos esperados: frontend `3000`, backend `3001` | DevOps Automator |
| Identificar variables de entorno requeridas | DevOps Automator |
| Confirmar que secretos existen y cuales faltan | Senior SecOps Engineer |
| Detectar errores base de consola o arranque | DevOps Automator |
| Identificar endpoints sensibles: admin, login, signup, premium, pagos, usuarios y Flask-Admin | Codebase Onboarding Engineer |
| Registrar riesgos observados antes de implementar cambios | Reality Checker |

Criterios de aceptacion:

- Se sabe como arrancan frontend y backend.
- Existe una lista clara de variables necesarias.
- Se identificaron endpoints criticos.
- Se identifico si existen secretos hardcodeados, CORS abierto, debug fijo o `db.create_all()` automatico.

Bloqueantes:

- No avanzar si no se conoce como arrancar y verificar el proyecto.
- No avanzar si no estan identificados los endpoints criticos.

## Resultado Dia 1: Diagnostico Minimo Y Entorno

Estado: COMPLETADO CON BLOQUEANTES PARA BACKEND LOCAL.

Resumen:

- Frontend verificado: `npm.cmd run start` levanta Webpack Dev Server en `http://localhost:3000/`.
- Build frontend verificado: `npm.cmd run build` compila correctamente, con advertencias de performance por assets grandes.
- Backend local no pudo verificarse directamente en Windows porque `python` y `pipenv` no estan disponibles globalmente.
- El backend debe verificarse con Docker/devcontainer para evitar instalar Python globalmente en la maquina.
- Puertos confirmados: frontend `3000`, backend `3001`.
- El proyecto declara Node `16.x`, pero el entorno actual tiene Node `v24.17.0`.
- En PowerShell, `npm` puede fallar por Execution Policy; `npm.cmd` funciona.

Comandos confirmados:

| Uso | Comando | Resultado |
| --- | --- | --- |
| Frontend dev | `npm.cmd run start` | Compila y sirve en `localhost:3000` |
| Frontend build | `npm.cmd run build` | Compila con advertencias de tamano |
| Backend dev | `pipenv run start` | Debe ejecutarse dentro del devcontainer/Docker |
| Backend esperado | `python -m flask run -p 3001 -h 0.0.0.0` | Definido en `Pipfile` |

Entorno Docker/devcontainer detectado:

| Archivo | Uso |
| --- | --- |
| `.devcontainer/devcontainer.json` | Define devcontainer con Python 3, Node y puertos `3000`, `3001` |
| `.devcontainer/docker-compose.yml` | Define servicios `app` y `db` Postgres |
| `.devcontainer/Dockerfile` | Base Python 3.10 con cliente Postgres |

Decision de entorno:

- No instalar Python/Pipenv globalmente en Windows.
- Usar Docker/devcontainer para ejecutar y validar backend.
- Las pruebas reales de API/backend quedan pendientes hasta levantar el devcontainer o un contenedor equivalente.

Variables requeridas detectadas:

| Variable | Uso | Estado |
| --- | --- | --- |
| `DATABASE_URL` | Conexion DB backend | Documentada, pero fallback a SQLite es riesgoso para produccion |
| `FLASK_APP_KEY` | Secret Flask/Admin/JWT probable | Documentada con valor debil |
| `OPENAI_API_KEY` | Endpoints IA | Falta en `.env.example` |
| `BACKEND_URL` | Frontend hacia API | Documentada en `.env.example` |
| `PAYPAL_CLIENT_ID` | PayPal frontend | Falta en `.env.example` |
| `FLASK_APP` | Flask CLI | Documentada |
| `FLASK_DEBUG` | Dev/prod | Documentada |
| `BASENAME` | Router frontend | Documentada |
| `PORT` | Puerto backend | Opcional, no documentada explicitamente |

Riesgos de configuracion detectados:

- `.env.example` usa `FLASK_APP_KEY="any key works"`, valor debil que puede copiarse por error.
- `render.yaml` contiene `FLASK_APP_KEY: "any key works"`, secreto hardcodeado en configuracion de deploy.
- `src/api/admin.py` cae a fallback `sample key` si falta `FLASK_APP_KEY`.
- `src/app.py` cae a SQLite si falta `DATABASE_URL`.
- `src/app.py` ejecuta `db.create_all()` al iniciar/importar.
- `src/app.py` tiene `debug=True` fijo en ejecucion directa.
- `src/api/routes.py` usa `CORS(api)` abierto.
- `requirements.txt` no coincide con `Pipfile`; faltan dependencias usadas como `flask-jwt-extended`, `flask-bcrypt`, `openai` y `reportlab`.

Errores o advertencias de arranque/build:

- `npm.cmd run build` compila con 3 advertencias por tamano de assets: `signup.png`, `equilibra-logo.png`, `BGEquilibria.png`, fuente `.ttf` y `bundle.js`.
- `npm.cmd run start` compila correctamente, pero Watchpack reporta errores al intentar leer archivos del disco raiz: `C:\DumpStack.log.tmp`, `C:\pagefile.sys`, `C:\swapfile.sys`.
- `python --version` no esta disponible globalmente en esta maquina, lo cual es aceptable si se usa Docker/devcontainer.
- `pipenv --version` no esta disponible globalmente en esta maquina, lo cual es aceptable si se usa Docker/devcontainer.

Endpoints sensibles identificados:

| Endpoint o ruta | Archivo | Riesgo |
| --- | --- | --- |
| `POST /api/user` | `src/api/routes.py` | Registro publico acepta `is_admin` desde cliente |
| `POST /api/login` | `src/api/routes.py` | Auth/JWT; email inexistente puede terminar en 500 |
| `GET /api/user` | `src/api/routes.py` | Datos usuario autenticado |
| `PATCH /api/user/change-data` | `src/api/routes.py` | Modifica email, password, nombre, genero y preferencias |
| `POST /api/signup-admin` | `src/api/routes.py` | Creacion admin sin JWT activo |
| `/admin/` Flask-Admin | `src/api/admin.py` | ModelView de `User` sin control de acceso visible |
| `GET /api/admin/users` | `src/api/routes.py` | Admin protegido con JWT y `is_admin` |
| `PATCH /api/admin/force-reset-password` | `src/api/routes.py` | Admin protegido |
| `PATCH /api/admin/suspender-activar-user` | `src/api/routes.py` | Admin protegido |
| `PATCH /api/admin/hacer-deshacer-admin` | `src/api/routes.py` | Admin protegido, pero puede dejar sistema sin admins |
| `POST /api/user/upgrade` | `src/api/routes.py` | Activa premium directamente sin validacion backend de pago |
| `GET /api/favorite-quotes` | `src/api/routes.py` | Favoritos privados, no valida premium backend |
| `POST /api/favorite` | `src/api/routes.py` | Escritura favoritos, no valida premium backend |
| `DELETE /api/favorite-del` | `src/api/routes.py` | Borrado favoritos |
| `POST /api/entrada` | `src/api/routes.py` | Diario privado |
| `GET /api/diario` | `src/api/routes.py` | Diario privado |
| `POST /api/diario/export-pdf` | `src/api/routes.py` | Exporta datos privados |
| `POST /api/consejo-personalizado` | `src/api/routes.py` | IA con datos emocionales |
| `POST /api/frase-motivacional` | `src/api/routes.py` | IA |
| `POST /api/frases-motivacionales` | `src/api/routes.py` | IA |
| `POST /api/recomendaciones` | `src/api/routes.py` | IA con entrada libre |

Rutas frontend sensibles identificadas:

| Ruta | Riesgo |
| --- | --- |
| `/signup-admin` | Ruta publica de creacion admin |
| `/admin-dashboard` | Panel admin visible por URL si no hay guard |
| `/vista-usuarios` | Gestion admin de usuarios |
| `/dashboard` | Privada de usuario |
| `/checkout` | Pago/premium |
| `/favoritos` y subrutas | Favoritos privados/premium |
| `/diario` | Diario privado |
| `/registrar-entrada` | Escritura diario |
| `/frases-motivacionales` | IA/favoritos |
| `/recomendaciones` | IA/favoritos |
| `/cambiar-info` | Perfil/contrasena/email |

Criterios del Dia 1:

- [x] Se sabe como arrancan frontend y backend.
- [x] Existe una lista clara de variables necesarias.
- [x] Se identificaron endpoints criticos.
- [x] Se identifico si existen secretos hardcodeados, CORS abierto, debug fijo o `db.create_all()` automatico.

Bloqueantes antes de cerrar completamente entorno local:

- Levantar Docker/devcontainer para verificar backend sin instalar Python/Pipenv globalmente.
- Definir si el entorno debe usar Node 16.x o si se acepta Node 24 con riesgo.
- Decidir si se limpian artefactos generados por `npm.cmd run build` en `public/`.

Siguiente paso recomendado: Dia 2, bloqueo critico de seguridad backend.

Validacion Reality Checker:

- Veredicto Dia 1: APROBADO CON BLOQUEANTES.
- Hay evidencia suficiente para cerrar el diagnostico inicial.
- Se puede avanzar a Dia 2 porque los riesgos criticos estan identificados.
- No se puede certificar ninguna correccion backend dinamicamente hasta levantar Docker/devcontainer o un entorno Python aislado del proyecto.
- Dia 2 puede avanzar, pero las pruebas reales del backend deben ejecutarse dentro de Docker/devcontainer si el runtime backend local sigue sin estar disponible.

## Dia 2: Bloqueo Critico De Seguridad Backend

Objetivo: cerrar riesgos que permiten abuso directo del sistema.

| Tarea | Agente |
| --- | --- |
| Cerrar creacion publica de administradores | Application Security Engineer |
| Evitar que registro publico acepte `is_admin` desde el cliente | Application Security Engineer |
| Exigir usuario autenticado y admin para acciones administrativas | Application Security Engineer |
| Revisar que todos los endpoints admin validen autenticacion y rol | Application Security Engineer |
| Proteger o desactivar Flask-Admin si queda expuesto | Security Architect |
| Neutralizar cualquier flujo que active premium sin pago validado | Application Security Engineer |
| Impedir que usuarios normales modifiquen roles, premium o suspension | Application Security Engineer |
| Evitar que un admin se quite privilegios si deja el sistema sin admins | Backend Architect |
| Mejorar respuestas para no autenticado, no autorizado y recurso inexistente | Backend Architect |
| Validar que las decisiones sensibles no dependan del frontend | Security Architect |

Criterios de aceptacion:

- Un usuario no autenticado no puede crear admins.
- Un usuario autenticado no admin no puede crear admins.
- Un usuario no admin no puede acceder a endpoints administrativos.
- Flask-Admin no queda publicamente accesible.
- No existe camino directo para obtener premium gratis.

Bloqueantes:

- Cualquier usuario puede crear admins.
- Flask-Admin queda expuesto.
- Premium puede activarse sin pago validado.
- Alguna ruta admin no valida autenticacion y rol.

## Resultado Dia 2: Bloqueo Critico De Seguridad Backend

Estado: COMPLETADO CON PRUEBAS BACKEND EN DOCKER.

Cambios aplicados:

- `POST /api/user` ignora `is_admin` enviado por el cliente y crea usuarios normales.
- `POST /api/signup-admin` exige JWT y rol admin backend.
- `POST /api/signup-admin` crea admins desde decision backend, no desde `is_admin` enviado por cliente.
- Flask-Admin queda deshabilitado por defecto salvo `ENABLE_FLASK_ADMIN=1`.
- Las rutas `/admin/` y `/admin/*` devuelven `404` cuando Flask-Admin esta deshabilitado.
- Flask-Admin ya no usa fallback `sample key`; si se habilita requiere `FLASK_APP_KEY` explicito.
- `POST /api/user/upgrade` ya no activa premium directamente; responde `403` hasta que exista pago backend validado.
- `PATCH /api/admin/hacer-deshacer-admin` impide quitar el ultimo admin.
- El secreto JWT queda configurado desde `FLASK_APP_KEY` en `src/app.py`, independiente de Flask-Admin.

Evidencia ejecutada:

| Prueba | Resultado |
| --- | --- |
| `pipenv run python -m unittest tests.test_security_day2 -v` en Docker/devcontainer | 9 tests OK |

Criterios del Dia 2:

- [x] Un usuario no autenticado no puede crear admins.
- [x] Un usuario autenticado no admin no puede crear admins.
- [x] Un usuario no admin no puede acceder a endpoints administrativos cubiertos.
- [x] Flask-Admin no queda publicamente accesible por defecto.
- [x] No existe camino directo para obtener premium gratis mediante `/api/user/upgrade`.

Notas para Dia 3:

- Queda pendiente estabilizar login, sesion y usuarios suspendidos segun el plan.
- La creacion del primer admin seguro sigue pendiente de documentacion definitiva para produccion.

## Dia 3: Autenticacion, Sesion Y Usuarios Suspendidos

Objetivo: estabilizar login, logout, sesion activa y estados de usuario.

| Tarea | Agente |
| --- | --- |
| Corregir login para no depender de estado frontend recien actualizado | Frontend Developer |
| Hacer que verificacion de token devuelva datos utiles del usuario | Backend Architect |
| Limpiar sesion ante token invalido, expirado o usuario inexistente | Frontend Developer |
| Asegurar que logout borre token, usuario y datos sensibles | Frontend Developer |
| Definir comportamiento para usuarios suspendidos | Backend Architect |
| Impedir que usuarios suspendidos usen funcionalidades internas | Backend Architect |
| Unificar respuesta backend para usuario activo, suspendido, admin y premium | Backend Architect |
| Corregir credenciales invalidas para que no generen error 500 | Backend Architect |
| Validar login correcto, login incorrecto, sesion expirada y suspendido | API Tester |

Criterios de aceptacion:

- Login correcto inicia sesion con datos consistentes.
- Login invalido devuelve error controlado.
- Token expirado o invalido cierra sesion de forma predecible.
- Usuario suspendido no puede operar como usuario activo.
- Logout limpia sesion local y estado global.

Bloqueantes:

- Usuario suspendido puede seguir usando rutas privadas.
- Login depende de estado desactualizado del frontend.
- Credenciales incorrectas generan error interno.

## Dia 4: Proteccion De Rutas Frontend

Objetivo: evitar acceso visual o accidental a pantallas privadas desde URL directa.

| Tarea | Agente |
| --- | --- |
| Definir proteccion frontend para rutas autenticadas | Frontend Developer |
| Definir proteccion frontend para rutas admin | Frontend Developer |
| Proteger `/dashboard` | Frontend Developer |
| Proteger `/admin-dashboard` | Frontend Developer |
| Proteger `/vista-usuarios` | Frontend Developer |
| Proteger `/favoritos` y vistas relacionadas | Frontend Developer |
| Proteger `/diario`, `/recomendaciones` y `/frases-motivacionales` | Frontend Developer |
| Redirigir usuarios sin sesion hacia `/login` | Frontend Developer |
| Redirigir usuarios no admin fuera de pantallas admin | Frontend Developer |
| Validar que el frontend respete usuario suspendido o sesion expirada | API Tester |

Criterios de aceptacion:

- Usuario sin sesion no ve pantallas privadas.
- Usuario no admin no ve pantallas admin.
- Usuario suspendido no queda navegando en areas internas.
- Redirecciones son consistentes y no generan bucles.
- La proteccion frontend complementa al backend, no lo reemplaza.

Bloqueantes:

- Ruta admin visible para usuario no admin.
- Ruta privada visible sin sesion.
- Frontend contradice decisiones del backend.

## Dia 5: Modelos, Datos Y Migraciones

Objetivo: ordenar la base de datos antes de implementar pagos seguros.

| Tarea | Agente |
| --- | --- |
| Revisar modelos actuales de usuarios, entradas y favoritos | Database Optimizer |
| Definir modelo de pagos con datos auditables | Database Optimizer |
| Confirmar relaciones entre usuarios, favoritos, diario y pagos | Database Optimizer |
| Definir campos obligatorios y opcionales | Database Optimizer |
| Asegurar que cambios estructurales se gestionen por migraciones | Database Optimizer |
| Validar instalacion limpia desde migraciones | Database Optimizer |
| Evitar dependencia de cambios manuales en tablas | Database Optimizer |
| Revisar consistencia entre modelos y migraciones existentes | Backend Architect |

Criterios de aceptacion:

- Existe estructura clara para registrar pagos.
- Los campos criticos tienen nulabilidad y restricciones coherentes.
- Migraciones pueden aplicarse desde cero.
- Migraciones pueden aplicarse sobre una base existente compatible.
- No hay dependencia de cambios manuales.

Bloqueantes:

- No existe forma auditable de registrar pagos.
- La base requiere cambios manuales.
- Las migraciones no son reproducibles.

## Dia 6: Premium Y Pagos Seguros

Objetivo: permitir premium unicamente tras validacion backend de pago completado.

| Tarea | Agente |
| --- | --- |
| Mantener precio inicial fijo de premium: `5.99 USD` | Backend Architect |
| Impedir que frontend controle monto, moneda, premium o resultado de pago | Application Security Engineer |
| Integrar flujo donde backend valide el estado real del pago | Backend Architect |
| Validar pago con proveedor mediante confirmacion server-side o webhook verificado | Backend Architect |
| Implementar idempotencia para evitar doble activacion | Backend Architect |
| Registrar intentos, pagos exitosos, fallidos, cancelados y repetidos | Database Optimizer |
| Marcar usuario como premium solo despues de confirmacion valida | Application Security Engineer |
| Actualizar dashboard usando estado confirmado desde backend | Frontend Developer |
| Definir comportamiento de pago fallido o cancelado | Backend Architect |
| Probar pago exitoso, fallido, cancelado y repetido | API Tester |

Criterios de aceptacion:

- No se puede obtener premium llamando manualmente un endpoint simple.
- Backend no acepta estado premium enviado por frontend.
- Backend valida proveedor, estado, monto, moneda, usuario e idempotencia.
- Pago exitoso queda registrado y activa premium.
- Pago fallido o cancelado no activa premium.
- Pago repetido no duplica beneficios ni rompe estado.

Bloqueantes:

- Premium puede activarse desde frontend.
- No se registra el pago.
- Backend acepta monto, moneda o estado premium enviados por cliente.
- No hay validacion server-side real con el proveedor.

## Dia 7: Centralizacion De API Frontend

Objetivo: reducir duplicacion y hacer predecible el manejo de errores desde frontend.

| Tarea | Agente |
| --- | --- |
| Centralizar URL base del backend | Frontend Developer |
| Centralizar manejo de token JWT | Frontend Developer |
| Centralizar headers comunes | Frontend Developer |
| Unificar manejo de errores `401`, `403`, `404` y `500` | Frontend Developer |
| Definir comportamiento global para sesion expirada | Frontend Developer |
| Hacer que acciones frontend devuelvan resultados claros | Frontend Developer |
| Reducir `console.log` innecesarios | Frontend Developer |
| Reemplazar llamadas repetidas sin cambiar reglas de negocio | Frontend Developer |
| Revisar que la centralizacion no introduzca acoplamiento excesivo | Code Reviewer |

Criterios de aceptacion:

- El frontend maneja sesion expirada de forma consistente.
- Los errores se muestran o propagan con mensajes claros.
- No hay duplicacion innecesaria de configuracion de API.
- Las acciones no ocultan errores criticos.

Bloqueantes:

- Errores `401` o `403` se tratan como exito.
- Token queda disperso en multiples lugares sin control.
- Centralizacion cambia reglas de autorizacion.

## Dia 8: Robustez General Del Backend

Objetivo: reducir errores inesperados y preparar el servidor para produccion.

| Tarea | Agente |
| --- | --- |
| Validar entradas en endpoints principales | Application Security Engineer |
| Validar longitud minima de contrasena | Application Security Engineer |
| Manejar ausencia de `OPENAI_API_KEY` | Backend Architect |
| Hacer respuestas de IA resistentes a JSON invalido | Backend Architect |
| Revisar errores internos evitables | Backend Architect |
| Eliminar rollbacks innecesarios en endpoints sin escritura | Backend Architect |
| Separar comportamiento local y produccion para debug, CORS y tablas | DevOps Automator |
| Asegurar codigos HTTP consistentes | Backend Architect |
| Validar endpoints robustos con casos positivos y negativos | API Tester |

Criterios de aceptacion:

- Email inexistente en login no produce error 500.
- Entradas invalidas devuelven errores controlados.
- Falta de clave externa no rompe todo el backend sin explicacion.
- Produccion no depende de debug activo.
- CORS no queda abierto sin justificacion.

Bloqueantes:

- Errores comunes siguen produciendo 500.
- Produccion requiere debug activo.
- CORS queda permisivo sin restriccion.
- App depende de `db.create_all()` automatico en produccion.

## Dia 9: Limpieza De Boilerplate

Objetivo: eliminar ruido heredado sin romper flujos criticos ya asegurados.

| Tarea | Agente |
| --- | --- |
| Revisar rutas de demo o prueba no usadas | Codebase Onboarding Engineer |
| Retirar textos visibles de template o boilerplate | Frontend Developer |
| Eliminar imports no usados | Frontend Developer |
| Revisar nombres inconsistentes | Code Reviewer |
| Mantener solo pantallas necesarias para la app real | Software Architect |
| Ordenar navegacion y rutas principales | Frontend Developer |
| Confirmar que la limpieza no elimina funcionalidades reales | Code Reviewer |

Criterios de aceptacion:

- La app deja de verse como template modificado.
- No quedan rutas de demo accesibles sin proposito.
- No se elimina funcionalidad critica.
- Login, admin, premium y rutas privadas siguen funcionando.

Bloqueantes:

- Limpieza rompe login, admin, premium o rutas privadas.
- Se eliminan pantallas reales por confundirlas con boilerplate.

## Dia 10: UX, Accesibilidad Y Responsive

Objetivo: mejorar experiencia sin debilitar seguridad ni cambiar reglas de negocio.

| Tarea | Agente |
| --- | --- |
| Reemplazar `alert()` por mensajes en pantalla o toasts simples | UX Architect |
| Agregar estados de carga en login | Frontend Developer |
| Agregar estados de carga en registro | Frontend Developer |
| Agregar estados de carga en recomendaciones IA | Frontend Developer |
| Agregar estados de carga en frases motivacionales | Frontend Developer |
| Agregar estados de carga en pagos | Frontend Developer |
| Mejorar mensajes de error para usuarios | UX Architect |
| Unificar idioma en espanol | Technical Writer |
| Revisar textos sensibles sobre salud mental | UX Researcher |
| Revisar landing, login, signup, dashboard y panel admin en movil | UX Architect |
| Revisar contraste, labels, botones accesibles y teclado | Accessibility Auditor |
| Revisar footer y componentes principales en pantallas pequenas | UX Architect |
| Capturar evidencia visual de desktop y movil | Evidence Collector |

Criterios de aceptacion:

- No hay alertas innecesarias en flujos principales.
- Formularios comunican carga, exito y error.
- La experiencia movil es usable.
- Textos de salud mental son claros y responsables.
- Accesibilidad basica queda revisada.

Bloqueantes:

- Cambio UX oculta errores de seguridad.
- Mensajes indican exito cuando backend rechazo la accion.
- Pantallas principales no son utilizables en movil.

## Dia 11: Pruebas Manuales, APIs Y Evidencia

Objetivo: validar flujos reales antes de considerar el proyecto aprobable o listo.

| Tarea | Agente |
| --- | --- |
| Probar registro de usuario | API Tester |
| Probar login correcto | API Tester |
| Probar login con contrasena incorrecta | API Tester |
| Probar usuario suspendido | API Tester |
| Probar logout | API Tester |
| Probar dashboard usuario normal | Evidence Collector |
| Probar dashboard admin | Evidence Collector |
| Probar creacion de admin autorizada y no autorizada | API Tester |
| Probar listado de usuarios | API Tester |
| Probar suspension y reactivacion | API Tester |
| Probar cambio forzado de contrasena si aplica | API Tester |
| Probar entrada de diario | API Tester |
| Probar exportacion PDF | Evidence Collector |
| Probar frase motivacional | API Tester |
| Probar recomendaciones | API Tester |
| Probar favoritos como premium | API Tester |
| Probar favoritos sin premium | API Tester |
| Probar pago premium exitoso | API Tester |
| Probar pago premium fallido | API Tester |
| Probar pago cancelado o repetido | API Tester |
| Probar sesion expirada | API Tester |
| Registrar evidencia de resultados | Evidence Collector |
| Aprobar o rechazar con base en evidencia | Reality Checker |

Criterios de aceptacion:

- Todos los flujos criticos tienen resultado documentado.
- Los casos negativos de seguridad son rechazados correctamente.
- No hay errores 500 en flujos esperados.
- Existe evidencia visual o funcional suficiente.

Bloqueantes:

- No se prueban casos negativos de admin y premium.
- Hay errores 500 en flujos normales.
- No existe evidencia verificable de pruebas.

## Dia 12: Produccion Y Documentacion

Objetivo: dejar el proyecto preparado para despliegue inicial con configuracion clara.

| Tarea | Agente |
| --- | --- |
| Revisar variables de produccion | DevOps Automator |
| Separar configuracion local y produccion | DevOps Automator |
| Confirmar build frontend | DevOps Automator |
| Confirmar backend en modo produccion | DevOps Automator |
| Revisar CORS definitivo | Application Security Engineer |
| Revisar secretos y rotacion si corresponde | Senior SecOps Engineer |
| Confirmar que secretos no aparezcan en logs, commits, documentacion real ni capturas | Senior SecOps Engineer |
| Revisar configuracion de base de datos | Database Optimizer |
| Revisar proceso de migraciones para despliegue | Database Optimizer |
| Confirmar que `db.create_all()` queda prohibido fuera de local controlado | Backend Architect |
| Documentar configuracion de PayPal | Technical Writer |
| Documentar configuracion de OpenAI | Technical Writer |
| Documentar creacion segura del primer admin | Technical Writer |
| Actualizar README con arranque, entorno y despliegue | Technical Writer |
| Aprobar o rechazar preparacion de produccion | Reality Checker |

Criterios de aceptacion:

- Produccion no usa debug activo.
- CORS esta restringido.
- Secretos no estan hardcodeados ni expuestos.
- Base de datos se inicializa mediante proceso controlado.
- Primer admin tiene procedimiento seguro.
- README permite que otro agente levante el proyecto sin adivinar.

Bloqueantes:

- Hay secretos hardcodeados.
- Produccion depende de configuracion insegura.
- `db.create_all()` sigue activo fuera de local controlado.
- No esta documentado como crear el primer admin.
- Despliegue requiere pasos manuales no documentados.

## Bloqueantes Globales

- Existe creacion publica de admins.
- Flask-Admin queda accesible publicamente sin proteccion.
- Premium puede activarse desde frontend o mediante endpoint directo inseguro.
- Backend acepta rol, premium, monto, moneda o estado de pago enviados por el cliente como fuente de verdad.
- Usuarios suspendidos pueden operar como usuarios activos.
- Endpoints admin no validan autenticacion y rol.
- Debug queda fijo para produccion.
- CORS queda abierto en produccion.
- Secretos estan hardcodeados, aparecen en logs o se documentan como valores reales.
- La base depende de cambios manuales sin migraciones.
- `db.create_all()` queda permitido fuera de local controlado.
- Pagos no quedan registrados.
- Errores esperados generan 500.
- No hay evidencia de pruebas para flujos criticos.
- Reality Checker rechaza una fase.

## Checklist Final De Reaprobacion

- [ ] Seguridad critica esta antes que UX, limpieza y documentacion.
- [ ] Admin publico queda tratado como riesgo bloqueante.
- [ ] Flask-Admin queda tratado como riesgo bloqueante.
- [ ] Premium inseguro queda tratado como riesgo bloqueante.
- [ ] Pagos requieren validacion backend, proveedor real, idempotencia y registro en base de datos.
- [ ] CORS, debug, secretos y creacion automatica de tablas estan incluidos antes de produccion.
- [ ] Usuarios suspendidos tienen comportamiento definido.
- [ ] Cada dia tiene agente principal y agentes de revision.
- [ ] Cada tarea tiene agente asignado.
- [ ] Cada dia tiene criterios de aceptacion.
- [ ] Cada dia tiene bloqueantes claros.
- [ ] Las pruebas de seguridad no se dejan solo para el final.
- [ ] La documentacion de primer admin, PayPal, OpenAI y entorno esta contemplada.
- [ ] Reality Checker puede aprobar o rechazar con evidencia.
- [ ] Security Architect y Application Security Engineer aprueban las fases criticas.
- [ ] Backend Architect aprueba autenticacion, autorizacion, pagos y robustez.
- [ ] Database Optimizer aprueba migraciones y modelo de pagos.
- [ ] DevOps Automator y Senior SecOps Engineer aprueban preparacion de produccion.
