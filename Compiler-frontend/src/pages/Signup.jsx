import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { signUp } from "../services/operations/authApi";

/**
 * Signup View Component
 *
 * Registration interface allowing new developers to create user credentials
 * with client-side validation and automated navigation upon success.
 */
const Signup = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({ userName: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const { userName, password } = formData;

  const handleOnChange = (e) => {
    setFormData((prevData) => ({
      ...prevData,
      [e.target.name]: e.target.value,
    }));
  };

  const handleOnSubmit = (e) => {
    e.preventDefault();
    dispatch(signUp(userName, password, navigate));
  };

  const getPasswordStrength = (pw) => {
    if (!pw) return 0;
    if (pw.length < 4) return 1;
    if (pw.length < 6) return 2;
    if (pw.length < 8) return 3;
    return 4;
  };

  const strength = getPasswordStrength(password);
  
  const getStrengthColor = (level) => {
    if (strength < level) return "bg-white/[0.07]";
    if (strength === 1) return "bg-red-500";
    if (strength === 2) return "bg-orange-500";
    if (strength === 3) return "bg-yellow-500";
    return "bg-green-500";
  };

  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
  const labelColors = ["", "text-red-500", "text-orange-500", "text-yellow-500", "text-green-500"];

  return (
    <>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .dot-bg {
          background-image: radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px);
          background-size: 24px 24px;
        }
      `}</style>
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center relative overflow-hidden font-sans p-4 md:p-8">
        {/* Ambient glow blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/20 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/15 blur-3xl rounded-full pointer-events-none" />
        
        {/* Dot grid */}
        <div className="absolute inset-0 dot-bg pointer-events-none" />

        {/* 2-column layout container */}
        <div 
          className="relative z-10 w-full max-w-5xl flex flex-col lg:flex-row items-center justify-center gap-12"
          style={{ animation: 'fadeSlideUp 0.5s ease-out both' }}
        >
          {/* Brand Panel (hidden on mobile) */}
          <div className="hidden lg:flex flex-col flex-1 text-white pr-8">
            <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-cyan-400 mb-4">
              CollabIDE
            </h1>
            <p className="text-xl text-gray-400 mb-8">Code Together, Build Faster</p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-gray-300">
                <span className="text-xl">⚡</span> Real-time collaboration
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <span className="text-xl">🤖</span> AI-powered code assistance
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <span className="text-xl">🌐</span> 11+ languages supported
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <span className="text-xl">🔒</span> Secure execution sandbox
              </li>
            </ul>
          </div>

          {/* Form Card */}
          <div className="w-full max-w-md bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 shadow-2xl">
            <div className="mb-8">
              <h2 className="text-3xl font-bold font-sans bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-cyan-400 mb-2">
                Create your account
              </h2>
              <p className="text-gray-400 text-sm">
                Join thousands of developers coding together
              </p>
            </div>

            <form onSubmit={handleOnSubmit} className="space-y-5">
              {/* Username */}
              <div>
                <label htmlFor="userName" className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <input
                    required
                    type="text"
                    id="userName"
                    name="userName"
                    value={userName}
                    onChange={handleOnChange}
                    className="block w-full pl-10 pr-3 py-3 border border-white/[0.08] rounded-xl bg-white/[0.04] text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200"
                    placeholder="your_username"
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={password}
                    onChange={handleOnChange}
                    className="block w-full pl-10 pr-10 py-3 border border-white/[0.08] rounded-xl bg-white/[0.04] text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-indigo-400 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                <div className="mt-2">
                  <div className="flex gap-1 h-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div key={level} className={`flex-1 rounded-full transition-colors duration-300 ${getStrengthColor(level)}`}></div>
                    ))}
                  </div>
                  <div className="min-h-[16px] mt-1 text-[11px] font-medium text-right">
                    {strength > 0 && (
                      <span className={`${labelColors[strength]} transition-colors duration-300`}>
                        {strengthLabels[strength]}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-cyan-400 hover:from-indigo-600 hover:to-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0e1a] focus:ring-indigo-500 transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg shadow-indigo-500/25 mt-2"
              >
                Create Account
                <span className="text-base">🚀</span>
              </button>
            </form>

            <div className="mt-6 text-center">
              <span className="text-gray-400 text-sm">Already have an account? </span>
              <Link to="/login" className="text-indigo-400 hover:text-cyan-400 font-semibold text-sm transition-colors">
                Sign in
              </Link>
            </div>
            
            <div className="mt-8 flex items-center gap-3">
              <div className="flex-1 h-px bg-white/[0.08]"></div>
              <span className="text-xs text-gray-500 uppercase tracking-wider">Secure Connection</span>
              <div className="flex-1 h-px bg-white/[0.08]"></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;
