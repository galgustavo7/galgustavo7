# 👋 Hola, soy Gustavo Cruces (galgustavo7)

![avatar](https://avatars.githubusercontent.com/u/165847641?v=4)

Desarrollador Backend especializado en PHP para e‑commerce. Experiencia sólida en Laravel y WordPress (incluyendo integraciones con WooCommerce y enfoques headless). Diseño arquitecturas escalables, resilientes y orientadas a datos para tiendas online, con gestión avanzada de bases de datos y collations para entornos multi‑idioma y multi‑zona.

[📄 CV](#) • [✉️ Contacto](mailto:galgustavo7@gmail.com) • [LinkedIn](http://www.linkedln.com/in/Gustavo-cruces/)

---

## 🔭 Qué hago
- Desarrollo de APIs y servicios backend para e‑commerce (Laravel, Lumen, WordPress/WooCommerce).
- Diseño de arquitecturas: monolitos modulares, microservicios y BFFs para canales headless.
- Gestión y sincronización de datos entre múltiples bases: MySQL/MariaDB, PostgreSQL, Redis, Elasticsearch.
- Implementación de colas, workers y pipelines para procesamiento asíncrono (pagos, inventarios, facturación).
- Integración con pasarelas de pago, ERPs y sistemas de logística.
- Observabilidad, profiling y optimización para entornos con picos de tráfico.

---

## 🛠 Stack principal
- Lenguaje: PHP 8.x, Composer
- Frameworks / CMS: Laravel, Lumen, Symfony (cuando aplica), WordPress (WooCommerce / headless)
- Bases de datos: MySQL / MariaDB (utf8mb4, collations), PostgreSQL, Redis, Elasticsearch, MongoDB (cuando aplica)
- Mensajería / background: Redis queues, Laravel Horizon, RabbitMQ, Supervisor
- Infra / DevOps: Docker, docker-compose, Kubernetes (básico), GitHub Actions, Deployer/Capistrano
- Calidad: PHPUnit, Pest, PHPStan, Psalm, PHPCS, Blackfire, Xdebug
- Observabilidad: Sentry, Prometheus + Grafana, ELK

---

## ⭐ Enfoque E‑commerce (qué entrego)
- Modelado robusto de catálogo (productos, variantes, atributos) y búsqueda optimizada con Elasticsearch.
- Checkout resiliente: idempotencia, conciliación de pagos y reintentos seguros.
- Inventario distribuido: sincronización entre almacenes, reconciliaciones y compensaciones (eventual consistency).
- Gestión de promociones, reglas complejas y pricing multi‑moneda.
- Internacionalización: locales, impuestos, formatos y collations por región.
- Seguridad y cumplimiento: manejo seguro de datos sensibles, buenas prácticas para PCI‑DSS.

---

## 🔧 Soporte multi‑BD y collations (prácticas)
- Recomendación general: usar utf8mb4 y collations coherentes en todo el ecosistema para evitar problemas de búsqueda y sorting.
- Estrategias:
  - Scripts automatizados para definir charset/collation en nuevas bases y réplicas.
  - Migraciones incrementales con pruebas en staging antes de producción.
  - Normalización/escape en integraciones con sistemas legados; reconciliación periódica de datos.
  - Adaptación de índices y tipos según motor (ej.: jsonb en PostgreSQL vs columnas JSON en MySQL).
- Casos especiales: diferencias en ordering y case‑sensitivity entre MySQL y PostgreSQL — aplico abstracciones y pruebas de contrato para asegurar comportamiento consistente.

---

## 📚 Caso de estudio (resumen)
- Contexto: plataforma con picos de tráfico que degradaban el checkout y provocaban desincronización de stock.
- Solución:
  - Arquitectura de workers y colas para procesar órdenes y conciliaciones de forma asíncrona.
  - Cache inteligente y réplicas de lectura para escalar lecturas intensivas del catálogo.
  - Normalización de charset/collation (utf8mb4) y scripts de reconciliación para integraciones externas.
- Resultados: checkout estable ante picos 3x, reducción de errores 5xx en 95%, mejora del p95 en 60%.

---

## 📂 Proyectos (ordenados por fecha de creación, más recientes primero)

- Techstore — Tienda MVC en PHP  
  Repo: https://github.com/galgustavo7/Techstore  
  Creado: 07 Apr 2026

- galgustavo7 — Repositorio de perfil / desarrollador web  
  Repo: https://github.com/galgustavo7/galgustavo7  
  Creado: 04 Jun 2024

Si quieres que añada descripciones más detalladas, demos o badges (CI, coverage) en cada repo, indícame cuáles y los actualizo.

---

## ✅ Buenas prácticas que aplico
- Documentación OpenAPI / Swagger para contratos de API.
- CI/CD: GitHub Actions para analizador estático (PHPStan/Psalm), tests unitarios e integración y despliegue.
- Docker + docker‑compose para entornos reproducibles.
- Tests: unitarios, integración y contract tests para integraciones externas.
- Logging estructurado, trazabilidad con correlation IDs y alertas configuradas.
- Policies y scripts para backups, restores y reconciliaciones de datos.

---

## 📬 Contacto
- GitHub: https://github.com/galgustavo7
- Email: galgustavo7@gmail.com
- LinkedIn: http://www.linkedln.com/in/Gustavo-cruces/

---

Licencia: MIT
