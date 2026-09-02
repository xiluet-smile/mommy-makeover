# Especificación del webhook de leads · Landing page Mommy Makeover

**Landing page:** https://promo.xiluetaestheticsurgery.com (inglés) · https://promo.xiluetaestheticsurgery.com/es/ (español)

## Qué necesitamos de tu parte

1. Un **endpoint HTTPS** en el CRM que acepte un `POST` con cuerpo JSON (una petición por lead) y responda con cualquier código `2xx`.
2. Opcional: el mismo endpoint u otro que acepte un POST `multipart/form-data` con hasta 4 fotos (ver "Subida de fotos").
3. La **autenticación** que quieras que enviemos: un header con secreto compartido o un bearer token. Indícanos el nombre del header y su valor.

Cuando esté listo, envíanos tres cosas: la URL del endpoint, la URL del endpoint de fotos si es distinta, y el header de autenticación (nombre y valor). Los configuramos en Cloudflare y los leads empiezan a llegar el mismo día. Nada cambia en la landing page.

## Cómo te llega la petición

El visitante responde un quiz de 8 pasos. Al enviarlo, la página hace un POST a nuestra función en Cloudflare, que reenvía **un solo POST JSON** a tu endpoint desde la red de Cloudflare (el navegador nunca llama a tu URL directamente).

```
POST <tu endpoint>
Content-Type: application/json
X-Webhook-Secret: <secreto compartido, si eliges esa opción>      (o bien)
Authorization: Bearer <token>                                     (cualquier header único que nos indiques)
```

Timeout: de nuestro lado esperamos hasta 8 segundos tu respuesta. Responde rápido (encola cualquier procesamiento lento).

## Payload JSON

Cada petición trae exactamente estas claves. Una cadena vacía significa "no respondido / no aplica". Los valores son claves fijas en inglés tanto en la página en inglés como en la de español, así que nunca recibirás texto traducido.

```json
{
  "first_name": "Ana Test",
  "phone": "(305) 555-0100",
  "email": "ana@example.com",
  "whatsapp_ok": true,
  "language": "es",
  "procedures": ["tummy_tuck", "breast_lift"],
  "timing": "1_3_months",
  "travel": "other_state",
  "age_18_plus": "yes",
  "postpartum_status": "yes",
  "smoker": "no",
  "payment_method": "financing",
  "credit_range": "720_plus",
  "state": "Georgia",
  "city": "Atlanta",
  "qualification": "qualified",
  "source": "google_lp_mommy_makeover",
  "campaign_name": "mm-es",
  "utm_source": "google",
  "utm_medium": "cpc",
  "utm_campaign": "mm-es",
  "utm_content": "",
  "utm_term": "",
  "matchtype": "",
  "gclid": "Cj0KCQjw...",
  "gbraid": "",
  "wbraid": "",
  "fbclid": "",
  "fbp": "",
  "fbc": "",
  "landing_url": "https://promo.xiluetaestheticsurgery.com/es/?utm_source=google&utm_campaign=mm-es&gclid=Cj0KCQjw...",
  "event_source_url": "https://promo.xiluetaestheticsurgery.com/es/",
  "submitted_at": "2026-09-01T23:27:47.220Z"
}
```

### Referencia de campos

| Campo | Tipo | Valores / notas |
|---|---|---|
| `first_name` | string | Nombre completo tal como lo escribió la visitante (el campo del formulario dice "Nombre completo"). |
| `phone` | string | Tal como se escribió; sin normalizar. |
| `email` | string | Tal como se escribió, sin espacios al inicio o al final. |
| `whatsapp_ok` | boolean | Siempre `true` (la línea de consentimiento del formulario cubre teléfono, SMS y WhatsApp). |
| `language` | string | `en` o `es`. Úsalo para asignar a coordinadoras de habla inglesa o hispana. |
| `procedures` | array de strings | Cualquiera de `tummy_tuck`, `breast_lift`, `breast_augmentation`, `liposuction`, `not_sure`. Puede venir vacío. |
| `timing` | string | `asap`, `1_3_months`, `3_6_months`, `researching`. |
| `travel` | string | `miami_south_fl`, `florida`, `other_state`, `no`. |
| `age_18_plus` | string | `yes`, `no`. |
| `postpartum_status` | string | `yes` (no planea más embarazos, 6+ meses posparto, ya no amamanta), `not_yet`, `not_sure`. |
| `smoker` | string | `no`, `yes`, `yes_would_stop`. |
| `payment_method` | string | `cash`, `financing`, `mix`, `not_sure`. |
| `credit_range` | string | `720_plus`, `680_719`, `620_679`, `below_620`, `unknown`, o vacío cuando el pago es `cash`. |
| `state` | string | Nombre del estado de EE. UU., `Puerto Rico`, u `Outside the US` / `Fuera de EE. UU.`. Por defecto `Florida`. |
| `city` | string | Texto libre, opcional. |
| `qualification` | string | `qualified`, `nurture`, `not_fit`. Ver reglas abajo. |
| `source` | string | Siempre `google_lp_mommy_makeover`. |
| `campaign_name` | string | Igual a `utm_campaign`, o `google-lp-mm` cuando la visitante llegó sin UTMs. |
| `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` | string | Capturados de la URL de llegada y conservados durante el quiz. Vacíos si no existen. |
| `matchtype` | string | Tipo de concordancia de la palabra clave de Google Ads (`e`, `p`, `b`), si la campaña lo envía. Vacío en caso contrario. |
| `gclid` | string | ID de clic de Google Ads. Guárdalo: permite subir conversiones offline más adelante. |
| `gbraid`, `wbraid` | string | IDs de clic de Google Ads que iOS usa en lugar de `gclid`. Guárdalos igual. |
| `fbclid`, `fbp`, `fbc` | string | ID de clic de Meta y cookies del píxel, para la Conversions API. Vacíos si no existen. |
| `landing_url` | string | Primera URL de la sesión, incluyendo UTMs. |
| `event_source_url` | string | URL de la página donde se envió el formulario. |
| `submitted_at` | string | Fecha y hora ISO 8601 en UTC. |

### Reglas de calificación (las calcula la página; la visitante nunca las ve)

- `not_fit`: `age_18_plus` = `no` **o** `travel` = `no`. Estas visitantes salen antes de terminar y **no se envían**; normalmente no las recibirás.
- `nurture`: `timing` = `researching` **o** `credit_range` = `below_620` **o** `postpartum_status` = `not_yet`.
- `qualified`: todo lo demás.

Manejo sugerido: `qualified` → pipeline de ventas, seguimiento inmediato (justo después de enviar, se le pide a la visitante que mande 4 fotos por WhatsApp). `nurture` → secuencia de seguimiento de la coordinadora.

## Subida de fotos (endpoint opcional)

Las visitantes calificadas pueden subir fotos en la página de gracias en lugar de usar WhatsApp. Si lo soportas, enviamos:

```
POST <endpoint de fotos>         (si no nos das uno distinto, se usa el endpoint de leads)
Content-Type: multipart/form-data
<el mismo header de autenticación de arriba>

photo_front   archivo (image/*, ≤ 12 MB)   -- puede venir cualquier subconjunto de las cuatro
photo_left    archivo
photo_right   archivo
photo_back    archivo
first_name    texto
phone         texto
email         texto
language      texto   en | es
type          texto   "photos"
source        texto   "google_lp_mommy_makeover"
submitted_at  texto   ISO 8601
```

Relaciona las fotos con el lead por `email` y/o `phone`. Responde `2xx` si todo salió bien. Si no quieres recibir archivos, dinos y dejamos la subida solo por WhatsApp.

## Notas de confiabilidad

- Deduplica por `email` + `phone` + `submitted_at` si ves reintentos.
- Por ahora no reintentamos ante un fallo; una respuesta distinta de `2xx` queda registrada de nuestro lado. Si quieres reintentos, dinos y los agregamos.
- Todas las peticiones salen desde la red de Cloudflare, así que una lista blanca de IPs no es práctica. Usa el header de autenticación.

## Cómo probar tu endpoint antes de conectarlo

Ejecuta esto contra tu endpoint (reemplaza la URL y el header). Deberías ver el lead aparecer en el CRM.

```bash
curl -X POST "https://TU-CRM/endpoint" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: TU-SECRETO" \
  -d '{"first_name":"Test Lead","phone":"(305) 555-0100","email":"test@example.com","whatsapp_ok":true,"language":"es","procedures":["tummy_tuck"],"timing":"asap","travel":"miami_south_fl","age_18_plus":"yes","postpartum_status":"yes","smoker":"no","payment_method":"cash","credit_range":"","state":"Florida","city":"Miami","qualification":"qualified","source":"google_lp_mommy_makeover","campaign_name":"google-lp-mm","utm_source":"","utm_medium":"","utm_campaign":"","utm_content":"","utm_term":"","matchtype":"","gclid":"","gbraid":"","wbraid":"","fbclid":"","fbp":"","fbc":"","landing_url":"https://promo.xiluetaestheticsurgery.com/es/","event_source_url":"https://promo.xiluetaestheticsurgery.com/es/","submitted_at":"2026-09-01T00:00:00.000Z"}'
```

En cuanto nos envíes la URL y el header, haremos un lead de prueba real a través del quiz y confirmaremos que llega.
