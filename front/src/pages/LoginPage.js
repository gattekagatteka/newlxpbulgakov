import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useAuth } from '../auth/AuthContext';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('teacher1');
  const [password, setPassword] = useState('teacher');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from || '/';

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(username, password);
      navigate(from, { replace: true });
    } catch (_) {
      setError('Неверный логин или пароль');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pageWrap">
      <h1 className="pageTitle">Вход</h1>
      <Card className="loginCard">
        <form className="form" onSubmit={onSubmit}>
          <label className="label">
            Логин
            <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} />
          </label>
          <label className="label">
            Пароль
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {error ? <div className="formError">{error}</div> : null}
          <Button type="submit" disabled={loading} className="wideBtn">
            Войти
          </Button>
        </form>
      </Card>

      <div className="loginHint">
        teacher1..teacher5 / teacher
        <br />
        student1..student15 / student
      </div>
    </div>
  );
}
