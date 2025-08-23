"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast({
        title: "Úspešné prihlásenie",
        description: "Vitajte v systéme!",
      });
    } catch (error) {
      toast({
        title: "Chyba prihlásenia",
        description: error instanceof Error ? error.message : "Nastala chyba",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Prihlásenie do systému
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Zadajte svoje prihlasovacie údaje
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email adresa"
                className="mb-4"
              />
            </div>
            <div>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Heslo"
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? "Prihlasujem..." : "Prihlásiť sa"}
            </Button>
          </div>

          <div className="text-sm text-center text-gray-600">
            <p>Demo účty:</p>
            <p>admin@example.com / admin123</p>
            <p>accountant@example.com / accountant123</p>
            <p>user@example.com / user123</p>
          </div>
        </form>
      </div>
    </div>
  );
}
