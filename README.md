# Blog REST API - Personalized Feed System

## 🚀 Features
- **Smart Feed Algorithm** - Prioritizes friends/followers → interacted users → discovery
- **Interest Tracking** - Learns user preferences from likes/comments
- **Real-time Notifications** - Like, comment, follow alerts
- **Redis Caching** - High-performance feed delivery
- **Scalable Architecture** - Optimized for millions of users

## 📊 Feed Scoring
```
Score = (Priority × 1000) + (Engagement × 10) + Recency

Priority: Friends/Following (3) > Interacted (2) > Random (1)
Engagement: Likes + (Comments × 2)
```

## 🔧 Setup

### Database Indexes
```bash
db.posts.createIndex({ author: 1, createdAt: -1 })
db.users.createIndex({ friends: 1, following: 1 })
db.notifications.createIndex({ recipient: 1, createdAt: -1 })
```

## 📡 API Endpoints

### Feed
```http
GET /api/v1/feed/personalized?page=1&limit=10
Authorization: Bearer {token}
```

### Notifications
```http
GET /api/v1/notifications?unreadOnly=true
PATCH /api/v1/notifications/mark-read
DELETE /api/v1/notifications/:id
```

## 🏗️ Architecture

### New Models
- `Notification-model.ts` - Notification schema with recipient/sender
- Updated `user-model.ts` - Added `interactedWith` tracking

### Services
- `feed.service.ts` - Personalized feed with scoring algorithm
- `notification.service.ts` - Notification management

### Interaction Tracking
- View: +1 score
- Like: +5 score  
- Comment: +10 score

## ⚡ Performance
- Feed cached for 60s
- Aggregation pipeline for single-query results
- Compound indexes on hot paths
- Duplicate notification prevention (1hr window)

## 🔐 Privacy
- Respects blocked users
- No self-notifications
- User-specific feed isolation

---

