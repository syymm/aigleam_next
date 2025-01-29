import type React from "react"
import { useState, useEffect, createContext, useContext } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Paper,
  Typography,
  IconButton,
  Grid,
  alpha,
} from "@mui/material"
import { styled } from "@mui/material/styles"
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Save as SaveIcon } from "@mui/icons-material"

// 自定义样式组件
const IOSDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 20,
    background: alpha(theme.palette.background.paper, 0.9),
    backdropFilter: 'blur(10px)',
  },
  '& .MuiDialogTitle-root': {
    textAlign: 'center',
    fontSize: '1.5rem',
    fontWeight: 600,
    padding: theme.spacing(3),
  },
}))

const IOSPaper = styled(Paper)(({ theme }) => ({
  borderRadius: 16,
  background: alpha(theme.palette.background.paper, 0.8),
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: `0 4px 30px ${alpha(theme.palette.common.black, 0.1)}`,
}))

const IOSTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 12,
    backgroundColor: alpha(theme.palette.common.white, 0.06),
    '& fieldset': {
      borderColor: alpha(theme.palette.divider, 0.2),
    },
    '&:hover fieldset': {
      borderColor: alpha(theme.palette.primary.main, 0.3),
    },
  },
}))

const IOSButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  padding: '10px 20px',
  textTransform: 'none',
  fontWeight: 600,
  boxShadow: 'none',
  '&:hover': {
    boxShadow: 'none',
  },
}))

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

const PromptContext = createContext<Prompt[]>([])

export const usePromptContext = () => {
  const context = useContext(PromptContext)
  if (context === undefined) {
    throw new Error('usePromptContext must be used within a PromptContext.Provider')
  }
  return context
}

const CustomPromptLibrary: React.FC<CustomPromptLibraryProps> = ({
  open,
  onClose,
  onSave,
  initialPrompts
}) => {
  const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts)
  const [currentPrompt, setCurrentPrompt] = useState<Prompt>({ name: '', content: '' })
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  useEffect(() => {
    if (open) {
      setPrompts(initialPrompts)
    }
  }, [open, initialPrompts])

  const handleAddOrUpdatePrompt = () => {
    if (currentPrompt.name.trim() && currentPrompt.content.trim()) {
      if (editingIndex !== null) {
        const newPrompts = [...prompts]
        newPrompts[editingIndex] = { ...currentPrompt }
        setPrompts(newPrompts)
        setEditingIndex(null)
      } else {
        setPrompts([...prompts, { ...currentPrompt }])
      }
      setCurrentPrompt({ name: '', content: '' })
    }
  }

  const handleEditPrompt = (index: number) => {
    setEditingIndex(index)
    setCurrentPrompt(prompts[index])
  }

  const handleDeletePrompt = (index: number) => {
    setPrompts(prompts.filter((_, i) => i !== index))
  }

  const handleClose = () => {
    onSave(prompts)
    onClose()
  }

  return (
    <PromptContext.Provider value={prompts}>
      <IOSDialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogTitle>提示词库 🏛️</DialogTitle>
        <DialogContent sx={{ px: 3, pb: 3 }}>
          <Grid container spacing={3} sx={{ mt: 0 }}>
            {/* 左侧编辑区域 */}
            <Grid item xs={12} md={6}>
              <IOSPaper sx={{ p: 3, height: '100%' }}>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    color: theme => theme.palette.text.primary 
                  }}
                >
                  {editingIndex !== null ? "编辑提示词" : "添加提示词"}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <IOSTextField
                    fullWidth
                    placeholder="提示词名称"
                    value={currentPrompt.name}
                    onChange={(e) => setCurrentPrompt({ ...currentPrompt, name: e.target.value })}
                    variant="outlined"
                  />
                  <IOSTextField
                    fullWidth
                    placeholder="提示词内容"
                    multiline
                    rows={4}
                    value={currentPrompt.content}
                    onChange={(e) => setCurrentPrompt({ ...currentPrompt, content: e.target.value })}
                    variant="outlined"
                  />
                  <IOSButton
                    variant="contained"
                    fullWidth
                    onClick={handleAddOrUpdatePrompt}
                    disabled={!currentPrompt.name.trim() || !currentPrompt.content.trim()}
                    startIcon={editingIndex !== null ? <SaveIcon /> : <AddIcon />}
                    sx={{ mt: 1 }}
                  >
                    {editingIndex !== null ? "保存修改" : "添加提示词"}
                  </IOSButton>
                </Box>
              </IOSPaper>
            </Grid>

            {/* 右侧列表区域 */}
            <Grid item xs={12} md={6}>
              <IOSPaper sx={{ p: 3, height: '100%' }}>
                <Typography 
                  variant="h6" 
                  gutterBottom
                  sx={{ 
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    color: theme => theme.palette.text.primary 
                  }}
                >
                  已保存的提示词
                </Typography>
                <Box sx={{ 
                  maxHeight: 400, 
                  overflow: 'auto',
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    borderRadius: '4px',
                    backgroundColor: theme => alpha(theme.palette.text.primary, 0.2),
                  },
                }}>
                  {prompts.map((prompt, index) => (
                    <Box
                      key={index}
                      sx={{
                        p: 2,
                        mb: 1.5,
                        borderRadius: 3,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        bgcolor: theme => alpha(theme.palette.background.default, 0.6),
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: theme => alpha(theme.palette.action.hover, 0.1),
                          transform: 'translateX(4px)',
                        },
                      }}
                    >
                      <Typography 
                        noWrap 
                        sx={{ 
                          flex: 1,
                          fontWeight: 500,
                          color: theme => theme.palette.text.primary
                        }}
                      >
                        {prompt.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleEditPrompt(index)}
                          sx={{ 
                            color: theme => theme.palette.primary.main,
                            '&:hover': {
                              bgcolor: theme => alpha(theme.palette.primary.main, 0.1),
                            }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeletePrompt(index)}
                          sx={{ 
                            color: theme => theme.palette.error.main,
                            '&:hover': {
                              bgcolor: theme => alpha(theme.palette.error.main, 0.1),
                            }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </IOSPaper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center' }}>
          <IOSButton 
            onClick={onClose}
            variant="outlined" 
            sx={{ 
              minWidth: 120,
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
    </PromptContext.Provider>
  )
}

export default CustomPromptLibrary