import { Posts } from "./routes/postsRoutes";
import { User } from "./routes/userRoutes";

export const dummyPosts: Posts[] = [
  {
    id: crypto.randomUUID(),
    content: "This is wonderful!",
    title: "Wonderland",
  },
];

export const dummyData: User[] = [
  { email: "Basilawni123@gmail.com ", username: "Basil", posts: dummyPosts },
];
