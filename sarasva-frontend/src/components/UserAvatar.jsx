/**
 * UserAvatar — colored initials or emoji avatar.
 * Reads avatarColor and avatarEmoji from the user object.
 */

export const AVATAR_COLORS = [
  { hex: "#6366f1", label: "Indigo"  },
  { hex: "#8b5cf6", label: "Violet"  },
  { hex: "#ec4899", label: "Pink"    },
  { hex: "#f43f5e", label: "Rose"    },
  { hex: "#f97316", label: "Orange"  },
  { hex: "#f59e0b", label: "Amber"   },
  { hex: "#10b981", label: "Emerald" },
  { hex: "#0ea5e9", label: "Sky"     },
  { hex: "#14b8a6", label: "Teal"    },
  { hex: "#84cc16", label: "Lime"    },
];

export const AVATAR_EMOJIS = [
  null,   // means: use initials
  // Study & achievement
  "📚", "🎯", "🌟", "💡", "🏆", "🚀", "⚡", "🎨",
  // Cute animals
  "🐱", "🐶", "🐼", "🐸", "🦊", "🐨", "🐧", "🦄",
  "🐹", "🦝", "🦁", "🦦", "🦋", "🐝", "🦩", "🐬",
  // Nature & vibes
  "🌸", "🌺", "🌻", "🍀", "🌈", "🌙", "🌊", "🌵",
  // Fun & cool
  "🎵", "🎀", "🧸", "🤖", "👾", "💫", "🎭", "🎸",
];

/**
 * @param {{ user?: object, size?: "xs"|"sm"|"md"|"lg"|"xl" }}
 */
export default function UserAvatar({ user, size = "md" }) {
  const sizeMap = {
    xs:  "h-6 w-6 text-[10px]",
    sm:  "h-8 w-8 text-xs",
    md:  "h-10 w-10 text-sm",
    lg:  "h-14 w-14 text-xl",
    xl:  "h-20 w-20 text-3xl",
  };

  const initials = (user?.name ?? "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const bg    = user?.avatarColor ?? "#6366f1";
  const emoji = user?.avatarEmoji ?? null;

  return (
    <div
      className={`${sizeMap[size]} shrink-0 rounded-full flex items-center justify-center font-bold select-none`}
      style={{ background: emoji ? "#f3f4f6" : bg, color: emoji ? undefined : "#ffffff" }}
    >
      {emoji ?? initials}
    </div>
  );
}
