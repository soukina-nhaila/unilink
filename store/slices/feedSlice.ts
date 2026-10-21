import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { FeedState, Post } from "@/types";
import { postsAPI } from "@/lib/api";

const initialState: FeedState = {
    posts: [], isLoading: false, error: null, hasMore: true, page: 1,
};

export const fetchFeed = createAsyncThunk(
    "feed/fetch",
    async ({ tab, page }: { tab: string; page: number }, { rejectWithValue }) => {
        try {
            const res = await postsAPI.getFeed(tab, page);
            return res.data as { posts: Post[]; hasMore: boolean; page: number };
        } catch (e: any) {
            return rejectWithValue(e.response?.data?.message ?? "Erreur de chargement");
        }
    }
);

interface CreatePostData {
    content: string;
    tags: string[];
    images: string[];
    location?: string;
    poll?: any;
}

export const createPost = createAsyncThunk(
    "feed/createPost",
    async (data: CreatePostData, { rejectWithValue }) => {
        try {
            const res = await postsAPI.create(data);
            return res.data as Post;
        } catch (e: any) {
            return rejectWithValue(e.response?.data?.message ?? "Erreur lors de la publication");
        }
    }
);

export const toggleLike = createAsyncThunk(
    "feed/toggleLike",
    async ({ postId, isLiked }: { postId: string; isLiked: boolean }, { rejectWithValue }) => {
        try {
            if (isLiked) await postsAPI.unlike(postId);
            else         await postsAPI.like(postId);
            return { postId, isLiked: !isLiked };
        } catch (e: any) {
            return rejectWithValue("Erreur like");
        }
    }
);

export const toggleSaveThunk = createAsyncThunk(
    "feed/toggleSave",
    async ({ postId, isSaved }: { postId: string; isSaved: boolean }, { rejectWithValue }) => {
        try {
            if (isSaved) await postsAPI.unsave(postId);
            else         await postsAPI.save(postId);
            return { postId, isSaved: !isSaved };
        } catch (e: any) {
            return rejectWithValue("Erreur save");
        }
    }
);

export const deletePost = createAsyncThunk(
    "feed/deletePost",
    async (postId: string, { rejectWithValue }) => {
        try {
            await postsAPI.delete(postId);
            return postId;
        } catch (e: any) {
            return rejectWithValue(e.response?.data?.message ?? "Erreur de suppression");
        }
    }
);

const feedSlice = createSlice({
    name: "feed",
    initialState,
    reducers: {
        toggleSave(state, action: PayloadAction<string>) {
            const post = state.posts.find(p => p.id === action.payload);
            if (post) post.isSaved = !post.isSaved;
        },
        resetFeed(state) {
            state.posts = [];
            state.page  = 1;
            state.hasMore = true;
            state.error = null;
        },
    },
    extraReducers: b => {
        b.addCase(fetchFeed.pending, s => { s.isLoading = true; s.error = null; })
            .addCase(fetchFeed.fulfilled, (s, action) => {
                s.isLoading = false;
                // On utilise action.meta.arg.page pour détecter page 1 (reset)
                if (action.meta.arg.page === 1) {
                    s.posts = action.payload.posts;
                    s.page  = 2;
                } else {
                    s.posts.push(...action.payload.posts);
                    s.page += 1;
                }
                s.hasMore = action.payload.hasMore;
            })
            .addCase(fetchFeed.rejected, (s, a) => { s.isLoading = false; s.error = a.payload as string; })

            .addCase(createPost.fulfilled, (s, a) => { s.posts.unshift(a.payload); })

            .addCase(toggleLike.fulfilled, (s, a) => {
                const p = s.posts.find(x => x.id === a.payload.postId);
                if (p) { p.isLiked = a.payload.isLiked; p.likesCount += a.payload.isLiked ? 1 : -1; }
            })

            .addCase(toggleSaveThunk.fulfilled, (s, a) => {
                const p = s.posts.find(x => x.id === a.payload.postId);
                if (p) p.isSaved = a.payload.isSaved;
            })

            .addCase(deletePost.fulfilled, (s, a) => {
                s.posts = s.posts.filter(p => p.id !== a.payload);
            });
    },
});

export const { toggleSave, resetFeed } = feedSlice.actions;
export default feedSlice.reducer;