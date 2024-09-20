import React from 'react';
import { Box, Typography, Button, Grid, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';

interface WelcomeScreenProps {
  onStartNewChat: () => void;
}

const LogoBox = styled(Box)(({ theme }) => ({
  width: 100,
  height: 100,
  backgroundColor: theme.palette.primary.main,
  borderRadius: '50%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: theme.spacing(4),
}));

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStartNewChat }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        p: 4,
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
      }}
    >
      <LogoBox>
        <Typography variant="h3" color="white">
          AI
        </Typography>
      </LogoBox>
      <Typography variant="h4" gutterBottom>
        欢迎使用 AI 助手
      </Typography>
      <Typography variant="body1" gutterBottom align="center" color="text.secondary">
        开始一个新的对话，或者从以下选项中选择：
      </Typography>
      <Grid container spacing={2} sx={{ mt: 4, maxWidth: 600 }}>
        <Grid item xs={12} sm={6}>
          <Button variant="contained" fullWidth onClick={onStartNewChat} color="primary">
            开始新对话
          </Button>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Button variant="outlined" fullWidth color="primary">
            查看使用指南
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default WelcomeScreen;