import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

type BackButtonProps = {
  fallback?: string;
  className?: string;
};

export const BackButton = ({ fallback = "/", className = "" }: BackButtonProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const goBack = () => {
    if (location.key !== "default") {
      navigate(-1);
      return;
    }
    navigate(fallback, { replace: true });
  };

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label="Back"
      className={`h-9 w-9 rounded-full hover:bg-muted/50 flex items-center justify-center ${className}`}
    >
      <ArrowLeft className="h-5 w-5" />
    </button>
  );
};
