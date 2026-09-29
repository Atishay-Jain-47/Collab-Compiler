import {combineReducers} from "@reduxjs/toolkit";

import authReducer from "../slices/authSlice"
import profileReducer from "../slices/profileSlice"
import codeReducer from "../slices/codeSlice"

/**
 * Root Redux Reducer combining auth, profile, and code state branches.
 */
const rootReducer  = combineReducers({
    auth: authReducer,
    profile: profileReducer,
    code: codeReducer
})

export default rootReducer