import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import * as forumService from '../services/forumService';

const ForumContext = createContext();

export const useForum = () => {
  const context = useContext(ForumContext);
  if (!context) {
    throw new Error('useForum must be used within a ForumProvider');
  }
  return context;
};

export const ForumProvider = ({ children }) => {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  // Filters and sorting
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState(forumService.SORT_OPTIONS.RECENT);
  const [searchQuery, setSearchQuery] = useState('');

  // Load threads
  const loadThreads = async (options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const fetchOptions = {
        category: selectedCategory,
        sortBy,
        searchQuery,
        ...options
      };
      const fetchedThreads = await forumService.getThreads(fetchOptions);
      setThreads(fetchedThreads);
    } catch (err) {
      console.error('Error loading threads:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load forum stats
  const loadStats = async () => {
    try {
      const forumStats = await forumService.getForumStats();
      setStats(forumStats);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  // Reload threads when filters change
  useEffect(() => {
    loadThreads();
  }, [selectedCategory, sortBy, searchQuery]);

  // Thread operations
  const createThread = async (threadData) => {
    try {
      const newThread = await forumService.createThread(threadData, user);
      setThreads(prev => [newThread, ...prev]);
      await loadStats(); // Refresh stats
      return newThread;
    } catch (err) {
      console.error('Error creating thread:', err);
      throw err;
    }
  };

  const updateThread = async (threadId, updates) => {
    try {
      await forumService.updateThread(threadId, updates);
      setThreads(prev =>
        prev.map(t => (t.id === threadId ? { ...t, ...updates } : t))
      );
    } catch (err) {
      console.error('Error updating thread:', err);
      throw err;
    }
  };

  const deleteThread = async (threadId) => {
    try {
      await forumService.deleteThread(threadId);
      setThreads(prev => prev.filter(t => t.id !== threadId));
      await loadStats(); // Refresh stats
    } catch (err) {
      console.error('Error deleting thread:', err);
      throw err;
    }
  };

  const togglePinThread = async (threadId, isPinned) => {
    try {
      await forumService.togglePinThread(threadId, isPinned);
      setThreads(prev =>
        prev.map(t => (t.id === threadId ? { ...t, isPinned } : t))
      );
      // Re-sort to show pinned threads first
      await loadThreads();
    } catch (err) {
      console.error('Error toggling pin:', err);
      throw err;
    }
  };

  const toggleLockThread = async (threadId, isLocked) => {
    try {
      await forumService.toggleLockThread(threadId, isLocked);
      setThreads(prev =>
        prev.map(t => (t.id === threadId ? { ...t, isLocked } : t))
      );
    } catch (err) {
      console.error('Error toggling lock:', err);
      throw err;
    }
  };

  // Reply operations
  const createReply = async (threadId, replyData) => {
    try {
      const newReply = await forumService.createReply(threadId, replyData, user);
      // Update thread reply count in local state
      setThreads(prev =>
        prev.map(t =>
          t.id === threadId
            ? { ...t, replyCount: (t.replyCount || 0) + 1 }
            : t
        )
      );
      return newReply;
    } catch (err) {
      console.error('Error creating reply:', err);
      throw err;
    }
  };

  const deleteReply = async (threadId, replyId) => {
    try {
      await forumService.deleteReply(threadId, replyId);
      // Update thread reply count in local state
      setThreads(prev =>
        prev.map(t =>
          t.id === threadId
            ? { ...t, replyCount: Math.max((t.replyCount || 1) - 1, 0) }
            : t
        )
      );
    } catch (err) {
      console.error('Error deleting reply:', err);
      throw err;
    }
  };

  // Voting
  const voteOnThread = async (threadId, voteValue) => {
    try {
      const result = await forumService.voteOnThread(threadId, user.uid, voteValue);
      // Refresh the specific thread to get updated counts
      await loadThreads();
      return result;
    } catch (err) {
      console.error('Error voting on thread:', err);
      throw err;
    }
  };

  const voteOnReply = async (threadId, replyId, voteValue) => {
    try {
      return await forumService.voteOnReply(threadId, replyId, user.uid, voteValue);
    } catch (err) {
      console.error('Error voting on reply:', err);
      throw err;
    }
  };

  // Check if user is admin
  const isAdmin = () => {
    // You can implement your admin check logic here
    // For now, checking if user has admin role or specific UID
    return user?.role === 'admin' || user?.uid === 't2OotVn0rwd7EC56ii8DvkgMTdH2';
  };

  const value = {
    // State
    threads,
    loading,
    error,
    stats,
    selectedCategory,
    sortBy,
    searchQuery,

    // Filters
    setSelectedCategory,
    setSortBy,
    setSearchQuery,

    // Thread operations
    createThread,
    updateThread,
    deleteThread,
    togglePinThread,
    toggleLockThread,
    loadThreads,

    // Reply operations
    createReply,
    deleteReply,

    // Voting
    voteOnThread,
    voteOnReply,

    // Stats
    loadStats,

    // Utilities
    isAdmin,

    // Constants
    CATEGORIES: forumService.FORUM_CATEGORIES,
    CATEGORY_LABELS: forumService.CATEGORY_LABELS,
    CATEGORY_COLORS: forumService.CATEGORY_COLORS,
    SORT_OPTIONS: forumService.SORT_OPTIONS
  };

  return (
    <ForumContext.Provider value={value}>
      {children}
    </ForumContext.Provider>
  );
};
