import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import CreateUser from "./pages/CreateUser";
import DeleteUser from "./pages/DeleteUser";
import { Button } from "./components/ui/button";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";

const queryClient = new QueryClient();

function AppContent() {
  const { data: users = [], refetch } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("http://localhost:3000/api/user");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data["users"] || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  return (
    <div className="max-w-6xl mt-10  m-auto">
      <nav className="grid grid-cols-2 w-full justify-between mb-4 w-fulls">
        <div className=" inline-flex justify-start">
          <Link className="font-bold text-2xl" to="/">
            User Management
          </Link>
        </div>
        <div className="flex justify-end gap-2.5">
          <Link to="/create-user">
            <Button className="cursor-pointer">Create user</Button>
          </Link>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Home users={users} />} />
        <Route
          path="/create-user"
          element={<CreateUser onUserCreated={() => refetch()} />}
        />
        <Route
          path="/delete-user/:userId"
          element={<DeleteUser users={users} onUserDelete={() => refetch()} />}
        />
      </Routes>
    </div>
  );
}
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;

/*
I need 3-pages:
    1-Create User.
    2-Delete User.
    3-Home Page.
*/

/**
 *
 * Create User:
 *    1- Create a route for CreateUser.
 *    2- Implement the form to create up the user.
 *    3- Connect it to upload to the backend.
 */
