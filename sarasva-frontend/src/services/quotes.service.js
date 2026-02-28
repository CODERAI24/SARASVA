/**
 * Motivational quotes service.
 * Collection: quotes/{id}  — { text, author, active, createdAt }
 * Admins can CRUD; all authenticated users can read active quotes.
 */
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  query, where, getDocs,
} from "firebase/firestore";
import { db } from "@/firebase/config.js";

const quotesCol = () => collection(db, "quotes");

export const quotesService = {
  async getAll() {
    const snap = await getDocs(quotesCol());
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async getActive() {
    const snap = await getDocs(query(quotesCol(), where("active", "==", true)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async add({ text, author = "" }) {
    return addDoc(quotesCol(), {
      text,
      author: author.trim(),
      active:    true,
      createdAt: new Date().toISOString(),
    });
  },

  async update(id, patch) {
    await updateDoc(doc(db, "quotes", id), patch);
  },

  async remove(id) {
    await deleteDoc(doc(db, "quotes", id));
  },
};

/**
 * Pick a quote deterministically for the current hour.
 * Changes every hour, cycles through all active quotes.
 */
export function pickHourlyQuote(quotes) {
  if (!quotes.length) return null;
  const hourSlot = Math.floor(Date.now() / (1000 * 60 * 60));
  return quotes[hourSlot % quotes.length];
}

/** Default seeded quotes shown if no quotes exist in Firestore yet. */
export const SEED_QUOTES = [
  { id: "seed-1", text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { id: "seed-2", text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { id: "seed-3", text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { id: "seed-4", text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { id: "seed-5", text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { id: "seed-6", text: "Education is the passport to the future.", author: "Malcolm X" },
  { id: "seed-7", text: "The more that you read, the more things you will know.", author: "Dr. Seuss" },
  { id: "seed-8", text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { id: "seed-9", text: "Push yourself, because no one else is going to do it for you.", author: "" },
  { id: "seed-10", text: "Great things never come from comfort zones.", author: "" },
  { id: "seed-11", text: "Dream it. Wish it. Do it.", author: "" },
  { id: "seed-12", text: "Success doesn't just find you. You have to go out and get it.", author: "" },
];
