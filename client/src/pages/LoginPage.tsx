import { LoginForm } from "../components/auth/LoginForm";

export function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Welcome Back
        </h1>
        <LoginForm />
      </div>
    </div>
  );
}
