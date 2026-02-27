import { useState, useRef } from "react";
import {
  Search, UserPlus, UserCheck, Users, X, Check, Clock, User2,
} from "lucide-react";
import { usePTP } from "@/hooks/usePTP.js";

/* ── Avatar initials component ──────────────────────────────────── */
function Avatar({ name, size = "md" }) {
  const initials = (name ?? "?")
    .split(" ")
    .map(w => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const sz = size === "sm" ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm";
  return (
    <div
      className={`${sz} shrink-0 rounded-full bg-primary/15 flex items-center justify-center font-bold text-primary`}
    >
      {initials}
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────── */
export default function PTPPage() {
  const {
    friends, incomingRequests, outgoingRequests, loading,
    searchUsers, sendRequest, acceptRequest, rejectRequest, removeFriend,
  } = usePTP();

  const [searchQuery,    setSearchQuery]    = useState("");
  const [searchResults,  setSearchResults]  = useState([]);
  const [searching,      setSearching]      = useState(false);
  const [requestSentMap, setRequestSentMap] = useState({}); // uid → true (optimistic)
  const [tab,            setTab]            = useState("friends"); // "friends" | "requests"
  const debounceRef = useRef(null);

  /* ── Search ──────────────────────────────────────────────────── */
  async function handleSearchChange(val) {
    setSearchQuery(val);
    clearTimeout(debounceRef.current);
    if (!val.trim()) { setSearchResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const results = await searchUsers(val);
      setSearchResults(results);
      setSearching(false);
    }, 400);
  }

  async function handleAdd(person) {
    try {
      await sendRequest(person);
      setRequestSentMap(m => ({ ...m, [person.uid]: true }));
    } catch {
      // error already captured in hook
    }
  }

  const showSearch = searchQuery.length > 0;

  /* ── Helpers ─────────────────────────────────────────────────── */
  function isAlreadySent(uid) {
    return requestSentMap[uid] || outgoingRequests.some(r => r.toUid === uid);
  }
  function isAlreadyFriend(uid) {
    return friends.some(f => f.uid === uid);
  }

  return (
    <div className="mx-auto max-w-md space-y-4">

      {/* ── Page header ──────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold">Study Peers</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Connect and collaborate with classmates
        </p>
      </div>

      {/* ── Search bar ───────────────────────────────────────────── */}
      <div className="relative">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <input
          value={searchQuery}
          onChange={e => handleSearchChange(e.target.value)}
          placeholder="Search peers by name…"
          className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        {searchQuery && (
          <button
            onClick={() => { setSearchQuery(""); setSearchResults([]); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* ── Search results ───────────────────────────────────────── */}
      {showSearch && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <p className="border-b border-border px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Search Results
          </p>
          {searching ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Searching…</p>
          ) : searchResults.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No users found.</p>
          ) : (
            <div className="divide-y divide-border">
              {searchResults.map(person => (
                <div key={person.uid} className="flex items-center gap-3 px-4 py-3">
                  <Avatar name={person.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{person.name}</p>
                    {person.course && (
                      <p className="truncate text-xs text-muted-foreground">{person.course}</p>
                    )}
                  </div>
                  {isAlreadyFriend(person.uid) ? (
                    <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                      <UserCheck size={14} />
                      Friends
                    </div>
                  ) : isAlreadySent(person.uid) ? (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock size={13} />
                      Sent
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAdd(person)}
                      className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                    >
                      <UserPlus size={12} />
                      Add
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab switcher ─────────────────────────────────────────── */}
      <div className="flex gap-1 rounded-xl bg-muted p-1">
        <button
          onClick={() => setTab("friends")}
          className={`relative flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
            tab === "friends" ? "bg-card shadow-sm" : "text-muted-foreground"
          }`}
        >
          Friends
          {friends.length > 0 && (
            <span className="ml-1 text-muted-foreground">({friends.length})</span>
          )}
        </button>
        <button
          onClick={() => setTab("requests")}
          className={`relative flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
            tab === "requests" ? "bg-card shadow-sm" : "text-muted-foreground"
          }`}
        >
          Requests
          {incomingRequests.length > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
              {incomingRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Tab: Friends ─────────────────────────────────────────── */}
      {tab === "friends" && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {loading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
          ) : friends.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-14">
              <Users size={38} className="text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">No study peers yet</p>
              <p className="text-xs text-muted-foreground">Search above to find classmates</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {friends.map(f => (
                <div key={f.id} className="flex items-center gap-3 px-4 py-3">
                  <Avatar name={f.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{f.name}</p>
                    <p className="text-xs text-muted-foreground">Study peer</p>
                  </div>
                  <button
                    onClick={() => removeFriend(f.uid)}
                    className="text-xs text-muted-foreground transition-colors hover:text-destructive"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Requests ────────────────────────────────────────── */}
      {tab === "requests" && (
        <div className="space-y-3">
          {/* Incoming */}
          {incomingRequests.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <p className="border-b border-border px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Incoming ({incomingRequests.length})
              </p>
              <div className="divide-y divide-border">
                {incomingRequests.map(req => (
                  <div key={req.id} className="flex items-center gap-3 px-4 py-3">
                    <Avatar name={req.fromName} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{req.fromName}</p>
                      <p className="text-xs text-muted-foreground">wants to study together</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => acceptRequest(req)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => rejectRequest(req.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Outgoing */}
          {outgoingRequests.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <p className="border-b border-border px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Sent ({outgoingRequests.length})
              </p>
              <div className="divide-y divide-border">
                {outgoingRequests.map(req => (
                  <div key={req.id} className="flex items-center gap-3 px-4 py-3">
                    <Avatar name={req.toName} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{req.toName}</p>
                      <p className="text-xs text-muted-foreground">Request pending…</p>
                    </div>
                    <Clock size={14} className="shrink-0 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {incomingRequests.length === 0 && outgoingRequests.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card py-14">
              <User2 size={38} className="text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">No pending requests</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
