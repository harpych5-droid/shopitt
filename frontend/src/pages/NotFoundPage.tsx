import { Button } from "@/components/ui/button";

const NotFoundPage = () => {
  return (
    <div className="grid min-h-screen place-items-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="mt-2 text-muted-foreground">Page not found.</p>
        <Button asChild className="mt-4">
          <a href="/">Go back home</a>
        </Button>
      </div>
    </div>
  );
};

export default NotFoundPage;
