import { Link } from "react-router-dom";

const AppBar = () => {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container flex items-center justify-between py-2">
        <Link to="/" className="flex items-center gap-2" aria-label="Shopit Home">
          <div className="h-8 w-8 rounded-md bg-gradient-primary shadow-[var(--shadow-elev)]" aria-hidden />
          <span className="font-extrabold tracking-tight">Shopit</span>
        </Link>
        <div aria-hidden className="w-8" />
      </nav>
    </header>
  );
};

export default AppBar;
