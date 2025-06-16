import DynamicBackground from '../component/DynamicBackground'
import ForgotPasswordComponent from './ForgotPasswordComponent';
import './ForgotPassword.css';

const ForgotPasswordPage: React.FC = () => {
  return (
    <div className="forgotpasswordpage">
      <DynamicBackground id="forgotpasswordbg" />
      <ForgotPasswordComponent />
    </div>
  );
};

export default ForgotPasswordPage;