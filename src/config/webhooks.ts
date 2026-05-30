import i18n from '@/i18n';

export const WEBHOOK_EVENTS = [
  {
    id: 'water_log.created',
    label: 'water_log.created',
    description: i18n.t('webhooks.water_log_created'),
    schema: {
      id: 'uuid',
      user_id: 'uuid',
      amount: 'number (ml)',
      name: 'string',
      day: 'date',
      created_at: 'timestamp',
    },
    example: `{
  "id": "a1b2c3d4-...",
  "user_id": "user-abc-123",
  "amount": 250,
  "name": "Water",
  "day": "2026-05-26",
  "created_at": "2026-05-26T10:30:00Z"
}`,
  },
  {
    id: 'water_log.updated',
    label: 'water_log.updated',
    description: i18n.t('webhooks.water_log_updated'),
    schema: {
      id: 'uuid',
      user_id: 'uuid',
      amount: 'number (ml)',
      name: 'string',
      day: 'date',
      previous_amount: 'number (ml)',
      updated_at: 'timestamp',
    },
    example: `{
  "id": "a1b2c3d4-...",
  "user_id": "user-abc-123",
  "amount": 300,
  "name": "Water",
  "day": "2026-05-26",
  "previous_amount": 200,
  "updated_at": "2026-05-26T11:00:00Z"
}`,
  },
  {
    id: 'water_log.deleted',
    label: 'water_log.deleted',
    description: i18n.t('webhooks.water_log_deleted'),
    schema: {
      id: 'uuid',
      user_id: 'uuid',
      amount: 'number (ml)',
      day: 'date',
      deleted_at: 'timestamp',
    },
    example: `{
  "id": "a1b2c3d4-...",
  "user_id": "user-abc-123",
  "amount": 250,
  "day": "2026-05-26",
  "deleted_at": "2026-05-26T12:00:00Z"
}`,
  },
  {
    id: 'streak.updated',
    label: 'streak.updated',
    description: i18n.t('webhooks.streak_updated'),
    schema: {
      user_id: 'uuid',
      current_streak: 'number',
      longest_streak: 'number',
      milestone: 'string | null',
      updated_at: 'timestamp',
    },
    example: `{
  "user_id": "user-abc-123",
  "current_streak": 7,
  "longest_streak": 14,
  "milestone": "7-day",
  "updated_at": "2026-05-26T10:30:00Z"
}`,
  },
] as const;

export const WEBHOOK_ENVELOPE = {
  id: 'uuid (unique per delivery)',
  event: 'string (event type)',
  timestamp: 'ISO8601 timestamp',
  data: 'object (event-specific payload)',
};

export const WEBHOOK_SIGNATURE_EXAMPLE = `// Node.js — verify DigiWell webhook signature
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  const expected = 'sha256=' + hmac.digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// Express example
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-digiwell-signature-256'];
  if (!verifyWebhook(req.body, signature, process.env.DIGIWELL_SECRET)) {
    return res.status(401).send('Invalid signature');
  }
  console.log('Event:', req.body.event);
  res.status(200).send('OK');
});`;

export const WEBHOOK_HEADERS = [
  { header: 'x-digiwell-signature-256', description: i18n.t('webhooks.header_signature') },
  { header: 'x-digiwell-event', description: i18n.t('webhooks.header_event') },
  { header: 'x-digiwell-delivery-id', description: i18n.t('webhooks.header_delivery_id') },
  { header: 'user-agent', description: i18n.t('webhooks.header_user_agent') },
] as const;
