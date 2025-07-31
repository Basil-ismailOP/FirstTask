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
import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";

export interface User {
  id: number;
  username: string;
  email: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  imageKey: string;
  onCreated: () => void;
}

interface HomeProps {
  users: User[];
}

function AddPost({
  userId,
  onPostCreated,
}: {
  userId: number;
  onPostCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);

    if (image) formData.append("image", image);

    try {
      const res = await fetch(
        `http://localhost:3000/api/posts/create-post/${userId}`,
        { method: "POST", body: formData }
      );
      if (!res.ok) throw new Error(`Status ${res.status}`);

      setTitle("");
      setImage(null);
      setContent("");
      setOpen(false);
      onPostCreated();
    } catch (e) {
      setError(e as string);
      console.log(error);
    }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button
          onClick={() => setOpen(true)}
          className="m-1.5 cursor-pointer rounded-full"
        >
          +
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader className="flesx m-auto font-bold">
          <DialogTitle> New Post</DialogTitle>
          <DialogDescription>Fill in infos</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="mb-1.5 text-lg">
              Title
            </Label>
            <Input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              required
            />
          </div>
          <div>
            <Label htmlFor="email" className="mb-1.5 text-lg">
              Content
            </Label>
            <Input
              type="text"
              id="content"
              placeholder="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>
          <div className="grid w-full max-w-sm items-center gap-3">
            <Label htmlFor="picture">Picture</Label>
            <Input
              id="picture"
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit">Upload</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
function DeleteButton({
  id,
  userId,
  setOpen,
}: {
  id: number;
  userId: number;
  setOpen: (arg0: boolean) => void;
}) {
  const handleDelete = async () => {
    try {
      const res = await fetch(
        `http://localhost:3000/api/posts/delete-post/${userId}/${id}`,
        {
          method: "DELETE",
        }
      );
      if (!res.ok)
        throw new Error(
          `Somethingwent wrong while deleting HTTP ${res.status} `
        );
      setOpen(false);
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <Button className="cursor-pointer" onClick={handleDelete}>
      delete
    </Button>
  );
}

function Posts({
  posts,
  name,
  userId,
  open,
  setOpen,
}: {
  posts: Post[];
  name: string;
  userId: number;
  open: boolean;
  setOpen: (arg0: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button className="hover:cursor-pointer hover:bg-gray-700">
          View Posts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader className="text-2xl font-bold">{`${name}'s Posts`}</DialogHeader>
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="border-b py-4 last:border-b-0">
              <div className="flex justify-between">
                <h5 className="font-semibold">{post.title}</h5>
                <DeleteButton id={post.id} userId={userId} setOpen={setOpen} />
              </div>
              <div className=" relative w-full  overflow-hidden rounded-lg"></div>
              {post.imageKey ? (
                <img
                  className="m-auto w-[200px] h-[200px]"
                  src={post.imageKey}
                  alt={post.title}
                />
              ) : (
                <Skeleton className="retlative   m-auto  my-3.5 h-[200px] bg-gray-400 w-[250px]" />
              )}
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
  const [open, setOpen] = useState(false);
  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch(
        `http://localhost:3000/api/posts/get-posts/${id}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setposts(data["posts"] || []);
      console.log(data);
    } catch (error) {
      console.log(error);
    }
  }, [id]);
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts, open]);

  return (
    <TableRow>
      <TableCell>
        <Link to={`/delete-user/${id}`}>
          <Button className="bg-red-800 rounded-full">X</Button>
        </Link>
      </TableCell>
      <TableCell>{name}</TableCell>
      <TableCell>{email}</TableCell>
      <TableCell>
        {posts?.length ? (
          <Posts
            posts={posts}
            name={name}
            open={open}
            setOpen={setOpen}
            userId={id}
          />
        ) : null}
        <AddPost userId={id} onPostCreated={fetchPosts} />
      </TableCell>
    </TableRow>
  );
}
export default function Home({ users }: HomeProps) {
  return (
    <>
      <Table className="text-center w-full">
        <TableCaption>Users and their posts</TableCaption>
        <TableHeader className="">
          <TableRow>
            <TableHead> </TableHead>
            <TableHead className="text-center w-[100px]">name</TableHead>
            <TableHead className="text-center">Email</TableHead>
            <TableHead className="text-center">View Posts</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users?.map((user) => (
            <Row
              key={user.id}
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
