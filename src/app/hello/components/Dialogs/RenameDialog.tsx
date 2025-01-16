import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Button,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';

interface RenameDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRename: (newName: string) => Promise<void>;
  currentName: string;
}

const RenameDialog: React.FC<RenameDialogProps> = ({ 
  isOpen, 
  onClose, 
  onRename, 
  currentName 
}) => {
  const [newName, setNewName] = useState(currentName);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setNewName(currentName);
      setError(null);
    }
  }, [isOpen, currentName]);

  const handleRename = async () => {
    console.log('RenameDialog handleRename called');
    const trimmedName = newName.trim();
    
    if (trimmedName === '') {
      setError('名称不能为空');
      return;
    }

    if (trimmedName === currentName) {
      onClose();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Calling onRename with:', trimmedName);
      await onRename(trimmedName);
      onClose();
    } catch (err) {
      console.error('RenameDialog error:', err);
      setError('重命名失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !isLoading) {
      handleRename();
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <>
      <Dialog 
        open={isOpen} 
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
      >
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
            onKeyPress={handleKeyPress}
            error={Boolean(error)}
            helperText={error}
            disabled={isLoading}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleClose} 
            disabled={isLoading}
          >
            取消
          </Button>
          <Button 
            onClick={handleRename}
            disabled={isLoading || !newName.trim()}
            variant="contained"
          >
            {isLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              '确认'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={Boolean(error)} 
        autoHideDuration={3000} 
        onClose={() => setError(null)}
      >
        <Alert 
          onClose={() => setError(null)} 
          severity="error" 
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default RenameDialog;