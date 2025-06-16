import React from 'react';
import { MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { AccountCircle } from '@mui/icons-material';

interface UpgradeButtonProps {
  onUpgrade: () => void;
}

const UpgradeButton: React.FC<UpgradeButtonProps> = ({ onUpgrade }) => {
  return (
    <MenuItem onClick={onUpgrade}>
      <ListItemIcon>
        <AccountCircle />
      </ListItemIcon>
      <ListItemText primary="升级套餐" />
    </MenuItem>
  );
};

export default UpgradeButton;
