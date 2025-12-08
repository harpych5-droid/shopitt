import { useParams } from "react-router-dom";
import { useEffect } from "react";

const Profile = () => {
  const { handle } = useParams<{ handle: string }>();

  useEffect(() => {
    document.title = `${handle ?? "User"} – Shopit Profile`;
  }, [handle]);

  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-md space-y-4 pb-24 pt-14">
        <header className="flex items-center gap-3">
          <div className="size-16 rounded-full bg-primary text-primary-foreground grid place-items-center font-bold">
            {(handle ?? "U").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold">{handle}</h1>
            <p className="text-sm text-muted-foreground">Creator • Verified Seller</p>
          </div>
          <div className="ml-auto">
            <button className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground">Follow</button>
          </div>
        </header>
        <section className="grid grid-cols-3 gap-1">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="aspect-square overflow-hidden rounded-sm bg-muted" />
          ))}
        </section>
      </main>
    </div>
  );
};

export default Profile;
