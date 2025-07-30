import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import CreateUser from "./pages/CreateUser";
import DeleteUser from "./pages/DeleteUser";
import { useState, useEffect, useCallback } from "react";
import { Button } from "./components/ui/button";
function App() {
  const [users, setUsers] = useState([]);
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:3000/api/user");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      setUsers(data["users"]);
      console.log(data);
    } catch (error) {
      console.log(error);
    }
  }, []);
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <>
      <div className="max-w-3xl mt-10  m-auto">
        <nav className="grid grid-cols-2 w-full justify-between mb-4 w-fulls">
          <div className=" inline-flex justify-start">
            <Link className="font-bold text-2xl" to="/">
              User Management
            </Link>
          </div>
          <div className="flex justify-end gap-2.5">
            <Link to="/create-user">
              <Button>Create user</Button>
            </Link>
            <Link to="/delete-user">
              <Button>Delete user</Button>
            </Link>
          </div>
        </nav>
        <Routes>
          <Route path="/" element={<Home users={users} />} />
          <Route
            path="/create-user"
            element={<CreateUser onUserCreated={fetchUsers} />}
          />
          <Route path="/delete-user" element={<DeleteUser />} />
        </Routes>
      </div>
    </>
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
