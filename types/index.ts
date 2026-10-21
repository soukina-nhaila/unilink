export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  coverImage?: string;
  department: string;
  level: string;
  bio?: string;
  university: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowing?: boolean;
  isOnline?: boolean;
  createdAt: string;
  notificationPrefs?: {
    newFollowers: boolean;
    likes: boolean;
    comments: boolean;
    mentions: boolean;
    directMessages: boolean;
    weeklyDigest: boolean;
  };
  privacySettings?: {
    privateAccount: boolean;
    showEmail: boolean;
    allowMessages: boolean;
    appearInSearch: boolean;
  };
  theme?: string;
  language?: string;
}


export interface Post {
  id: string;
  author: User;
  content: string;
  images?: string[];
  tags: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked: boolean;
  isSaved: boolean;
  isTrending?: boolean;
  createdAt: string;
  location?: string;

  poll?: {
    question: string;
    options: {
      id: string;
      text: string;
      votes: number;
    }[];
    expiresAt?: string;
    totalVotes: number;
  };
}

export interface Comment {
  id: string;
  author: User;
  postId: string;
  content: string;
  likesCount: number;
  isLiked: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: "like" | "comment" | "follow" | "mention" | "share";
  actor: User;
  postId?: string;
  read: boolean;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participant: User;
  lastMessage: Message;
  unreadCount: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface FeedState {
  posts: Post[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
}

export type FeedTab = "forYou" | "following" | "popular";
