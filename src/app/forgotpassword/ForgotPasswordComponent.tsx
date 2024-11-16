'use client';

import React, { useState } from 'react';
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Check from '@mui/icons-material/Check';
import StepConnector, { stepConnectorClasses } from '@mui/material/StepConnector';
import Button from '@mui/material/Button';
import SendIcon from '@mui/icons-material/Send';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Link from 'next/link';
import InputBase from '@mui/material/InputBase';
import { StepIconProps } from '@mui/material/StepIcon';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import './ForgotPasswordComponent.css';

const QontoConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 10,
    left: 'calc(-50% + 16px)',
    right: 'calc(50% + 16px)',
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: '#784af4',
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: '#784af4',
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : '#eaeaf0',
    borderTopWidth: 3,
    borderRadius: 1,
  },
}));

const QontoStepIconRoot = styled('div')<{ ownerState: { active?: boolean } }>(
  ({ theme, ownerState }) => ({
    color: theme.palette.mode === 'dark' ? theme.palette.grey[700] : '#eaeaf0',
    display: 'flex',
    height: 22,
    alignItems: 'center',
    ...(ownerState.active && {
      color: '#784af4',
    }),
    '& .QontoStepIcon-completedIcon': {
      color: '#784af4',
      zIndex: 1,
      fontSize: 18,
    },
    '& .QontoStepIcon-circle': {
      width: 8,
      height: 8,
      borderRadius: '50%',
      backgroundColor: 'currentColor',
    },
  }),
);

function QontoStepIcon(props: StepIconProps) {
  const { active, completed, className } = props;

  return (
    <QontoStepIconRoot ownerState={{ active }} className={className}>
      {completed ? (
        <Check className="QontoStepIcon-completedIcon" />
      ) : (
        <div className="QontoStepIcon-circle" />
      )}
    </QontoStepIconRoot>
  );
}

const steps = ['确认账号', '重置密码', '重置成功'];

const ForgotPasswordComponent: React.FC = () => {
  const theme = createTheme({
    palette: {
      primary: {
        main: '#7E57C2',
      },
    },
  });

  const [activeStep, setActiveStep] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [isCodeSending, setIsCodeSending] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'error' as 'error' | 'success'
  });

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // 添加密码字段验证函数
  const validatePasswordFields = () => {
    if (!password.trim()) {
      setSnackbar({
        open: true,
        message: '请输入新密码',
        severity: 'error'
      });
      return false;
    }

    if (password.length < 6) {
      setSnackbar({
        open: true,
        message: '密码长度不能少于6位',
        severity: 'error'
      });
      return false;
    }

    if (!confirmPassword.trim()) {
      setSnackbar({
        open: true,
        message: '请输入确认密码',
        severity: 'error'
      });
      return false;
    }

    if (password !== confirmPassword) {
      setSnackbar({
        open: true,
        message: '两次输入的密码不一致',
        severity: 'error'
      });
      return false;
    }

    return true;
  };

  const handleSendVerificationCode = async () => {
    // 如果在第二步，先验证密码相关字段
    if (activeStep === 1) {
      if (!validatePasswordFields()) {
        return;
      }
    }

    // 邮箱格式验证
    if (!email || !validateEmail(email)) {
      setSnackbar({
        open: true,
        message: '请输入有效的邮箱地址',
        severity: 'error'
      });
      return;
    }

    setIsCodeSending(true);
    try {
      const response = await fetch('/api/send-verification-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setSnackbar({
        open: true,
        message: '验证码已发送，请检查您的邮箱',
        severity: 'success'
      });
    } catch (error) {
      console.error('发送验证码时出错:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : '发送验证码失败，请稍后再试',
        severity: 'error'
      });
    } finally {
      setIsCodeSending(false);
    }
  };

  const handleNext = async () => {
    if (activeStep === 0) {
      // 邮箱验证步骤
      if (!email.trim()) {
        setSnackbar({
          open: true,
          message: '邮箱不能为空',
          severity: 'error'
        });
        return;
      }

      if (!validateEmail(email)) {
        setSnackbar({
          open: true,
          message: '邮箱格式错误',
          severity: 'error'
        });
        return;
      }

      try {
        const response = await fetch('/api/forgotpassword', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            step: 1,
            email
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error);
        }

        setUserId(data.userId);
        setActiveStep((prevActiveStep) => prevActiveStep + 1);

      } catch (error) {
        setSnackbar({
          open: true,
          message: error instanceof Error ? error.message : '验证失败',
          severity: 'error'
        });
      }
    } else if (activeStep === 1) {
      // 步骤2: 密码重置
      if (!validatePasswordFields()) {
        return;
      }

      if (!verificationCode.trim()) {
        setSnackbar({
          open: true,
          message: '请输入验证码',
          severity: 'error'
        });
        return;
      }

      try {
        const response = await fetch('/api/forgotpassword', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            step: 2,
            email,
            password,
            confirmPassword,
            verificationCode,
            userId
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error);
        }

        setSnackbar({
          open: true,
          message: '密码重置成功',
          severity: 'success'
        });
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
      } catch (error) {
        setSnackbar({
          open: true,
          message: error instanceof Error ? error.message : '密码重置失败',
          severity: 'error'
        });
      }
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword((show) => !show);
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <br />
            <TextField
              sx={{ bgcolor: 'white', height: '40px', width: '60%' }}
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              variant="outlined"
              size="small"
            />
            <br />
          </Box>
        );
      case 1:
        return (
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <TextField
              sx={{ bgcolor: 'white', marginTop: '0px', height: '40px', width: '60%' }}
              label="新密码"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              variant="outlined"
              size="small"
              margin="normal"
              autoComplete="new-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                      style={{ backgroundColor: 'transparent', padding: 0, margin: 'auto 0', top: '50%', transform: 'translateY(-50%)', color: '#666' }}
                    >
                      {showPassword ? <VisibilityOff style={{ fontSize: 24 }} /> : <Visibility style={{ fontSize: 24 }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              sx={{ bgcolor: 'white', marginTop: '0px', height: '40px', width: '60%' }}
              label="确认密码"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              variant="outlined"
              size="small"
              margin="normal"
              autoComplete="new-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                      style={{ backgroundColor: 'transparent', padding: 0, margin: 'auto 0', top: '50%', transform: 'translateY(-50%)', color: '#666' }}
                    >
                      {showPassword ? <VisibilityOff style={{ fontSize: 24 }} /> : <Visibility style={{ fontSize: 24 }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              sx={{ bgcolor: 'white', marginTop: '0px', height: '40px', width: '60%' }}
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              variant="outlined"
              size="small"
              margin="normal"
              disabled
            />
            <InputBase
              sx={{
                bgcolor: 'white',
                padding: '0 10px',
                display: 'flex',
                alignItems: 'center',
                height: '40px',
                width: '60%',
                border: '1px solid #d1d1d1',
                borderRadius: '4px',
              }}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="验证码"
              endAdornment={
                <><Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
                  <Button
                    id="customButton"
                    variant="text"
                    size='small'
                    onClick={handleSendVerificationCode}
                    disabled={isCodeSending}
                    endIcon={<SendIcon sx={{ color: '#6200ea' }} />}
                    sx={{
                      height: '100%',
                      ml: 1,
                      color: '#6200ea',
                      backgroundColor: 'transparent',
                      boxShadow: 'none',
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      whiteSpace: 'nowrap',
                      minWidth: 'auto',
                      padding: '0 8px',
                      '&:hover': {
                        backgroundColor: 'transparent',
                        boxShadow: 'none'
                      }
                    }}
                  >
                    {isCodeSending ? '发送中...' : '发送'}
                  </Button>
                </>
              }
            />
          </Box>
        );
      case 2:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <Typography sx={{ mt: 2, mb: 1 }}>密码重置成功！</Typography>
            <Button
              component={Link}
              href="/login"
              variant="contained"
              sx={{ width: '250px', height: '50px', alignSelf: 'center' }}
            >
              返回登录
            </Button>
          </Box>
        );
      default:
        return '未知步骤';
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <div className="forgotpassword-component">
        <div className="forgotpassword-form">
          <h1>忘记密码了？</h1>
          <Box sx={{ width: '100%', mt: 1 }}>
            <Stack spacing={4}>
              <Stepper
                alternativeLabel
                activeStep={activeStep}
                connector={<QontoConnector />}
              >
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel StepIconComponent={QontoStepIcon}>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {getStepContent(activeStep)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                {activeStep < steps.length - 1 && (
                  <Button
                    onClick={handleNext}
                    variant="contained"
                    sx={{ width: '250px', height: '50px' }}
                  >
                    下一步
                  </Button>
                )}
              </Box>
            </Stack>
          </Box>
        </div>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </div>
    </ThemeProvider>
  );
};

export default ForgotPasswordComponent;