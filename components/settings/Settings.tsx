
import React from 'react';

const Settings: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Settings</h2>
      
      <div className="space-y-8">
        {/* Change Password Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Change Password</h3>
          <form className="mt-4 space-y-4 max-w-sm">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Current Password</label>
              <input type="password" name="currentPassword" className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
              <input type="password" name="newPassword" className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</label>
              <input type="password" name="confirmPassword" className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div className="pt-2">
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700">Update Password</button>
            </div>
          </form>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700"></div>

        {/* Notification Settings Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Notification Settings</h3>
          <div className="mt-4 space-y-4">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input id="email-notifications" name="email-notifications" type="checkbox" className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded" defaultChecked />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="email-notifications" className="font-medium text-gray-700 dark:text-gray-300">Email Notifications</label>
                <p className="text-gray-500 dark:text-gray-400">Get emails about your ticket updates.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;
