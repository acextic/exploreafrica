import React from "react";

function fmtToday() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

type Props = {
  mode?: "sticky" | "card" | "inline";
  pricePerNight: number;

  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  rooms?: number;

  maxCapacity?: number;

  nights: number;
  total: number;

  onChangeCheckIn: (v: string) => void;
  onChangeCheckOut: (v: string) => void;
  onChangeAdults: (n: number) => void;
  onChangeChildren: (n: number) => void;
  onChangeRooms?: (n: number) => void;

  onBook: () => void;
};

export default function StickyBookingPanel({
  mode = "sticky",
  pricePerNight,

  checkIn,
  checkOut,
  adults,
  children,
  rooms = 1,

  maxCapacity,

  nights,
  total,

  onChangeCheckIn,
  onChangeCheckOut,
  onChangeAdults,
  onChangeChildren,
  onChangeRooms,

  onBook,
}: Props) {
  const min = fmtToday();
  const totalGuests = adults + children;
  const capacityLimit = maxCapacity ? rooms * maxCapacity : undefined;

  const canIncAdults =
    capacityLimit === undefined ? true : totalGuests < capacityLimit;
  const canIncChildren =
    capacityLimit === undefined ? true : totalGuests < capacityLimit;

  const incAdults = () => {
    if (!canIncAdults) return;
    onChangeAdults(adults + 1);
  };
  const decAdults = () => onChangeAdults(Math.max(1, adults - 1));

  const incChildren = () => {
    if (!canIncChildren) return;
    onChangeChildren(children + 1);
  };
  const decChildren = () => onChangeChildren(Math.max(0, children - 1));

  const incRooms = () => onChangeRooms?.(rooms + 1);
  const decRooms = () => onChangeRooms?.(Math.max(1, rooms - 1));

  const Card = (
    <div className="bg-white rounded-xl shadow p-4 md:p-5 w-full">
      <div className="text-xl font-semibold">
        ${pricePerNight}
        <span className="text-sm font-normal text-gray-500"> / night</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <input
          type="date"
          min={min}
          value={checkIn}
          onChange={(e) => {
            const v = e.target.value;
            onChangeCheckIn(v);
            if (checkOut && v && checkOut <= v) {
              const d = new Date(v);
              d.setDate(d.getDate() + 1);
              const next =
                d.getFullYear() +
                "-" +
                String(d.getMonth() + 1).padStart(2, "0") +
                "-" +
                String(d.getDate()).padStart(2, "0");
              onChangeCheckOut(next);
            }
          }}
          className="border rounded px-2 py-2 text-sm"
        />
        <input
          type="date"
          min={checkIn ? checkIn : min}
          value={checkOut}
          onChange={(e) => {
            const v = e.target.value;
            if (checkIn && v <= checkIn) return;
            onChangeCheckOut(v);
          }}
          className="border rounded px-2 py-2 text-sm"
        />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {/* Adults */}
        <div className="border rounded px-2 py-2 text-sm flex items-center justify-between">
          <span>Adults</span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={decAdults} className="px-2">
              -
            </button>
            <span>{adults}</span>
            <button
              type="button"
              onClick={incAdults}
              className={`px-2 ${
                !canIncAdults ? "opacity-40 cursor-not-allowed" : ""
              }`}
              disabled={!canIncAdults}
            >
              +
            </button>
          </div>
        </div>

        {/* Children */}
        <div className="border rounded px-2 py-2 text-sm flex items-center justify-between">
          <span>Children</span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={decChildren} className="px-2">
              -
            </button>
            <span>{children}</span>
            <button
              type="button"
              onClick={incChildren}
              className={`px-2 ${
                !canIncChildren ? "opacity-40 cursor-not-allowed" : ""
              }`}
              disabled={!canIncChildren}
            >
              +
            </button>
          </div>
        </div>

        {/* Rooms */}
        <div className="border rounded px-2 py-2 text-sm flex items-center justify-between">
          <span>Rooms</span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={decRooms} className="px-2">
              -
            </button>
            <span>{rooms}</span>
            <button type="button" onClick={incRooms} className="px-2">
              +
            </button>
          </div>
        </div>
      </div>

      {maxCapacity ? (
        <p className="mt-2 text-xs text-gray-500">
          Capacity: up to <b>{maxCapacity}</b> guest(s) per room ( max{" "}
          <b>{rooms * maxCapacity}</b> total for {rooms} room
          {rooms > 1 ? "s" : ""}).
        </p>
      ) : null}

      <div className="mt-3 text-sm text-gray-700">
        {nights} night(s) · {rooms} room(s) · {adults} adult(s)
        {children ? `, ${children} child` : ""} · Total{" "}
        <span className="font-medium">${total}</span>
      </div>

      <button
        className="mt-3 w-full bg-orange-500 hover:bg-orange-600 text-white rounded px-4 py-2"
        onClick={onBook}
      >
        Book now
      </button>

      <p className="mt-2 text-xs text-gray-500">
        Taxes and park fees calculated at checkout.
      </p>
    </div>
  );

  if (mode === "inline") return Card;
  return (
    <div className={mode === "sticky" ? "md:sticky md:top-20" : ""}>{Card}</div>
  );
}
