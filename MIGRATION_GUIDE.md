# Firebase Migration Guide

This guide will help you migrate from the current PostgreSQL + Prisma + NextAuth stack to Firebase Auth + Firestore + R2 Storage.

## 🚀 Quick Start

### 1. Firebase Project Setup

1. **Create Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project"
   - Enter project name: `csi-nmamit`
   - Enable Google Analytics (optional)
   - Click "Create project"

2. **Enable Authentication:**
   - In Firebase Console, go to "Authentication" → "Sign-in method"
   - Enable "Google" provider
   - Add your domain to authorized domains

3. **Enable Firestore Database:**
   - Go to "Firestore Database" → "Create database"
   - Choose "Start in test mode" (we'll add security rules later)
   - Select a location (choose closest to your users)

4. **Enable Storage:**
   - Go to "Storage" → "Get started"
   - Choose "Start in test mode"
   - Select same location as Firestore

### 2. Get Firebase Configuration

1. **Get Web App Config:**
   - In Firebase Console, go to Project Settings (gear icon)
   - Scroll down to "Your apps" section
   - Click "Add app" → "Web"
   - Register app with name: `csi-nmamit-web`
   - Copy the config object

2. **Update Environment Variables:**
   ```bash
   # Copy .env.example to .env
   cp .env.example .env
   ```

   Add your Firebase config to `.env`:
   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
   NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abcdef"
   ```

### 3. Install Dependencies

```bash
npm install firebase @firebase/auth @firebase/firestore @firebase/storage
```

## 🔄 Migration Steps

### Step 1: Data Migration from PostgreSQL to Firestore

1. **Export PostgreSQL Data:**
   ```bash
   # Export data from PostgreSQL
   pg_dump -h localhost -U postgres -d csinmamit --data-only > data_backup.sql
   ```

2. **Create Migration Script:**
   ```typescript
   // scripts/migrate-to-firestore.ts
   import { db } from '../src/lib/firebase';
   import { collection, addDoc } from 'firebase/firestore';

   // Import your PostgreSQL data
   const migrateData = async () => {
     // Migrate users
     // Migrate core members
     // Migrate events
     // Migrate teams
     // Migrate recruits
   };
   ```

### Step 2: Update Authentication

1. **Replace NextAuth with Firebase Auth:**
   - The `AuthProvider` is already set up in `src/lib/auth-context.tsx`
   - Update your login components to use `useAuth()` hook
   - Remove NextAuth dependencies when ready

2. **Update Protected Routes:**
   ```typescript
   // Before (NextAuth)
   import { useSession } from 'next-auth/react';
   
   // After (Firebase)
   import { useAuth } from '~/lib/auth-context';
   ```

### Step 3: Update API Calls

1. **Use Firebase tRPC Routers:**
   ```typescript
   // Before (Prisma)
   const { data: coreMembers } = api.core.getCoreMembers.useQuery();
   
   // After (Firestore)
   const { data: coreMembers } = api.firebase.core.getCoreMembers.useQuery();
   ```

2. **Update Components:**
   - Replace all `api.user.*` calls with `api.firebase.user.*`
   - Replace all `api.core.*` calls with `api.firebase.core.*`
   - Replace all `api.recruit.*` calls with `api.firebase.recruit.*`

### Step 4: Storage Migration

1. **Current: Firebase Storage**
   - Files are uploaded to Firebase Storage
   - URLs are generated automatically

2. **Future: R2 Storage**
   - Install R2 SDK: `npm install @aws-sdk/client-s3`
   - Update `src/lib/r2-storage.ts` with actual implementation
   - Replace Firebase Storage calls with R2 calls

## 🔧 Configuration

### Firestore Security Rules

Create `firestore.rules`:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Core members - public read, admin write
    match /core/{docId} {
      allow read: if true;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Events - public read, admin write
    match /events/{docId} {
      allow read: if true;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Teams - authenticated users can read/write
    match /teams/{docId} {
      allow read, write: if request.auth != null;
    }
    
    // Recruits - public create, admin read/write
    match /recruits/{docId} {
      allow create: if true;
      allow read, write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}
```

### Storage Security Rules

Create `storage.rules`:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Public read access for images
    match /images/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Authenticated users can upload avatars
    match /avatars/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Admin only for documents
    match /documents/{allPaths=**} {
      allow read, write: if request.auth != null && 
        firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}
```

## 🧪 Testing

### 1. Test Authentication
```typescript
// Test Firebase Auth
const { user, signInWithGoogle, signOut } = useAuth();
console.log('Current user:', user);
```

### 2. Test Firestore Operations
```typescript
// Test core members
const { data: coreMembers } = api.firebase.core.getCoreMembers.useQuery();
console.log('Core members:', coreMembers);

// Test user creation
const createUser = api.firebase.user.createUser.useMutation();
```

### 3. Test Storage
```typescript
// Test file upload
import { imageStorage } from '~/lib/storage';

const handleUpload = async (file: File) => {
  const result = await imageStorage.uploadImage(file);
  console.log('Upload result:', result);
};
```

## 🚀 Deployment

### 1. Vercel Deployment
```bash
# Deploy to Vercel
vercel --prod
```

### 2. Environment Variables
Add Firebase config to Vercel:
- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Add all `NEXT_PUBLIC_FIREBASE_*` variables

### 3. Firebase Hosting (Optional)
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and initialize
firebase login
firebase init hosting

# Deploy
firebase deploy
```

## 🔄 Rollback Plan

If you need to rollback:

1. **Keep both systems running:**
   - Maintain PostgreSQL database
   - Keep NextAuth configuration
   - Use feature flags to switch between systems

2. **Gradual migration:**
   - Migrate one feature at a time
   - Test thoroughly before moving to next feature
   - Keep backup of all data

3. **Rollback commands:**
   ```bash
   # Revert to previous commit
   git reset --hard HEAD~1
   
   # Restore database from backup
   psql -h localhost -U postgres -d csinmamit < data_backup.sql
   ```

## 📊 Monitoring

### 1. Firebase Console
- Monitor authentication usage
- Check Firestore read/write operations
- Review storage usage

### 2. Application Monitoring
```typescript
// Add error tracking
try {
  await firebaseOperation();
} catch (error) {
  console.error('Firebase error:', error);
  // Send to error tracking service
}
```

## 🎯 Next Steps

1. **Complete R2 Integration:**
   - Implement R2 storage service
   - Migrate from Firebase Storage to R2
   - Update file upload components

2. **Performance Optimization:**
   - Add Firestore caching
   - Implement offline support
   - Optimize queries

3. **Advanced Features:**
   - Real-time updates with Firestore listeners
   - Push notifications
   - Analytics integration

## 📞 Support

If you encounter issues:

1. Check Firebase Console for errors
2. Review Firestore security rules
3. Verify environment variables
4. Check browser console for client-side errors
5. Review server logs for API errors

## 🔗 Useful Links

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Storage Rules](https://firebase.google.com/docs/storage/security)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [tRPC Documentation](https://trpc.io/docs) 