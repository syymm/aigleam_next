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
        sx={{
          padding: '20px',
          width: '40px',    // 设置固定宽度
          height: '40px',   // 设置固定高度 
          '& .MuiSvgIcon-root': {
            fontSize: '2rem'
          }
        }}
      >
        <AddIcon />
      </IconButton>
    </Tooltip>
  );
};

export default SidebarHeader;