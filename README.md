# ElorAdmin — Panel de administración del Framework educativo

Una aplicación web en Angular para gestionar usuarios y reuniones del CIFP Elorrieta-Errekamari. Diseñada para ser clara, segura, responsive y multiidioma.

• Roles: God, Administradores, Profesores, Alumnos  
• Home: métricas rápidas (alumnos, profesores, reuniones de hoy)  
• CRUD: alta/edición/borrado de usuarios (con restricciones para God/administradores)  
• Búsqueda: por nombre, apellidos y tipo_id  
• Reuniones: filtros DTITUC → DTERRE → DMUNIC, tabla paginada, detalle con mapa (Mapbox)  
• Seguridad: password cifrado por Clave Pública en tránsito; buenas prácticas de rutas protegidas (Guards)  
• UX: responsive (Bootstrap), 3 idiomas (eu/es/en), aspecto profesional acorde a identidad del centro

## Stack y arquitectura
- Angular + TypeScript + RxJS
- Bootstrap + iconografía
- Mapbox en componente de detalle de reuniones
- MySQL (XAMPP) y JSON de apoyo para catálogos/centros
- Módulos: Auth, Administradores, Profesores, Alumnos, Reuniones, Core (interceptores/guards), Shared (componentes reutilizables)
- Patrón de servicios (HttpClient) y guards por ruta principal; manejo de estados y errores con observables

## Inicio rápido
1) Requisitos: Node LTS, Angular CLI, XAMPP MySQL activo  
2) Configura endpoints y claves en `environment.*` (API/BD y mapa)  
3) `npm install`  
4) `ng serve` → abre http://localhost:4200 (login como vista por defecto)

## Aprendizajes clave
- Diseño de rutas y protección granular con Guards
- Internacionalización del componente de reuniones (eu/es/en) y textos en toda la app
- Integración de mapas y datos geográficos (Mapbox + JSON) con filtros jerárquicos
- UX responsive y accesible; paginación y búsqueda eficientes
- Flujo seguro: cifrado de credenciales, manejo de errores y códigos HTTP

## Calidad y mantenimiento
- Estructura modular, servicios desacoplados y componentes reutilizables
- Naming significativo, eliminación de código muerto y DRY
- Documentación mínima orientada a despliegue y soporte

---
ElorAdmin es el pilar de administración del Framework educativo, conectando la gestión con una experiencia moderna, segura y didáctica.