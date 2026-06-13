import app from "./src/app.js"
import { connectDB } from "./src/config/db.js"
import dotenv from "dotenv"

dotenv.config()

connectDB()

app.listen(3000, (re,res) => {
    console.log(`app is running on 3000 PORT`)
})