import { toast } from "react-hot-toast";

import {
  setCode,
  setInput,
  setOutput,
  setLanguage,
} from "../../slices/codeSlice";

import { setLoading, setToken } from "../../slices/authSlice";
import { setUser } from "../../slices/profileSlice";
import { apiConnector } from "../apiConnector";
import { endpoints } from "../apis";

const { SIGNUP_API, LOGIN_API } = endpoints;

/**
 * Redux async thunk action for user account registration.
 *
 * @param {string} userName
 * @param {string} password
 * @param {Function} navigate React Router navigation handler
 */
export function signUp(userName, password, navigate) {
  return async (dispatch) => {
    const toastId = toast.loading("Loading...");
    dispatch(setLoading(true));
    try {
      const response = await apiConnector("POST", SIGNUP_API, {
        userName,
        password,
      });

      console.log("SIGNUP API RESPONSE............", response);

      if (!response.data.userName) {
        throw new Error(response.data.message);
      }

      toast.success("Signup Successful");
      navigate("/login");
    } catch (error) {
      console.log("SIGNUP API ERROR............", error);
      toast.error(error.message || "Signup Failed");
      navigate("/signup");
    }
    dispatch(setLoading(false));
    toast.dismiss(toastId);
  };
}

/**
 * Redux async thunk action for user authentication.
 * On success, stores JWT token and username in localStorage and updates Redux auth state.
 *
 * @param {string} userName
 * @param {string} password
 * @param {Function} navigate React Router navigation handler
 */
export function login(userName, password, navigate) {
  return async (dispatch) => {
    const toastId = toast.loading("Loading...");
    dispatch(setLoading(true));
    try {
      const response = await apiConnector("POST", LOGIN_API, {
        userName,
        password,
      });

      console.log("LOGIN API RESPONSE............", response);

      if (!response.data.token) {
        throw new Error(response.data.message);
      }

      toast.success("Login Successful");
      dispatch(setToken(response.data.token));
      dispatch(setUser(response.data.userName));

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", response.data.userName);
      navigate("/");
    } catch (error) {
      console.log("LOGIN API ERROR............", error);
      toast.error(error.message || "Login Failed");
    }
    dispatch(setLoading(false));
    toast.dismiss(toastId);
  };
}

/**
 * Redux action clearing active user session and auth tokens from localStorage.
 *
 * @param {Function} navigate React Router navigation handler
 */
export function logout(navigate) {
  return (dispatch) => {
    dispatch(setToken(null));
    dispatch(setUser(null));
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
    toast.success("Logged Out");
  };
}
