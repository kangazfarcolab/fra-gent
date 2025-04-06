"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Paper,
  Typography,
  TextField,
  Grid,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Save as SaveIcon,
  PlayArrow as PlayArrowIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import Canvas from './Canvas';
import StepEditor from './StepEditor';
import ConnectionEditor from './ConnectionEditor';

interface WorkflowBuilderProps {
  workflowId?: string;
}

interface Workflow {
  id?: string;
  name: string;
  description: string;
  definition: {
    steps: any[];
    output: any;
  };
  tags: string[];
  is_public: boolean;
}

const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({ workflowId }) => {
  const router = useRouter();
  const [workflow, setWorkflow] = useState<Workflow>({
    name: '',
    description: '',
    definition: {
      steps: [],
      output: {},
    },
    tags: [],
    is_public: false,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });
  const [activeTab, setActiveTab] = useState(0);
  const [selectedStep, setSelectedStep] = useState<any | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<any | null>(null);

  useEffect(() => {
    if (workflowId) {
      fetchWorkflow(workflowId);
    }
  }, [workflowId]);

  const fetchWorkflow = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/workflows/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch workflow');
      }
      const data = await response.json();
      setWorkflow(data);
    } catch (error) {
      console.error('Error fetching workflow:', error);
      showNotification('Failed to load workflow', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = workflowId
        ? `/api/workflows/${workflowId}`
        : '/api/workflows';
      const method = workflowId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflow),
      });

      if (!response.ok) {
        throw new Error('Failed to save workflow');
      }

      const savedWorkflow = await response.json();

      // Always redirect to the workflows page after saving
      router.push('/workflows');
    } catch (error) {
      console.error('Error saving workflow:', error);
      showNotification('Failed to save workflow', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRun = () => {
    if (workflowId) {
      router.push(`/workflows/run/${workflowId}`);
    } else {
      showNotification('Please save the workflow before running it', 'warning');
    }
  };

  const handleBack = () => {
    router.push('/workflows');
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleStepSelect = (step: any) => {
    setSelectedStep(step);
    setSelectedConnection(null);
    setActiveTab(1); // Switch to step editor tab
  };

  const handleConnectionSelect = (connection: any) => {
    setSelectedConnection(connection);
    setSelectedStep(null);
    setActiveTab(2); // Switch to connection editor tab
  };

  const handleStepChange = (updatedStep: any) => {
    const updatedSteps = workflow.definition.steps.map((step) =>
      step.id === updatedStep.id ? updatedStep : step
    );

    setWorkflow({
      ...workflow,
      definition: {
        ...workflow.definition,
        steps: updatedSteps,
      },
    });
  };

  const handleStepAdd = (newStep: any) => {
    setWorkflow({
      ...workflow,
      definition: {
        ...workflow.definition,
        steps: [...workflow.definition.steps, newStep],
      },
    });
  };

  const handleStepDelete = (stepId: string) => {
    setWorkflow({
      ...workflow,
      definition: {
        ...workflow.definition,
        steps: workflow.definition.steps.filter((step) => step.id !== stepId),
      },
    });
    setSelectedStep(null);
  };

  const handleConnectionChange = (updatedConnection: any) => {
    // Update connection logic here
    console.log('Connection updated:', updatedConnection);
  };

  const showNotification = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setNotification({
      open: true,
      message,
      severity,
    });
  };

  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false,
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h4" component="h1">
            {workflowId ? 'Edit Workflow' : 'Create Workflow'}
          </Typography>
        </Box>
        <Box>
          <Button
            variant="outlined"
            startIcon={<PlayArrowIcon />}
            onClick={handleRun}
            sx={{ mr: 2 }}
            disabled={!workflowId}
          >
            Run
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Workflow Details
            </Typography>
            <TextField
              label="Name"
              fullWidth
              margin="normal"
              value={workflow.name}
              onChange={(e) => setWorkflow({ ...workflow, name: e.target.value })}
              required
            />
            <TextField
              label="Description"
              fullWidth
              margin="normal"
              multiline
              rows={3}
              value={workflow.description}
              onChange={(e) => setWorkflow({ ...workflow, description: e.target.value })}
            />
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Workflow Canvas
            </Typography>
            <Canvas
              steps={workflow.definition.steps}
              onStepSelect={handleStepSelect}
              onConnectionSelect={handleConnectionSelect}
              onStepAdd={handleStepAdd}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
              <Tab label="Overview" />
              <Tab label="Step Editor" disabled={!selectedStep} />
              <Tab label="Connection Editor" disabled={!selectedConnection} />
            </Tabs>

            <Divider sx={{ mb: 3 }} />

            {activeTab === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Workflow Overview
                </Typography>
                <Typography variant="body1" paragraph>
                  This workflow has {workflow.definition.steps.length} steps.
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Select a step on the canvas to edit its properties.
                </Typography>
              </Box>
            )}

            {activeTab === 1 && selectedStep && (
              <StepEditor
                step={selectedStep}
                onChange={handleStepChange}
                onDelete={handleStepDelete}
              />
            )}

            {activeTab === 2 && selectedConnection && (
              <ConnectionEditor
                connection={selectedConnection}
                onChange={handleConnectionChange}
              />
            )}
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default WorkflowBuilder;
