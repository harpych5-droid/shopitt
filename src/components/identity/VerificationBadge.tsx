import { BadgeCheck } from "lucide-react";

interface VerificationBadgeProps {
  verified?: boolean | null;
  className?: string;
}

export const VerificationBadge = ({ verified = false, className = "" }: VerificationBadgeProps) => {
  if (!verified) return null;
  return <BadgeCheck aria-label="Verified account" className={`text-brand-purple fill-brand-purple/20 shrink-0 ${className}`} />;
};