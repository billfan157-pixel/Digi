-- Fix corrupted meta_value caused by text || jsonb string concatenation
-- Root cause: meta_value is TEXT column, and `text || jsonb` does string concat, not jsonb merge
-- This extracts all complete JSON objects from the concatenated string and merges them

CREATE OR REPLACE FUNCTION public._fix_concat_json(str text)
RETURNS jsonb
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
  depth int := 0;
  pos int := 0;
  i int;
  ch text;
  merged jsonb := '{}'::jsonb;
  part text;
BEGIN
  IF str IS NULL OR length(trim(str)) = 0 THEN
    RETURN '{}'::jsonb;
  END IF;

  FOR i IN 1..length(str) LOOP
    ch := substr(str, i, 1);
    IF ch = '{' THEN
      IF depth = 0 THEN pos := i; END IF;
      depth := depth + 1;
    ELSIF ch = '}' THEN
      depth := depth - 1;
      IF depth = 0 AND pos > 0 THEN
        part := substr(str, pos, i - pos + 1);
        BEGIN
          merged := merged || part::jsonb;
        EXCEPTION WHEN OTHERS THEN
          NULL;
        END;
        pos := 0;
      END IF;
    END IF;
  END LOOP;

  RETURN merged;
END;
$$;

-- Fix corrupted rows (detect by checking for multiple root-level braces)
UPDATE shop_items
SET meta_value = public._fix_concat_json(meta_value)::text
WHERE category = 'theme'
  AND meta_value LIKE '%{%{';

-- Clean up
DROP FUNCTION IF EXISTS public._fix_concat_json;
