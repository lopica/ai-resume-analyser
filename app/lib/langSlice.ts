import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type Language = "vi" | "en";

interface LangState {
  lang: Language;
}

const initialState: LangState = {
  lang: "vi", // Match the default in i18n config
};

const langSlice = createSlice({
  name: "lang",
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<Language>) => {
      state.lang = action.payload;
    },
  },
});

export const { setLanguage } = langSlice.actions;
export default langSlice;