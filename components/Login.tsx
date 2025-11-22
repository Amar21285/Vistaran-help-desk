import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Logo from './icons/Logo';
import { LoginStatus } from '../types';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const status = login(email, password);
    if (status === LoginStatus.INVALID_CREDENTIALS) {
      setError('Invalid email or password. Please try again.');
    } else if (status === LoginStatus.USER_INACTIVE) {
        setError('This account is inactive. Please contact an administrator.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-slate-800 rounded-2xl shadow-xl">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Logo className="h-16"/>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Vistaran Help Desk</h1>
          <p className="text-slate-500 dark:text-slate-400">IT Support Ticket Management System</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
             <label className="text-sm font-bold text-gray-600 dark:text-gray-300 tracking-wide flex items-center space-x-2">
                <i className="fas fa-envelope"></i>
                <span>Email Address</span>
             </label>
             <input
              className="w-full text-base py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-600 dark:text-gray-300 tracking-wide flex items-center space-x-2">
                <i className="fas fa-lock"></i>
                <span>Password</span>
            </label>
            <input
              className="w-full text-base py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center font-semibold">{error}</p>}
          <div>
            <button type="submit" className="w-full flex items-center justify-center gap-2 bg-blue-500 text-gray-100 p-3 rounded-lg tracking-wide font-semibold shadow-lg cursor-pointer transition ease-in duration-300 hover:bg-blue-600">
              <i className="fas fa-sign-in-alt"></i>
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;