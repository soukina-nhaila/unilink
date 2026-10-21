import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { NotificationState } from "@/types";
import { notificationsAPI } from "@/lib/api";

const initialState: NotificationState = { notifications: [], unreadCount: 0, isLoading: false };

export const fetchNotifications = createAsyncThunk("notifications/fetch", async (_, { rejectWithValue }) => {
  try {
    const res = await notificationsAPI.getAll();
    return res.data as { notifications: any[]; unreadCount: number };
  } catch (e: any) { return rejectWithValue("Erreur de chargement"); }
});

export const markAllNotificationsRead = createAsyncThunk("notifications/markAllRead", async (_, { rejectWithValue }) => {
  try { await notificationsAPI.markAllRead(); }
  catch (e: any) { return rejectWithValue("Erreur"); }
});

export const markNotificationRead = createAsyncThunk("notifications/markOneRead", async (id: string, { rejectWithValue }) => {
  try { await notificationsAPI.markRead(id); return id; }
  catch (e: any) { return rejectWithValue("Erreur"); }
});

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    markAllRead(state) { state.notifications.forEach(n => { n.read = true; }); state.unreadCount = 0; },
    markOneRead(state, action: PayloadAction<string>) {
      const n = state.notifications.find(x => x.id === action.payload);
      if (n && !n.read) { n.read = true; state.unreadCount = Math.max(0, state.unreadCount - 1); }
    },
  },
  extraReducers: b => {
    b.addCase(fetchNotifications.pending,   s => { s.isLoading = true; })
     .addCase(fetchNotifications.fulfilled, (s, a) => { s.isLoading = false; s.notifications = a.payload.notifications; s.unreadCount = a.payload.unreadCount; })
     .addCase(fetchNotifications.rejected,  s => { s.isLoading = false; })
     .addCase(markAllNotificationsRead.fulfilled, s => { s.notifications.forEach(n => { n.read = true; }); s.unreadCount = 0; })
     .addCase(markNotificationRead.fulfilled, (s, a) => {
       const n = s.notifications.find(x => x.id === a.payload);
       if (n && !n.read) { n.read = true; s.unreadCount = Math.max(0, s.unreadCount - 1); }
     });
  },
});

export const { markAllRead, markOneRead } = notificationsSlice.actions;
export default notificationsSlice.reducer;
