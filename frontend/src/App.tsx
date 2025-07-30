import { Routes,Route,Link } from 'react-router-dom'
import Home from './pages/Home'
import CreateUser from './pages/CreateUser'
import DeleteUser from './pages/DeleteUser'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "@/components/ui/navigation-menu"
import { useState ,useEffect} from 'react'
import { User } from 'lucide-react'

function App() {
const [users,setUsers] = useState([]);

    useEffect(()=>
    {
       async function fetchUsers()
        {
            try{

                const res = await fetch('http://localhost:3000/api/user')
                if(!res.ok)
                    throw new Error(`HTTP ${res.status}`);
                
                const data = await res.json();
                
                            setUsers(data['users']);
                            console.log(data);
            }catch(error)
            {
                console.log(error);
            }
            
        }
        fetchUsers();
    },[])

return <>
<div className='max-w-2xl mt-10  m-auto'>
  
  <nav className='grid grid-cols-2 w-full justify-between mb-4 w-fulls'>
    <div className=' inline-flex justify-start'>
      <Link className='1' to='/'>Home</Link>
      </div>
      <div className='flex justify-end gap-2.5'>
       <Link to="/create-user">Create user</Link>    
      <Link to="/delete-user">Delete user</Link>
  </div>
  </nav>
  <Routes>
    <Route path='/' element={<Home users={users}/>}/>
    <Route path='/create-user' element={<CreateUser/>}/>
    <Route path='/delete-user' element={<DeleteUser/>}/>
  </Routes>
  </div></>
}

export default App


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