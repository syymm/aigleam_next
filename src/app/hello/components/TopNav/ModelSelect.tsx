import React from 'react';
import { Select, MenuItem, FormControl, InputLabel } from '@mui/material';

interface ModelSelectProps {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
}

const ModelSelect: React.FC<ModelSelectProps> = ({ selectedModel, setSelectedModel }) => {
  return (
    <FormControl sx={{ m: 1, minWidth: 120 }}>
      <InputLabel id="model-select-label">模型</InputLabel>
      <Select
        labelId="model-select-label"
        id="model-select"
        value={selectedModel}
        label="模型"
        onChange={(e) => setSelectedModel(e.target.value as string)}
      >
        <MenuItem value="gpt-3.5-turbo">GPT-3.5-Turbo</MenuItem>
        <MenuItem value="gpt-4">GPT-4</MenuItem>
      </Select>
    </FormControl>
  );
};

export default ModelSelect;