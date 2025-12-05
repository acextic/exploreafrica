import { supabase } from "../supabaseClient";

/** ===== Stays (accommodations) ===== */

export type CreateBookingInput = {
  accommodation_id: number;
  check_in_date: string;
  check_out_date: string;
  adults: number;
  children: number;
  nightly_price: number;
  rooms: number;
  guest_phone?: string | null;
  special_requests?: string | null;
};

function nightsBetween(aISO: string, bISO: string): number {
  const a = new Date(aISO).getTime();
  const b = new Date(bISO).getTime();
  return Math.max(0, Math.round((b - a) / 86400000));
}

export function computeTotal(input: CreateBookingInput) {
  const nights = nightsBetween(input.check_in_date, input.check_out_date);
  const guests = input.adults + input.children;
  const total = nights * input.nightly_price * Math.max(1, input.rooms);
  return { nights, guests, total };
}

export async function createBooking(input: CreateBookingInput) {
  const { data: auth, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const user = auth?.user;
  if (!user) throw new Error("Must be signed in to create a booking.");

  const { nights } = computeTotal(input);
  if (nights <= 0) throw new Error("Check-out must be after check-in.");

  // Let DB trigger compute totals + confirmation_number
  const { data, error } = await supabase
    .from("bookings")
    .insert({
      user_id: user.id,
      accommodation_id: input.accommodation_id,
      booking_status: "pending",
      check_in_date: input.check_in_date,
      check_out_date: input.check_out_date,
      travel_date: input.check_in_date,
      num_of_guests: input.adults + input.children,
      guest_phone: input.guest_phone ?? null,
      special_requests: input.special_requests ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data; // includes booking_id + confirmation_number from trigger
}

/** ===== Packages (tours) ===== */

export async function createPackageBooking(opts: {
  package_id: number;
  travel_date: string;
  guests: number;
  guest_phone?: string | null;
  special_requests?: string | null;
}) {
  const { data: auth, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const user = auth?.user;
  if (!user) throw new Error("Must be signed in to create a booking.");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(opts.travel_date)) {
    throw new Error("Please pick a valid travel date.");
  }
  if (opts.guests < 1) throw new Error("Guests must be at least 1.");

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      user_id: user.id,
      package_id: opts.package_id,
      travel_date: opts.travel_date,
      num_of_guests: opts.guests,
      booking_status: "pending",
      guest_phone: opts.guest_phone ?? null,
      special_requests: opts.special_requests ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data; // includes booking_id + confirmation_number from trigger
}

/** ===== Payments helper (optional) ===== */

export async function recordPayment(opts: {
  booking_id: number;
  method?: string;          // 'card' | 'mpesa' | 'bank' ...
  status?: string;          // 'paid' | 'initiated' | 'failed' | 'refunded'
  transaction_ref?: string; // gateway confirmation id
  currency?: string;        // default 'USD'
}) {
  const {
    booking_id,
    method = "card",
    status = "paid",
    transaction_ref,
    currency = "USD",
  } = opts;

  const { error } = await supabase.from("payments").insert({
    booking_id,
    payment_method: method,
    payment_status: status,
    payment_date: new Date().toISOString(),
    transaction_ref: transaction_ref ?? null,
    currency,
  });

  if (error) throw error;
}