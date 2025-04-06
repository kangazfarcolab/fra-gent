"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Divider,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ExpandMore as ExpandMoreIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import Link from 'next/link';

interface ExecutionDetailsPageProps {
  params: {
    id: string;
    executionId: string;
  };
}

export default function ExecutionDetailsPage({ params }: ExecutionDetailsPageProps) {
  const router = useRouter();
  const [workflow, setWorkflow] = useState<any>(null);
  const [execution, setExecution] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch workflow details
      const workflowResponse = await fetch(`/api/workflows-id?id=${params.id}`);
      if (!workflowResponse.ok) {
        throw new Error('Failed to fetch workflow');
      }
      const workflowData = await workflowResponse.json();
      setWorkflow(workflowData);
      
      // Fetch execution details
      const executionResponse = await fetch(`/api/workflows-execution?id=${params.id}&executionId=${params.executionId}`);
      if (!executionResponse.ok) {
        throw new Error('Failed to fetch execution details');
      }
      const executionData = await executionResponse.json();
      setExecution(executionData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'running':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return 'N/A';
    
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const durationMs = end - start;
    
    if (durationMs < 1000) {
      return `${durationMs}ms`;
    } else if (durationMs < 60000) {
      return `${(durationMs / 1000).toFixed(2)}s`;
    } else {
      const minutes = Math.floor(durationMs / 60000);
      const seconds = ((durationMs % 60000) / 1000).toFixed(0);
      return `${minutes}m ${seconds}s`;
    }
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
            href={`/workflows/${params.id}/executions`}
            startIcon={<ArrowBackIcon />}
            sx={{ mr: 2 }}
          >
            Back to Executions
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
          onClick={fetchData}
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
          href={`/workflows/${params.id}/executions`}
          startIcon={<ArrowBackIcon />}
          sx={{ mr: 2 }}
        >
          Back to Executions
        </Button>
        <Typography variant="h4" component="h1">
          Execution Details
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            {workflow?.name}
          </Typography>
          <Chip
            label={execution?.status}
            color={getStatusColor(execution?.status) as any}
          />
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Execution ID
            </Typography>
            <Typography variant="body1" gutterBottom>
              {execution?.id}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Duration
            </Typography>
            <Typography variant="body1" gutterBottom>
              {formatDuration(execution?.started_at, execution?.completed_at)}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Started At
            </Typography>
            <Typography variant="body1" gutterBottom>
              {formatDate(execution?.started_at)}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Completed At
            </Typography>
            <Typography variant="body1" gutterBottom>
              {execution?.completed_at ? formatDate(execution.completed_at) : 'N/A'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Input
            </Typography>
            <pre style={{ overflow: 'auto', maxHeight: '300px' }}>
              {JSON.stringify(execution?.input_data, null, 2)}
            </pre>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Output
            </Typography>
            <pre style={{ overflow: 'auto', maxHeight: '300px' }}>
              {JSON.stringify(execution?.output_data, null, 2)}
            </pre>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Step Executions
        </Typography>
        
        {execution?.steps?.length === 0 ? (
          <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 3 }}>
            No step executions found
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            {execution?.steps?.map((step: any) => (
              <Accordion key={step.id} defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" width="100%" pr={2}>
                    <Typography variant="subtitle1">
                      {step.step_name}
                    </Typography>
                    <Chip
                      label={step.status}
                      color={getStatusColor(step.status) as any}
                      size="small"
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Duration
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {formatDuration(step.started_at, step.completed_at)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Step ID
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {step.step_id}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Input
                      </Typography>
                      <pre style={{ overflow: 'auto', maxHeight: '150px' }}>
                        {JSON.stringify(step.input_data, null, 2)}
                      </pre>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Output
                      </Typography>
                      <pre style={{ overflow: 'auto', maxHeight: '150px' }}>
                        {JSON.stringify(step.output_data, null, 2)}
                      </pre>
                    </Grid>
                    
                    {step.error && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Error
                        </Typography>
                        <Alert severity="error" sx={{ mb: 2 }}>
                          {step.error}
                        </Alert>
                      </Grid>
                    )}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
}
