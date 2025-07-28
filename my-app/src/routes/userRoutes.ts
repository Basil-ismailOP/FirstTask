import { Hono } from "hono";
import { Posts, dummyPosts } from "./postsRoutes";


type User = {
    email: string,
    username: string,
    posts: Posts[],
}

const dummydata: User[] = [
    {email:"Basilawni123@gmail.com ",username:"Basil",posts: dummyPosts}
]

export const userRoutes = new Hono()
.get("/", (c) => { return c.json({ users:[]})
})
.post("/",(c) => {return c.json({})
});
