# BESTIES Forum Database Schema

## Collections Structure

### threads (root collection)
```javascript
{
  id: "auto-generated",
  title: string,
  content: string, // markdown/rich text
  authorId: string,
  authorName: string,
  authorAvatar: string,
  category: "general" | "feature-request" | "bug-report" | "help" | "announcement",
  tags: string[],
  isPinned: boolean,
  isLocked: boolean,
  viewCount: number,
  replyCount: number,
  voteCount: number, // upvotes - downvotes
  upvotes: number,
  downvotes: number,
  lastActivityAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp,
  images: string[] // Firebase Storage URLs
}
```

### threads/{threadId}/replies (subcollection)
```javascript
{
  id: "auto-generated",
  threadId: string,
  content: string,
  authorId: string,
  authorName: string,
  authorAvatar: string,
  voteCount: number,
  upvotes: number,
  downvotes: number,
  isAccepted: boolean, // for marking solution
  createdAt: timestamp,
  updatedAt: timestamp,
  images: string[]
}
```

### threads/{threadId}/votes (subcollection)
```javascript
{
  id: "{userId}", // document ID is the user's ID
  userId: string,
  vote: 1 | -1, // 1 for upvote, -1 for downvote
  createdAt: timestamp
}
```

### threads/{threadId}/replies/{replyId}/votes (subcollection)
```javascript
{
  id: "{userId}",
  userId: string,
  vote: 1 | -1,
  createdAt: timestamp
}
```

## Category Definitions

- **general**: General discussion about BESTIES
- **feature-request**: User suggestions and feature voting
- **bug-report**: Bug reports and issues
- **help**: User help and support questions
- **announcement**: Official announcements (admin only)

## Indexes Required

1. **threads**: (category, isPinned DESC, lastActivityAt DESC)
2. **threads**: (category, voteCount DESC)
3. **threads/*/replies**: (threadId, createdAt ASC)
4. **threads/*/replies**: (threadId, voteCount DESC)

## Security Considerations

- Only authenticated users can create threads/replies
- Only thread/reply authors can edit their own content
- Only admins can pin/lock threads or post announcements
- Everyone can read threads/replies
- Users can only vote once per thread/reply
