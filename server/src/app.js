import mongoose from "mongoose"
import express from "express"
import { authRoute } from "./routes/auth.routes.js"

const app = express()

app.use(express.json())

//importing all the routers
app.use('/api/auth', authRoute)

export default app;