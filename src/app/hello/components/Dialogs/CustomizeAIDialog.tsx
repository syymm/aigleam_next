import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Chip,
  Stack,
  InputLabel,
  Box,
  Typography
} from '@mui/material';
import { Autorenew } from '@mui/icons-material';

export interface AISettings {
  name: string;
  role: string;
  traits: string[];
  additionalInfo: string;
}

interface CustomizeAIDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (settings: AISettings) => void;
  initialSettings: AISettings;
}

const ALL_TRAITS = [
  '健谈', '友善', '有主见', '直言不讳', 'Z 世代', '敏锐性', '怀疑', '富有共鸣',
  '幽默', '严谨', '创新', '耐心', '活力', '专注', '理性', '感性', '务实',
  '浪漫', '谨慎', '大胆', '细心', '随性', '乐观', '稳重'
];

const getRandomTraits = () => {
  const shuffled = [...ALL_TRAITS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 8); // 随机返回8个特征
};

const CustomizeAIDialog: React.FC<CustomizeAIDialogProps> = ({
  open,
  onClose,
  onSave,
  initialSettings
}) => {
  const [settings, setSettings] = useState<AISettings>(initialSettings);
  const [presetTraits, setPresetTraits] = useState(ALL_TRAITS.slice(0, 8));
  const [traitsInput, setTraitsInput] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (open) {
      setSettings(initialSettings);
      setTraitsInput(initialSettings.traits.join('、'));
    }
  }, [open, initialSettings]);

  const handleTraitToggle = (trait: string) => {
    const newTraits = settings.traits.includes(trait)
      ? settings.traits.filter(t => t !== trait)
      : [...settings.traits, trait];
    
    setSettings(prev => ({
      ...prev,
      traits: newTraits
    }));
    setTraitsInput(newTraits.join('、'));
  };

  const handleTraitsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTraitsInput(e.target.value);
    // 将输入框中的文本按顿号或逗号分割成数组
    const newTraits = e.target.value.split(/[、,，]/).filter(t => t.trim());
    setSettings(prev => ({
      ...prev,
      traits: newTraits
    }));
  };

  const handleRandomizeTraits = () => {
    setPresetTraits(getRandomTraits());
  };

  const handleSave = () => {
    onSave(settings);
    setHasChanges(false);
    onClose();
  };

  const handleCloseRequest = () => {
    if (hasChanges) {
      setShowConfirmDialog(true);
    } else {
      setSettings(initialSettings);
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setShowConfirmDialog(false);
    setSettings(initialSettings);
    onClose();
  };

  const handleSettingsChange = (newSettings: Partial<AISettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    setHasChanges(true);
  };

  return (
    <>
      <Dialog open={open} onClose={handleCloseRequest} maxWidth="sm" fullWidth>
        <DialogTitle>自定义 ChatGPT</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="ChatGPT 应该怎么称呼您?"
              value={settings.name}
              onChange={(e) => handleSettingsChange({ name: e.target.value })}
            />
            
            <TextField
              fullWidth
              label="您是做什么的?"
              value={settings.role}
              onChange={(e) => handleSettingsChange({ role: e.target.value })}
            />

            <Box>
              <InputLabel sx={{ mb: 1 }}>ChatGPT 应该具备哪些特征？</InputLabel>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="性格特征"
                  value={traitsInput}
                  onChange={handleTraitsInputChange}
                  helperText="可以直接输入或编辑，用顿号、逗号分隔"
                />
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                  {presetTraits.map((trait) => (
                    <Chip
                      key={trait}
                      label={trait}
                      onClick={() => handleTraitToggle(trait)}
                      color={settings.traits.includes(trait) ? "primary" : "default"}
                      clickable
                    />
                  ))}
                  <Chip
                    icon={<Autorenew />}
                    label="换一批"
                    onClick={handleRandomizeTraits}
                    variant="outlined"
                    clickable
                  />
                </Stack>
              </Stack>
            </Box>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="ChatGPT 还需要了解您的其他信息吗?"
              value={settings.additionalInfo}
              onChange={(e) => handleSettingsChange({ additionalInfo: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRequest}>取消</Button>
          <Button onClick={handleSave} variant="contained">保存</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogContent>
          <Typography>您有未保存的更改。</Typography>
          <Typography>确定要退出吗？您所做的全部更改都将永久丢失。</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)}>返回</Button>
          <Button 
            onClick={handleConfirmClose}
            color="error"
          >
            退出
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CustomizeAIDialog; 