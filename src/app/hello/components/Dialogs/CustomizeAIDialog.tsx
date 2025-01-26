import type React from "react"
import { useState, useEffect, createContext, useContext } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Chip,
  Stack,
  Box,
  IconButton,
  InputAdornment,
} from "@mui/material"
import SearchIcon from "@mui/icons-material/Search"

interface Prompt {
  name: string
  content: string
}

interface CustomPromptLibraryProps {
  open: boolean
  onClose: () => void
  onSave: (prompts: Prompt[]) => void
  initialPrompts: Prompt[]
}

// 创建一个上下文来存储提示词
const PromptContext = createContext<Prompt[]>([])

export const usePromptContext = () => useContext(PromptContext)

const CustomPromptLibrary: React.FC<CustomPromptLibraryProps> = ({ open, onClose, onSave, initialPrompts }) => {
  const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts)
  const [nameInput, setNameInput] = useState("")
  const [contentInput, setContentInput] = useState("")
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (open) {
      setPrompts(initialPrompts)
    }
  }, [open, initialPrompts])

  const handleAddPrompt = () => {
    if (nameInput.trim() && contentInput.trim()) {
      setPrompts((prev) => [...prev, { name: nameInput.trim(), content: contentInput.trim() }])
      setNameInput("")
      setContentInput("")
    }
  }

  const handleEditPrompt = (index: number) => {
    setEditingIndex(index)
    setNameInput(prompts[index].name)
    setContentInput(prompts[index].content)
  }

  const handlePromptSave = () => {
    if (editingIndex !== null) {
      const newPrompts = [...prompts]
      newPrompts[editingIndex] = { name: nameInput, content: contentInput }
      setPrompts(newPrompts)
      setEditingIndex(null)
      setNameInput("")
      setContentInput("")
    }
  }

  const handleDeletePrompt = (index: number) => {
    const newPrompts = prompts.filter((_, i) => i !== index)
    setPrompts(newPrompts)
  }

  const handleSave = () => {
    onSave(prompts)
    onClose()
  }

  const filteredPrompts = prompts.filter((prompt) => prompt.name.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <PromptContext.Provider value={prompts}>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>我的提示词库</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="搜索提示词"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <TextField fullWidth label="提示词名称" value={nameInput} onChange={(e) => setNameInput(e.target.value)} />
            <TextField
              fullWidth
              label="提示词内容"
              value={contentInput}
              onChange={(e) => setContentInput(e.target.value)}
              multiline
              rows={4}
            />
            <Button onClick={handleAddPrompt} variant="contained">
              添加提示词
            </Button>
            <Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                {filteredPrompts.map((prompt, index) => (
                  <Chip
                    key={index}
                    label={prompt.name}
                    onClick={() => handleEditPrompt(index)}
                    onDelete={() => handleDeletePrompt(index)}
                    deleteIcon={<span style={{ fontSize: "1.2rem" }}>×</span>}
                    clickable
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>取消</Button>
          <Button onClick={handleSave} variant="contained">
            保存
          </Button>
        </DialogActions>

        {editingIndex !== null && (
          <Dialog open={true} onClose={() => setEditingIndex(null)}>
            <DialogTitle>编辑提示词</DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="提示词名称"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                />
                <TextField
                  fullWidth
                  label="提示词内容"
                  value={contentInput}
                  onChange={(e) => setContentInput(e.target.value)}
                  multiline
                  rows={4}
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditingIndex(null)}>取消</Button>
              <Button onClick={handlePromptSave} variant="contained">
                保存
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </Dialog>
    </PromptContext.Provider>
  )
}

export default CustomPromptLibrary