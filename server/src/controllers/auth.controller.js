import { userModel } from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function registerUserController(req, res) {
  const { name, email, password, mobileNumber, collegeName } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "name , email and password are required for registration",
    });
  }

  if (!mobileNumber) {
    return res.status(400).json({
      message: "mobile number is required",
    });
  }

  const userExists = await userModel.findOne({
    email,
  });

  if (userExists) {
    return res.status(400).json({
      message: "user already exists with this email",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = await userModel.create({
    name: name,
    email: email,
    password: hashedPassword,
    mobileNumber: mobileNumber,
    collegeName: collegeName,
  });

  res.status(201).json({
    message: "user created successfully",
    user: {
      name,
      email,
      mobileNumber,
      collegeName,
    },
  });
}

export async function loginUserController(req, res) {
    //need to include the role of the user also
  const { email, password} = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "email and password both are required for login",
    });
  }

  const user = await userModel.findOne({ email });

  if (!user) {
    return res.status(400).json({
      message: "No account exists with this credentials",
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(400).json({
      message: "Invalid password",
    });
  }

  const token = jwt.sign(
    {
      id: user._id,
    },
    process.env.JWT_SECRET_KEY,
    {
      expiresIn: "7d",
    },
  );

  res.cookie("token", token);

  res.status(200).json({
    message: "Logged In successfully",
    user: {
      name: user.name,
      email: user.email,
      mobileNumber: user.mobileNumber,
      collegeName: user.collegeName,
    },
    token,
  });

}