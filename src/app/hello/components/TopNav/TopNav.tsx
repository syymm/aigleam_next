import React from 'react';
import { styled } from '@mui/material/styles';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import { useTheme } from '@mui/material/styles';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ModelSelect from './ModelSelect';
import UserAvatar from './UserAvatar';

const drawerWidth = 240;

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  backgroundColor: theme.palette.background.default,
  color: theme.palette.text.primary,
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

interface TopNavProps {
  open: boolean;
  handleDrawerOpen: () => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  onThemeToggle: () => void;
  onUpgrade: () => void;
  isDarkMode: boolean;
}

const TopNav: React.FC<TopNavProps> = ({ 
  open, 
  handleDrawerOpen, 
  selectedModel, 
  setSelectedModel, 
  onThemeToggle,
  onUpgrade,
  isDarkMode
}) => {
  const theme = useTheme();
  
  return (
    <AppBar position="fixed" open={open} elevation={0} sx={{ backgroundColor: theme.palette.background.default }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{ 
              ...(open && { display: 'none' }),
              padding: '20px',
              width: '40px',    // 设置固定宽度
              height: '40px',   // 设置固定高度 
              '& .MuiSvgIcon-root': {
                fontSize: '1.8rem',
              }
            }}
          >
            <MenuIcon />
          </IconButton>
          <ModelSelect selectedModel={selectedModel} setSelectedModel={setSelectedModel}/>
        </div>
        <UserAvatar
          onThemeToggle={onThemeToggle}
          onUpgrade={onUpgrade}
          isDarkMode={isDarkMode}
        />
      </Toolbar>
    </AppBar>
  );
};

export default TopNav;