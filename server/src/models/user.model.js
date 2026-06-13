import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name:{
        type: String,
        require: [true, 'name is required']
    },
    email:{
        type: String,
        require: [true, 'email is required'],
        unique: [true, 'email is already in use']
    },
    password:{
        type: String,
        require: [true, 'password is required']
    },
    mobileNumber:{
        type: Number,
        require: [true, 'mobile number is required'],
        unique: [true, 'mobile number is already in use']
    },
    collegeName:{
        type: String
    }
})

export const userModel = mongoose.model("user",userSchema)