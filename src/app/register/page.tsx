import DynamicBackground from '../component/DynamicBackground'
import RegisterComponent from './RegisterComponent';
import './Register.css';

const RegisterPage: React.FC = () => {
  return (
    <div className="registerpage">
      <DynamicBackground id="registerbg" />
      <RegisterComponent />
    </div>
  );
}

export default RegisterPage;