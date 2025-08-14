import { createApi } from "@reduxjs/toolkit/query/react";
import { getPuter } from "./puter";
import { checkAuthStatus, setPuter, setUser } from "./puterSlice";

export const puterApiSlice = createApi({
  reducerPath: "puterApi",
  baseQuery: () => ({ data: null }),
  tagTypes: ["AuthStatus"],
  endpoints: (builder) => ({
    // Auth endpoints
    signIn: builder.mutation<void, void>({
      queryFn: async (_, { dispatch }) => {
        const puter = getPuter();
        if (!puter) {
          return { error: "Puter.js not available" };
        }
        try {
          await puter.auth.signIn();
          dispatch(checkAuthStatus());
          return { data: undefined };
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Sign in failed";
          return { error: msg };
        }
      },
      invalidatesTags: ["AuthStatus"],
    }),

    signOut: builder.mutation<void, void>({
      queryFn: async (_, { dispatch }) => {
        const puter = getPuter();
        if (!puter) {
          return { error: "Puter.js not available" };
        }

        try {
          await puter.auth.signOut();
          dispatch(setUser({ user: null }));

          return { data: undefined };
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Sign out failed";
          return { error: msg };
        }
      },
      invalidatesTags: ["AuthStatus"],
    }),

    refreshUser: builder.mutation<void, void>({
      queryFn: async (_, { dispatch }) => {
        const puter = getPuter();
        if (!puter) {
          return { error: "Puter.js not available" };
        }

        try {
          const user = await puter.auth.getUser();
          dispatch(setUser({ user }));
          return { data: undefined };
        } catch (err) {
          const msg =
            err instanceof Error ? err.message : "Failed to refresh user";
          return { error: msg };
        }
      },
    }),

    init: builder.mutation<void, void>({
      queryFn: async (_, { dispatch }) => {
        const puter = getPuter();
        if (puter) {
          dispatch(setPuter(true));
          dispatch(checkAuthStatus());
          return { data: undefined };
        }

        // Gói chờ puter vào Promise
        return await new Promise((resolve) => {
          const interval = setInterval(() => {
            if (getPuter()) {
              clearInterval(interval);
              clearTimeout(timeout);
              dispatch(setPuter(true));
              dispatch(checkAuthStatus());
              resolve({ data: undefined });
            }
          }, 100);

          const timeout = setTimeout(() => {
            clearInterval(interval);
            if (!getPuter()) {
              resolve({
                error: { message: "Puter.js failed to load within 10 seconds" },
              });
            }
          }, 10000);
        });
      },
      invalidatesTags: ["AuthStatus"],
    }),

    // File system endpoints
    fsWrite: builder.mutation<
      File | undefined,
      { path: string; data: string | File | Blob }
    >({
      queryFn: async ({ path, data }) => {
        const puter = getPuter();
        if (!puter) {
          return { error: "Puter.js not available" };
        }

        try {
          const result = await puter.fs.write(path, data);
          return { data: result };
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Write failed";
          return { error: msg };
        }
      },
    }),

    fsRead: builder.query<string, {path: string, isPdf?: boolean}>({
      queryFn: async ({path, isPdf = false}) => {
        const puter = getPuter();
        if (!puter) {
          return { error: "Puter.js not available" };
        }

        try {
          const result = await puter.fs.read(path);
          let url
          if (isPdf) {
            const pdfBlob = new Blob([result], { type: "application/pdf" });
            url = URL.createObjectURL(pdfBlob);
          } else {
            url = URL.createObjectURL(result)
          }
          return { data: url };
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Read failed";
          return { error: msg };
        }
      },
    }),

    fsReadir: builder.query<FSItem[], string>({
      queryFn: async (path) => {
        const puter = getPuter();
        if (!puter) {
          return { error: "Puter.js not available" };
        }

        try {
          const result = await puter.fs.readdir(path);
          return { data: result };
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Read failed";
          return { error: msg };
        }
      },
    }),

    fsUpload: builder.mutation<FSItem, File[] | Blob[]>({
      queryFn: async (files) => {
        const puter = getPuter();
        if (!puter) {
          return { error: "Puter.js not available" };
        }

        try {
          const result = await puter.fs.upload(files);
          return { data: result };
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Upload failed";
          return { error: msg };
        }
      },
    }),

    fsDelete: builder.mutation<void, string>({
      queryFn: async (path) => {
        const puter = getPuter();
        if (!puter) {
          return { error: "Puter.js not available" };
        }

        try {
          await puter.fs.delete(path);
          return { data: undefined };
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Delete failed";
          return { error: msg };
        }
      },
    }),

    // AI endpoints
    aiChat: builder.query<
      AIResponse,
      {
        prompt: string | ChatMessage[];
        imageURL?: string | PuterChatOptions;
        testMode?: boolean;
        options?: PuterChatOptions;
      }
    >({
      queryFn: async ({ prompt, imageURL, testMode, options }) => {
        const puter = getPuter();
        if (!puter) {
          return { error: "Puter.js not available" };
        }

        try {
          const result = (await puter.ai.chat(
            prompt,
            imageURL,
            testMode,
            options
          )) as AIResponse;
          return { data: result };
        } catch (err) {
          const msg = err instanceof Error ? err.message : "AI chat failed";
          return { error: msg };
        }
      },
    }),

    aiFeedback: builder.mutation<AIResponse, { path: string; message: string }>(
      {
        queryFn: async ({ path, message }) => {
          const puter = getPuter();
          if (!puter) {
            return { error: "Puter.js not available" };
          }

          try {
            const result = (await puter.ai.chat(
              [
                {
                  role: "user",
                  content: [
                    {
                      type: "file",
                      puter_path: path,
                    },
                    {
                      type: "text",
                      text: message,
                    },
                  ],
                },
              ],
              { model: "claude-sonnet-4" }
            )) as AIResponse;
            return { data: result };
          } catch (err) {
            const msg =
              err instanceof Error ? err.message : "AI feedback failed";
            return { error: msg };
          }
        },
      }
    ),

    aiImg2txt: builder.query<
      string,
      { image: string | File | Blob; testMode?: boolean }
    >({
      queryFn: async ({ image, testMode }) => {
        const puter = getPuter();
        if (!puter) {
          return { error: "Puter.js not available" };
        }

        try {
          const result = await puter.ai.img2txt(image, testMode);
          return { data: result };
        } catch (err) {
          const msg =
            err instanceof Error ? err.message : "Image to text failed";
          return { error: msg };
        }
      },
    }),

    // Key-Value store endpoints
    kvGet: builder.query<string | null, string>({
      queryFn: async (key) => {
        const puter = getPuter();
        if (!puter) {
          return { error: "Puter.js not available" };
        }

        try {
          const result = await puter.kv.get(key);
          return { data: result };
        } catch (err) {
          const msg = err instanceof Error ? err.message : "KV get failed";
          return { error: msg };
        }
      },
    }),

    kvSet: builder.mutation<boolean, { key: string; value: string }>({
      queryFn: async ({ key, value }) => {
        const puter = getPuter();
        if (!puter) {
          return { error: "Puter.js not available" };
        }

        try {
          const result = await puter.kv.set(key, value);
          return { data: result };
        } catch (err) {
          const msg = err instanceof Error ? err.message : "KV set failed";
          return { error: msg };
        }
      },
    }),

    kvDelete: builder.mutation<boolean, string>({
      queryFn: async (key) => {
        const puter = getPuter();
        if (!puter) {
          return { error: "Puter.js not available" };
        }

        try {
          const result = await puter.kv.delete(key);
          return { data: result };
        } catch (err) {
          const msg = err instanceof Error ? err.message : "KV delete failed";
          return { error: msg };
        }
      },
    }),

    kvList: builder.query<
      string[] | KVItem[],
      { pattern: string; returnValues?: boolean }
    >({
      queryFn: async ({ pattern, returnValues = false }) => {
        const puter = getPuter();
        if (!puter) {
          return { error: "Puter.js not available" };
        }

        try {
          const result = await puter.kv.list(pattern, returnValues);
          return { data: result };
        } catch (err) {
          const msg = err instanceof Error ? err.message : "KV list failed";
          return { error: msg };
        }
      },
      providesTags: ["AuthStatus"],
    }),

    kvFlush: builder.mutation<boolean, void>({
      queryFn: async () => {
        const puter = getPuter();
        if (!puter) {
          return { error: "Puter.js not available" };
        }

        try {
          const result = await puter.kv.flush();
          return { data: result };
        } catch (err) {
          const msg = err instanceof Error ? err.message : "KV flush failed";
          return { error: msg };
        }
      },
    }),
  }),
});

// Export hooks
export const {
  // Auth hooks
  useSignInMutation,
  useSignOutMutation,
  useRefreshUserMutation,
  useInitMutation,

  // File system hooks
  useFsWriteMutation,
  useFsReadQuery,
  useFsUploadMutation,
  useFsDeleteMutation,
  useFsReadirQuery,

  // AI hooks
  useAiChatQuery,
  useAiFeedbackMutation,
  useAiImg2txtQuery,

  // KV hooks
  useKvGetQuery,
  useKvSetMutation,
  useKvDeleteMutation,
  useKvListQuery,
  useKvFlushMutation,
} = puterApiSlice;
