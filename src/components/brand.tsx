export function Logo({ size = 40 }: { size?: number }) {
  return (
    <span
      className="relative inline-flex items-center justify-center rounded-2xl grad-bg shadow-[0_8px_24px_-6px_rgba(110,90,255,0.55)]"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="white"
        width={size * 0.58}
        height={size * 0.58}
        aria-hidden
      >
        {/* messenger-style lightning bubble */}
        <path d="M12 2C6.48 2 2 6.05 2 11.05c0 2.83 1.36 5.36 3.5 7.02V22l3.2-1.76c1.03.28 2.12.44 3.3.44 5.52 0 10-4.05 10-9.05S17.52 2 12 2Zm5.6 7.2-3.02 4.8a1.5 1.5 0 0 1-2.16.55l-2.4-1.8a.6.6 0 0 0-.72 0l-3.25 2.47c-.43.33-.99-.19-.7-.65L8.37 9.4a1.5 1.5 0 0 1 2.16-.55l2.4 1.8a.6.6 0 0 0 .72 0l3.25-2.47c.43-.33.99.19.7.65Z" />
      </svg>
    </span>
  );
}

const AVATAR_GRADS = [
  "from-sky-500 to-indigo-600",
  "from-violet-500 to-fuchsia-600",
  "from-rose-500 to-orange-500",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-red-500",
  "from-cyan-500 to-blue-600",
];

export function Avatar({
  name,
  src,
  size = 44,
}: {
  name: string;
  src?: string | null;
  size?: number;
}) {
  const initial = (name || "؟").trim().charAt(0);
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  const grad = AVATAR_GRADS[Math.abs(hash) % AVATAR_GRADS.length];

  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover ring-2 ring-white/10 shrink-0"
        style={{ width: size, height: size }}
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br ${grad} text-white font-bold ring-2 ring-white/10 shrink-0 select-none`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initial}
    </span>
  );
}
