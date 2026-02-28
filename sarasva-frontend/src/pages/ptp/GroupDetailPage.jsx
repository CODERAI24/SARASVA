import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Users, Plus, X, Bookmark, BookmarkCheck,
  Calendar, ClipboardList, BookOpen, FileText, StickyNote,
  UserPlus, ChevronDown, ChevronUp, Trash2, LogOut,
  Library, CalendarDays, Download,
} from "lucide-react";
import { useGroupDetail, useGroups } from "@/hooks/useGroups.js";
import { usePTP }       from "@/hooks/usePTP.js";
import { useSubjects }  from "@/hooks/useSubjects.js";
import { useTimetable } from "@/hooks/useTimetable.js";
import { useAuth }      from "@/hooks/useAuth.js";
import { tasksService } from "@/services/tasks.service.js";
import { cn }           from "@/lib/utils.js";

/* ── Post type config ────────────────────────────────────────────── */
const POST_TYPES = [
  { value: "note",         label: "Note",         icon: StickyNote,
    bg: "bg-emerald-100 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-400" },
  { value: "task",         label: "Task",         icon: ClipboardList,
    bg: "bg-blue-100 dark:bg-blue-950/40",   text: "text-blue-700 dark:text-blue-400" },
  { value: "assignment",   label: "Assignment",   icon: FileText,
    bg: "bg-purple-100 dark:bg-purple-950/40", text: "text-purple-700 dark:text-purple-400" },
  { value: "exam_date",    label: "Exam Date",    icon: Calendar,
    bg: "bg-rose-100 dark:bg-rose-950/40",   text: "text-rose-700 dark:text-rose-400" },
  { value: "exam_pattern", label: "Exam Pattern", icon: BookOpen,
    bg: "bg-amber-100 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-400" },
  { value: "subject",      label: "Subject",      icon: Library,
    bg: "bg-teal-100 dark:bg-teal-950/40",   text: "text-teal-700 dark:text-teal-400" },
  { value: "timetable",    label: "Timetable",    icon: CalendarDays,
    bg: "bg-violet-100 dark:bg-violet-950/40", text: "text-violet-700 dark:text-violet-400" },
];

function typeConfig(value) {
  return POST_TYPES.find(p => p.value === value) ?? POST_TYPES[0];
}

/* ── Small reusable components ───────────────────────────────────── */
function Avatar({ name, size = "sm" }) {
  const initials = (name ?? "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const sz = size === "xs" ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-xs";
  return (
    <div className={`${sz} shrink-0 rounded-full bg-primary/15 flex items-center justify-center font-bold text-primary`}>
      {initials}
    </div>
  );
}

function PostTypeBadge({ type }) {
  const t = typeConfig(type);
  const Icon = t.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${t.bg} ${t.text}`}>
      <Icon size={10} />
      {t.label}
    </span>
  );
}

/* ── Main page ───────────────────────────────────────────────────── */
export default function GroupDetailPage() {
  const { groupId } = useParams();
  const navigate    = useNavigate();
  const { user }    = useAuth();

  const { group, posts, loading, createPost, toggleSave } = useGroupDetail(groupId);
  const { inviteToGroup, deleteGroup, leaveGroup }        = useGroups();
  const { friends }                                       = usePTP();
  const { subjects, importSubject }                       = useSubjects();
  const { timetables, importTimetable }                   = useTimetable();

  /* ── Post form ──────────────────────────────────────────────── */
  const [addingPost,  setAddingPost]  = useState(false);
  const [postType,    setPostType]    = useState("note");
  const [postTitle,   setPostTitle]   = useState("");
  const [postDesc,    setPostDesc]    = useState("");
  const [postDate,    setPostDate]    = useState("");
  const [postPayload, setPostPayload] = useState(null);
  const [postError,   setPostError]   = useState("");
  const [submitting,  setSubmitting]  = useState(false);

  /* ── Invite panel ───────────────────────────────────────────── */
  const [membersOpen,   setMembersOpen]   = useState(false);
  const [inviting,      setInviting]      = useState(false);
  const [inviteSentMap, setInviteSentMap] = useState({});
  const [inviteError,   setInviteError]   = useState("");

  /* ── Save optimistic state ───────────────────────────────────── */
  const [savedMap, setSavedMap] = useState({});

  const isCreator = group?.createdBy === user?.id;
  const invitableFriends = friends.filter(f => !group?.memberUids?.includes(f.uid));

  /* ── Handlers ───────────────────────────────────────────────── */
  function handleTypeChange(value) {
    setPostType(value);
    setPostPayload(null);
    if (value === "subject" || value === "timetable") {
      setPostTitle("");
      setPostDesc("");
    }
  }

  function handleSubjectSelect(e) {
    const subj = subjects.find(s => s.id === e.target.value);
    if (!subj) { setPostTitle(""); setPostDesc(""); setPostPayload(null); return; }
    const chapters = subj.chapters ?? [];
    setPostTitle(subj.name);
    setPostDesc(chapters.length ? chapters.map(c => c.name).join(", ") : "No chapters yet");
    setPostPayload({ name: subj.name, chapters });
  }

  function handleTimetableSelect(e) {
    const tt = timetables.find(t => t.id === e.target.value);
    if (!tt) { setPostTitle(""); setPostDesc(""); setPostPayload(null); return; }
    setPostTitle(tt.name);
    setPostDesc(`${(tt.slots ?? []).length} time slot(s)`);
    setPostPayload({ name: tt.name, slots: tt.slots ?? [] });
  }

  async function handleCreatePost(e) {
    e.preventDefault();
    if (!postTitle.trim()) return;
    if ((postType === "subject" || postType === "timetable") && !postPayload) return;
    setPostError(""); setSubmitting(true);
    try {
      await createPost({
        type:        postType,
        title:       postTitle.trim(),
        description: postDesc.trim(),
        date:        postDate || null,
        payload:     postPayload,
      });
      setPostTitle(""); setPostDesc(""); setPostDate("");
      setPostPayload(null); setAddingPost(false);
    } catch (err) { setPostError(err.message); }
    setSubmitting(false);
  }

  async function handleSaveToApp(post) {
    const isSaved = savedMap[post.id] ?? post.savedBy?.includes(user?.id);
    setSavedMap(m => ({ ...m, [post.id]: !isSaved }));
    await toggleSave(post.id, isSaved);
    if (!isSaved) {
      try {
        if (post.type === "subject" && post.payload) {
          await importSubject(post.payload);
        } else if (post.type === "timetable" && post.payload) {
          await importTimetable(post.payload);
        } else {
          await tasksService.create(user.id, {
            title:       post.title,
            description: `[${group?.name ?? "Group"}] ${post.description}`.trim(),
            dueDate:     post.date ?? "",
            priority:    post.type === "exam_date" ? "high" : "medium",
          });
        }
      } catch { /* non-critical */ }
    }
  }

  async function handleInvite(friend) {
    if (!group) return;
    setInviteError("");
    try {
      await inviteToGroup(groupId, group.name, friend);
      setInviteSentMap(m => ({ ...m, [friend.uid]: true }));
    } catch (err) { setInviteError(err.message); }
  }

  async function handleDeleteGroup() {
    if (!confirm(`Delete "${group.name}"? This cannot be undone and will remove the group for all members.`)) return;
    try {
      await deleteGroup(groupId);
      navigate("/ptp");
    } catch (err) { alert(err.message); }
  }

  async function handleLeaveGroup() {
    if (!confirm(`Leave "${group.name}"?`)) return;
    try {
      await leaveGroup(groupId);
      navigate("/ptp");
    } catch (err) { alert(err.message); }
  }

  /* ── Loading / not found ─────────────────────────────────────── */
  if (loading) return (
    <div className="flex h-40 items-center justify-center">
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  );
  if (!group) return (
    <div className="flex flex-col items-center gap-2 py-20">
      <p className="text-sm text-muted-foreground">Group not found.</p>
      <button onClick={() => navigate("/ptp")} className="text-xs text-primary underline">Back to Peers</button>
    </div>
  );

  const showDate   = ["task", "assignment", "exam_date"].includes(postType);
  const isSubjType = postType === "subject";
  const isTTType   = postType === "timetable";

  return (
    <div className="mx-auto max-w-md space-y-4">

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/ptp")}
          className="rounded-lg p-1.5 hover:bg-accent transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">{group.name}</h1>
          <p className="text-xs text-muted-foreground">
            {group.memberUids?.length ?? 0} member{group.memberUids?.length !== 1 ? "s" : ""}
          </p>
        </div>
        {isCreator ? (
          <button
            onClick={handleDeleteGroup}
            className="flex items-center gap-1 rounded-lg border border-destructive/30 px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
            title="Delete group"
          >
            <Trash2 size={13} /> Delete
          </button>
        ) : (
          <button
            onClick={handleLeaveGroup}
            className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
            title="Leave group"
          >
            <LogOut size={13} /> Leave
          </button>
        )}
      </div>

      {/* ── Members panel ────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <button
          onClick={() => setMembersOpen(v => !v)}
          className="flex w-full items-center justify-between px-4 py-3"
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <Users size={14} className="text-primary" />
            Members ({group.members?.length ?? 0})
          </div>
          {membersOpen ? <ChevronUp size={14} className="text-muted-foreground" />
                       : <ChevronDown size={14} className="text-muted-foreground" />}
        </button>

        {membersOpen && (
          <div className="border-t border-border">
            <div className="divide-y divide-border">
              {(group.members ?? []).map(m => (
                <div key={m.uid} className="flex items-center gap-3 px-4 py-2.5">
                  <Avatar name={m.name} size="xs" />
                  <p className="flex-1 text-sm">{m.name}</p>
                  {m.uid === group.createdBy && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      Admin
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-border p-3 space-y-2">
              <button
                onClick={() => { setInviting(v => !v); setInviteError(""); }}
                className="flex items-center gap-1.5 text-xs font-medium text-primary"
              >
                <UserPlus size={13} />
                {inviting ? "Close" : "Invite a Friend"}
              </button>

              {inviting && (
                <div className="space-y-1.5">
                  {inviteError && <p className="text-xs text-destructive">{inviteError}</p>}
                  {invitableFriends.length === 0 ? (
                    <p className="py-2 text-center text-xs text-muted-foreground">
                      All your friends are already in this group.
                    </p>
                  ) : (
                    invitableFriends.map(f => (
                      <div key={f.uid} className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
                        <Avatar name={f.name} size="xs" />
                        <span className="flex-1 text-sm">{f.name}</span>
                        {inviteSentMap[f.uid] ? (
                          <span className="text-xs text-muted-foreground">Sent</span>
                        ) : (
                          <button
                            onClick={() => handleInvite(f)}
                            className="rounded-lg bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground"
                          >
                            Invite
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Share with group button ───────────────────────────────── */}
      <button
        onClick={() => setAddingPost(v => !v)}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-colors",
          addingPost
            ? "border-border bg-muted text-muted-foreground"
            : "border-primary bg-primary/5 text-primary hover:bg-primary/10"
        )}
      >
        {addingPost ? <X size={15} /> : <Plus size={15} />}
        {addingPost ? "Cancel" : "Share with Group"}
      </button>

      {/* ── Add post form ─────────────────────────────────────────── */}
      {addingPost && (
        <form onSubmit={handleCreatePost} className="space-y-3 rounded-xl border border-border bg-card p-4">
          {/* Type pills */}
          <div className="flex flex-wrap gap-1.5">
            {POST_TYPES.map(t => {
              const isActive = postType === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => handleTypeChange(t.value)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                    isActive ? `${t.bg} ${t.text}` : "bg-muted text-muted-foreground hover:bg-accent"
                  )}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Subject picker */}
          {isSubjType && (
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Pick a subject to share</label>
              <select
                onChange={handleSubjectSelect}
                defaultValue=""
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="" disabled>Select subject…</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}{(s.chapters ?? []).length > 0 ? ` (${s.chapters.length} chapters)` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Timetable picker */}
          {isTTType && (
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Pick a timetable to share</label>
              <select
                onChange={handleTimetableSelect}
                defaultValue=""
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="" disabled>Select timetable…</option>
                {timetables.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}{(t.slots ?? []).length > 0 ? ` (${t.slots.length} slots)` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Selected preview */}
          {(isSubjType || isTTType) && postTitle && (
            <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{postTitle}</span>
              {postDesc && <span className="ml-1">— {postDesc}</span>}
            </div>
          )}

          {/* Manual title + desc */}
          {!isSubjType && !isTTType && (
            <>
              <input
                autoFocus
                value={postTitle}
                onChange={e => setPostTitle(e.target.value)}
                placeholder="Title…"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <textarea
                value={postDesc}
                onChange={e => setPostDesc(e.target.value)}
                placeholder="Details, topics to cover, notes…"
                rows={3}
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </>
          )}

          {showDate && (
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Date</label>
              <input
                type="date"
                value={postDate}
                onChange={e => setPostDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          )}

          {postError && <p className="text-xs text-destructive">{postError}</p>}

          <button
            type="submit"
            disabled={submitting || !postTitle.trim() || ((isSubjType || isTTType) && !postPayload)}
            className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {submitting ? "Sharing…" : "Share"}
          </button>
        </form>
      )}

      {/* ── Posts feed ────────────────────────────────────────────── */}
      {posts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card py-14">
          <StickyNote size={34} className="text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">Nothing shared yet</p>
          <p className="text-xs text-muted-foreground">Be the first to share a task, subject, or note</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => {
            const isSaved    = savedMap[post.id] ?? post.savedBy?.includes(user?.id);
            const isDataType = post.type === "subject" || post.type === "timetable";
            return (
              <div key={post.id} className="rounded-xl border border-border bg-card p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <PostTypeBadge type={post.type} />
                    <p className="text-sm font-semibold leading-snug">{post.title}</p>
                  </div>
                  <button
                    onClick={() => handleSaveToApp(post)}
                    className={cn(
                      "shrink-0 rounded-lg p-1.5 transition-colors",
                      isSaved ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
                    )}
                    title={
                      isSaved
                        ? (isDataType ? "Already imported" : "Saved to my tasks")
                        : (isDataType ? "Import to my app" : "Save to my tasks")
                    }
                  >
                    {isSaved
                      ? <BookmarkCheck size={16} />
                      : isDataType ? <Download size={16} /> : <Bookmark size={16} />
                    }
                  </button>
                </div>

                {post.description && (
                  <p className="text-xs leading-relaxed text-muted-foreground">{post.description}</p>
                )}

                <div className="flex items-center justify-between pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <Avatar name={post.authorName} size="xs" />
                    <span className="text-xs text-muted-foreground">{post.authorName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {post.date && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {new Date(post.date + "T12:00:00").toLocaleDateString("en-IN", {
                          day: "numeric", month: "short",
                        })}
                      </span>
                    )}
                    {isSaved && (
                      <span className="text-[10px] font-semibold text-primary">
                        {isDataType ? "Imported ✓" : "Saved ✓"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
