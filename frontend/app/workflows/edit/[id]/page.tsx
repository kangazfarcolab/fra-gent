"use client";

import React, { useState, useEffect } from 'react';
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
import WorkflowCanvas from '../../../components/WorkflowBuilder/WorkflowCanvas';

interface EditWorkflowPageProps {
  params: {
    id: string;
  };
}

export default function EditWorkflowPage({ params }: EditWorkflowPageProps) {
  const router = useRouter();
  const [workflow, setWorkflow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('info');

  useEffect(() => {
    fetchWorkflow();
  }, []);

  const fetchWorkflow = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/workflows-id?id=${params.id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch workflow');
      }

      const data = await response.json();
      setWorkflow(data);
    } catch (error) {
      console.error('Error fetching workflow:', error);
      showSnackbar(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWorkflow = async (updatedWorkflow: any) => {
    setSaving(true);

    try {
      // Convert the workflow to the format expected by the API
      const workflowData = {
        id: params.id,
        name: updatedWorkflow.name,
        description: workflow.description || `Workflow with ${updatedWorkflow.components.length} components`,
        tags: workflow.tags || ['custom'],
        is_public: workflow.is_public || false,
        definition: {
          steps: updatedWorkflow.components.map((component: any) => ({
            id: component.id,
            name: component.name,
            type: component.type,
            position: component.position,
            config: component.config,
          })),
          connections: updatedWorkflow.connections.map((connection: any) => ({
            from: connection.from,
            to: connection.to,
          })),
          output: {
            result: { source: 'variables', path: 'output.result' }
          }
        }
      };

      // Update the workflow
      const response = await fetch(`/api/workflows-id?id=${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflowData),
      });

      if (!response.ok) {
        throw new Error('Failed to update workflow');
      }

      showSnackbar('Workflow updated successfully', 'success');

      // Redirect to the workflows page
      setTimeout(() => {
        router.push('/workflows');
      }, 1500);
    } catch (error) {
      console.error('Error updating workflow:', error);
      showSnackbar(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setSaving(false);
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

  // Convert the workflow definition to the format expected by the WorkflowCanvas
  const convertWorkflowForCanvas = () => {
    if (!workflow || !workflow.definition) return { components: [], connections: [] };

    // Handle steps
    const components = Array.isArray(workflow.definition.steps)
      ? workflow.definition.steps.map((step: any) => ({
          id: step.id || `step-${Math.random().toString(36).substr(2, 9)}`,
          type: step.type || mapStepTypeToComponentType(step),
          name: step.name || 'Unnamed Step',
          position: step.position || { x: 100, y: 100 },
          config: step.config || {},
        }))
      : [];

    // Handle connections - make sure connections array exists
    const connections = Array.isArray(workflow.definition.connections)
      ? workflow.definition.connections.map((connection: any) => {
          // Make sure from and to are defined
          if (!connection.from || !connection.to) return null;
          return {
            id: `${connection.from}-${connection.to}`,
            from: connection.from,
            to: connection.to,
          };
        }).filter(Boolean) // Remove null connections
      : [];

    return { components, connections };
  };

  // Map step types to component types if needed
  const mapStepTypeToComponentType = (step: any) => {
    // This is a fallback in case the step type is not explicitly set
    if (step.name.toLowerCase().includes('input')) return 'user_input';
    if (step.name.toLowerCase().includes('llm') || step.name.toLowerCase().includes('agent')) return 'llm';
    if (step.name.toLowerCase().includes('output')) return 'output';
    return 'llm'; // Default to LLM
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
          Edit Workflow
        </Typography>
        {(loading || saving) && <CircularProgress size={24} sx={{ ml: 2 }} />}
      </Box>

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <WorkflowCanvas
            workflowId={params.id}
            initialName={workflow?.name || ''}
            initialComponents={convertWorkflowForCanvas().components}
            initialConnections={convertWorkflowForCanvas().connections}
            onSave={handleSaveWorkflow}
          />
        )}
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
