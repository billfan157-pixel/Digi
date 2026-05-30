-- Migration: Add GiftHub Codes and Redemption Logic

-- 1. Create gift_codes table
CREATE TABLE IF NOT EXISTS public.gift_codes (
    code TEXT PRIMARY KEY,
    reward_type TEXT NOT NULL CHECK (reward_type IN ('coins', 'item')),
    reward_value TEXT NOT NULL, -- e.g. '1000' (coins) or 'theme_royal' (shop item ID) or 'all'
    max_uses INT NOT NULL DEFAULT 1,
    uses_count INT NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on gift_codes
ALTER TABLE public.gift_codes ENABLE ROW LEVEL SECURITY;

-- gift_codes policy: only authenticated users can read
CREATE POLICY read_gift_codes ON public.gift_codes FOR SELECT TO authenticated USING (true);

-- 2. Create user_redeemed_codes table
CREATE TABLE IF NOT EXISTS public.user_redeemed_codes (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    code TEXT NOT NULL REFERENCES public.gift_codes(code) ON DELETE CASCADE,
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, code)
);

-- Enable RLS on user_redeemed_codes
ALTER TABLE public.user_redeemed_codes ENABLE ROW LEVEL SECURITY;

-- user_redeemed_codes policy: users can read their own redemption logs
CREATE POLICY read_own_redemptions ON public.user_redeemed_codes FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 3. Create RPC function for redeeming code
CREATE OR REPLACE FUNCTION public.redeem_gift_code(p_user_id UUID, p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_reward_type TEXT;
    v_reward_value TEXT;
    v_max_uses INT;
    v_uses_count INT;
    v_expires_at TIMESTAMPTZ;
    v_already_redeemed BOOLEAN;
    v_item_id TEXT;
    v_coin_amount INT;
    v_message TEXT;
BEGIN
    -- 1. Sanitize code input
    p_code := trim(upper(p_code));

    -- 2. Fetch code details
    SELECT reward_type, reward_value, max_uses, uses_count, expires_at
    INTO v_reward_type, v_reward_value, v_max_uses, v_uses_count, v_expires_at
    FROM public.gift_codes
    WHERE code = p_code;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Mã quà tặng không tồn tại hoặc đã hết hạn.');
    END IF;

    -- 3. Check expiration
    IF v_expires_at IS NOT NULL AND v_expires_at < NOW() THEN
        RETURN jsonb_build_object('success', false, 'message', 'Mã quà tặng đã hết hạn.');
    END IF;

    -- 4. Check uses count
    IF v_uses_count >= v_max_uses THEN
        RETURN jsonb_build_object('success', false, 'message', 'Mã quà tặng đã hết lượt sử dụng.');
    END IF;

    -- 5. Check if user already redeemed this code
    SELECT EXISTS (
        SELECT 1 FROM public.user_redeemed_codes
        WHERE user_id = p_user_id AND code = p_code
    ) INTO v_already_redeemed;

    IF v_already_redeemed THEN
        RETURN jsonb_build_object('success', false, 'message', 'Bạn đã nhận quà từ mã này rồi.');
    END IF;

    -- 6. Grant Reward
    IF v_reward_type = 'coins' THEN
        -- Add coins to user profile
        v_coin_amount := v_reward_value::INT;
        UPDATE public.profiles
        SET coins = COALESCE(coins, 0) + v_coin_amount
        WHERE id = p_user_id;
        v_message := 'Nhận quà thành công! Bạn nhận được ' || v_reward_value || ' xu.';
    ELSIF v_reward_type = 'item' THEN
        v_item_id := v_reward_value;
        IF v_item_id = 'all' THEN
            -- Unlock all themes, sounds, and frames in shop
            INSERT INTO public.user_purchases (user_id, item_id)
            SELECT p_user_id, id 
            FROM public.shop_items
            WHERE category IN ('theme', 'sound', 'frame')
            ON CONFLICT (user_id, item_id) DO NOTHING;
            
            IF p_code = 'BILLDEPCHAI' THEN
                v_message := 'Mở khóa toàn bộ theme, sound và frame thành công! Đẹp trai quá anh Bill ơi! 😎';
            ELSE
                v_message := 'Mở khóa toàn bộ vật phẩm trong cửa hàng thành công!';
            END IF;
        ELSE
            -- Check if user already owns the item to avoid duplication
            IF EXISTS (
                SELECT 1 FROM public.user_purchases
                WHERE user_id = p_user_id AND item_id = v_item_id
            ) THEN
                RETURN jsonb_build_object('success', false, 'message', 'Bạn đã sở hữu vật phẩm này rồi.');
            END IF;

            INSERT INTO public.user_purchases (user_id, item_id)
            VALUES (p_user_id, v_item_id);
            v_message := 'Nhận quà thành công! Đã thêm vật phẩm vào kho đồ của bạn.';
        END IF;
    ELSE
        RETURN jsonb_build_object('success', false, 'message', 'Loại phần thưởng không hợp lệ.');
    END IF;

    -- 7. Update usage logs
    UPDATE public.gift_codes
    SET uses_count = uses_count + 1
    WHERE code = p_code;

    INSERT INTO public.user_redeemed_codes (user_id, code)
    VALUES (p_user_id, p_code);

    RETURN jsonb_build_object(
        'success', true, 
        'message', v_message, 
        'reward_type', v_reward_type, 
        'reward_value', v_reward_value
    );
END;
$$;

-- Grant execute privileges
REVOKE EXECUTE ON FUNCTION public.redeem_gift_code(UUID, TEXT) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.redeem_gift_code(UUID, TEXT) TO authenticated;

-- Insert some default gift codes for demo/testing
INSERT INTO public.gift_codes (code, reward_type, reward_value, max_uses, expires_at)
VALUES 
    ('GIFTHUB500', 'coins', '500', 10000, NOW() + INTERVAL '1 year'),
    ('GIFTHUB2000', 'coins', '2000', 5000, NOW() + INTERVAL '1 year'),
    ('GIFTHUBTHEME', 'item', 'theme_royal', 1000, NOW() + INTERVAL '1 year'),
    ('BILLDEPCHAI', 'item', 'all', 10000, NOW() + INTERVAL '10 years')
ON CONFLICT (code) DO NOTHING;
