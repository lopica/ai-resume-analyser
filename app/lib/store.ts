import { configureStore } from "@reduxjs/toolkit";
import puterSlice from "./puterSlice";
import { puterApiSlice } from "./puterApiSlice";

export const store = configureStore({
  devTools: process.env.NODE_ENV !== "production",
  reducer: {
    [puterSlice.name]: puterSlice.reducer,
    [puterApiSlice.reducerPath]: puterApiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(puterApiSlice.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
