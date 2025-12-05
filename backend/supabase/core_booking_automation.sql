-- Holds table (expires if unpaid)
create table if not exists booking_holds (
  hold_id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references bookings(booking_id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Function: on new booking, create hold and decrement availability
create or replace function fn_on_booking_insert()
returns trigger as $$
declare
  nights int;
begin
  -- calculate nights
  nights := greatest(1, (date_part('day', new.check_out - new.check_in))::int);

  -- decrement availability for each date in range
  insert into availability_locks (destination_id, accommodation_id, date, booking_id)
  select new.destination_id, new.accommodation_id, d::date, new.booking_id
  from generate_series(new.check_in, new.check_out - interval '1 day', interval '1 day') as d;

  -- create hold (e.g., 20 minutes)
  insert into booking_holds (booking_id, expires_at)
  values (new.booking_id, now() + interval '20 minutes');

  -- log event
  insert into event_log(event_type, entity_id, payload)
  values ('booking.created', new.booking_id, to_jsonb(new));

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_on_booking_insert on bookings;
create trigger trg_on_booking_insert
after insert on bookings
for each row
when (new.status = 'pending')
execute function fn_on_booking_insert();
