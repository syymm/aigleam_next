import DynamicBackground from '../component/DynamicBackground'
import LoginComponent from './LoginComponent';
import './Login.css';

const LoginPage: React.FC = () => {
  return (
    <div className="loginpage">
      <DynamicBackground id="loginbg" />
      <LoginComponent />
    </div>
  );
};

export default LoginPage;
