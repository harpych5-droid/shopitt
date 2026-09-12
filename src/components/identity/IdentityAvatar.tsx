import type { Profile } from "@/hooks/useIdentity";

interface IdentityAvatarProps {
  profile: Profile | null;
  size?: number; // px
  className?: string;
  ring?: boolean;
}

/**
 * Single source of truth for rendering the authenticated user's avatar.
 * Falls back to a gradient initial (never to a mock username).
 */
export const IdentityAvatar = ({
  profile,
  size = 40,
  className = "",
  ring = false,
}: IdentityAvatarProps) => {
  const initial = (profile?.username?.[0] ?? "S").toUpperCase();
  const dim = { width: size, height: size };

  return (
    <span
      className={`relative inline-block shrink-0 ${className}`}
      style={dim}
      aria-label={profile?.username ? `@${profile.username}` : "Your avatar"}
    >
      {ring && <span className="absolute -inset-0.5 rounded-full gradient-brand" />}
      <span
        className="relative block h-full w-full rounded-full bg-background"
        style={{ padding: ring ? 2 : 0 }}
      >
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.username ?? "avatar"}
            className="h-full w-full rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="block h-full w-full rounded-full gradient-brand flex items-center justify-center font-black text-white">
            {initial}
          </span>
        )}
      </span>
    </span>
  );
};
