import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";
import { Button, buttonClassNames } from "../ui";

export function Navbar() {
  const { user, logout } = useAuth();
  const { cart, fetchCart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (user?.role === "CUSTOMER") {
      void fetchCart();
    }
  }, [user, fetchCart]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const cartCount = cart?.items?.length ?? 0;

  return (
    <header className="bg-white shadow sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            to="/"
            className="text-xl font-semibold text-indigo-600 hover:text-indigo-700 shrink-0"
          >
            <span className="text-red-400">7Span</span> Store
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {user ? (
              <>
                <NavLink to="/products">Products</NavLink>
                {user.role === "CUSTOMER" && (
                  <>
                    <Link
                      to="/cart"
                      className="inline-flex items-center gap-1.5 text-gray-700 hover:text-indigo-600 font-medium"
                    >
                      Cart
                      <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-indigo-600 px-1.5 text-xs font-semibold text-white">
                        {cartCount}
                      </span>
                    </Link>
                    <NavLink to="/orders">Orders</NavLink>
                  </>
                )}
                {user.role === "ADMIN" && (
                  <>
                    <NavLink to="/admin/products">Admin products</NavLink>
                    <NavLink to="/admin/orders">Admin orders</NavLink>
                  </>
                )}
                <span className="text-gray-500 truncate max-w-[10rem]">{user.name}</span>
                <Button type="button" variant="primary" size="sm" onClick={() => logout()}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <NavLink to="/login">Login</NavLink>
                <Link to="/register" className={buttonClassNames({ variant: "primary", size: "sm" })}>
                  Register
                </Link>
              </>
            )}
          </nav>

          {/* Hamburger button */}
          <Button
            type="button"
            variant="ghost"
            onClick={() => setMenuOpen((o) => !o)}
            className="md:hidden inline-flex rounded-md p-2 !px-2 !py-2"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-2">
            {user ? (
              <>
                <MobileLink to="/products">Products</MobileLink>
                {user.role === "CUSTOMER" && (
                  <>
                    <MobileLink to="/cart">
                      Cart
                      <span className="ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-indigo-600 px-1.5 text-xs font-semibold text-white">
                        {cartCount}
                      </span>
                    </MobileLink>
                    <MobileLink to="/orders">Orders</MobileLink>
                  </>
                )}
                {user.role === "ADMIN" && (
                  <>
                    <MobileLink to="/admin/products">Admin products</MobileLink>
                    <MobileLink to="/admin/orders">Admin orders</MobileLink>
                  </>
                )}
                <div className="border-t border-gray-100 pt-2 mt-2 flex items-center justify-between">
                  <span className="text-sm text-gray-500 truncate">{user.name}</span>
                  <Button type="button" variant="primary" size="sm" onClick={() => logout()}>
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <>
                <MobileLink to="/login">Login</MobileLink>
                <MobileLink to="/register">Register</MobileLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="text-gray-700 hover:text-indigo-600 font-medium">
      {children}
    </Link>
  );
}

function MobileLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="flex items-center rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
    >
      {children}
    </Link>
  );
}
