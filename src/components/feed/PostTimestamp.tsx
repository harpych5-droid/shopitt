import { useEffect, useState } from "react";
import { formatRelativeTime, getRelativeTimeRefreshDelay } from "@/lib/relativeTime";

type PostTimestampProps = {
  createdAt?: string | null;
  className?: string;
};

export const PostTimestamp = ({ createdAt, className = "" }: PostTimestampProps) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!createdAt) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        setNow(Date.now());
        schedule();
      }, getRelativeTimeRefreshDelay(createdAt, Date.now()) + 50);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [createdAt]);

  if (!createdAt) return null;

  return (
    <time dateTime={createdAt ?? undefined} className={className}>
      {formatRelativeTime(createdAt, now)}
    </time>
  );
};
