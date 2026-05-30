import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const hydrationDuration = new Trend('hydration_duration');
const feedDuration = new Trend('feed_duration');
const cacheDuration = new Trend('cache_duration');
const readReplicaDuration = new Trend('read_replica_duration');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5173';
const API_URL = __ENV.API_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_KEY = __ENV.SUPABASE_SERVICE_KEY || '';

export const options = {
  stages: [
    { duration: '1m', target: 100 },
    { duration: '2m', target: 500 },
    { duration: '2m', target: 1000 },
    { duration: '2m', target: 2000 },
    { duration: '3m', target: 2000 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    'http_req_duration': ['p(95)<2000'],
    'http_req_failed': ['rate<0.10'],
    'login_duration': ['p(95)<3000'],
    'hydration_duration': ['p(95)<2500'],
    'feed_duration': ['p(95)<3000'],
    'cache_duration': ['p(95)<500'],
    'read_replica_duration': ['p(95)<1500'],
    'errors': ['rate<0.15'],
  },
};

const testUsers = [
  { email: 'test1@example.com', password: 'testpass1' },
  { email: 'test2@example.com', password: 'testpass2' },
  { email: 'test3@example.com', password: 'testpass3' },
];

function randomUser() {
  return testUsers[Math.floor(Math.random() * testUsers.length)];
}

export default function () {
  group('Frontend: homepage', function () {
    const homeRes = http.get(BASE_URL + '/');
    check(homeRes, {
      'homepage status 200': (r) => r.status === 200,
      'homepage loads quickly': (r) => r.timings.duration < 3000,
    });
    errorRate.add(homeRes.status !== 200);
  });

  sleep(1);

  group('Auth: login flow', function () {
    const user = randomUser();

    const loginRes = http.post(`${API_URL}/auth/v1/token?grant_type=password`, {
      email: user.email,
      password: user.password,
    }, {
      headers: { 'Content-Type': 'application/json' },
    });

    const loginSuccess = check(loginRes, {
      'login status 200': (r) => r.status === 200,
      'login returns token': (r) => r.json('access_token') !== undefined,
    });

    errorRate.add(!loginSuccess);
    loginDuration.add(loginRes.timings.duration);

    if (loginRes.json('access_token')) {
      const token = loginRes.json('access_token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': SUPABASE_ANON_KEY,
      };

      sleep(1);

      group('API: record hydration', function () {
        const hydrationRes = http.post(`${API_URL}/rest/v1/rpc/record_hydration_event`, {
          amount_ml: 250,
          client_event_id: `k6-${__VU}-${Date.now()}`,
        }, { headers });

        const hydrationSuccess = check(hydrationRes, {
          'hydration status 200': (r) => r.status === 200,
          'hydration returns log_id': (r) => r.json('log_id') !== undefined,
        });

        errorRate.add(!hydrationSuccess);
        hydrationDuration.add(hydrationRes.timings.duration);
      });

      group('API: load feed', function () {
        const feedRes = http.get(`${API_URL}/rest/v1/social_posts?select=*&limit=20`, { headers });

        check(feedRes, {
          'feed status 200': (r) => r.status === 200,
          'feed returns posts': (r) => Array.isArray(r.json()),
        });
        errorRate.add(feedRes.status !== 200);
        feedDuration.add(feedRes.timings.duration);
      });

      group('API: read replica query (leaderboard)', function () {
        const readRes = http.get(`${API_URL}/rest/v1/rpc/get_leaderboard?limit=50`, { headers });

        check(readRes, {
          'read replica status 200': (r) => r.status === 200,
        });
        errorRate.add(readRes.status !== 200);
        readReplicaDuration.add(readRes.timings.duration);
      });

      group('API: read replica query (daily stats)', function () {
        const statsRes = http.get(`${API_URL}/rest/v1/rpc/get_daily_stats`, { headers });

        check(statsRes, {
          'daily stats status 200': (r) => r.status === 200,
        });
        errorRate.add(statsRes.status !== 200);
      });
    }
  });

  sleep(1);

  group('CDN/cache: cache-proxy endpoints', function () {
    const cacheEndpoints = [
      `${BASE_URL}/api/cache/leaderboard`,
      `${BASE_URL}/api/cache/weather`,
      `${BASE_URL}/api/cache/quests`,
    ];

    cacheEndpoints.forEach((url) => {
      const cacheRes = http.get(url);
      check(cacheRes, {
        'cache endpoint responds': (r) => r.status < 500,
      });
      cacheDuration.add(cacheRes.timings.duration);
      errorRate.add(cacheRes.status >= 500);
    });
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'k6-summary.json': JSON.stringify({
      total_requests: data.metrics.http_reqs.values.count,
      failed_requests: data.metrics.http_req_failed.values.passes,
      avg_duration_ms: data.metrics.http_req_duration.values.avg,
      p95_duration_ms: data.metrics.http_req_duration.values['p(95)'],
      max_duration_ms: data.metrics.http_req_duration.values.max,
      test_duration_s: data.state.testRunDuration / 1000,
      vus_max: data.metrics.vus_max ? data.metrics.vus_max.values.value : 2000,
      login_p95_ms: data.metrics.login_duration ? data.metrics.login_duration.values['p(95)'] : 0,
      hydration_p95_ms: data.metrics.hydration_duration ? data.metrics.hydration_duration.values['p(95)'] : 0,
      feed_p95_ms: data.metrics.feed_duration ? data.metrics.feed_duration.values['p(95)'] : 0,
      cache_p95_ms: data.metrics.cache_duration ? data.metrics.cache_duration.values['p(95)'] : 0,
      read_replica_p95_ms: data.metrics.read_replica_duration ? data.metrics.read_replica_duration.values['p(95)'] : 0,
    }),
  };
}

function textSummary(data, options) {
  const { metrics } = data;
  let summary = '\n';
  summary += '============================================\n';
  summary += '       K6 LOAD TEST SUMMARY (2K VUs)\n';
  summary += '============================================\n\n';
  summary += `Total Requests:     ${metrics.http_reqs.values.count}\n`;
  summary += `Failed Requests:    ${metrics.http_req_failed.values.passes}\n`;
  summary += `Avg Duration:       ${metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  summary += `P95 Duration:        ${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += `Max Duration:       ${metrics.http_req_duration.values.max.toFixed(2)}ms\n`;
  summary += `Test Duration:      ${(data.state.testRunDuration / 1000).toFixed(1)}s\n`;
  summary += `Max VUs:            ${metrics.vus_max ? metrics.vus_max.values.value : 'N/A'}\n\n`;

  if (metrics.login_duration) {
    summary += 'Login Performance:\n';
    summary += `  Avg: ${metrics.login_duration.values.avg.toFixed(2)}ms\n`;
    summary += `  P95: ${metrics.login_duration.values['p(95)'].toFixed(2)}ms\n\n`;
  }

  if (metrics.hydration_duration) {
    summary += 'Hydration Performance:\n';
    summary += `  Avg: ${metrics.hydration_duration.values.avg.toFixed(2)}ms\n`;
    summary += `  P95: ${metrics.hydration_duration.values['p(95)'].toFixed(2)}ms\n\n`;
  }

  if (metrics.feed_duration) {
    summary += 'Feed Performance:\n';
    summary += `  Avg: ${metrics.feed_duration.values.avg.toFixed(2)}ms\n`;
    summary += `  P95: ${metrics.feed_duration.values['p(95)'].toFixed(2)}ms\n\n`;
  }

  if (metrics.cache_duration) {
    summary += 'Cache Proxy Performance:\n';
    summary += `  Avg: ${metrics.cache_duration.values.avg.toFixed(2)}ms\n`;
    summary += `  P95: ${metrics.cache_duration.values['p(95)'].toFixed(2)}ms\n\n`;
  }

  if (metrics.read_replica_duration) {
    summary += 'Read Replica Performance:\n';
    summary += `  Avg: ${metrics.read_replica_duration.values.avg.toFixed(2)}ms\n`;
    summary += `  P95: ${metrics.read_replica_duration.values['p(95)'].toFixed(2)}ms\n\n`;
  }

  summary += 'Thresholds:\n';
  summary += `  Duration P95 < 2000ms: ${metrics.http_req_duration.values['p(95)'] < 2000 ? 'PASS' : 'FAIL'}\n`;
  summary += `  Error Rate < 10%:       ${metrics.http_req_failed.values.rate < 0.10 ? 'PASS' : 'FAIL'}\n`;
  summary += `  Errors < 15%:           ${metrics.errors ? `${metrics.errors.values.rate < 0.15 ? 'PASS' : 'FAIL'}` : 'N/A'}\n`;

  return summary;
}
