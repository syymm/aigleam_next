import React, { useState, useRef } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button,
  Box,
  IconButton
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';

interface AvatarEditDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (file: File) => void;
}

const PreviewBox = styled(Box)(({ theme }) => ({
  width: '200px',
  height: '200px',
  border: `2px dashed ${theme.palette.divider}`,
  borderRadius: '50%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  margin: '20px auto',
  position: 'relative',
  overflow: 'hidden',
  cursor: 'pointer',
}));

const HiddenInput = styled('input')({
  display: 'none',
});

const PreviewImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
});

const AvatarEditDialog: React.FC<AvatarEditDialogProps> = ({ open, onClose, onSave }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (selectedFile) {
      onSave(selectedFile);
      onClose();
    }
  };

  const handleBoxClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>更改头像</DialogTitle>
      <DialogContent>
        <PreviewBox onClick={handleBoxClick}>
          {previewUrl ? (
            <PreviewImage src={previewUrl} alt="Avatar preview" />
          ) : (
            <IconButton>
              <AddPhotoAlternateIcon />
            </IconButton>
          )}
        </PreviewBox>
        <HiddenInput
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button 
          onClick={handleSave}
          disabled={!selectedFile}
          variant="contained"
        >
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AvatarEditDialog; 