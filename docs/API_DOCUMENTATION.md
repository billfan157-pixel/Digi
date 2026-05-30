# DigiWell Public API Documentation

**Version:** 1.0.0
**Base URL:** `https://{project_ref}.supabase.co/functions/v1/v1`
**Last Updated:** 2026-05-26

---

## Authentication

Tất cả API endpoints yêu cầu authentication qua một trong hai phương thức:

### 1. API Key Header (Khuyến nghị)
```http
x-api-key: dw_live_your_api_key_here
```

### 2. Bearer Token
```http
Authorization: Bearer dw_live_your_api_key_here
```

---

## Endpoints

### Profile

#### `GET /profile`
Lấy hồ sơ người dùng hiện tại.

**Response:**
```json
{
  "id": "uuid",
  "nickname": "string",
  "gender": "string",
  "age": 25,
  "height": 170,
  "weight": 65,
  "activity": "moderate",
  "climate": "tropical",
  "goal": "maintain",
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-01T00:00:00Z"
}
```

#### `PATCH /profile`
Cập nhật hồ sơ người dùng.

**Request Body:**
```json
{
  "nickname": "string",
  "gender": "string",
  "age": 25,
  "height": 170,
  "weight": 65,
  "activity": "string",
  "climate": "string",
  "goal": "string"
}
```

---

### Water Logs

#### `GET /water-logs`
Lấy lịch sử uống nước.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | integer | 50 | Số bản ghi tối đa |
| offset | integer | 0 | Số bản ghi bỏ qua |
| start_date | string (YYYY-MM-DD) | - | Ngày bắt đầu |
| end_date | string (YYYY-MM-DD) | - | Ngày kết thúc |

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "amount": 250,
    "name": "Nước lọc",
    "exp": 10,
    "day": "2026-05-26",
    "drink_type": "water",
    "created_at": "2026-05-26T10:00:00Z"
  }
]
```

#### `POST /water-logs`
Ghi nhận lượng nước đã uống.

**Request Body:**
```json
{
  "amount": 250,
  "name": "Nước lọc",
  "drink_type": "water",
  "day": "2026-05-26"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "amount": 250,
  "name": "Nước lọc",
  "exp": 10,
  "day": "2026-05-26",
  "drink_type": "water",
  "created_at": "2026-05-26T10:00:00Z"
}
```

#### `DELETE /water-logs`
Xóa bản ghi uống nước.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | uuid | ID của bản ghi cần xóa |

---

## Webhooks

### Event Types

| Event | Description |
|-------|-------------|
| `water_log.created` | Bản ghi uống nước mới được tạo |
| `water_log.updated` | Bản ghi uống nước được cập nhật |
| `water_log.deleted` | Bản ghi uống nước bị xóa |
| `*` | Tất cả các sự kiện |

### Webhook Payload Format

```json
{
  "id": "delivery-uuid",
  "event": "water_log.created",
  "timestamp": "2026-05-26T10:00:00Z",
  "data": {
    "id": "water-log-uuid",
    "user_id": "user-uuid",
    "amount": 250,
    "name": "Nước lọc",
    "exp": 10,
    "day": "2026-05-26",
    "drink_type": "water",
    "created_at": "2026-05-26T10:00:00Z"
  }
}
```

### Verifying Webhook Signatures

Mỗi webhook request bao gồm header `x-digiwell-signature-256`:

```http
x-digiwell-signature-256: sha256=hmac_hex_signature
```

**Verification (Node.js example):**
```javascript
import crypto from 'crypto';

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  const receivedSignature = signature.replace('sha256=', '');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(receivedSignature)
  );
}
```

---

## Rate Limits

| Tier | Limit |
|------|-------|
| Public API | 60 requests/minute |

---

## Error Responses

| Status | Description |
|--------|-------------|
| 400 | Bad Request - Dữ liệu không hợp lệ |
| 401 | Unauthorized - API key không hợp lệ |
| 404 | Not Found - Resource không tồn tại |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

---

## SDKs & Libraries

### JavaScript/TypeScript
```bash
npm install @supabase/supabase-js
```

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://your-project.supabase.co',
  'your-anon-key',
  {
    global: { headers: { 'x-api-key': 'your-api-key' } }
  }
);
```

---

## Support

- **Email:** api@digiwell.app
- **Documentation:** https://docs.digiwell.app
- **Status Page:** https://status.digiwell.app
