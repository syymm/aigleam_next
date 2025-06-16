import React from 'react';
import { IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { styled, useTheme } from '@mui/material/styles';

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

interface SidebarHeaderProps {
  onNewConversation: () => void;
  onDrawerClose: () => void;
  isLoading?: boolean;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({ 
  onNewConversation, 
  onDrawerClose,
  isLoading = false 
}) => {
  const theme = useTheme();

  return (
    <DrawerHeader>
      <IconButton
        onClick={onNewConversation}
        disabled={isLoading}
      >
        <AddIcon />
      </IconButton>
      <IconButton onClick={onDrawerClose}>
        {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
      </IconButton>
    </DrawerHeader>
  );
};

export default SidebarHeader;