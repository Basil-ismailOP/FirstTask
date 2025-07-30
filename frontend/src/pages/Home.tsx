import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface User {
  id: number;
  username: string;
  email: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
}

interface HomeProps {
  users: User[];
}

function Posts({ posts }: { posts: Post[] }) {
  return (
    <Dialog>
      <DialogTrigger>
        <Button>View Posts</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>Posts</DialogHeader>
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="border-b pb-4 last:border-b-0">
              <h3 className="font-bold">{post.title}</h3>
              <div className=" relative w-full  overflow-hidden rounded-lg"></div>
              <Skeleton className="retlative   m-auto  my-3.5 h-[200px] bg-gray-400 w-[250px]" />
              <p className="text-center font-stretch-75%">{post.content}</p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
function Row({ id, name, email }: { id: number; name: string; email: string }) {
  const [posts, setposts] = useState<Post[]>();

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch(
          `http://localhost:3000/api/posts/get-posts/${id}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setposts(data["posts"]);
        console.log(data);
      } catch (error) {
        console.log(error);
      }
    }
    fetchPosts();
  }, []);

  return (
    <TableRow>
      <TableCell>{name}</TableCell>
      <TableCell>{email}</TableCell>
      <TableCell>
        {" "}
        {posts ? <Posts posts={posts} /> : "No posts found"}
      </TableCell>
    </TableRow>
  );
}
export default function Home({ users }: HomeProps) {
  return (
    <>
      <Table className="text-center">
        <TableCaption>Users and their posts</TableCaption>
        <TableHeader className="">
          <TableRow>
            <TableHead className="text-center w-[100px]">name</TableHead>
            <TableHead className="text-center">Email</TableHead>
            <TableHead className="text-center">View Posts</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users?.map((user, index) => (
            <Row
              key={index}
              id={user.id}
              name={user.username}
              email={user.email}
            />
          ))}
        </TableBody>
      </Table>
    </>
  );
}
