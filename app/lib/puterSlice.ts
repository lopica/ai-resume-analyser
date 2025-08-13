// features/puter/puterSlice.ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getPuter } from "./puter";

interface AuthState {
  user: PuterUser | null;
  isAuthenticated: boolean;
}

interface PuterState {
  puterReady: boolean;
  auth: AuthState;
}

const initialState: PuterState = {
  puterReady: false,
  auth: {
    user: null,
    isAuthenticated: false,
  },
};

const puterSlice = createSlice({
  name: "puter",
  initialState,
  reducers: {
    setUser(state, action) {
      state.auth.user = action.payload.user;
      state.auth.isAuthenticated = !!action.payload.user;
    },
    setPuter(state, action) {
      state.puterReady = action.payload;
    },
  },
});

export const checkAuthStatus = createAsyncThunk(
  `${puterSlice.name}/checkAuthStatus`,
  async (_, { rejectWithValue, dispatch }) => {
    const puter = getPuter();
    if (!puter) {
      return rejectWithValue("Puter.js not available");
    }

    try {
      const isSignedIn = await puter.auth.isSignedIn();
      if (isSignedIn) {
        const user = await puter.auth.getUser();
        dispatch(setUser({user}))
      } else {
        dispatch(setUser({user: null}))
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to check auth status";
      return rejectWithValue(msg);
    }
  }
);

export const { setUser, setPuter } = puterSlice.actions;
export default puterSlice;
