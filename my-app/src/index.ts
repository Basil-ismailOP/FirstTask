import { Hono } from 'hono'
import {logger} from 'hono/logger'
import { postsRoutes } from './routes/postsRoutes'
import { userRoutes } from './routes/userRoutes'



const app = new Hono()


app.use("*",logger());


app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.route("/api/posts",postsRoutes);
app.route("/api/user",userRoutes);
export default app
