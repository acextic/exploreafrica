-- Run every 5 minutes via Supabase Scheduler
with expired as (
  select bh.booking_id
  from booking_holds bh
  join bookings b on b.booking_id = bh.booking_id
  where bh.expires_at < now() and b.status = 'pending'
)
update bookings
set status = 'expired'
from expired e
where bookings.booking_id = e.booking_id;

-- clean locks
delete from availability_locks al
using bookings b
where b.booking_id = al.booking_id
  and b.status in ('expired','cancelled');
