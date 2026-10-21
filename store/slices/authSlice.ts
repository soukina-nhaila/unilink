import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { AuthState, User } from "@/types";
import { authAPI } from "@/lib/api";

const initialState: AuthState = {
  user: null, token: null,
  isAuthenticated: false, isLoading: false, error: null,
};

export const registerUser = createAsyncThunk(
  "auth/register",
  async (data: { firstName:string; lastName:string; email:string; password:string; department:string; level:string }, { rejectWithValue }) => {
    try {
      const res = await authAPI.register(data);
      if (typeof window !== "undefined")
        localStorage.setItem("unilink_token", res.data.token);
      return res.data as { token: string; user: User };
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message ?? "Erreur d'inscription");
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (data: { email:string; password:string }, { rejectWithValue }) => {
    try {
      const res = await authAPI.login(data);
      if (typeof window !== "undefined")
        localStorage.setItem("unilink_token", res.data.token);
      return res.data as { token: string; user: User };
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message ?? "Email ou mot de passe incorrect");
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      const res = await authAPI.me();
      return res.data as User;
    } catch (e: any) {
      return rejectWithValue("Session expirée");
    }
  }
);

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (data: { firstName?:string; lastName?:string; bio?:string; department?:string; level?:string }, { rejectWithValue }) => {
    try {
      const res = await authAPI.updateProfile(data);
      return res.data as User;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message ?? "Erreur de mise à jour");
    }
  }
);
export const updateSettings = createAsyncThunk(
    "auth/updateSettings",
    async (data: {
        notificationPrefs?: Partial<User["notificationPrefs"]>;
        privacySettings?: Partial<User["privacySettings"]>;
        theme?: string;
        language?: string;
    }, { rejectWithValue }) => {
        try {
            const res = await authAPI.updateSettings(data);
            return res.data as User;
        } catch (e: any) {
            return rejectWithValue(e.response?.data?.message ?? "Erreur de mise à jour");
        }
    }
);

export const deleteAccount = createAsyncThunk(
    "auth/deleteAccount",
    async (_, { rejectWithValue }) => {
        try {
            await authAPI.deleteAccount();
            if (typeof window !== "undefined") localStorage.removeItem("unilink_token");
        } catch (e: any) {
            return rejectWithValue("Erreur lors de la suppression");
        }
    }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null; state.token = null; state.isAuthenticated = false;
      if (typeof window !== "undefined") localStorage.removeItem("unilink_token");
    },
    setToken(state, action: PayloadAction<string>) {
      state.token = action.payload; state.isAuthenticated = true;
    },
    clearError(state) { state.error = null; },
  },
  extraReducers: (b) => {
    const pending  = (s: AuthState) => { s.isLoading = true; s.error = null; };
    const rejected = (s: AuthState, a: any) => { s.isLoading = false; s.error = a.payload as string; };

    b.addCase(registerUser.pending, pending)
     .addCase(registerUser.fulfilled, (s, a) => { s.isLoading=false; s.user=a.payload.user; s.token=a.payload.token; s.isAuthenticated=true; })
     .addCase(registerUser.rejected, rejected)

     .addCase(loginUser.pending, pending)
     .addCase(loginUser.fulfilled, (s, a) => { s.isLoading=false; s.user=a.payload.user; s.token=a.payload.token; s.isAuthenticated=true; })
     .addCase(loginUser.rejected, rejected)

     .addCase(fetchCurrentUser.pending, (s) => { s.isLoading=true; })
     .addCase(fetchCurrentUser.fulfilled, (s, a) => { s.isLoading=false; s.user=a.payload; s.isAuthenticated=true; })
     .addCase(fetchCurrentUser.rejected, (s) => { s.isLoading=false; })

     .addCase(updateProfile.fulfilled, (s, a) => { s.user = a.payload; })
     .addCase(updateSettings.fulfilled, (s, a) => { s.user = a.payload; })
     .addCase(deleteAccount.fulfilled,  (s)    => {
              s.user = null; s.token = null; s.isAuthenticated = false;
          });
  },
});

export const { logout, setToken, clearError } = authSlice.actions;
export default authSlice.reducer;
