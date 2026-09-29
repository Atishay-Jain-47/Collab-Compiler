import {createSlice} from "@reduxjs/toolkit"

/**
 * User Profile state slice.
 * Synchronizes currently authenticated username with localStorage persistence.
 */
const initialState = {
    user: localStorage.getItem("user"),
    loading: false,
};

const profileSlice = createSlice({
    name:"profile",
    initialState: initialState,
    reducers: {
        setUser(state, value) {
            state.user = value.payload;
            if (value.payload) {
                localStorage.setItem("user", value.payload);
            } else {
                localStorage.removeItem("user");
            }
        },
        setLoading(state, value) {
            state.loading = value.payload;
        },
    },
});

export const {setUser, setLoading } = profileSlice.actions;
export default profileSlice.reducer;