"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Alert,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import Link from 'next/link';

interface ExecutionsPageProps {
  params: {
    id: string;
  };
}

export default function ExecutionsPage({ params }: ExecutionsPageProps) {
  const router = useRouter();
  const [workflow, setWorkflow] = useState<any>(null);
  const [executions, setExecutions] = useState<any[]>([]);
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
      
      // Fetch executions
      const executionsResponse = await fetch(`/api/workflows-executions?id=${params.id}`);
      if (!executionsResponse.ok) {
        throw new Error('Failed to fetch executions');
      }
      const executionsData = await executionsResponse.json();
      setExecutions(executionsData);
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
          onClick={fetchData}
        >
          Retry
        </Button>
      </Box>
    );
  }

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
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          Execution History: {workflow?.name}
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={fetchData}
          sx={{ ml: 2 }}
        >
          Refresh
        </Button>
      </Box>

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
        
        <Box display="flex" justifyContent="flex-end">
          <Button
            variant="contained"
            color="primary"
            component={Link}
            href={`/workflows/run/${params.id}`}
          >
            Run Workflow
          </Button>
        </Box>
      </Paper>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Started At</TableCell>
                <TableCell>Completed At</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {executions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No executions found
                  </TableCell>
                </TableRow>
              ) : (
                executions.map((execution) => (
                  <TableRow key={execution.id}>
                    <TableCell>{execution.id}</TableCell>
                    <TableCell>
                      <Chip
                        label={execution.status}
                        color={getStatusColor(execution.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDate(execution.started_at)}</TableCell>
                    <TableCell>{execution.completed_at ? formatDate(execution.completed_at) : 'N/A'}</TableCell>
                    <TableCell>{formatDuration(execution.started_at, execution.completed_at)}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        component={Link}
                        href={`/workflows/${params.id}/executions/${execution.id}`}
                        title="View details"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
