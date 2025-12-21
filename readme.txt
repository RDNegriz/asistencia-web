📘 Proyecto Laboratorio – Sistema de Asistencias
📌 Descripción general

Este proyecto implementa un sistema básico de registro de asistencias orientado al ámbito educativo.
Permite gestionar alumnos, cursos y asistencias, y obtener reportes por rango de fechas (semana, cuatrimestre, etc.).

La solución está diseñada siguiendo una arquitectura cliente–servidor, desplegada completamente con Docker y Docker Compose.

🧱 Arquitectura del sistema
Navegador
   |
   v
NGINX (puerto 8080)
   ├── Sirve frontend estático (HTML + JS)
   └── Reverse proxy /api → Backend
                |
                v
        Backend Node.js (Express)
                |
                v
             MariaDB

Componentes

Frontend: HTML + JavaScript (estático)

Backend: Node.js + Express (API REST)

Base de datos: MariaDB

Servidor web / Reverse proxy: Nginx

Orquestación: Docker Compose

🧩 Funcionalidades principales
📋 Gestión básica

Alta de alumnos

Alta de cursos

Registro de asistencias:

Alumno

Curso

Fecha

Estado: PRESENTE, AUSENTE, TARDANZA

Actualización automática si se registra la misma fecha (no duplica)

📊 Reportes

Reporte de asistencia por rango de fechas

Útil para semanas o cuatrimestres

Totales por alumno y curso:

Presentes

Ausentes

Tardanzas

🌐 API externa (demo)

Consulta a una API pública externa (jsonplaceholder) para demostrar consumo de servicios externos.

🗄️ Modelo de datos (simplificado)
Alumnos

id

nombre

Cursos

id

nombre

Asistencias

id

alumno_id

curso_id

estado

fecha

La base de datos se inicializa automáticamente al levantar el backend.

🚀 Cómo ejecutar el proyecto
📦 Requisitos

Docker

Docker Compose

▶️ Pasos

Desde la carpeta raíz del proyecto:

docker compose down
docker compose up -d --build


Verificar servicios:

docker compose ps

🌍 Acceso

Aplicación web:
http://IP_DE_LA_VM:8080

Estado del backend:
http://IP_DE_LA_VM:8080/api/status

🔌 Endpoints principales (API REST)
Alumnos

GET /api/alumnos

POST /api/alumnos

Cursos

GET /api/cursos

POST /api/cursos

Asistencias

POST /api/asistencias

GET /api/asistencias

Reportes

GET /api/reportes/rango?desde=YYYY-MM-DD&hasta=YYYY-MM-DD

(opcional) &curso_id=ID

API externa

GET /api/external

🛠️ Detalles técnicos relevantes

Nginx funciona como servidor de archivos estáticos y reverse proxy

El backend y la base de datos están aislados en una red Docker interna

Persistencia de datos mediante volumen Docker

Configuración por variables de entorno

Arquitectura escalable y extensible

📚 Contexto académico

Proyecto desarrollado como laboratorio integrador, aplicando conocimientos de:

Linux

Docker / Docker Compose

Redes y servicios

Arquitectura web

Bases de datos

Desarrollo backend y frontend básico

🔮 Posibles mejoras futuras

Inscripción de alumnos a cursos

Autenticación de docentes

Justificación de ausencias

Exportación de reportes (CSV / PDF)

Notificaciones por correo

Integración con servidor de correo (ej. Zimbra)

👤 Autor

Proyecto realizado por (Susana y Ruben) estudiantes de la Diplomatura en Infraestructura Tecnológica basada en Software Libre.