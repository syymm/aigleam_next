import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  List, 
  ListItem, 
  ListItemText, 
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  styled,
  alpha
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

// 样式组件保持与现有UI一致
const IOSDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 20,
    background: alpha(theme.palette.background.paper, 0.9),
    backdropFilter: 'blur(10px)',
  },
  '& .MuiDialogTitle-root': {
    textAlign: 'center',
    fontSize: '1.2rem',
    fontWeight: 600,
    padding: theme.spacing(3),
  },
}));

const IOSButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  padding: '10px 20px',
  textTransform: 'none',
  fontWeight: 600,
  boxShadow: 'none',
  '&:hover': {
    boxShadow: 'none',
  },
}));

interface Prompt {
  id?: string;
  name: string;
  content: string;
  userId?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface PromptSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (prompt: Prompt) => void;
  onOpenCustomize: () => void;
}

const PromptSelectionDialog: React.FC<PromptSelectionDialogProps> = ({ 
  open, 
  onClose, 
  onSelect,
  onOpenCustomize
}) => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取用户的提示词列表
  const fetchPrompts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/prompts');
      if (!response.ok) throw new Error('获取提示词失败');
      const data = await response.json();
      setPrompts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取提示词失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchPrompts();
    }
  }, [open]);

  // 选择提示词时直接传递完整的prompt对象
  const handleSelect = (prompt: Prompt) => {
    onSelect(prompt);
  };

  const handleOpenCustomize = () => {
    onClose();
    onOpenCustomize();
  };

  return (
    <IOSDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>选择提示词</DialogTitle>
      <DialogContent sx={{ position: 'relative', minHeight: 200 }}>
        {loading ? (
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            minHeight: 200
          }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        ) : prompts.length === 0 ? (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            minHeight: 200,
            gap: 2
          }}>
            <Typography color="text.secondary" align="center">
              您还没有创建任何提示词
            </Typography>
            <IOSButton
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCustomize}
            >
              创建新提示词
            </IOSButton>
          </Box>
        ) : (
          <List sx={{ 
            '& .MuiListItem-root': {
              borderRadius: 2,
              mb: 1,
              '&:hover': {
                bgcolor: theme => alpha(theme.palette.primary.main, 0.08),
              }
            }
          }}>
            {prompts.map((prompt) => (
              <ListItem 
                button 
                key={prompt.id} 
                onClick={() => handleSelect(prompt)}
                sx={{
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateX(4px)',
                  }
                }}
              >
                <ListItemText 
                  primary={prompt.name}
                  primaryTypographyProps={{
                    fontWeight: 500
                  }}
                  secondary={prompt.content}
                  secondaryTypographyProps={{
                    noWrap: true,
                    sx: { opacity: 0.7 }
                  }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center' }}>
        {prompts.length > 0 && (
          <IOSButton
            variant="outlined"
            onClick={handleOpenCustomize}
            sx={{ mr: 1 }}
          >
            管理提示词
          </IOSButton>
        )}
        <IOSButton 
          onClick={onClose}
          variant="outlined"
          sx={{ 
            minWidth: 100,
            borderWidth: 2,
            '&:hover': {
              borderWidth: 2,
            }
          }}
        >
          关闭
        </IOSButton>
      </DialogActions>
    </IOSDialog>
  );
};

export default PromptSelectionDialog;