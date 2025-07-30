import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

interface CreateUserProps {
  onUserCreated?: () => void;
}

export default function CreateUser({ onUserCreated }: CreateUserProps) {
  const [username, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState(false);
  const [sucess, setSuccess] = useState(false);
  const navigate = useNavigate();

  const uploadNewUser = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(false);
      try {
        const res = await fetch("http://localhost:3000/api/user/create-user", {
          method: "POST",
          headers: {
            "Content-type": "application/json",
          },
          body: JSON.stringify({
            username,
            email,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        console.log("User created:", data);

        setUserName("");
        setEmail("");
        setSuccess(true);
        if (onUserCreated) {
          onUserCreated();
        }
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } catch (error) {
        setError(true);
        console.log(error);
        console.log(username, email);
      }
    },
    [username, email, navigate, onUserCreated]
  );
  return (
    <Card className=" w-full m-auto  mt-20 max-w-lg">
      <CardTitle className="p-2.5 m-auto text-2xl">Create User</CardTitle>
      <CardDescription className="m-auto">
        Fill new user's information
      </CardDescription>
      <CardContent>
        {sucess && (
          <div className="mb-4 p-3 bg-green-700 text-white roundded">
            User created successfully, you will be redirected to home
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-400 text-white rounded">
            Something went wrong
          </div>
        )}
        <form onSubmit={uploadNewUser}>
          <div className="flex flex-col gap-6">
            <div>
              <Label className="text-lg mb-1.5" htmlFor="email">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter username "
                required
              />
            </div>
            <div>
              <Label className="text-lg mb-1.5" htmlFor="email">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter user's email"
                required
              />
            </div>
            <div>
              <Button type="submit" className="cursor-pointer">
                {" "}
                Register{" "}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
