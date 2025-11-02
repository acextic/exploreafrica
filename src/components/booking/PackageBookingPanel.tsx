import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

type Props = {
  pricePerPerson: number;
  durationDays: number;
};

export default function PackageBookingPanel({
  pricePerPerson,
  durationDays,
}: Props) {
  const { id } = useParams(); // package_id
  const navigate = useNavigate();

  const [date, setDate] = useState<string>("");
  const [guests, setGuests] = useState<number>(2);

  const canBook = !!date && guests > 0;
  const subtotal = (pricePerPerson || 0) * Math.max(1, guests);

  return (
    <div className="bg-white rounded-xl shadow p-4 md:p-5">
      <div className="text-xl font-semibold">
        ${pricePerPerson.toFixed(2)}
        <span className="text-sm font-normal text-gray-500"> / person</span>
      </div>

      {/* Travel date */}
      <div className="mt-3">
        <label className="block text-sm font-medium">Travel date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 w-full border rounded px-3 py-2 text-sm"
        />
      </div>

      {/* Guests */}
      <div className="mt-3">
        <label className="block text-sm font-medium">Guests</label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setGuests(Math.max(1, guests - 1))}
            className="px-3 py-1 border rounded"
          >
            –
          </button>
          <span>{guests}</span>
          <button
            type="button"
            onClick={() => setGuests(guests + 1)}
            className="px-3 py-1 border rounded"
          >
            +
          </button>
        </div>
      </div>

      {/* Subtotal */}
      <div className="mt-3 text-sm text-gray-700">
        Subtotal · <b>${subtotal.toFixed(2)}</b>
      </div>

      <button
        className={
          "mt-3 w-full text-white rounded px-4 py-2 " +
          (canBook
            ? "bg-orange-500 hover:bg-orange-600"
            : "bg-gray-400 cursor-not-allowed")
        }
        disabled={!canBook}
        onClick={() => {
          if (!id || !date || guests < 1) return;
          const qs = new URLSearchParams({
            packageId: String(id),
            date,
            guests: String(guests),
          }).toString();
          navigate(`/checkout?${qs}`);
        }}
      >
        Book now
      </button>

      <p className="mt-2 text-xs text-gray-500">
        Taxes and fees are calculated at checkout.
      </p>
    </div>
  );
}
