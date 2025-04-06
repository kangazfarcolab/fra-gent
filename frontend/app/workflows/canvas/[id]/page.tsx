"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  PlayArrow as RunIcon,
} from '@mui/icons-material';

interface WorkflowCanvasPageProps {
  params: {
    id: string;
  };
}

const WorkflowCanvasPage: React.FC<WorkflowCanvasPageProps> = ({ params }) => {
  const router = useRouter();
  const { id } = params;
  const isNewWorkflow = id === 'new';

  const [workflow, setWorkflow] = useState<any>({
    name: '',
    description: '',
    definition: {
      steps: [],
      connections: [],
      output: {}
    }
  });
  const [loading, setLoading] = useState(!isNewWorkflow);

  useEffect(() => {
    if (!isNewWorkflow) {
      fetchWorkflow();
    }
  }, [id]);

  const fetchWorkflow = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/workflows-id?id=${id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch workflow');
      }

      const data = await response.json();
      setWorkflow(data);
    } catch (error) {
      console.error('Error fetching workflow:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Save workflow logic
    console.log('Saving workflow:', workflow);
  };

  const handleRun = async () => {
    // Run workflow logic
    console.log('Running workflow:', workflow);
  };

  const handleBack = () => {
    router.push('/workflows');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      bgcolor: 'background.default',
      color: 'text.primary',
    }}>
      {/* Top Bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <IconButton
          onClick={handleBack}
          sx={{ mr: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 500 }}>
          {isNewWorkflow ? 'New Workflow' : workflow.name}
        </Typography>
        <Tooltip title="Run Workflow">
          <IconButton
            onClick={handleRun}
            sx={{ mr: 1 }}
          >
            <RunIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Save Workflow">
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            sx={{ textTransform: 'none' }}
          >
            Save
          </Button>
        </Tooltip>
      </Box>

      {/* Canvas Area */}
      <Box sx={{
        flexGrow: 1,
        p: 2,
        overflow: 'hidden',
        position: 'relative',
      }}>
        <Paper
          elevation={0}
          sx={{
            height: '100%',
            bgcolor: 'background.default',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <Box sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            gap: 2
          }}>
            <Typography variant="h6" color="text.secondary">
              Canvas will be implemented here
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Drag and drop components to build your workflow
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default WorkflowCanvasPage;
