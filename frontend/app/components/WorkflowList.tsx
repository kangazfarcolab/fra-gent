"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Typography,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Tooltip,
  Badge,
  Pagination,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  PlayArrow as PlayArrowIcon,
  History as HistoryIcon,
  Lightbulb as LightbulbIcon,
} from '@mui/icons-material';

interface Workflow {
  id: string;
  name: string;
  description: string;
  version: number;
  success_rate: number;
  avg_execution_time: number;
  tags: string[];
  improvement_suggestions: any[];
  is_public: boolean;
}

const WorkflowList: React.FC = () => {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 12; // Number of workflows per page

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      // Add a cache-busting query parameter to avoid caching
      const response = await fetch(`/api/workflows?t=${new Date().getTime()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch workflows');
      }

      const data = await response.json();
      setWorkflows(data);
    } catch (error) {
      console.error('Error fetching workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkflow = () => {
    router.push('/workflows/builder');
  };

  const handleEditWorkflow = (id: string) => {
    router.push(`/workflows/edit/${id}`);
  };

  const handleRunWorkflow = (id: string) => {
    router.push(`/workflows/run/${id}`);
  };

  const handleViewExecutions = (id: string) => {
    router.push(`/workflows/${id}/executions`);
  };

  const handleViewOptimizations = (id: string) => {
    router.push(`/workflows/${id}/optimizations`);
  };

  const handleDeleteClick = (id: string) => {
    setWorkflowToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (workflowToDelete) {
      try {
        // Use the workflows-id endpoint with a DELETE method
        const response = await fetch(`/api/workflows-id?id=${workflowToDelete}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete workflow');
        }

        // Remove the deleted workflow from the state
        setWorkflows(workflows.filter(w => w.id !== workflowToDelete));
        setDeleteDialogOpen(false);
        setWorkflowToDelete(null);
      } catch (error) {
        console.error('Error deleting workflow:', error);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setWorkflowToDelete(null);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calculate the workflows to display on the current page
  const paginatedWorkflows = workflows.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, pb: 10, minHeight: '100vh' }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Workflows
      </Typography>

      <Box sx={{
        bgcolor: 'background.paper',
        borderRadius: 1,
        boxShadow: 1,
        overflow: 'hidden',
        mb: 4
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">
            Your Workflows
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateWorkflow}
          >
            Create Workflow
          </Button>
        </Box>

        {workflows.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No workflows found
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Create your first workflow to get started
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreateWorkflow}
            >
              Create Workflow
            </Button>
          </Box>
        ) : (
          <Box sx={{ p: 2 }}>
            <Grid container spacing={3}>
              {paginatedWorkflows.map((workflow) => (
              <Grid item xs={12} sm={6} key={workflow.id}>
                <Card
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 250, // Minimum height for all cards
                    p: 1, // Add some padding to make cards bigger
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Typography variant="h6" component="h2" gutterBottom sx={{ maxWidth: '80%' }}>
                        {workflow.name.length > 20 ? `${workflow.name.substring(0, 20)}...` : workflow.name}
                      </Typography>
                      {workflow.improvement_suggestions && workflow.improvement_suggestions.length > 0 && (
                        <Tooltip title="Has optimization suggestions">
                          <Badge badgeContent={workflow.improvement_suggestions ? workflow.improvement_suggestions.length : 0} color="warning">
                            <LightbulbIcon color="action" />
                          </Badge>
                        </Tooltip>
                      )}
                    </Box>
                    <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                      {workflow.tags && workflow.tags.map((tag) => (
                        <Chip key={tag} label={tag} size="small" />
                      ))}
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="text.secondary">
                        Version:
                      </Typography>
                      <Typography variant="body2">{workflow.version || 1}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="text.secondary">
                        Success Rate:
                      </Typography>
                      <Typography variant="body2">
                        {workflow.success_rate !== undefined ? (workflow.success_rate * 100).toFixed(1) : '100.0'}%
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Avg. Execution Time:
                      </Typography>
                      <Typography variant="body2">
                        {workflow.avg_execution_time !== undefined ? workflow.avg_execution_time.toFixed(2) : '0.00'}s
                      </Typography>
                    </Box>
                  </CardContent>
                  <CardActions sx={{ pt: 1, pb: 1, px: 2 }}>
                    <IconButton
                      size="medium"
                      color="primary"
                      onClick={() => handleRunWorkflow(workflow.id)}
                      title="Run workflow"
                    >
                      <PlayArrowIcon />
                    </IconButton>
                    <IconButton
                      size="medium"
                      color="primary"
                      onClick={() => handleEditWorkflow(workflow.id)}
                      title="Edit workflow"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="medium"
                      color="primary"
                      onClick={() => handleViewExecutions(workflow.id)}
                      title="View execution history"
                    >
                      <HistoryIcon />
                    </IconButton>
                    <IconButton
                      size="medium"
                      color="primary"
                      onClick={() => handleViewOptimizations(workflow.id)}
                      title="View optimization suggestions"
                      disabled={!workflow.improvement_suggestions || workflow.improvement_suggestions.length === 0}
                    >
                      <LightbulbIcon />
                    </IconButton>
                    <Box flexGrow={1} />
                    <IconButton
                      size="medium"
                      color="error"
                      onClick={() => handleDeleteClick(workflow.id)}
                      title="Delete workflow"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              count={Math.ceil(workflows.length / itemsPerPage)}
              page={page}
              onChange={handlePageChange}
              color="primary"
              sx={{ mb: 1 }} // Reduced margin since we're inside a container now
            />
          </Box>
        </Box>
      )}
      </Box>

      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Delete Workflow</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this workflow? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkflowList;
