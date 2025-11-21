# Vistaran Help Desk - Deployment Instructions

## Prerequisites
- Node.js (version 16 or higher)
- npm (version 8 or higher)

## Local Development Setup

1. Clone the repository:
   ```
   git clone <repository-url>
   cd Vistaran-help-desk
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5000`

## Production Build

To create a production build:

```
npm run build
```

The build output will be in the `dist` directory.

## Deployment to Vercel

1. Push your code to your GitHub repository
2. Go to [Vercel](https://vercel.com) and sign in
3. Click "New Project"
4. Import your GitHub repository
5. Configure the project with these settings:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
6. Click "Deploy"

## Environment Variables

Make sure to set the following environment variables in your Vercel project settings:

- `VITE_MYSQLHOST` - Your MySQL host
- `VITE_MYSQLPORT` - Your MySQL port (default: 3306)
- `VITE_MYSQLUSER` - Your MySQL username
- `VITE_MYSQLPASSWORD` - Your MySQL password
- `VITE_MYSQLDATABASE` - Your MySQL database name
- `VITE_MYSQL_URL` - Your MySQL connection URL (if applicable)
- `GEMINI_API_KEY` - Your Google Gemini API key

## Troubleshooting

### Blank Page Issues
If you encounter a blank page after deployment:

1. Check the browser console for JavaScript errors
2. Verify that all environment variables are set correctly
3. Ensure the `dist` directory was built correctly
4. Check Vercel logs for build or deployment errors

### TypeError: Cannot read properties of undefined
This error typically occurs when:

1. A required module or component is not properly imported
2. Environment variables are missing
3. There's an issue with the Firebase configuration

To resolve:
1. Verify all environment variables are set
2. Check that the Firebase configuration is correct
3. Ensure all dependencies are properly installed

### Import Warnings During Build
The warnings about imports not being exported are related to TypeScript's `verbatimModuleSyntax` setting. These warnings do not prevent the application from working correctly and can be safely ignored.

## Common Fixes Applied

The following fixes have been implemented to resolve deployment issues:

1. Removed .tsx extensions from import statements
2. Replaced CDN links with local npm packages for Font Awesome and Recharts
3. Added proper favicon.ico file
4. Implemented comprehensive error handling throughout the application
5. Added global error boundaries to catch and display errors gracefully
6. Enhanced Firebase initialization with better error handling
7. Fixed chart components to use direct imports instead of window object access

## Support

If you continue to experience issues, please check the browser console for specific error messages and contact the development team for assistance.