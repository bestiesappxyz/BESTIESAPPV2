import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  increment,
  serverTimestamp,
  writeBatch,
  collectionGroup
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';

// Categories
export const FORUM_CATEGORIES = {
  GENERAL: 'general',
  FEATURE_REQUEST: 'feature-request',
  BUG_REPORT: 'bug-report',
  HELP: 'help',
  ANNOUNCEMENT: 'announcement'
};

export const CATEGORY_LABELS = {
  [FORUM_CATEGORIES.GENERAL]: 'General Discussion',
  [FORUM_CATEGORIES.FEATURE_REQUEST]: 'Feature Requests',
  [FORUM_CATEGORIES.BUG_REPORT]: 'Bug Reports',
  [FORUM_CATEGORIES.HELP]: 'Help & Support',
  [FORUM_CATEGORIES.ANNOUNCEMENT]: 'Announcements'
};

export const CATEGORY_COLORS = {
  [FORUM_CATEGORIES.GENERAL]: 'bg-purple-500',
  [FORUM_CATEGORIES.FEATURE_REQUEST]: 'bg-pink-500',
  [FORUM_CATEGORIES.BUG_REPORT]: 'bg-red-500',
  [FORUM_CATEGORIES.HELP]: 'bg-blue-500',
  [FORUM_CATEGORIES.ANNOUNCEMENT]: 'bg-yellow-500'
};

// Sort options
export const SORT_OPTIONS = {
  RECENT: 'recent',
  TOP: 'top',
  TRENDING: 'trending'
};

// ==================== THREADS ====================

/**
 * Create a new forum thread
 */
export const createThread = async (threadData, user) => {
  try {
    const thread = {
      title: threadData.title.trim(),
      content: threadData.content.trim(),
      authorId: user.uid,
      authorName: user.displayName || 'Anonymous',
      authorAvatar: user.photoURL || null,
      category: threadData.category,
      tags: threadData.tags || [],
      isPinned: false,
      isLocked: false,
      viewCount: 0,
      replyCount: 0,
      voteCount: 0,
      upvotes: 0,
      downvotes: 0,
      images: [],
      lastActivityAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Upload images if provided
    if (threadData.images && threadData.images.length > 0) {
      thread.images = await uploadThreadImages(threadData.images, user.uid);
    }

    const docRef = await addDoc(collection(db, 'threads'), thread);
    return { id: docRef.id, ...thread };
  } catch (error) {
    console.error('Error creating thread:', error);
    throw error;
  }
};

/**
 * Get threads with filtering and sorting
 */
export const getThreads = async (options = {}) => {
  try {
    const {
      category = null,
      sortBy = SORT_OPTIONS.RECENT,
      limitCount = 20,
      searchQuery = null
    } = options;

    let q = collection(db, 'threads');
    const constraints = [];

    // Filter by category
    if (category && category !== 'all') {
      constraints.push(where('category', '==', category));
    }

    // Sort options
    if (sortBy === SORT_OPTIONS.RECENT) {
      constraints.push(orderBy('isPinned', 'desc'));
      constraints.push(orderBy('lastActivityAt', 'desc'));
    } else if (sortBy === SORT_OPTIONS.TOP) {
      constraints.push(orderBy('voteCount', 'desc'));
    }

    constraints.push(limit(limitCount));

    q = query(q, ...constraints);
    const snapshot = await getDocs(q);

    let threads = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Client-side search if needed
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      threads = threads.filter(thread =>
        thread.title.toLowerCase().includes(searchLower) ||
        thread.content.toLowerCase().includes(searchLower)
      );
    }

    return threads;
  } catch (error) {
    console.error('Error getting threads:', error);
    throw error;
  }
};

/**
 * Get a single thread by ID
 */
export const getThread = async (threadId) => {
  try {
    const docRef = doc(db, 'threads', threadId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Thread not found');
    }

    // Increment view count
    await updateDoc(docRef, {
      viewCount: increment(1)
    });

    return {
      id: docSnap.id,
      ...docSnap.data()
    };
  } catch (error) {
    console.error('Error getting thread:', error);
    throw error;
  }
};

/**
 * Update a thread
 */
export const updateThread = async (threadId, updates) => {
  try {
    const docRef = doc(db, 'threads', threadId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating thread:', error);
    throw error;
  }
};

/**
 * Delete a thread
 */
export const deleteThread = async (threadId) => {
  try {
    // Get thread data first to delete images
    const threadDoc = await getDoc(doc(db, 'threads', threadId));
    if (threadDoc.exists()) {
      const thread = threadDoc.data();

      // Delete images from storage
      if (thread.images && thread.images.length > 0) {
        await Promise.all(
          thread.images.map(imageUrl => deleteImageFromUrl(imageUrl))
        );
      }

      // Delete all replies and their votes
      const repliesSnapshot = await getDocs(
        collection(db, 'threads', threadId, 'replies')
      );

      const batch = writeBatch(db);
      repliesSnapshot.docs.forEach(replyDoc => {
        batch.delete(replyDoc.ref);
      });
      await batch.commit();

      // Delete all thread votes
      const votesSnapshot = await getDocs(
        collection(db, 'threads', threadId, 'votes')
      );

      const votesBatch = writeBatch(db);
      votesSnapshot.docs.forEach(voteDoc => {
        votesBatch.delete(voteDoc.ref);
      });
      await votesBatch.commit();
    }

    // Delete the thread
    await deleteDoc(doc(db, 'threads', threadId));
  } catch (error) {
    console.error('Error deleting thread:', error);
    throw error;
  }
};

/**
 * Pin/unpin a thread (admin only)
 */
export const togglePinThread = async (threadId, isPinned) => {
  try {
    await updateDoc(doc(db, 'threads', threadId), {
      isPinned,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error toggling pin:', error);
    throw error;
  }
};

/**
 * Lock/unlock a thread (admin only)
 */
export const toggleLockThread = async (threadId, isLocked) => {
  try {
    await updateDoc(doc(db, 'threads', threadId), {
      isLocked,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error toggling lock:', error);
    throw error;
  }
};

// ==================== REPLIES ====================

/**
 * Create a reply to a thread
 */
export const createReply = async (threadId, replyData, user) => {
  try {
    const reply = {
      threadId,
      content: replyData.content.trim(),
      authorId: user.uid,
      authorName: user.displayName || 'Anonymous',
      authorAvatar: user.photoURL || null,
      voteCount: 0,
      upvotes: 0,
      downvotes: 0,
      isAccepted: false,
      images: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Upload images if provided
    if (replyData.images && replyData.images.length > 0) {
      reply.images = await uploadReplyImages(threadId, replyData.images, user.uid);
    }

    const docRef = await addDoc(
      collection(db, 'threads', threadId, 'replies'),
      reply
    );

    // Update thread reply count and last activity
    await updateDoc(doc(db, 'threads', threadId), {
      replyCount: increment(1),
      lastActivityAt: serverTimestamp()
    });

    return { id: docRef.id, ...reply };
  } catch (error) {
    console.error('Error creating reply:', error);
    throw error;
  }
};

/**
 * Get replies for a thread
 */
export const getReplies = async (threadId, sortBy = 'oldest') => {
  try {
    let q = collection(db, 'threads', threadId, 'replies');

    if (sortBy === 'oldest') {
      q = query(q, orderBy('createdAt', 'asc'));
    } else if (sortBy === 'newest') {
      q = query(q, orderBy('createdAt', 'desc'));
    } else if (sortBy === 'top') {
      q = query(q, orderBy('voteCount', 'desc'));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting replies:', error);
    throw error;
  }
};

/**
 * Update a reply
 */
export const updateReply = async (threadId, replyId, updates) => {
  try {
    await updateDoc(doc(db, 'threads', threadId, 'replies', replyId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating reply:', error);
    throw error;
  }
};

/**
 * Delete a reply
 */
export const deleteReply = async (threadId, replyId) => {
  try {
    // Get reply data first to delete images
    const replyDoc = await getDoc(doc(db, 'threads', threadId, 'replies', replyId));
    if (replyDoc.exists()) {
      const reply = replyDoc.data();

      // Delete images from storage
      if (reply.images && reply.images.length > 0) {
        await Promise.all(
          reply.images.map(imageUrl => deleteImageFromUrl(imageUrl))
        );
      }
    }

    await deleteDoc(doc(db, 'threads', threadId, 'replies', replyId));

    // Update thread reply count
    await updateDoc(doc(db, 'threads', threadId), {
      replyCount: increment(-1)
    });
  } catch (error) {
    console.error('Error deleting reply:', error);
    throw error;
  }
};

/**
 * Mark reply as accepted solution (thread author only)
 */
export const markReplyAsAccepted = async (threadId, replyId, isAccepted) => {
  try {
    await updateDoc(doc(db, 'threads', threadId, 'replies', replyId), {
      isAccepted,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error marking reply as accepted:', error);
    throw error;
  }
};

// ==================== VOTING ====================

/**
 * Vote on a thread
 */
export const voteOnThread = async (threadId, userId, voteValue) => {
  try {
    const voteRef = doc(db, 'threads', threadId, 'votes', userId);
    const voteDoc = await getDoc(voteRef);
    const threadRef = doc(db, 'threads', threadId);

    if (voteDoc.exists()) {
      const existingVote = voteDoc.data().vote;

      if (existingVote === voteValue) {
        // Remove vote
        await deleteDoc(voteRef);
        await updateDoc(threadRef, {
          voteCount: increment(-voteValue),
          [voteValue === 1 ? 'upvotes' : 'downvotes']: increment(-1)
        });
        return null;
      } else {
        // Change vote
        await updateDoc(voteRef, { vote: voteValue });
        await updateDoc(threadRef, {
          voteCount: increment(voteValue * 2), // Remove old vote and add new
          upvotes: increment(voteValue === 1 ? 1 : -1),
          downvotes: increment(voteValue === -1 ? 1 : -1)
        });
        return voteValue;
      }
    } else {
      // New vote
      await addDoc(voteRef, {
        userId,
        vote: voteValue,
        createdAt: serverTimestamp()
      });
      await updateDoc(threadRef, {
        voteCount: increment(voteValue),
        [voteValue === 1 ? 'upvotes' : 'downvotes']: increment(1)
      });
      return voteValue;
    }
  } catch (error) {
    console.error('Error voting on thread:', error);
    throw error;
  }
};

/**
 * Vote on a reply
 */
export const voteOnReply = async (threadId, replyId, userId, voteValue) => {
  try {
    const voteRef = doc(db, 'threads', threadId, 'replies', replyId, 'votes', userId);
    const voteDoc = await getDoc(voteRef);
    const replyRef = doc(db, 'threads', threadId, 'replies', replyId);

    if (voteDoc.exists()) {
      const existingVote = voteDoc.data().vote;

      if (existingVote === voteValue) {
        // Remove vote
        await deleteDoc(voteRef);
        await updateDoc(replyRef, {
          voteCount: increment(-voteValue),
          [voteValue === 1 ? 'upvotes' : 'downvotes']: increment(-1)
        });
        return null;
      } else {
        // Change vote
        await updateDoc(voteRef, { vote: voteValue });
        await updateDoc(replyRef, {
          voteCount: increment(voteValue * 2),
          upvotes: increment(voteValue === 1 ? 1 : -1),
          downvotes: increment(voteValue === -1 ? 1 : -1)
        });
        return voteValue;
      }
    } else {
      // New vote
      await addDoc(voteRef, {
        userId,
        vote: voteValue,
        createdAt: serverTimestamp()
      });
      await updateDoc(replyRef, {
        voteCount: increment(voteValue),
        [voteValue === 1 ? 'upvotes' : 'downvotes']: increment(1)
      });
      return voteValue;
    }
  } catch (error) {
    console.error('Error voting on reply:', error);
    throw error;
  }
};

/**
 * Get user's vote on a thread
 */
export const getUserThreadVote = async (threadId, userId) => {
  try {
    const voteDoc = await getDoc(doc(db, 'threads', threadId, 'votes', userId));
    return voteDoc.exists() ? voteDoc.data().vote : null;
  } catch (error) {
    console.error('Error getting user vote:', error);
    return null;
  }
};

/**
 * Get user's vote on a reply
 */
export const getUserReplyVote = async (threadId, replyId, userId) => {
  try {
    const voteDoc = await getDoc(
      doc(db, 'threads', threadId, 'replies', replyId, 'votes', userId)
    );
    return voteDoc.exists() ? voteDoc.data().vote : null;
  } catch (error) {
    console.error('Error getting user reply vote:', error);
    return null;
  }
};

// ==================== IMAGE UPLOADS ====================

/**
 * Upload thread images to Firebase Storage
 */
const uploadThreadImages = async (images, userId) => {
  const uploadPromises = images.map(async (image, index) => {
    const timestamp = Date.now();
    const fileName = `forum/threads/${userId}/${timestamp}_${index}`;
    const storageRef = ref(storage, fileName);

    await uploadBytes(storageRef, image);
    return await getDownloadURL(storageRef);
  });

  return await Promise.all(uploadPromises);
};

/**
 * Upload reply images to Firebase Storage
 */
const uploadReplyImages = async (threadId, images, userId) => {
  const uploadPromises = images.map(async (image, index) => {
    const timestamp = Date.now();
    const fileName = `forum/replies/${threadId}/${userId}/${timestamp}_${index}`;
    const storageRef = ref(storage, fileName);

    await uploadBytes(storageRef, image);
    return await getDownloadURL(storageRef);
  });

  return await Promise.all(uploadPromises);
};

/**
 * Delete image from Firebase Storage using URL
 */
const deleteImageFromUrl = async (imageUrl) => {
  try {
    const imagePath = imageUrl.split('/o/')[1].split('?')[0];
    const decodedPath = decodeURIComponent(imagePath);
    const imageRef = ref(storage, decodedPath);
    await deleteObject(imageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
  }
};

// ==================== STATISTICS ====================

/**
 * Get forum statistics
 */
export const getForumStats = async () => {
  try {
    const threadsSnapshot = await getDocs(collection(db, 'threads'));
    const threads = threadsSnapshot.docs.map(doc => doc.data());

    const totalThreads = threads.length;
    const totalReplies = threads.reduce((sum, t) => sum + (t.replyCount || 0), 0);
    const totalViews = threads.reduce((sum, t) => sum + (t.viewCount || 0), 0);

    // Get category breakdown
    const categoryStats = {};
    Object.values(FORUM_CATEGORIES).forEach(cat => {
      categoryStats[cat] = threads.filter(t => t.category === cat).length;
    });

    return {
      totalThreads,
      totalReplies,
      totalViews,
      categoryStats
    };
  } catch (error) {
    console.error('Error getting forum stats:', error);
    throw error;
  }
};
