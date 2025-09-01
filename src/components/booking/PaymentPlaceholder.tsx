import { useState } from "react";

type Props = {
  onPaidChange: (paid: boolean) => void;
};

export default function PaymentPlaceholder({ onPaidChange }: Props) {
  const [agree, setAgree] = useState(false);
  const [card, setCard] = useState("");

  const toggle = (v: boolean) => {
    setAgree(v);
    onPaidChange(v && card.replace(/\s/g, "").length >= 12);
  };

  const onCard = (v: string) => {
    setCard(v);
    onPaidChange(agree && v.replace(/\s/g, "").length >= 12);
  };

  return (
    <div className="rounded-xl bg-white shadow p-4">
      <h3 className="text-lg font-semibold">Payment</h3>
      <p className="text-sm text-gray-600 mt-1">Demo-only placeholder — no real charges.</p>
      <div className="mt-3">
        <label className="block text-sm text-gray-600">Card number</label>
        <input
          value={card}
          onChange={(e) => onCard(e.target.value)}
          placeholder="4242 4242 4242 4242"
          className="mt-1 w-full border rounded px-3 py-2"
        />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <input id="agree" type="checkbox" checked={agree} onChange={(e) => toggle(e.target.checked)} />
        <label htmlFor="agree" className="text-sm text-gray-700">I authorize a mock payment for confirmation</label>
      </div>
      <p className="text-xs text-gray-500 mt-2">In production, integrate Stripe or your PSP here.</p>
    </div>
  );
}
