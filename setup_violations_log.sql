-- 1. Create geo_fence_violations table
CREATE TABLE IF NOT EXISTS public.geo_fence_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
    violation_time TIMESTAMPTZ DEFAULT now(),
    last_known_location GEOGRAPHY(POINT, 4326),
    address_text TEXT,
    severity TEXT DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH
    status TEXT DEFAULT 'PENDING' -- PENDING, REVIEWED, RESOLVED
);

-- 2. Enable Realtime for violations
ALTER PUBLICATION supabase_realtime ADD TABLE public.geo_fence_violations;

-- 3. Trigger Function to automatically log violation if outside Manaus (Simplified for simulator demo)
-- Manaus Rough Box: lat -3.15 to -2.95, lng -60.10 to -59.85
CREATE OR REPLACE FUNCTION log_geo_fence_violation()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if location is outside Manaus Box
    IF (ST_Y(NEW.location::geometry) > -2.95 OR ST_Y(NEW.location::geometry) < -3.15 OR 
        ST_X(NEW.location::geometry) > -59.85 OR ST_X(NEW.location::geometry) < -60.10) THEN
        
        -- Avoid duplicate logs within 5 minutes for the same driver
        IF NOT EXISTS (
            SELECT 1 FROM public.geo_fence_violations 
            WHERE driver_id = NEW.id 
            AND violation_time > now() - interval '5 minutes'
        ) THEN
            INSERT INTO public.geo_fence_violations (driver_id, last_known_location, address_text)
            VALUES (NEW.id, NEW.location, NEW.address_text);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create Trigger on drivers table
DROP TRIGGER IF EXISTS tr_check_geo_fence ON public.drivers;
CREATE TRIGGER tr_check_geo_fence
    AFTER UPDATE OF location ON public.drivers
    FOR EACH ROW
    WHEN (NEW.status = 'ONLINE' OR NEW.status = 'IN_RIDE')
    EXECUTE FUNCTION log_geo_fence_violation();
