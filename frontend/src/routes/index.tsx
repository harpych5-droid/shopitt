import HomePage from "@/pages/HomePage";
import SearchPage from "@/pages/SearchPage";
import CartPage from "@/pages/CartPage";
import WishlistPage from "@/pages/WishlistPage";
import ProfilePage from "@/pages/ProfilePage";
import NotFoundPage from "@/pages/NotFoundPage";

export const routes = [
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/search",
    element: <SearchPage />,
  },
  {
    path: "/cart",
    element: <CartPage />,
  },
  {
    path: "/wishlist",
    element: <WishlistPage />,
  },
  {
    path: "/profile/:handle",
    element: <ProfilePage />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
];
