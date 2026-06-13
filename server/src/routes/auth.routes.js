import expressRouter from "express"
import { loginUserController, registerUserController } from "../controllers/auth.controller.js";

export const authRoute = expressRouter();


/**
 * @route /api/auth/register
 * @description Register user
 * @access public
 */
authRoute.post('/register', registerUserController)

/**
 * @route /api/auth/login
 * @description Login user
 * @access public
 */
authRoute.post('/login', loginUserController)