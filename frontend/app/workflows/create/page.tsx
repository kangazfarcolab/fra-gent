"use client";

import React, { useState } from 'react';
import { createTranslationWorkflow, createSummarizationWorkflow } from '../../templates/translation-workflow';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  FormControlLabel,
  Switch,
  Chip,
  IconButton,
  CircularProgress,
  Divider,
  MenuItem,
  Select,
  InputLabel,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import Link from 'next/link';

export default function CreateWorkflowPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [workflowType, setWorkflowType] = useState('translation');
  const [targetLanguage, setTargetLanguage] = useState('Spanish');

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Workflow name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create a workflow based on the selected type
      let workflowData;

      if (workflowType === 'translation') {
        // Translation workflow
        workflowData = createTranslationWorkflow(name, targetLanguage);
      } else if (workflowType === 'summarization') {
        // Summarization workflow
        workflowData = createSummarizationWorkflow(name);
      } else {
        // Default to translation
        workflowData = createTranslationWorkflow(name, 'English');
      }

      // Add description and tags
      workflowData.description = description || workflowData.description;
      if (tags.length > 0) {
        workflowData.tags = [...new Set([...workflowData.tags, ...tags])];
      }
      workflowData.is_public = isPublic;

      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflowData),
      });

      if (!response.ok) {
        throw new Error('Failed to create workflow');
      }

      const data = await response.json();
      router.push('/workflows');
    } catch (error) {
      console.error('Error creating workflow:', error);
      setError('Failed to create workflow. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          component={Link}
          href="/workflows"
          startIcon={<ArrowBackIcon />}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" component="h1">
          Create Workflow
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Workflow Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            margin="normal"
            error={!!error && !name.trim()}
            helperText={error && !name.trim() ? error : ''}
          />

          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
            margin="normal"
          />

          <FormControl fullWidth margin="normal">
            <InputLabel id="workflow-type-label">Workflow Type</InputLabel>
            <Select
              labelId="workflow-type-label"
              value={workflowType}
              label="Workflow Type"
              onChange={(e) => setWorkflowType(e.target.value)}
            >
              <MenuItem value="translation">Translation</MenuItem>
              <MenuItem value="summarization">Summarization</MenuItem>
            </Select>
          </FormControl>

          {workflowType === 'translation' && (
            <FormControl fullWidth margin="normal">
              <InputLabel id="target-language-label">Target Language</InputLabel>
              <Select
                labelId="target-language-label"
                value={targetLanguage}
                label="Target Language"
                onChange={(e) => setTargetLanguage(e.target.value)}
              >
                <MenuItem value="Spanish">Spanish</MenuItem>
                <MenuItem value="French">French</MenuItem>
                <MenuItem value="German">German</MenuItem>
                <MenuItem value="Italian">Italian</MenuItem>
                <MenuItem value="Portuguese">Portuguese</MenuItem>
                <MenuItem value="Russian">Russian</MenuItem>
                <MenuItem value="Japanese">Japanese</MenuItem>
                <MenuItem value="Chinese">Chinese</MenuItem>
              </Select>
            </FormControl>
          )}

          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Tags
            </Typography>
            <Box display="flex" alignItems="center" mb={1}>
              <TextField
                label="Add Tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                size="small"
                sx={{ mr: 1 }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddTag}
                disabled={!newTag.trim()}
              >
                Add
              </Button>
            </Box>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => handleRemoveTag(tag)}
                  deleteIcon={<CloseIcon />}
                />
              ))}
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <FormControl component="fieldset" margin="normal">
            <FormControlLabel
              control={
                <Switch
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  color="primary"
                />
              }
              label="Make this workflow public"
            />
          </FormControl>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              component={Link}
              href="/workflows"
              sx={{ mr: 2 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              Create Workflow
            </Button>
          </Box>

          {error && name.trim() && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
        </form>
      </Paper>
    </Box>
  );
}
