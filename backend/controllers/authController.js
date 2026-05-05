// project / controllers / authcontroller.js
import * as authService from "../services/authService.js";
import { success } from "../utils/respond.js";
export const login = async (req, res, next) => {
  try {
    const data = await authService.loginAdmin(req.body);
    success(res, data, "Login successful");
  } catch (e) {
    next(e);
  }
};
export const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user._id);
    success(res, user);
  } catch (e) {
    next(e);
  }
};
