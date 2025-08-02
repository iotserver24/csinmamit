#!/bin/bash

# Firebase Rules Deployment Script for CSI NMAMIT
# This script deploys Firestore and Storage security rules

echo "🚀 Deploying Firebase Security Rules for CSI NMAMIT..."

# Check if firebase-tools is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "🔐 Please login to Firebase..."
    firebase login
fi

# Deploy Firestore rules
echo "📝 Deploying Firestore security rules..."
firebase deploy --only firestore:rules

# Deploy Storage rules
echo "📁 Deploying Storage security rules..."
firebase deploy --only storage

echo "✅ Firebase security rules deployed successfully!"
echo ""
echo "📋 Summary of deployed rules:"
echo "   • Firestore: firestore.rules"
echo "   • Storage: storage.rules"
echo ""
echo "🔒 Security features enabled:"
echo "   • User authentication required for sensitive operations"
echo "   • Admin-only access for user management"
echo "   • Public read access for core team and events"
echo "   • File size limits (10MB max)"
echo "   • File type validation"
echo "   • User-specific data protection"
echo ""
echo "🌐 Next steps:"
echo "   1. Test the rules in Firebase Console"
echo "   2. Monitor for any permission errors"
echo "   3. Adjust rules if needed for your specific use cases" 