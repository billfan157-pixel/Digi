import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { checkRateLimit } from '../_shared/rateLimit.ts';

// CORS Headers helper
function getCorsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  };
}

// JSON helper response
const jsonResponse = (body: Record<string, unknown> | Array<unknown>, status = 200, origin: string | null = null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
  });

// Rate limiting settings for Public API
const RATE_LIMIT_CONFIG = { maxRequests: 60, windowSeconds: 60 };

// OpenAPI Specification JSON
const OPENAPI_SPEC = {
  openapi: "3.0.3",
  info: {
    title: "DigiWell Public API",
    description: "API công khai dành cho nhà phát triển để tích hợp thiết bị và dữ liệu uống nước.",
    version: "1.0.0"
  },
  servers: [
    {
      "url": "https://{project_ref}.supabase.co/functions/v1/v1",
      "description": "Cổng API Gateway chính thức"
    }
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "x-api-key",
        description: "Khóa API được cấp từ trang Cài đặt nhà phát triển."
      },
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        description: "Truyền khóa API trong header Authorization dạng Bearer <api_key>."
      }
    },
    schemas: {
      Profile: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          nickname: { type: "string" },
          gender: { type: "string" },
          age: { type: "integer" },
          height: { type: "number" },
          weight: { type: "number" },
          activity: { type: "string" },
          climate: { type: "string" },
          goal: { type: "string" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" }
        }
      },
      WaterLog: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          user_id: { type: "string", format: "uuid" },
          amount: { type: "integer" },
          name: { type: "string" },
          exp: { type: "integer" },
          day: { type: "string", format: "date" },
          drink_type: { type: "string" },
          created_at: { type: "string", format: "date-time" }
        }
      }
    }
  },
  security: [
    { ApiKeyAuth: [] },
    { BearerAuth: [] }
  ],
  paths: {
    "/profile": {
      get: {
        summary: "Lấy hồ sơ người dùng",
        description: "Trả về chi tiết hồ sơ sinh trắc của tài khoản sở hữu API key.",
        responses: {
          "200": {
            description: "Thành công",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Profile" }
              }
            }
          },
          "401": { description: "Khóa API không hợp lệ hoặc đã bị thu hồi" }
        }
      },
      patch: {
        summary: "Cập nhật hồ sơ người dùng",
        description: "Cập nhật các chỉ số sinh trắc học và mục tiêu sức khỏe.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  nickname: { type: "string" },
                  gender: { type: "string" },
                  age: { type: "integer" },
                  height: { type: "number" },
                  weight: { type: "number" },
                  activity: { type: "string" },
                  climate: { type: "string" },
                  goal: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Cập nhật thành công",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Profile" }
              }
            }
          },
          "400": { description: "Dữ liệu cập nhật không hợp lệ" }
        }
      }
    },
    "/water-logs": {
      get: {
        summary: "Lấy lịch sử uống nước",
        description: "Trả về danh sách nhật ký uống nước của người dùng theo bộ lọc.",
        parameters: [
          { name: "limit", in: "query", schema: { type: "integer", default: 50 }, description: "Giới hạn số bản ghi" },
          { name: "offset", in: "query", schema: { type: "integer", default: 0 }, description: "Bỏ qua bao nhiêu bản ghi đầu tiên" },
          { name: "start_date", in: "query", schema: { type: "string", format: "date" }, description: "Ngày bắt đầu lọc (YYYY-MM-DD)" },
          { name: "end_date", in: "query", schema: { type: "string", format: "date" }, description: "Ngày kết thúc lọc (YYYY-MM-DD)" }
        ],
        responses: {
          "200": {
            description: "Thành công",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/WaterLog" }
                }
              }
            }
          }
        }
      },
      post: {
        summary: "Ghi nhận lượng nước đã uống",
        description: "Lưu lịch sử uống nước mới, tự động tính điểm EXP cho người dùng.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["amount"],
                properties: {
                  amount: { type: "integer", description: "Lượng nước tính bằng ml (ví dụ: 250)" },
                  name: { type: "string", default: "Nước lọc", description: "Tên đồ uống" },
                  drink_type: { type: "string", default: "water", description: "Loại đồ uống (ví dụ: water, coffee, tea)" },
                  day: { type: "string", format: "date", description: "Ngày uống nước (định dạng YYYY-MM-DD). Mặc định là ngày hôm nay." }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Đã ghi nhận thành công",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/WaterLog" }
              }
            }
          },
          "400": { description: "Dữ liệu yêu cầu không hợp lệ" }
        }
      },
      delete: {
        summary: "Xóa nhật ký uống nước",
        description: "Xóa bản ghi nhật ký uống nước dựa theo ID của bản ghi.",
        parameters: [
          { name: "id", in: "query", required: true, schema: { type: "string", format: "uuid" }, description: "ID của bản ghi uống nước cần xóa" }
        ],
        responses: {
          "200": {
            description: "Đã xóa thành công",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" }
                  }
                }
              }
            }
          },
          "400": { description: "Thiếu ID hoặc ID không hợp lệ" }
        }
      }
    }
  }
};

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');

  // Handle CORS OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(origin) });
  }

  // Parse Path
  const url = new URL(req.url);
  const path = url.pathname;

  // Serve OpenAPI specification
  if (path.endsWith('/openapi.json')) {
    return jsonResponse(OPENAPI_SPEC, 200, origin);
  }

  // 1. Authenticate API Key
  const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace(/^bearer\s+/i, '');
  if (!apiKey || !apiKey.startsWith('dw_live_')) {
    return jsonResponse({ error: 'Không tìm thấy API Key hoặc định dạng khóa không hợp lệ.' }, 401, origin);
  }

  // Initialize Supabase Client with service_role key to lookup API Keys and update usage stats
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Validate key in database
  const { data: keyRecord, error: keyError } = await supabase
    .from('public_api_keys')
    .select('user_id, is_active')
    .eq('api_key', apiKey)
    .single();

  if (keyError || !keyRecord || !keyRecord.is_active) {
    return jsonResponse({ error: 'Khóa API không hợp lệ hoặc đã bị vô hiệu hóa.' }, 401, origin);
  }

  const userId = keyRecord.user_id;

  // 2. Perform Rate Limiting per API Key
  const { allowed, retryAfterSeconds } = await checkRateLimit(`apikey:${apiKey}`, RATE_LIMIT_CONFIG);
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Quá giới hạn tần suất truy cập. Thử lại sau.' }), {
      status: 429,
      headers: {
        ...getCorsHeaders(origin),
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSeconds || 60),
      },
    });
  }

  // Update last_used_at asynchronously (Non-blocking)
  const updateLastUsed = async () => {
    try {
      await supabase
        .from('public_api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('api_key', apiKey);
    } catch (err) {
      console.error('Lỗi khi cập nhật thời gian sử dụng API key:', err);
    }
  };
  // Deno allows running background promises without blocking the serve loop
  updateLastUsed();

  // Route: /profile
  if (path.endsWith('/profile')) {
    if (req.method === 'GET') {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        return jsonResponse({ error: 'Không tìm thấy hồ sơ người dùng.' }, 404, origin);
      }
      return jsonResponse(profile, 200, origin);
    }

    if (req.method === 'PATCH' || req.method === 'PUT') {
      try {
        const body = await req.json();
        const allowedUpdates = ['nickname', 'gender', 'age', 'height', 'weight', 'activity', 'climate', 'goal'];
        const updates: Record<string, unknown> = {};

        for (const k of allowedUpdates) {
          if (body[k] !== undefined) updates[k] = body[k];
        }

        if (Object.keys(updates).length === 0) {
          return jsonResponse({ error: 'Không có trường dữ liệu hợp lệ nào được gửi để cập nhật.' }, 400, origin);
        }

        // Validate numeric types
        if (updates.age !== undefined && (!Number.isInteger(updates.age) || (updates.age as number) <= 0)) {
          return jsonResponse({ error: 'Tuổi phải là số nguyên dương.' }, 400, origin);
        }
        if (updates.height !== undefined && (typeof updates.height !== 'number' || updates.height <= 0)) {
          return jsonResponse({ error: 'Chiều cao phải là số dương.' }, 400, origin);
        }
        if (updates.weight !== undefined && (typeof updates.weight !== 'number' || updates.weight <= 0)) {
          return jsonResponse({ error: 'Cân nặng phải là số dương.' }, 400, origin);
        }

        const { data: updatedProfile, error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', userId)
          .select('*')
          .single();

        if (error) throw error;
        return jsonResponse(updatedProfile, 200, origin);
      } catch (err) {
        return jsonResponse({ error: err instanceof Error ? err.message : 'Yêu cầu không hợp lệ.' }, 400, origin);
      }
    }

    return jsonResponse({ error: 'Phương thức HTTP không hỗ trợ.' }, 405, origin);
  }

  // Route: /water-logs
  if (path.endsWith('/water-logs')) {
    if (req.method === 'GET') {
      const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50')));
      const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0'));
      const startDate = url.searchParams.get('start_date');
      const endDate = url.searchParams.get('end_date');

      let query = supabase
        .from('water_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (startDate) {
        query = query.gte('day', startDate);
      }
      if (endDate) {
        query = query.lte('day', endDate);
      }

      const { data: logs, error } = await query;
      if (error) {
        return jsonResponse({ error: 'Lỗi khi lấy nhật ký uống nước.' }, 500, origin);
      }
      return jsonResponse(logs || [], 200, origin);
    }

    if (req.method === 'POST') {
      try {
        const body = await req.json();
        const { amount, name = 'Nước lọc', drink_type = 'water', day } = body;

        if (!amount || typeof amount !== 'number' || amount <= 0) {
          return jsonResponse({ error: 'Lượng nước (amount) phải là một số lớn hơn 0.' }, 400, origin);
        }

        const logDay = day || new Date().toISOString().split('T')[0];
        // Rules: 1 EXP per 10ml, minimum 0
        const exp = Math.max(0, Math.floor(amount / 10));

        const { data: logEntry, error } = await supabase
          .from('water_logs')
          .insert({
            user_id: userId,
            amount,
            name,
            exp,
            day: logDay,
            drink_type,
            created_at: new Date().toISOString()
          })
          .select('*')
          .single();

        if (error) throw error;
        return jsonResponse(logEntry, 201, origin);
      } catch (err) {
        return jsonResponse({ error: err instanceof Error ? err.message : 'Yêu cầu không hợp lệ.' }, 400, origin);
      }
    }

    if (req.method === 'DELETE') {
      const logId = url.searchParams.get('id');
      if (!logId) {
        return jsonResponse({ error: 'Thiếu ID của nhật ký cần xóa.' }, 400, origin);
      }

      const { error } = await supabase
        .from('water_logs')
        .delete()
        .eq('id', logId)
        .eq('user_id', userId);

      if (error) {
        return jsonResponse({ error: 'Không thể xóa nhật ký uống nước. Vui lòng kiểm tra lại ID.' }, 400, origin);
      }

      return jsonResponse({ success: true, message: 'Đã xóa bản ghi thành công.' }, 200, origin);
    }

    return jsonResponse({ error: 'Phương thức HTTP không hỗ trợ.' }, 405, origin);
  }

  // Not Found
  return jsonResponse({ error: 'Không tìm thấy API Endpoint này.' }, 404, origin);
});
