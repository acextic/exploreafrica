import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

type PreviousConversation = {
  id: string;
  title: string;
  summary: string;
  date: string;
};

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  time: string;
  content?: string;
  type?: "text" | "countries" | "hotels";
};

const previousConversations: PreviousConversation[] = new Array(6)
  .fill(null)
  .map((_, index) => ({
    id: `conv-${index}`,
    title: "5 days trip to Ngorongoro",
    summary: "All accommodations are close to the tourist sites.",
    date: "10/26/2025",
  }));

const countryOptions = [
  {
    name: "Uganda",
    image:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Kenya",
    image:
      "https://images.unsplash.com/photo-1508261303786-0f52fb94bfe8?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Tanzania",
    image:
      "https://images.unsplash.com/photo-1500534314591-419205182066?auto=format&fit=crop&w=400&q=80",
  },
];

const hotelOptions = [
  { name: "Morning Star", rating: 4.8, reviews: 600 },
  { name: "Dov Safari", rating: 4.6, reviews: 112 },
  { name: "Savanna Haven", rating: 4.4, reviews: 88 },
];

const uniqueId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const initialMessages: ChatMessage[] = [
  {
    id: "m-1",
    role: "assistant",
    time: "09:20 AM",
    content:
      "Welcome to our trip planner. Tell me the place, park, or experience you want and I’ll customize the ideal safari route.",
  },
  {
    id: "m-2",
    role: "user",
    time: "09:29 AM",
    content:
      "I would like to visit a place where I can see the wonders of the world. Eastern Africa seems like a good start.",
  },
  {
    id: "m-3",
    role: "assistant",
    time: "09:31 AM",
    type: "countries",
  },
  {
    id: "m-4",
    role: "user",
    time: "09:34 AM",
    content:
      "Let’s begin with Tanzania. I need accommodations and tours that work for a family.",
  },
  {
    id: "m-5",
    role: "assistant",
    time: "09:35 AM",
    type: "hotels",
  },
];

export default function TripPlannerShell() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const feedRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (text: string) => {
    if (!text.trim()) return;

    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMessage: ChatMessage = {
      id: uniqueId(),
      role: "user",
      time,
      content: text.trim(),
    };

    // TODO: replace with real backend call
    const assistantMessage: ChatMessage = {
      id: uniqueId(),
      role: "assistant",
      time,
      content:
        "Great question! I’ll share fresh options sourced from the Supabase travel dataset once the backend hook is ready.",
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addMessage(input);
    setInput("");
  };

  return (
    <main className="h-[calc(100vh-80px)] bg-[#f8f3eb] px-6 py-6 overflow-hidden">
      {/* LEFT (history) + RIGHT (chat) */}
      <div className="flex h-full w-full gap-6">
        {/* LEFT: previous conversations */}
        <aside className="flex h-full w-[320px] flex-col rounded-2xl border border-[#e0cdb1] bg-white p-5 shadow-sm overflow-hidden">
          <h2 className="text-lg font-semibold text-[#8a5a24]">
            Previous conversations
          </h2>

          <div className="mt-4 flex-1 space-y-4 overflow-y-auto pr-1">
            {previousConversations.map((conversation) => (
              <button
                key={conversation.id}
                className="flex w-full gap-3 rounded-2xl border border-[#f1dfc3] bg-[#fffaf3] p-3 text-left transition hover:border-[#f0c27b]"
              >
                <img
                  src="https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=120&q=60"
                  alt="Safari avatar"
                  className="h-20 w-14 rounded-full object-cover"
                />
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-[#634119]">
                      {conversation.title}
                    </p>
                    <p className="text-[11px] text-[#d2a872] whitespace-nowrap">
                      {conversation.date}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-[#a0773c]">
                    {conversation.summary}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* RIGHT: chat pane */}
        <section className="flex h-full min-h-0 flex-1 flex-col rounded-2xl border border-[#e0cdb1] bg-white p-6 shadow-md overflow-hidden">
          <div className="mb-4 rounded-2xl bg-[#fef3e0] p-4 text-sm text-[#7a4d16]">
            Welcome, steps to use our planner: describe the dream safari in one
            sentence. The assistant taps our AI-powered TourRAGChat backend and
            replies using the Supabase dataset. Just type and hit send.
          </div>

          {/* chat feed – scrolls, input stays at bottom */}
          <div
            ref={feedRef}
            className="flex-1 min-h-0 space-y-4 overflow-y-auto rounded-2xl border border-[#f2e3cc] bg-[#fffaf3] p-4"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col ${
                  message.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <span className="text-xs text-[#c19964]">{message.time}</span>

                {message.type === "countries" ? (
                  <div className="mt-2 w-full rounded-2xl bg-[#f9e1ba] p-4 text-sm text-[#744d1b]">
                    <p>
                      Here are countries to consider. Choose one to continue.
                    </p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      {countryOptions.map((country) => (
                        <div
                          key={country.name}
                          className="flex flex-col items-center rounded-xl bg-white p-3 shadow"
                        >
                          <img
                            src={country.image}
                            alt={country.name}
                            className="h-24 w-full rounded-lg object-cover"
                          />
                          <p className="mt-2 text-sm font-semibold text-[#6b3d12]">
                            {country.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : message.type === "hotels" ? (
                  <div className="mt-2 w-full rounded-2xl bg-[#f9e1ba] p-4 text-sm text-[#744d1b]">
                    <p>These hotels and tour operators suit family stays:</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      {hotelOptions.map((hotel) => (
                        <div
                          key={hotel.name}
                          className="rounded-xl bg-white p-3 text-center shadow"
                        >
                          <p className="font-semibold text-[#6b3d12]">
                            {hotel.name}
                          </p>
                          <p className="text-xs text-[#b07936]">
                            ⭐ {hotel.rating} · {hotel.reviews} reviews
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p
                    className={`mt-2 max-w-xl rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      message.role === "assistant"
                        ? "bg-[#fbb96b] text-[#4f2d09]"
                        : "bg-white text-[#4f2d09] shadow"
                    }`}
                  >
                    {message.content}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* input bar */}
          <form
            onSubmit={handleSubmit}
            className="mt-4 flex items-center gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Messaging..."
              className="flex-1 rounded-full border border-[#e7d2b5] px-5 py-3 text-sm text-[#6b3d12] placeholder:text-[#caa775] focus:border-[#f0a45d] focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-full bg-[#f0a45d] p-3 text-white shadow hover:bg-[#dd8f44]"
              aria-label="Send message"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
