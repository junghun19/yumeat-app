import React, { useState } from 'react';
import { storage } from '../utils/storage';
import { API_BASE_URL } from '../config';

/* ──────────────────────────────────────────
   공통 스타일 토큰
────────────────────────────────────────── */
const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: '10px',
  border: '1.5px solid #e2e8f0',
  fontSize: '13.5px',
  outline: 'none',
  transition: 'all 0.2s ease',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  color: '#2d3748',
};

const labelStyle = {
  display: 'block',
  fontSize: '12px',
  fontWeight: '700',
  color: '#4a5568',
  marginBottom: '6px',
  paddingLeft: '2px',
};

const primaryBtn = {
  width: '100%',
  padding: '13px',
  backgroundColor: '#ff6b6b',
  color: '#ffffff',
  border: 'none',
  borderRadius: '10px',
  fontWeight: 'bold',
  cursor: 'pointer',
  fontSize: '14.5px',
  transition: 'all 0.2s ease',
  boxShadow: '0 4px 12px rgba(255,107,107,0.2)',
  marginTop: '6px',
};

/* ──────────────────────────────────────────
   로그인 폼
────────────────────────────────────────── */
function LoginForm({ onLoginSuccess, onSwitchToRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) { setError('아이디를 입력해 주세요.'); return; }
    if (!password.trim()) { setError('비밀번호를 입력해 주세요.'); return; }

    setIsLoading(true);
    setError('');

    try {
      const res  = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      if (data.status === 'success') {
        const profileRes  = await fetch(`${API_BASE_URL}/api/profile/user/${encodeURIComponent(data.username)}`);
        const profileData = await profileRes.json();

        const userProfile = {
          username:   data.username,
          nickname:   profileData.nickname || data.nickname,
          hearts:     profileData.hearts   || 0,
          isLoggedIn: true,
        };
        storage.saveUserProfile(userProfile);
        onLoginSuccess(userProfile);
      } else {
        setError('로그인에 실패했습니다. 다시 시도해 주세요.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('서버 연결에 실패했습니다. 서버가 실행 중인지 확인해 주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 아이디 */}
      <div>
        <label style={labelStyle}>아이디</label>
        <input
          type="text"
          placeholder="아이디를 입력하세요"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isLoading}
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = '#ff6b6b')}
          onBlur={(e)  => (e.target.style.borderColor = '#e2e8f0')}
        />
      </div>

      {/* 비밀번호 */}
      <div>
        <label style={labelStyle}>비밀번호</label>
        <input
          type="password"
          placeholder="비밀번호를 입력하세요"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = '#ff6b6b')}
          onBlur={(e)  => (e.target.style.borderColor = '#e2e8f0')}
        />
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div style={{
          color: '#e53e3e', fontSize: '12px', fontWeight: '600',
          padding: '8px 12px', background: '#fff5f5', borderRadius: '8px',
          border: '1px solid #fed7d7', display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          ⚠️ {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        style={primaryBtn}
        onMouseOver={(e) => (e.target.style.backgroundColor = '#ff5252')}
        onMouseOut={(e)  => (e.target.style.backgroundColor = '#ff6b6b')}
      >
        {isLoading ? '로그인 중...' : '🔑 로그인'}
      </button>

      {/* 회원가입 안내 */}
      <div style={{ textAlign: 'center', marginTop: '4px' }}>
        <span style={{ fontSize: '13px', color: '#718096' }}>처음 방문하셨나요?&nbsp;</span>
        <button
          type="button"
          onClick={onSwitchToRegister}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#ff6b6b', fontWeight: '700', fontSize: '13px',
            textDecoration: 'underline', padding: 0,
          }}
        >
          회원가입하기 →
        </button>
      </div>
    </form>
  );
}

/* ──────────────────────────────────────────
   회원가입 폼
────────────────────────────────────────── */
function RegisterForm({ onSwitchToLogin }) {
  const [form, setForm]           = useState({ username: '', password: '', passwordConfirm: '', school: '', student_id: '' });
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { username, password, passwordConfirm, school, student_id } = form;

    if (!username.trim())        { setError('아이디를 입력해 주세요.');          return; }
    if (!password.trim())        { setError('비밀번호를 입력해 주세요.');         return; }
    if (password !== passwordConfirm) { setError('비밀번호가 일치하지 않습니다.'); return; }
    if (!school.trim())          { setError('재학 중인 학교를 입력해 주세요.');    return; }
    if (!student_id.trim())      { setError('학번을 입력해 주세요.');             return; }

    setIsLoading(true);
    try {
      const res  = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password, school: school.trim(), student_id: student_id.trim() }),
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else if (data.status === 'success') {
        setSuccess(true);
      }
    } catch (err) {
      console.error('Register error:', err);
      setError('서버 연결에 실패했습니다. 서버가 실행 중인지 확인해 주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  /* 가입 완료 상태 */
  if (success) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '12px 0' }}>
        <div style={{ fontSize: '52px' }}>🎉</div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '16px', fontWeight: '800', color: '#2d3748', margin: '0 0 8px 0' }}>
            회원가입 완료!
          </p>
          <p style={{ fontSize: '13px', color: '#718096', margin: 0, lineHeight: 1.6 }}>
            성공적으로 완료되었습니다.<br />로그인 후 서비스를 이용해 보세요 😊
          </p>
        </div>
        <button
          type="button"
          onClick={onSwitchToLogin}
          style={{ ...primaryBtn, marginTop: 0, width: 'auto', padding: '12px 32px' }}
          onMouseOver={(e) => (e.target.style.backgroundColor = '#ff5252')}
          onMouseOut={(e)  => (e.target.style.backgroundColor = '#ff6b6b')}
        >
          🔑 로그인하러 가기
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* 아이디 */}
      <div>
        <label style={labelStyle}>아이디</label>
        <input type="text" placeholder="사용할 아이디를 입력하세요" value={form.username}
          onChange={set('username')} disabled={isLoading} style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = '#ff6b6b')}
          onBlur={(e)  => (e.target.style.borderColor = '#e2e8f0')} />
      </div>

      {/* 비밀번호 */}
      <div>
        <label style={labelStyle}>비밀번호</label>
        <input type="password" placeholder="비밀번호를 입력하세요" value={form.password}
          onChange={set('password')} disabled={isLoading} style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = '#ff6b6b')}
          onBlur={(e)  => (e.target.style.borderColor = '#e2e8f0')} />
      </div>

      {/* 비밀번호 확인 */}
      <div>
        <label style={labelStyle}>비밀번호 확인</label>
        <input type="password" placeholder="비밀번호를 다시 입력하세요" value={form.passwordConfirm}
          onChange={set('passwordConfirm')} disabled={isLoading} style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = '#ff6b6b')}
          onBlur={(e)  => (e.target.style.borderColor = '#e2e8f0')} />
      </div>

      {/* 학교 */}
      <div>
        <label style={labelStyle}>재학 중인 학교</label>
        <input type="text" placeholder="예: ○○대학교" value={form.school}
          onChange={set('school')} disabled={isLoading} style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = '#ff6b6b')}
          onBlur={(e)  => (e.target.style.borderColor = '#e2e8f0')} />
      </div>

      {/* 학번 */}
      <div>
        <label style={labelStyle}>학번</label>
        <input type="text" placeholder="예: 20211234" value={form.student_id}
          onChange={set('student_id')} disabled={isLoading} style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = '#ff6b6b')}
          onBlur={(e)  => (e.target.style.borderColor = '#e2e8f0')} />
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div style={{
          color: '#e53e3e', fontSize: '12px', fontWeight: '600',
          padding: '8px 12px', background: '#fff5f5', borderRadius: '8px',
          border: '1px solid #fed7d7', display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          ⚠️ {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        style={primaryBtn}
        onMouseOver={(e) => (e.target.style.backgroundColor = '#ff5252')}
        onMouseOut={(e)  => (e.target.style.backgroundColor = '#ff6b6b')}
      >
        {isLoading ? '가입 중...' : '✅ 가입 완료'}
      </button>

      {/* 로그인으로 돌아가기 */}
      <div style={{ textAlign: 'center', marginTop: '2px' }}>
        <span style={{ fontSize: '13px', color: '#718096' }}>이미 계정이 있으신가요?&nbsp;</span>
        <button
          type="button"
          onClick={onSwitchToLogin}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#ff6b6b', fontWeight: '700', fontSize: '13px',
            textDecoration: 'underline', padding: 0,
          }}
        >
          로그인하기 →
        </button>
      </div>
    </form>
  );
}

/* ──────────────────────────────────────────
   메인 컴포넌트
────────────────────────────────────────── */
export default function Login({ onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'

  return (
    <div
      className="page login-page"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        padding: '24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* ── 로고 & 타이틀 ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px', textAlign: 'center' }}>
          <img
            src="/logo.png"
            alt="얌잇 로고"
            style={{ width: '120px', height: '120px', objectFit: 'contain', marginBottom: '10px' }}
            onError={(e) => (e.target.style.display = 'none')}
          />
          <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#ff6b6b', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>
            얌잇 (Yam-It)
          </h1>
          <p style={{ fontSize: '13px', color: '#718096', margin: 0, fontWeight: '500' }}>
            대학 자취생들의 스마트한 냉장고 &amp; 커뮤니티
          </p>
        </div>

        {/* ── 탭 전환 버튼 ── */}
        <div style={{
          display: 'flex',
          width: '100%',
          marginBottom: '18px',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1.5px solid #ffe3e3',
        }}>
          {['login', 'register'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              style={{
                flex: 1,
                padding: '11px 0',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '13.5px',
                transition: 'all 0.2s ease',
                backgroundColor: mode === m ? '#ff6b6b' : '#fff5f5',
                color:           mode === m ? '#ffffff'  : '#ff6b6b',
              }}
            >
              {m === 'login' ? '🔑 로그인' : '📝 회원가입'}
            </button>
          ))}
        </div>

        {/* ── 카드 ── */}
        <div style={{
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          padding: '24px 20px',
          boxShadow: '0 8px 30px rgba(255,107,107,0.08)',
          border: '1px solid #ffe3e3',
          boxSizing: 'border-box',
        }}>
          {mode === 'login'
            ? <LoginForm onLoginSuccess={onLoginSuccess} onSwitchToRegister={() => setMode('register')} />
            : <RegisterForm onSwitchToLogin={() => setMode('login')} />
          }
        </div>
      </div>
    </div>
  );
}
