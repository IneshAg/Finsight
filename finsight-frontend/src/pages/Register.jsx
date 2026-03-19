import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Check, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { register } from '../services/api';

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    pin: ['', '', '', ''],
    confirmPin: ['', '', '', ''],
    consentGiven: false
  });

  // Refs for PIN inputs to handle auto-focus
  const pinRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const confirmPinRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePinChange = (index, value, isConfirm = false) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;

    const key = isConfirm ? 'confirmPin' : 'pin';
    const refs = isConfirm ? confirmPinRefs : pinRefs;
    const newPinArray = [...formData[key]];
    
    // Take only the last character if they pasted or typed quickly
    newPinArray[index] = value.slice(-1);
    setFormData({ ...formData, [key]: newPinArray });

    // Auto-advance
    if (value && index < 3) {
      refs[index + 1].current.focus();
    }
  };

  const handlePinKeyDown = (index, e, isConfirm = false) => {
    const refs = isConfirm ? confirmPinRefs : pinRefs;
    // Handle backspace auto-reverse
    if (e.key === 'Backspace' && !formData[isConfirm ? 'confirmPin' : 'pin'][index] && index > 0) {
      refs[index - 1].current.focus();
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.phone) {
        toast.error("Please fill all details");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const pinStr = formData.pin.join('');
      const confirmStr = formData.confirmPin.join('');
      if (pinStr.length !== 4) {
        toast.error("Please enter a 4-digit PIN");
        return;
      }
      if (pinStr !== confirmStr) {
        toast.error("PINs do not match");
        return;
      }
      setStep(3);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.consentGiven) {
      toast.error("Please accept the data consent agreement");
      return;
    }

    try {
      const response = await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.pin.join('') // Using PIN as password for backend compat
      });
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      toast.success("Account created successfully!");
      navigate('/dashboard'); // Go straight to dashboard (mocking Setu flow for now or let Connect Bank handle it)
    } catch (error) {
      toast.error(error.response?.data?.detail || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen bg-base flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md pt-8">
        
        {/* Step Indicator */}
        <div className="flex justify-center items-center gap-2 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
                ${step === i ? 'bg-brand text-black scale-110 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 
                  step > i ? 'bg-[#1f2937] border border-brand text-brand' : 'bg-[#1f2937] border border-gray-700 text-gray-500'}`}
              >
                {step > i ? <Check className="w-4 h-4" /> : i}
              </div>
              {i < 3 && (
                <div className={`w-12 h-1 transition-colors duration-300 ${step > i ? 'bg-brand/50' : 'bg-gray-800'}`}></div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-surface py-8 px-8 shadow-2xl sm:rounded-2xl border border-gray-800 relative overflow-hidden">
          {/* Decorative Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-brand/5 blur-[100px] rounded-full pointer-events-none"></div>

          <form onSubmit={(e) => { e.preventDefault(); if(step === 3) handleSubmit(e); }}>
            
            {/* STEP 1: Details */}
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="mb-8 text-center">
                  <h2 className="text-2xl font-bold text-white mb-2">Create your account</h2>
                  <p className="text-muted text-sm">Join FinSight and take control of your money</p>
                </div>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
                    <input
                      name="name" type="text" value={formData.name} onChange={handleChange} required
                      placeholder="e.g. Priya Sharma"
                      className="block w-full px-4 py-3 border border-gray-700 rounded-xl bg-[#111827] text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
                    <input
                      name="email" type="email" value={formData.email} onChange={handleChange} required
                      placeholder="priya@example.com"
                      className="block w-full px-4 py-3 border border-gray-700 rounded-xl bg-[#111827] text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Phone Number</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-4 py-3 rounded-l-xl border border-r-0 border-gray-700 bg-[#1f2937] text-gray-400 sm:text-sm">
                        +91
                      </span>
                      <input
                        name="phone" type="tel" value={formData.phone} onChange={handleChange} required
                        placeholder="98765 43210"
                        className="block w-full px-4 py-3 border border-gray-700 rounded-none rounded-r-xl bg-[#111827] text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: PIN Setup */}
            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="mb-8 text-center">
                  <div className="mx-auto w-12 h-12 bg-brand/10 text-brand rounded-full flex items-center justify-center mb-4 border border-brand/20">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Create your 4-digit Security PIN</h2>
                  <p className="text-muted text-sm px-4">This PIN will be used to secure your financial data and login to FinSight.</p>
                </div>

                <div className="space-y-8">
                  <div className="flex flex-col items-center">
                    <label className="block text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Set PIN</label>
                    <div className="flex gap-4">
                      {formData.pin.map((digit, i) => (
                        <input
                          key={`pin-${i}`}
                          ref={pinRefs[i]}
                          type="password"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handlePinChange(i, e.target.value, false)}
                          onKeyDown={(e) => handlePinKeyDown(i, e, false)}
                          className={`w-[52px] h-[64px] text-center text-2xl font-bold rounded-xl border-2 transition-all duration-200 outline-none
                            ${digit ? 'bg-brand/5 border-brand text-brand shadow-[0_0_10px_rgba(34,197,94,0.15)]' : 'bg-[#111827] border-gray-700 text-white focus:border-brand focus:bg-[#111827]'}
                          `}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <label className="block text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Confirm PIN</label>
                    <div className="flex gap-4">
                      {formData.confirmPin.map((digit, i) => (
                        <input
                          key={`cpin-${i}`}
                          ref={confirmPinRefs[i]}
                          type="password"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handlePinChange(i, e.target.value, true)}
                          onKeyDown={(e) => handlePinKeyDown(i, e, true)}
                          className={`w-[52px] h-[64px] text-center text-2xl font-bold rounded-xl border-2 transition-all duration-200 outline-none
                            ${digit ? 'bg-brand/5 border-brand text-brand shadow-[0_0_10px_rgba(34,197,94,0.15)]' : 'bg-[#111827] border-gray-700 text-white focus:border-brand focus:bg-[#111827]'}
                          `}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Consent */}
            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="mb-8 text-center">
                  <h2 className="text-2xl font-bold text-white mb-2">Almost there</h2>
                  <p className="text-muted text-sm">Protecting your data is our top priority</p>
                </div>

                <div className="bg-[#111827] border border-gray-800 rounded-xl p-5 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                       <label className="relative flex cursor-pointer items-center rounded-full p-2" htmlFor="checkbox-1" data-ripple-dark="true">
                        <input
                          type="checkbox"
                          className="before:content[''] peer relative h-6 w-6 cursor-pointer appearance-none rounded-md border border-gray-600 bg-transparent transition-all before:absolute before:top-2/4 before:left-2/4 before:block before:h-12 before:w-12 before:-translate-y-2/4 before:-translate-x-2/4 before:rounded-full before:bg-blue-gray-500 before:opacity-0 before:transition-opacity checked:border-brand checked:bg-brand checked:before:bg-brand hover:before:opacity-10"
                          id="checkbox-1"
                          checked={formData.consentGiven}
                          onChange={(e) => setFormData({...formData, consentGiven: e.target.checked})}
                        />
                        <div className="pointer-events-none absolute top-2/4 left-2/4 -translate-y-2/4 -translate-x-2/4 text-black opacity-0 transition-opacity peer-checked:opacity-100">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                          </svg>
                        </div>
                      </label>
                    </div>
                    <div>
                      <p className="text-sm text-gray-300 leading-relaxed font-medium">
                        I consent to FinSight accessing my financial data via the Setu Account Aggregator framework for analysis purposes.
                      </p>
                      <p className="text-xs text-muted mt-2">
                        Data is encrypted end-to-end. We do not sell your data. Read our <a href="#" className="text-brand hover:underline">Privacy Policy</a>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-10 flex gap-4">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-1/3 flex items-center justify-center py-3.5 px-4 border border-gray-700 rounded-xl shadow-sm text-sm font-bold text-white bg-[#1f2937] hover:bg-[#374151] active:scale-95 transition-all outline-none"
                >
                  <ChevronLeft className="w-5 h-5 mr-1" />
                  Back
                </button>
              )}
              
              <button
                type={step === 3 ? "submit" : "button"}
                onClick={step !== 3 ? handleNext : undefined}
                disabled={step === 3 && !formData.consentGiven}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl shadow-[0_4px_14px_0_rgba(34,197,94,0.39)] text-sm font-bold text-black bg-brand hover:bg-green-400 active:scale-95 transition-all outline-none
                  ${step === 3 && !formData.consentGiven ? 'opacity-50 cursor-not-allowed shadow-none' : ''}
                `}
              >
                {step === 3 ? "Complete Account Creation" : "Continue"}
                {step !== 3 && <ChevronRight className="w-5 h-5 ml-1" />}
              </button>
            </div>
            
            <div className="mt-8 text-center pt-6 border-t border-gray-800">
              <p className="text-sm text-muted">
                Already have an account?{' '}
                <Link to="/login" className="font-bold text-brand hover:text-green-400 transition-colors">
                  Sign in securely
                </Link>
              </p>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}    
