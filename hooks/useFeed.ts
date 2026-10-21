"use client";
import { useCallback } from "react";
import { useAppSelector } from "./useAppSelector";
import { useAppDispatch } from "./useAppDispatch";
import { fetchFeed, toggleLike, toggleSave, resetFeed, createPost } from "@/store/slices/feedSlice";
import { FeedTab } from "@/types";

export function useFeed() {
  const dispatch = useAppDispatch();
  const { posts, isLoading, error, hasMore, page } = useAppSelector(s => s.feed);

  const loadFeed = useCallback((tab: FeedTab, reset = false) => {
    if (reset) {
      dispatch(resetFeed());
      dispatch(fetchFeed({ tab, page: 1 }));
    } else {
      dispatch(fetchFeed({ tab, page }));
    }
  }, [dispatch, page]);

  const handleLike = useCallback((postId: string, isLiked: boolean) => {
    dispatch(toggleLike({ postId, isLiked }));
  }, [dispatch]);

  const handleSave = useCallback((postId: string) => {
    dispatch(toggleSave(postId));
  }, [dispatch]);

  interface CreatePostData {
    content: string;
    tags: string[];
    images: string[];
    location?: string;
    poll?: any;
  }

  const handleCreate = useCallback((data: CreatePostData) => {
    return dispatch(createPost(data));
  }, [dispatch]);

  return { posts, isLoading, error, hasMore, loadFeed, handleLike, handleSave, handleCreate };
}