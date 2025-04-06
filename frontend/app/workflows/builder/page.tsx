"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import Link from 'next/link';
import WorkflowCanvas from '../../components/WorkflowBuilder/WorkflowCanvas';

export default function WorkflowBuilderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('info');

  const handleSaveWorkflow = async (workflow: any) => {
    setLoading(true);
    
    try {
      // Convert the workflow to the format expected by the API
      const workflowData = {
        name: workflow.name,
        description: `Workflow with ${workflow.components.length} components`,
        tags: ['custom'],
        is_public: false,
        definition: {
          steps: workflow.components.map((component: any) => ({
            id: component.id,
            name: component.name,
            type: component.type,
            position: component.position,
            config: component.config,
          })),
          connections: workflow.connections.map((connection: any) => ({
            from: connection.from,
            to: connection.to,
          })),
          output: {
            result: { source: 'variables', path: 'output.result' }
          }
        }
      };
      
      // Save the workflow
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflowData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save workflow');
      }
      
      const data = await response.json();
      
      showSnackbar('Workflow saved successfully', 'success');
      
      // Redirect to the workflows page
      setTimeout(() => {
        router.push('/workflows');
      }, 1500);
    } catch (error) {
      console.error('Error saving workflow:', error);
      showSnackbar(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', borderBottom: '1px solid #e0e0e0' }}>
        <Button
          component={Link}
          href="/workflows"
          startIcon={<ArrowBackIcon />}
          sx={{ mr: 2 }}
        >
          Back to Workflows
        </Button>
        <Typography variant="h5" component="h1">
          Workflow Builder
        </Typography>
        {loading && <CircularProgress size={24} sx={{ ml: 2 }} />}
      </Box>
      
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <WorkflowCanvas onSave={handleSaveWorkflow} />
      </Box>
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
