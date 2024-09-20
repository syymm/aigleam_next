import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';

interface RenameDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRename: (newName: string) => void;
  currentName: string;
}

const RenameDialog: React.FC<RenameDialogProps> = ({ isOpen, onClose, onRename, currentName }) => {
  const [newName, setNewName] = useState(currentName);

  const handleRename = () => {
    if (newName.trim() !== '') {
      onRename(newName.trim());
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogTitle>重命名对话</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="新名称"
          type="text"
          fullWidth
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={handleRename}>确认</Button>
      </DialogActions>
    </Dialog>
  );
};

export default RenameDialog;