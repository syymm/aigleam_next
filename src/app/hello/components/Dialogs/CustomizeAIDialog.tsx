// CustomPromptLibrary.tsx
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
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material"
import { styled } from "@mui/material/styles"
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Save as SaveIcon } from "@mui/icons-material"

// iOS风格的样式组件
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

// 接口定义
export interface Prompt {
  id?: string
  name: string
  content: string
  userId?: number
  createdAt?: string
  updatedAt?: string
}

interface CustomPromptLibraryProps {
  open: boolean
  onClose: () => void
  onSave?: (prompts: Prompt[]) => Promise<void>
  initialPrompts?: Prompt[]
}

// 创建提示词上下文
const PromptContext = createContext<Prompt[]>([])

export const usePromptContext = () => {
  const context = useContext(PromptContext)
  if (context === undefined) {
    throw new Error('usePromptContext 必须在 PromptContext.Provider 内使用')
  }
  return context
}

const CustomPromptLibrary: React.FC<CustomPromptLibraryProps> = ({
  open,
  onClose,
  onSave,
  initialPrompts = [],
}) => {
  const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts)
  const [currentPrompt, setCurrentPrompt] = useState<Prompt>({ name: '', content: '' })
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // 获取提示词列表
  const fetchPrompts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/prompts')
      if (!response.ok) throw new Error('获取提示词失败')
      const data = await response.json()
      setPrompts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取提示词失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchPrompts()
    }
  }, [open])

  // 处理添加或更新提示词
  const handleAddOrUpdatePrompt = async () => {
    if (!currentPrompt.name.trim() || !currentPrompt.content.trim()) return

    try {
      setLoading(true)
      if (editingIndex !== null && currentPrompt.id) {
        // 更新现有提示词
        const response = await fetch(`/api/prompts/${currentPrompt.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: currentPrompt.name,
            content: currentPrompt.content,
          }),
        })
        if (!response.ok) throw new Error('更新提示词失败')
        setSuccess('提示词更新成功')
      } else {
        // 创建新提示词
        const response = await fetch('/api/prompts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: currentPrompt.name,
            content: currentPrompt.content,
          }),
        })
        if (!response.ok) throw new Error('创建提示词失败')
        setSuccess('提示词创建成功')
      }
      
      await fetchPrompts()
      if (onSave) {
        await onSave(prompts)
      }
      
      setCurrentPrompt({ name: '', content: '' })
      setEditingIndex(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
    } finally {
      setLoading(false)
    }
  }

  const handleEditPrompt = (index: number) => {
    setEditingIndex(index)
    setCurrentPrompt(prompts[index])
  }

  const handleDeletePrompt = async (index: number) => {
    try {
      setLoading(true)
      const promptId = prompts[index].id
      const response = await fetch(`/api/prompts/${promptId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('删除提示词失败')
      setSuccess('提示词删除成功')
      await fetchPrompts()
      if (onSave) {
        await onSave(prompts.filter((_, i) => i !== index))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setCurrentPrompt({ name: '', content: '' })
    setEditingIndex(null)
    onClose()
  }

  return (
    <PromptContext.Provider value={prompts}>
      <IOSDialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogTitle>提示词库 🏛️</DialogTitle>
        <DialogContent sx={{ px: 3, pb: 3, position: 'relative' }}>
          {loading && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(255, 255, 255, 0.7)',
                zIndex: 1,
              }}
            >
              <CircularProgress />
            </Box>
          )}
          <Grid container spacing={3} sx={{ mt: 0 }}>
            {/* 编辑区域 */}
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
                    disabled={loading}
                  />
                  <IOSTextField
                    fullWidth
                    placeholder="提示词内容"
                    multiline
                    rows={4}
                    value={currentPrompt.content}
                    onChange={(e) => setCurrentPrompt({ ...currentPrompt, content: e.target.value })}
                    disabled={loading}
                  />
                  <IOSButton
                    variant="contained"
                    fullWidth
                    onClick={handleAddOrUpdatePrompt}
                    disabled={loading || !currentPrompt.name.trim() || !currentPrompt.content.trim()}
                    startIcon={editingIndex !== null ? <SaveIcon /> : <AddIcon />}
                  >
                    {editingIndex !== null ? "保存修改" : "添加提示词"}
                  </IOSButton>
                </Box>
              </IOSPaper>
            </Grid>

            {/* 提示词列表 */}
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
                  {prompts.length === 0 ? (
                    <Typography 
                      sx={{ 
                        textAlign: 'center', 
                        color: 'text.secondary',
                        py: 4 
                      }}
                    >
                      还没有保存的提示词
                    </Typography>
                  ) : (
                    prompts.map((prompt, index) => (
                      <Box
                        key={prompt.id || index}
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
                            color: theme => theme.palette.text.primary,
                            cursor: 'pointer',
                            '&:hover': {
                              color: theme => theme.palette.primary.main,
                            }
                          }}
                          onClick={() => handleEditPrompt(index)}
                        >
                          {prompt.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditPrompt(index)}
                            disabled={loading}
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
                            disabled={loading}
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
                    ))
                  )}
                </Box>
              </IOSPaper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center' }}>
          <IOSButton 
            onClick={handleClose}
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

      {/* 错误提示 */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={3000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setError(null)} 
          severity="error" 
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>

      {/* 成功提示 */}
      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSuccess(null)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          {success}
        </Alert>
      </Snackbar>
    </PromptContext.Provider>
  )
}

export default CustomPromptLibrary