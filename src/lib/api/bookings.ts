import { supabase } from "../../lib/supabaseClient";

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

function nightsBetween(check_in: string, check_out: string): number {
  const a = new Date(check_in);
  const b = new Date(check_out);
  const ms = b.getTime() - a.getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
}

export function computeTotal(
  input: CreateBookingInput
): { nights: number; guests: number; total: number } {
  const nights = nightsBetween(input.check_in_date, input.check_out_date);
  const guests = input.adults + input.children;
  const total = nights * input.nightly_price * input.rooms;
  return { nights, guests, total };
}

function genConfirmation(): string {

  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "CNF-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function createBooking(input: CreateBookingInput) {
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!user) throw new Error("Must be signed in to create a booking.");

  const { nights, guests, total } = computeTotal(input);
  if (nights <= 0) throw new Error("Check-out must be after check-in.");

  const payload: any = {
    user_id: user.id,
    accommodation_id: input.accommodation_id,
    booking_status: "pending",
    check_in_date: input.check_in_date,
    check_out_date: input.check_out_date,
    travel_date: input.check_in_date, 
    nights,
    num_of_guests: guests,
    total_amount: total,
    confirmation_number: genConfirmation(),

    guest_phone: input.guest_phone ?? null,
    special_requests: input.special_requests ?? null,
  };

  const { data, error } = await supabase
    .from("bookings")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}