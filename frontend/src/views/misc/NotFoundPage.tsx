import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export function NotFoundPage() {
  const navigate = useNavigate();
  const accessToken = useAuthStore((state) => state.accessToken);
  
  const handleGoHome = () => {
    if (accessToken) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div style={{ padding: '4rem', textAlign: 'center' }}>
      <h1>404</h1>
      <p>Страница не найдена.</p>
      <button onClick={handleGoHome} style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
        {accessToken ? 'На главную' : 'На страницу входа'}
      </button>
    </div>
  );
}

