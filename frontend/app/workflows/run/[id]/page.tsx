"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  TextField,
  Divider,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  PlayArrow as PlayArrowIcon,
  ExpandMore as ExpandMoreIcon,
  Check as CheckIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import Link from 'next/link';

interface RunWorkflowPageProps {
  params: {
    id: string;
  };
}

export default function RunWorkflowPage({ params }: RunWorkflowPageProps) {
  const router = useRouter();
  const [workflow, setWorkflow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error' | 'info'>('info');

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
      setError('Failed to fetch workflow');
    } finally {
      setLoading(false);
    }
  };

  const handleRunWorkflow = async () => {
    try {
      setExecuting(true);
      setResult(null);
      setError('');

      // Prepare input data based on workflow type
      let inputData = {};

      // Check if the workflow is a translation workflow
      const isTranslation = workflow?.definition?.steps?.some(step =>
        step.type === 'llm' &&
        step.config?.prompt?.toLowerCase().includes('translate')
      );

      // Check if the workflow is a summarization workflow
      const isSummarization = workflow?.definition?.steps?.some(step =>
        step.type === 'llm' &&
        step.config?.prompt?.toLowerCase().includes('summarize')
      );

      if (isTranslation) {
        // For translation workflows, use the text input directly
        inputData = {
          text: inputValue,
          target_language: workflow?.definition?.steps?.[0]?.config?.target_language || 'Spanish'
        };
      } else if (isSummarization) {
        // For summarization workflows, use the text input directly
        inputData = {
          text: inputValue
        };
      } else {
        // For other workflows, try to parse as JSON or use as-is
        try {
          inputData = inputValue.trim() ? JSON.parse(inputValue) : { value: 10 };
        } catch (e) {
          // If parsing fails, use the input as a simple value
          inputData = { text: inputValue || '' };
        }
      }

      // Execute the workflow using the real API
      const response = await fetch(`/api/workflows-execute?id=${params.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inputData),
      });

      if (!response.ok) {
        throw new Error('Failed to execute workflow');
      }

      const executionResult = await response.json();

      setResult(executionResult);
      showNotificationMessage('Workflow executed successfully', 'success');
    } catch (error) {
      console.error('Error executing workflow:', error);
      setError('Failed to execute workflow');
      showNotificationMessage('Failed to execute workflow', 'error');
    } finally {
      setExecuting(false);
    }
  };



  const showNotificationMessage = (message: string, type: 'success' | 'error' | 'info') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
  };

  const handleCloseNotification = () => {
    setShowNotification(false);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <Button
            component={Link}
            href="/workflows"
            startIcon={<ArrowBackIcon />}
            sx={{ mr: 2 }}
          >
            Back to Workflows
          </Button>
          <Typography variant="h4" component="h1">
            Error
          </Typography>
        </Box>

        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>

        <Button
          variant="contained"
          onClick={fetchWorkflow}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          component={Link}
          href="/workflows"
          startIcon={<ArrowBackIcon />}
          sx={{ mr: 2 }}
        >
          Back to Workflows
        </Button>
        <Typography variant="h4" component="h1">
          Run Workflow: {workflow?.name}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Workflow Details
            </Typography>
            <Typography variant="body2" paragraph>
              {workflow?.description || 'No description'}
            </Typography>

            <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
              {workflow?.tags?.map((tag: string) => (
                <Chip key={tag} label={tag} size="small" />
              ))}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" gutterBottom>
              Input Parameters
            </Typography>
            <TextField
              label={workflow?.definition?.steps?.some(s => s.type === 'llm' && s.config?.prompt?.toLowerCase().includes('translate'))
                ? 'Text to Translate'
                : workflow?.definition?.steps?.some(s => s.type === 'llm' && s.config?.prompt?.toLowerCase().includes('summarize'))
                ? 'Text to Summarize'
                : 'Input'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              fullWidth
              multiline
              rows={4}
              placeholder={workflow?.definition?.steps?.some(s => s.type === 'llm' && s.config?.prompt?.toLowerCase().includes('translate'))
                ? 'Enter text to translate'
                : workflow?.definition?.steps?.some(s => s.type === 'llm' && s.config?.prompt?.toLowerCase().includes('summarize'))
                ? 'Enter text to summarize'
                : '{"value": 10}'}
              helperText={workflow?.definition?.steps?.some(s => s.type === 'llm' &&
                (s.config?.prompt?.toLowerCase().includes('translate') || s.config?.prompt?.toLowerCase().includes('summarize')))
                ? 'Enter text to process'
                : 'Enter JSON input or leave empty to use default'}
              sx={{ mb: 2 }}
            />

            <Button
              variant="contained"
              color="primary"
              startIcon={executing ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
              onClick={handleRunWorkflow}
              disabled={executing}
              fullWidth
            >
              {executing ? 'Executing...' : 'Run Workflow'}
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          {result && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Execution Results
              </Typography>

              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Input</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <pre style={{ overflow: 'auto', maxHeight: '200px' }}>
                    {JSON.stringify(result.input, null, 2)}
                  </pre>
                </AccordionDetails>
              </Accordion>

              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Steps</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {result.steps.map((step: any) => (
                      <Card key={step.id} variant="outlined">
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                            <Typography variant="subtitle1">
                              {step.name}
                            </Typography>
                            <Chip
                              label={step.type}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </Box>
                          <pre style={{ overflow: 'auto', maxHeight: '150px' }}>
                            {JSON.stringify(step.result, null, 2)}
                          </pre>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>

              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Output</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <pre style={{ overflow: 'auto', maxHeight: '200px' }}>
                    {JSON.stringify(result.output, null, 2)}
                  </pre>
                </AccordionDetails>
              </Accordion>
            </Paper>
          )}
        </Grid>
      </Grid>

      <Snackbar
        open={showNotification}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
      >
        <Alert onClose={handleCloseNotification} severity={notificationType} sx={{ width: '100%' }}>
          {notificationMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
