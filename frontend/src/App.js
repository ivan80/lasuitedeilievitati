import "./App.css";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AuthCallback from "./pages/AuthCallback";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Recipes from "./pages/Recipes";
import RecipeDetail from "./pages/RecipeDetail";
import RecipeForm from "./pages/RecipeForm";
import Calculator from "./pages/Calculator";
import FlourArchive from "./pages/FlourArchive";

function Loader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper">
      <div className="w-12 h-12 border-4 border-line border-t-crust rounded-full animate-spin" />
    </div>
  );
}

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRouter() {
  const location = useLocation();
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/ricette" element={<Protected><Recipes /></Protected>} />
      <Route path="/ricette/nuova" element={<Protected><RecipeForm /></Protected>} />
      <Route path="/ricette/:id" element={<Protected><RecipeDetail /></Protected>} />
      <Route path="/ricette/:id/modifica" element={<Protected><RecipeForm /></Protected>} />
      <Route path="/calcolatore" element={<Protected><Calculator /></Protected>} />
      <Route path="/farine" element={<Protected><FlourArchive /></Protected>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRouter />
        <Toaster position="top-center" richColors />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
