// PromptSelectionDialog.tsx
import React from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  List, 
  ListItem, 
  ListItemText, 
  Button 
} from '@mui/material';

interface Prompt {
  name: string;
  content: string;
}

interface PromptSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (prompt: Prompt) => void;
  prompts: Prompt[];
}

const PromptSelectionDialog: React.FC<PromptSelectionDialogProps> = ({ 
  open, 
  onClose, 
  onSelect, 
  prompts 
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>选择提示词</DialogTitle>
      <DialogContent>
        <List>
          {prompts.map((prompt, index) => (
            <ListItem button key={index} onClick={() => onSelect(prompt)}>
              <ListItemText primary={prompt.name} />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PromptSelectionDialog;