import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { User } from "./Home";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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

  const handleDelete = async () => {
    if (!userId) return;

    try {
      const res = await fetch(
        `http://localhost:3000/api/user/delete-user/${userId}`,
        {
          method: "DELETE",
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSuccess(true);
      setError(false);
      setTimeout(() => {
        navigate("/");
      }, 2000);
      onUserDelete();
    } catch (error) {
      console.error(error);
    }
  };

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
          <h4>User:{userToDelete?.username}</h4>
          <h4>email:{userToDelete?.email}</h4>
        </div>
        <div className="flex justify-between">
          <Button className="bg-red-700" onClick={handleDelete}>
            Yes
          </Button>
          <Button> go back</Button>
        </div>
      </CardContent>
    </Card>
  );
}
