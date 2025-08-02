# Firebase Security Rules Documentation

This document explains the security rules for CSI NMAMIT's Firebase implementation.

## 📋 Overview

We have two sets of security rules:
1. **Firestore Rules** (`firestore.rules`) - Database access control
2. **Storage Rules** (`storage.rules`) - File upload/download control

## 🔐 Firestore Security Rules

### User Roles

| Role | Permissions |
|------|-------------|
| **Public** | Read core team, events, settings |
| **Authenticated** | Read teams, create registrations, manage own data |
| **Moderator** | Read all data, update events, manage teams |
| **Admin** | Full access to all data and operations |

### Collection Access Matrix

| Collection | Public Read | Auth Read | Auth Write | Admin Full |
|------------|-------------|-----------|------------|------------|
| `users` | ❌ | Own data | Own data | ✅ |
| `core` | ✅ | ✅ | ❌ | ✅ |
| `events` | ✅ | ✅ | ❌ | ✅ |
| `teams` | ❌ | ✅ | Create/own | ✅ |
| `recruits` | ❌ | ❌ | Create only | ✅ |
| `notifications` | ❌ | Own | Own | ✅ |
| `analytics` | ❌ | ❌ | ❌ | ✅ |
| `settings` | ✅ | ✅ | ❌ | ✅ |

### Key Security Features

#### 1. User Data Protection
```javascript
// Users can only access their own data
match /users/{userId} {
  allow read, write: if request.auth.uid == userId;
  allow read: if isAdmin(); // Admins can read all users
}
```

#### 2. Public vs Private Data
```javascript
// Core team - public read, admin write
match /core/{docId} {
  allow read: if true; // Anyone can read
  allow write: if isAdmin(); // Only admins can modify
}
```

#### 3. Team Management
```javascript
// Team members can manage their own teams
match /teams/{docId} {
  allow update: if resource.data.leaderId == request.auth.uid;
}
```

#### 4. Recruitment Privacy
```javascript
// Anyone can apply, only admins can view applications
match /recruits/{docId} {
  allow create: if true; // Public registration
  allow read, write: if isAdmin(); // Admin only access
}
```

## 📁 Storage Security Rules

### File Organization

```
storage/
├── images/           # Public images (events, core team)
├── avatars/          # User profile pictures
├── events/           # Event-specific files
├── documents/        # Admin-only documents
├── teams/            # Team submission files
├── recruits/         # Recruitment documents
├── temp/             # Temporary files
└── backups/          # Admin-only backups
```

### File Type Restrictions

| File Type | Allowed Extensions | Max Size |
|-----------|-------------------|----------|
| **Images** | jpg, jpeg, png, gif, webp | 10MB |
| **Documents** | pdf, doc, docx, txt | 10MB |
| **All Files** | Any | 10MB |

### Access Control

#### 1. Public Images
```javascript
match /images/{allPaths=**} {
  allow read: if true; // Anyone can view
  allow write: if isAuthenticated() && isImage(); // Auth users can upload
}
```

#### 2. User Avatars
```javascript
match /avatars/{userId}/{allPaths=**} {
  allow read: if true; // Anyone can view
  allow write: if request.auth.uid == userId; // Own avatar only
}
```

#### 3. Admin Documents
```javascript
match /documents/{allPaths=**} {
  allow read: if isAuthenticated(); // Auth users can read
  allow write: if isAdmin(); // Only admins can upload
}
```

## 🚀 Deployment

### Quick Deploy
```bash
# Make script executable
chmod +x deploy-firebase-rules.sh

# Run deployment
./deploy-firebase-rules.sh
```

### Manual Deploy
```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage
```

## 🧪 Testing Rules

### 1. Firebase Console Testing
1. Go to Firebase Console → Firestore Database → Rules
2. Click "Rules Playground"
3. Test different scenarios:
   - Public read access
   - Authenticated user operations
   - Admin operations
   - Unauthorized access attempts

### 2. Common Test Cases

#### Test Public Access
```javascript
// Should succeed
match /core/{docId} {
  allow read: if true;
}
```

#### Test User Authentication
```javascript
// Should fail for unauthenticated users
match /users/{userId} {
  allow read: if request.auth.uid == userId;
}
```

#### Test Admin Access
```javascript
// Should succeed for admins
match /recruits/{docId} {
  allow read: if isAdmin();
}
```

## 🔧 Customization

### Adding New Collections

1. **Add to Firestore Rules:**
```javascript
match /new_collection/{docId} {
  allow read: if isAuthenticated();
  allow write: if isAdmin();
}
```

2. **Add to Storage Rules:**
```javascript
match /new_collection/{allPaths=**} {
  allow read: if isAuthenticated();
  allow write: if isAdmin();
}
```

### Modifying Permissions

#### Make Collection Public
```javascript
// Change from private to public
match /some_collection/{docId} {
  allow read: if true; // Was: if isAuthenticated()
}
```

#### Restrict Access
```javascript
// Change from public to admin-only
match /some_collection/{docId} {
  allow read: if isAdmin(); // Was: if true
}
```

### Adding New User Roles

1. **Create Helper Function:**
```javascript
function isEditor() {
  return request.auth != null && 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'editor';
}
```

2. **Use in Rules:**
```javascript
match /content/{docId} {
  allow read: if true;
  allow write: if isAdmin() || isEditor();
}
```

## 🚨 Security Best Practices

### 1. Principle of Least Privilege
- Start with restrictive rules
- Gradually open up access as needed
- Never use `allow read, write: if true;`

### 2. Input Validation
- Validate file types and sizes
- Check user authentication
- Verify user permissions

### 3. Regular Audits
- Review rules monthly
- Monitor access logs
- Update rules for new features

### 4. Testing
- Test all user roles
- Test edge cases
- Test unauthorized access

## 📊 Monitoring

### Firebase Console
- **Firestore**: Monitor read/write operations
- **Storage**: Monitor file uploads/downloads
- **Authentication**: Monitor login attempts

### Common Issues

#### Permission Denied Errors
```javascript
// Check if user is authenticated
if (!request.auth) {
  // User not logged in
}

// Check if user has required role
if (!isAdmin()) {
  // User not admin
}
```

#### File Upload Failures
```javascript
// Check file size
if (request.resource.size > 10 * 1024 * 1024) {
  // File too large
}

// Check file type
if (!isImage()) {
  // Not an image file
}
```

## 🔄 Updates and Maintenance

### When to Update Rules
- Adding new features
- Changing user roles
- Security vulnerabilities
- Performance optimization

### Version Control
- Keep rules in version control
- Document changes
- Test before deploying

### Backup
- Export rules before major changes
- Keep backup of working rules
- Test in staging environment

## 📞 Support

If you encounter issues:

1. **Check Firebase Console** for error messages
2. **Review rule syntax** for typos
3. **Test in Rules Playground** before deploying
4. **Check user authentication** status
5. **Verify file types and sizes**

## 🔗 Resources

- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Storage Security Rules](https://firebase.google.com/docs/storage/security)
- [Rules Playground](https://console.firebase.google.com/project/_/firestore/rules)
- [Security Best Practices](https://firebase.google.com/docs/rules/best-practices) 