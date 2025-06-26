import { useState } from 'react';
import Card from '../components/ui/Card';
import LoginForm from '../components/auth/LoginForm';
import SignupForm from '../components/auth/SignupForm';
import ResetPasswordForm from '../components/auth/ResetPasswordForm';

function Login() {
  const [activeForm, setActiveForm] = useState('login');

  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        {activeForm === 'login' && (
          <LoginForm 
            onToggleSignup={() => setActiveForm('signup')}
            onToggleReset={() => setActiveForm('reset')}
          />
        )}
        
        {activeForm === 'signup' && (
          <SignupForm 
            onToggleLogin={() => setActiveForm('login')}
          />
        )}
        
        {activeForm === 'reset' && (
          <ResetPasswordForm 
            onToggleLogin={() => setActiveForm('login')}
          />
        )}
      </Card>
    </div>
  );
}

export default Login;