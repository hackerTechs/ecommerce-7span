import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { CartProvider } from "./context/CartContext";
import { Layout } from "./components/layout/Layout";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { AdminRoute } from "./components/common/AdminRoute";
import { CustomerRoute } from "./components/common/CustomerRoute";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ProductsPage } from "./pages/ProductsPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { CartPage } from "./pages/CartPage";
import { OrdersPage } from "./pages/OrdersPage";
import { OrderDetailPage } from "./pages/OrderDetailPage";
import { AdminProductsPage } from "./pages/AdminProductsPage";
import { AdminProductNewPage } from "./pages/AdminProductNewPage";
import { AdminProductEditPage } from "./pages/AdminProductEditPage";
import { AdminOrdersPage } from "./pages/AdminOrdersPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <CartProvider>
            <Toaster position="top-right" />
            <Routes>
              <Route element={<Layout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/:id" element={<ProductDetailPage />} />

                <Route element={<ProtectedRoute />}>
                  <Route element={<CustomerRoute />}>
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/orders" element={<OrdersPage />} />
                    <Route path="/orders/:id" element={<OrderDetailPage />} />
                  </Route>
                  <Route element={<AdminRoute />}>
                    <Route path="/admin/products" element={<AdminProductsPage />} />
                    <Route path="/admin/products/new" element={<AdminProductNewPage />} />
                    <Route path="/admin/products/:id/edit" element={<AdminProductEditPage />} />
                    <Route path="/admin/orders" element={<AdminOrdersPage />} />
                  </Route>
                </Route>

                <Route path="*" element={<Navigate to="/products" replace />} />
              </Route>
            </Routes>
          </CartProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
