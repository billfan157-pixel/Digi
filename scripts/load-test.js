// Sprint 17: Load test critical paths
// Usage: k6 run scripts/load-test.js
// Install k6: https://k6.io/docs/get-started/installation/

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.SUPABASE_URL || 'https://xxx.supabase.co';
const ANON_KEY = __ENV.SUPABASE_ANON_KEY || '';
const TEST_TOKEN = __ENV.TEST_AUTH_TOKEN || '';

const errorRate = new Rate('errors');
const feedTrend = new Trend('feed_query_ms');
const waterTrend = new Trend('water_query_ms');
const notifTrend = new Trend('notification_query_ms');

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // ramp up to 10 users
    { duration: '1m', target: 10 },   // stay at 10
    { duration: '30s', target: 50 },  // ramp to 50
    { duration: '1m', target: 50 },   // stay at 50
    { duration: '30s', target: 0 },   // ramp down
  ],
  thresholds: {
    errors: ['rate<0.05'],     // < 5% errors
    http_req_duration: ['p(95)<3000'], // 95% under 3s
  },
};

const headers = {
  'Content-Type': 'application/json',
  'apikey': ANON_KEY,
  'Authorization': `Bearer ${TEST_TOKEN}`,
};

export default function () {
  group('Feed Query', () => {
    const start = Date.now();
    const res = http.get(
      `${BASE_URL}/rest/v1/social_posts?select=*,author:author_id(nickname,avatar_url,level)&order=created_at.desc&limit=20&offset=0`,
      { headers },
    );
    const duration = Date.now() - start;
    feedTrend.add(duration);
    errorRate.add(!res || res.status > 400);
    check(res, { 'feed status 200': (r) => r && r.status === 200 });
    sleep(1);
  });

  group('Water Log Query', () => {
    const start = Date.now();
    const res = http.get(
      `${BASE_URL}/rest/v1/water_logs?select=*&user_id=eq.test&order=created_at.desc&limit=50`,
      { headers },
    );
    const duration = Date.now() - start;
    waterTrend.add(duration);
    errorRate.add(!res || res.status > 400);
    check(res, { 'water status 200': (r) => r && r.status === 200 });
    sleep(0.5);
  });

  group('Notification Query', () => {
    const start = Date.now();
    const res = http.get(
      `${BASE_URL}/rest/v1/notifications?select=*&recipient_id=eq.test&order=created_at.desc&limit=20`,
      { headers },
    );
    const duration = Date.now() - start;
    notifTrend.add(duration);
    errorRate.add(!res || res.status > 400);
    check(res, { 'notification status 200': (r) => r && r.status === 200 });
    sleep(0.5);
  });

  group('Profile Read', () => {
    const res = http.get(
      `${BASE_URL}/rest/v1/profiles?id=eq.test&select=*`,
      { headers },
    );
    errorRate.add(!res || res.status > 400);
    check(res, { 'profile status 200': (r) => r && r.status === 200 });
    sleep(0.3);
  });

  group('Leaderboard Query', () => {
    const res = http.get(
      `${BASE_URL}/rest/v1/public_profiles?select=nickname,wp,level,avatar_url&order=wp.desc&limit=50`,
      { headers },
    );
    errorRate.add(!res || res.status > 400);
    check(res, { 'leaderboard status 200': (r) => r && r.status === 200 });
    sleep(0.5);
  });

  group('Notifications Count', () => {
    const res = http.get(
      `${BASE_URL}/rest/v1/notifications?recipient_id=eq.test&select=id&head=true`,
      { headers },
    );
    errorRate.add(!res || res.status > 400);
    check(res, { 'notif count status 200': (r) => r && r.status === 200 });
    sleep(0.3);
  });
}
