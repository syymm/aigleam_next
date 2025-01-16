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
  const [newName, setNewName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setNewName('');
      setError(null);
    }
  }, [isOpen]);

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
    if (event.key === 'Enter' && !isLoading && newName.trim()) {
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
            placeholder={currentName}
            type="text"
            fullWidth
            autoComplete="off"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyPress={handleKeyPress}
            error={Boolean(error)}
            helperText={error}
            disabled={isLoading}
            sx={{ 
              mt: 1,
              '& .MuiInputBase-input': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
              '& .MuiInputBase-input:focus': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
                '& fieldset': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
                '& input:-webkit-autofill': {
                  '-webkit-box-shadow': '0 0 0 100px rgba(0, 0, 0, 0.04) inset',
                  '-webkit-text-fill-color': 'inherit'
                }
              }
            }}
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