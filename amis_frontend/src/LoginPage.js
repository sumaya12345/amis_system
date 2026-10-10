import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Shield,
  Lock,
  User,
  ArrowRight,
  CheckCircle2,
  Activity,
  KeyRound,
  Mail,
  Phone,
  ArrowLeft,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  colors, 
  borderRadius, 
  typography, 
  inputStyle, 
  labelStyle, 
  buttonPrimaryStyle, 
  buttonSecondaryStyle,
  modalOverlayStyle,
  modalContentStyle,
  modalHeaderStyle,
  modalTitleStyle
} from './designSystem';

function LoginPage({ onLogin }) {
  // --- LOGIN STATES ---
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // --- FORGOT PASSWORD STATES ---
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Search, 2: Select Method, 3: Verify OTP, 4: Reset Password
  const [identifier, setIdentifier] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [resetMethod, setResetMethod] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otpInput, setOtpInput] = useState('');

  // Responsive state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 1. LOGIN HANDLER
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await axios.post('http://localhost:5000/api/login', {
        username: username,
        password: password
      });

      if (response.data.success) {
        setError('');
        const userData = {
          id: response.data.id,
          username: response.data.username,
          pic: response.data.pic,
          role: response.data.role,
          email: response.data.email, 
          phone: response.data.phone   
        };
        
        sessionStorage.setItem('sessionId', response.data.sessionId);
        sessionStorage.setItem('user', JSON.stringify(userData));
        sessionStorage.setItem('currentUser', response.data.role);

        onLogin(response.data.role, userData, response.data.sessionId); 
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Username ama Password khaldan!');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. FORGOT PASSWORD: SEARCH USER
  const handleSearchUser = async () => {
    if (!identifier) return alert("Fadlan geli Username ama Email");
    try {
      const res = await axios.post('http://localhost:5000/api/search-user', { identifier });
      if (res.data.success) {
        setFoundUser(res.data.user);
        setForgotStep(2);
      }
    } catch (err) {
      alert("User-kaas nidaamka kuma jiro!");
    }
  };

  // 3. FORGOT PASSWORD: SEND OTP
  const handleSendOTP = async () => {
    if (!resetMethod) return alert("Fadlan dooro meesha code-ka laguugu soo dirayo");
    try {
      await axios.post('http://localhost:5000/api/send-otp', { 
        userId: foundUser.id, 
        method: resetMethod 
      });
      setForgotStep(3);
    } catch (err) {
      alert("Code-ka lama diri karo hadda!");
    }
  };

  // 4. FORGOT PASSWORD: VERIFY OTP
  const handleVerifyOTP = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/verify-otp', {
        userId: foundUser.id,
        otp: otpInput
      });

      if (res.data.success) {
        setForgotStep(4); 
      }
    } catch (err) {
      alert(err.response?.data?.message || "Code-ku waa khalad!");
    }
  };

  // QUICK LOGIN (IF USER REMEMBERS PASSWORD)
  const handleQuickLogin = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/login', {
        username: foundUser.username,
        password: password
      });
      if (res.data.success) {
        const userData = {
          id: res.data.id,
          username: res.data.username,
          pic: res.data.pic,
          role: res.data.role,
          email: res.data.email,
          phone: res.data.phone
        };
        sessionStorage.setItem('sessionId', res.data.sessionId);
        sessionStorage.setItem('user', JSON.stringify(userData));
        sessionStorage.setItem('currentUser', res.data.role);

        onLogin(res.data.role, userData, res.data.sessionId);
      }
    } catch (err) {
      alert("Username ama Password-ka waa khalad!");
    }
  };

  // 5. RESET PASSWORD FINALIZE
  const handleResetFinal = async () => {
    if (!otpInput || !newPassword) return alert("Fadlan geli code-ka iyo password-ka cusub");

    try {
      const res = await axios.post('http://localhost:5000/api/reset-password', {
        userId: foundUser.id,
        otp: otpInput, 
        newPassword: newPassword
      });

      if (res.data.success) {
        alert("Password-ka si guul leh ayaa loogu beddelay!");
        setShowForgot(false);
        setForgotStep(1);
      }
    } catch (err) {
      alert("Code-ku waa khaldan yahay ama wuu dhacay!");
    }
  };

  // --- FORGOT PASSWORD MODAL ---
  const renderForgotModal = () => (
    <div style={modalOverlayStyle}>
      <div style={{ ...modalContentStyle, maxWidth: '480px' }}>
        <div style={modalHeaderStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {forgotStep > 1 && (
              <button
                type="button"
                onClick={() => setForgotStep(prev => prev - 1)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted, padding: '4px' }}
                title="Dib u noqo"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <h3 style={modalTitleStyle}>Dib u Helista Akoonka</h3>
          </div>
          <button
            type="button"
            onClick={() => { setShowForgot(false); setForgotStep(1); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted }}
          >
            <X size={18} />
          </button>
        </div>

        {/* STEP 1: IDENTIFIER SEARCH */}
        {forgotStep === 1 && (
          <div>
            <p style={{ fontSize: '13px', color: colors.textMuted, marginBottom: '16px' }}>
              Geli email-kaaga ama username-kaaga si nidaamku u xaqiijiyo akoonkaaga.
            </p>
            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>Email ama Username</label>
              <input 
                style={inputStyle} 
                placeholder="Tusaale: askar@amis.gov.so" 
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)} 
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button" 
                onClick={() => setShowForgot(false)} 
                style={buttonSecondaryStyle}
              >
                Ka Noqo
              </button>
              <button 
                type="button" 
                onClick={handleSearchUser} 
                style={buttonPrimaryStyle}
              >
                Raadi Akoonka
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: RECOVERY METHOD */}
        {forgotStep === 2 && foundUser && (
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              backgroundColor: colors.primaryLight,
              borderRadius: borderRadius.md,
              border: `1px solid ${colors.primaryBorder}`,
              marginBottom: '18px',
            }}>
              <img 
                src={foundUser.pic ? `http://localhost:5000/uploads/${foundUser.pic}` : '/assets/profiles/default.svg'} 
                alt="user" 
                style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${colors.primary}` }} 
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/assets/profiles/default.svg"; }}
              />
              <div>
                <div style={{ fontWeight: '700', fontSize: '14px', color: colors.text }}>{foundUser.username}</div>
                <div style={{ fontSize: '12px', color: colors.textMuted }}>AMIS System Officer</div>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ ...labelStyle, marginBottom: '8px' }}>Dooro habka code-ka laguugu soo dirayo:</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: borderRadius.md,
                  border: `1px solid ${colors.border}`,
                  cursor: 'pointer',
                  backgroundColor: resetMethod === 'email' ? colors.primaryLight : colors.white,
                }}>
                  <input type="radio" name="method" value="email" onChange={(e) => setResetMethod(e.target.value)} />
                  <Mail size={16} color={colors.primary} />
                  <span style={{ fontSize: '13px', color: colors.text }}>
                    Email: <strong>{foundUser.email || 'Lama helin'}</strong>
                  </span>
                </label>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: borderRadius.md,
                  border: `1px solid ${colors.border}`,
                  cursor: 'pointer',
                  backgroundColor: resetMethod === 'phone' ? colors.primaryLight : colors.white,
                }}>
                  <input type="radio" name="method" value="phone" onChange={(e) => setResetMethod(e.target.value)} />
                  <Phone size={16} color={colors.primary} />
                  <span style={{ fontSize: '13px', color: colors.text }}>
                    SMS: <strong>{foundUser.phone || 'Lama helin'}</strong>
                  </span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button" 
                onClick={() => setForgotStep(1)} 
                style={buttonSecondaryStyle}
              >
                Dib u Noqo
              </button>
              <button 
                type="button" 
                onClick={handleSendOTP} 
                style={buttonPrimaryStyle}
              >
                Dir Code-ka
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: VERIFY SECURITY CODE */}
        {forgotStep === 3 && (
          <div>
            <p style={{ fontSize: '13px', color: colors.textMuted, marginBottom: '14px' }}>
              Fadlan geli 6-da rambar ee laguugu soo diray <strong>{resetMethod.toUpperCase()}</strong>.
            </p>
            <div style={{ marginBottom: '18px' }}>
              <input 
                style={{
                  ...inputStyle,
                  height: '44px',
                  textAlign: 'center',
                  fontSize: '20px',
                  letterSpacing: '6px',
                  fontWeight: '700',
                }} 
                placeholder="------" 
                maxLength="6"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)} 
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button" 
                onClick={() => setForgotStep(2)} 
                style={buttonSecondaryStyle}
              >
                Dib u Noqo
              </button>
              <button 
                type="button" 
                onClick={handleVerifyOTP} 
                style={buttonPrimaryStyle}
              >
                Xaqiiji Code-ka
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: SET NEW PASSWORD */}
        {forgotStep === 4 && (
          <div>
            <p style={{ fontSize: '13px', color: colors.textMuted, marginBottom: '14px' }}>
              Code-ka waa la xaqiijiyay. Hadda deji password cusub oo sugan.
            </p>
            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>Password Cusub</label>
              <input 
                style={inputStyle} 
                type="password"
                placeholder="Geli password cusub" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)} 
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button" 
                onClick={handleResetFinal} 
                style={buttonPrimaryStyle}
              >
                Cusboonaysii Password-ka
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{
      height: '100vh',
      backgroundColor: '#FFFFFF',
      fontFamily: typography.fontFamily,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '16px' : '32px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Watermark Logo */}
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%) rotate(-0deg)',
        width: isMobile ? '500px' : '700px',
        height: isMobile ? '500px' : '700px',
        opacity: '0.15',
        pointerEvents: 'none',
        zIndex: 0,
      }}>
        <img
          src="/image 3.Png"
          alt="Watermark"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </div>

      {/* Login Form Container */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: isMobile ? '100%' : '400px',
        backgroundColor: colors.white,
        borderRadius: '8px',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
        padding: isMobile ? '28px 24px' : '36px 32px',
      }}>
        {/* Logo at Top */}
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? '12px' : '16px',
        }}>
          <img
            src="/image 3.Png"
            alt="AMIS Logo"
            style={{
              width: isMobile ? '70px' : '80px',
              height: isMobile ? '70px' : '80px',
              objectFit: 'contain',
            }}
          />
        </div>

        {/* Portal Login Heading */}
        <h2 style={{
          fontSize: isMobile ? '20px' : '24px',
          fontWeight: '600',
          color: colors.text,
          margin: `0 0 ${isMobile ? '20px' : '24px'} 0`,
          textAlign: 'center',
        }}>
          Portal Login
        </h2>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: colors.errorBg,
            border: `1px solid ${colors.errorBorder}`,
            borderRadius: borderRadius.md,
            color: colors.error,
            fontSize: '13px',
            fontWeight: '500',
            marginBottom: '20px',
          }}>
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          {/* Service ID / Username */}
          <div style={{ marginBottom: isMobile ? '16px' : '18px' }}>
            <label style={{
              ...labelStyle,
              marginBottom: '8px',
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: '500',
            }}>
              Service ID / Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                ...inputStyle,
                height: isMobile ? '42px' : '46px',
                paddingLeft: '14px',
                fontSize: isMobile ? '14px' : '15px',
                borderRadius: '6px',
              }}
              placeholder="e.g. Mo_Jeila07"
              required
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: isMobile ? '16px' : '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{
                ...labelStyle,
                marginBottom: 0,
                fontSize: isMobile ? '13px' : '14px',
                fontWeight: '500',
              }}>
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: colors.primary,
                  fontSize: isMobile ? '13px' : '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'none',
                }}
              >
                Forgot password?
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  ...inputStyle,
                  height: isMobile ? '42px' : '46px',
                  paddingLeft: '14px',
                  paddingRight: '48px',
                  fontSize: isMobile ? '14px' : '15px',
                  borderRadius: '6px',
                }}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  padding: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPassword ? (
                  <EyeOff size={18} color={colors.textLight} />
                ) : (
                  <Eye size={18} color={colors.textLight} />
                )}
              </button>
            </div>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              ...buttonPrimaryStyle,
              width: '100%',
              height: isMobile ? '46px' : '50px',
              fontSize: isMobile ? '15px' : '16px',
              fontWeight: '600',
              letterSpacing: '0.01em',
              borderRadius: '6px',
            }}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>

      {showForgot && renderForgotModal()}
    </div>
  );
}

export default LoginPage;