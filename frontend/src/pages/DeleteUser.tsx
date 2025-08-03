import { useNavigate, useParams } from "react-router-dom";
import type { User } from "./Home";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
export default function DeleteUser({
  users,
  onUserDelete,
}: {
  users: User[];
  onUserDelete: () => void;
}) {
  const [error, setError] = useState(false);
  const [sucess, setSuccess] = useState(false);
  const { userId } = useParams();
  const navigate = useNavigate();
  const userToDelete = users.find(
    (user) => user.id === parseInt(userId || "0")
  );
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `http://localhost:3000/api/user/delete-user/${userId}`,
        {
          method: "DELETE",
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    },
    onSuccess: () => {
      setSuccess(true);
      setError(false);
      setTimeout(() => {
        navigate("/");
      }, 2000);
      onUserDelete();
    },
    onError: () => {
      setError(true);
      console.log("Something went wrong couldn't delete");
    },
  });

  if (sucess)
    return (
      <div className="mb-4 p-3 bg-green-700 text-white roundded">
        User deleted successfully, you will be redirected to home
      </div>
    );
  if (!userToDelete)
    return (
      <div>
        <h1 className="m-auto text-2xl"> NO user found</h1>
      </div>
    );
  return (
    <Card className="w-full m-auto  mt-20 max-w-lg">
      <CardTitle className="p-2.5 m-auto text-2xl">Delete User</CardTitle>
      <CardDescription className="m-auto">
        You are about to delete user {userToDelete?.username}
      </CardDescription>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-400 text-white rounded">
            Something went wrong
          </div>
        )}
        <h2 className="text-center font-bold text-lg">Are you sure?</h2>
        <h3 className="text-center mt-5 text-lg">User's info </h3>
        <div className="flex justify-around m-5">
          <h4 className="font-bold">User:{userToDelete?.username}</h4>
          <h4 className="font-bold">email:{userToDelete?.email}</h4>
        </div>
        <div className="flex justify-between">
          <Button
            className="bg-red-700 cursor-pointer hover:bg-red-300"
            onClick={() => deleteMutation.mutate()}
          >
            Yes
          </Button>
          <Button
            className="cursor-pointer hover:bg-gray-700"
            onClick={() => {}}
          >
            go back
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
