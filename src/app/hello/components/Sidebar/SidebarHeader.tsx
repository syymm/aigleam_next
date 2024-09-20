import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

interface SidebarHeaderProps {
  onNewConversation: () => void;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({ onNewConversation }) => {
  return (
    <Tooltip title="新建聊天" placement="right">
      <IconButton
        color="primary"
        onClick={onNewConversation}
        size="large"
      >
        <AddIcon />
      </IconButton>
    </Tooltip>
  );
};

export default SidebarHeader;