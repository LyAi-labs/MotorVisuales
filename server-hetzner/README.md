# 🌐 MotorVisuales - Servidor de Presets Comunitarios en Hetzner

Este paquete contiene la API REST y la base de datos de alto rendimiento para el **Hub Comunitario de ADN Visual** de MotorVisuales.

---

## 🚀 Despliegue en Hetzner (1 Minuto con Docker)

### Requisitos
- Servidor Hetzner (Cloud VPS o Servidor Dedicado) con Docker y Docker Compose instalados.

### Pasos de Despliegue
1. Copia esta carpeta `server-hetzner` a tu servidor Hetzner (mediante `scp`, `rsync` o Git):
   ```bash
   scp -r server-hetzner root@TU_IP_HETZNER:/opt/motorvisuales-api
   ```

2. Entra en el directorio en tu servidor:
   ```bash
   cd /opt/motorvisuales-api
   ```

3. Levanta el contenedor:
   ```bash
   docker compose up -d --build
   ```

4. ¡Listo! La API estará activa y respondiendo en el puerto 4000:
   - Health check: `http://TU_IP_HETZNER:4000/api/health`
   - Feed público: `http://TU_IP_HETZNER:4000/api/presets`

---

## 🔒 Configurar Dominio y HTTPS Automático (Caddy o Nginx)

Si tienes un dominio o subdominio apuntando a la IP de tu Hetzner (ej: `https://presets.tudominio.com`):

### Con Nginx existente en tu servidor:
Añade este bloque a tu `/etc/nginx/sites-available/presets`:
```nginx
server {
    server_name presets.tudominio.com;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 10M;
    }
}
```
Y ejecuta `certbot --nginx -d presets.tudominio.com`.

---

## 🔗 Conectar MotorVisuales con tu Servidor Hetzner

En [index.html](file:///c:/MotorVisuales/index.html) o en tu configuración cliente, define el endpoint de tu Hetzner:

```javascript
window.MOTOR_CONFIG = window.MOTOR_CONFIG || {};
window.MOTOR_CONFIG.COMMUNITY_API_URL = "https://presets.tudominio.com/api";
```

*Nota: Mientras no configures el dominio, MotorVisuales funciona inmediatamente con su catálogo curado y persistencia en memoria local sin dar ningún error.*
