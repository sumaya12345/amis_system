import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// Reusable password field with a show/hide eye toggle. Wraps a plain
// <input type="password"> so existing value/onChange/style usage keeps working.
export default function PasswordInput({ style, ...inputProps }) {
  const [visible, setVisible] = useState(false);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        {...inputProps}
        type={visible ? 'text' : 'password'}
        style={{ ...style, paddingRight: '36px', width: '100%', boxSizing: 'border-box' }}
      />
      <button
        type="button"
        onClick={() => setVisible((prev) => !prev)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        title={visible ? 'Hide password' : 'Show password'}
        style={{
          position: 'absolute',
          right: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          padding: '2px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          color: '#6b7280',
        }}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
