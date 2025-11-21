# Vercel Deployment Guide for Vistaran Help Desk

## Prerequisites
- GitHub account
- Vercel account

## Deployment Steps

1. **Push your code to GitHub**
   Make sure all your changes are committed and pushed to your GitHub repository.

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in or create an account
   - Click "New Project"
   - Import your GitHub repository

3. **Configure Project Settings**
   Vercel should automatically detect this as a Vite project. Confirm the following settings:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Environment Variables**
   Add the following environment variables in your Vercel project settings:
   - `VITE_GEMINI_API_KEY` - Your Google Gemini API key
   - `VITE_FIREBASE_API_KEY` - Your Firebase API key
   - `VITE_FIREBASE_AUTH_DOMAIN` - Your Firebase auth domain
   - `VITE_FIREBASE_PROJECT_ID` - Your Firebase project ID
   - `VITE_FIREBASE_STORAGE_BUCKET` - Your Firebase storage bucket
   - `VITE_FIREBASE_MESSAGING_SENDER_ID` - Your Firebase messaging sender ID
   - `VITE_FIREBASE_APP_ID` - Your Firebase app ID
   - `VITE_FIREBASE_MEASUREMENT_ID` - Your Firebase measurement ID

5. **Deploy**
   Click "Deploy" and wait for the build to complete.

## Troubleshooting

### Blank Page Issues
If you encounter a blank page after deployment:

1. Check the browser console for JavaScript errors
2. Verify that all environment variables are set correctly in Vercel
3. Check Vercel logs for build or deployment errors
4. Ensure the `dist` directory was built correctly

### Common Fixes Applied
The following fixes have been implemented to resolve deployment issues:

1. Added proper script tag to index.html for Vite to detect entry point
2. Simplified Vite configuration to focus on essential settings
3. Removed .tsx extensions from import statements
4. Replaced CDN links with local npm packages for Font Awesome and Recharts
5. Added proper favicon.ico file
6. Implemented comprehensive error handling throughout the application

## Support
If you continue to experience issues, please check the browser console for specific error messages and contact the development team for assistance.