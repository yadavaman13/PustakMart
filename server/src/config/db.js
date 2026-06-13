import mongoose from "mongoose";

export async function connectDB() {
    try{
        await mongoose.connect(process.env.MONGO_URL)
        console.log("DB connected successfully!")
    } catch(err){
        console.log("Error connecting DB!")
    }
}
