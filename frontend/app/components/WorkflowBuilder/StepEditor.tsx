"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Divider,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';

interface StepEditorProps {
  step: any;
  onChange: (updatedStep: any) => void;
  onDelete: (stepId: string) => void;
}

const StepEditor: React.FC<StepEditorProps> = ({ step, onChange, onDelete }) => {
  const [localStep, setLocalStep] = useState<any>(step);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLocalStep(step);

    // Fetch agents if this is an agent step
    if (step.type === 'agent') {
      fetchAgents();
    }
  }, [step]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/agents');
      if (!response.ok) {
        throw new Error('Failed to fetch agents');
      }
      const data = await response.json();
      setAgents(data);
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    const updatedStep = {
      ...localStep,
      [field]: value,
    };
    setLocalStep(updatedStep);
    onChange(updatedStep);
  };

  const handleConfigChange = (field: string, value: any) => {
    const updatedConfig = {
      ...localStep.config,
      [field]: value,
    };
    const updatedStep = {
      ...localStep,
      config: updatedConfig,
    };
    setLocalStep(updatedStep);
    onChange(updatedStep);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    onDelete(localStep.id);
    setDeleteDialogOpen(false);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  const renderAgentStepFields = () => (
    <>
      <FormControl fullWidth margin="normal">
        <InputLabel>Agent</InputLabel>
        <Select
          value={localStep.config?.agent_id || ''}
          onChange={(e) => handleConfigChange('agent_id', e.target.value)}
          label="Agent"
        >
          {agents.map((agent) => (
            <MenuItem key={agent.id} value={agent.id}>
              {agent.name}
            </MenuItem>
          ))}
        </Select>
        <FormHelperText>Select the agent to use for this step</FormHelperText>
      </FormControl>

      <TextField
        label="Instructions"
        fullWidth
        margin="normal"
        multiline
        rows={4}
        value={localStep.config?.instructions || ''}
        onChange={(e) => handleConfigChange('instructions', e.target.value)}
        helperText="Instructions for the agent"
      />

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Input Mapping</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="textSecondary" paragraph>
            Define how data is passed to this agent
          </Typography>
          {/* Input mapping fields would go here */}
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Output Mapping</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="textSecondary" paragraph>
            Define how the agent's response is processed
          </Typography>
          {/* Output mapping fields would go here */}
        </AccordionDetails>
      </Accordion>
    </>
  );

  const renderTransformStepFields = () => (
    <>
      <TextField
        label="Transformation Code"
        fullWidth
        margin="normal"
        multiline
        rows={8}
        value={localStep.config?.code || ''}
        onChange={(e) => handleConfigChange('code', e.target.value)}
        helperText="JavaScript code to transform the input data"
      />

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Input Mapping</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="textSecondary" paragraph>
            Define how data is passed to this transformation
          </Typography>
          {/* Input mapping fields would go here */}
        </AccordionDetails>
      </Accordion>
    </>
  );

  const renderApiStepFields = () => (
    <>
      <TextField
        label="API URL"
        fullWidth
        margin="normal"
        value={localStep.config?.url || ''}
        onChange={(e) => handleConfigChange('url', e.target.value)}
      />

      <FormControl fullWidth margin="normal">
        <InputLabel>Method</InputLabel>
        <Select
          value={localStep.config?.method || 'GET'}
          onChange={(e) => handleConfigChange('method', e.target.value)}
          label="Method"
        >
          <MenuItem value="GET">GET</MenuItem>
          <MenuItem value="POST">POST</MenuItem>
          <MenuItem value="PUT">PUT</MenuItem>
          <MenuItem value="DELETE">DELETE</MenuItem>
          <MenuItem value="PATCH">PATCH</MenuItem>
        </Select>
      </FormControl>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Headers</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="textSecondary" paragraph>
            Define HTTP headers for the API request
          </Typography>
          {/* Headers fields would go here */}
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Body</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField
            label="Request Body"
            fullWidth
            multiline
            rows={4}
            value={localStep.config?.body || ''}
            onChange={(e) => handleConfigChange('body', e.target.value)}
          />
        </AccordionDetails>
      </Accordion>
    </>
  );

  const renderConditionStepFields = () => (
    <>
      <FormControl fullWidth margin="normal">
        <InputLabel>Condition Type</InputLabel>
        <Select
          value={localStep.config?.condition_type || 'comparison'}
          onChange={(e) => handleConfigChange('condition_type', e.target.value)}
          label="Condition Type"
        >
          <MenuItem value="comparison">Comparison</MenuItem>
          <MenuItem value="logical">Logical</MenuItem>
        </Select>
      </FormControl>

      {localStep.config?.condition_type === 'comparison' ? (
        <>
          <TextField
            label="Left Operand"
            fullWidth
            margin="normal"
            value={localStep.config?.left || ''}
            onChange={(e) => handleConfigChange('left', e.target.value)}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Operator</InputLabel>
            <Select
              value={localStep.config?.operator || 'eq'}
              onChange={(e) => handleConfigChange('operator', e.target.value)}
              label="Operator"
            >
              <MenuItem value="eq">Equals (==)</MenuItem>
              <MenuItem value="neq">Not Equals (!=)</MenuItem>
              <MenuItem value="gt">Greater Than (&gt;)</MenuItem>
              <MenuItem value="gte">Greater Than or Equal (&gt;=)</MenuItem>
              <MenuItem value="lt">Less Than (&lt;)</MenuItem>
              <MenuItem value="lte">Less Than or Equal (&lt;=)</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Right Operand"
            fullWidth
            margin="normal"
            value={localStep.config?.right || ''}
            onChange={(e) => handleConfigChange('right', e.target.value)}
          />
        </>
      ) : (
        <FormControl fullWidth margin="normal">
          <InputLabel>Logical Operator</InputLabel>
          <Select
            value={localStep.config?.operator || 'and'}
            onChange={(e) => handleConfigChange('operator', e.target.value)}
            label="Logical Operator"
          >
            <MenuItem value="and">AND</MenuItem>
            <MenuItem value="or">OR</MenuItem>
            <MenuItem value="not">NOT</MenuItem>
          </Select>
        </FormControl>
      )}

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Then / Else Paths</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="textSecondary" paragraph>
            Define what happens when the condition is true or false
          </Typography>
          {/* Then/Else configuration would go here */}
        </AccordionDetails>
      </Accordion>
    </>
  );

  const renderStepTypeFields = () => {
    switch (localStep.type) {
      case 'agent':
        return renderAgentStepFields();
      case 'transform':
        return renderTransformStepFields();
      case 'api':
        return renderApiStepFields();
      case 'condition':
        return renderConditionStepFields();
      default:
        return (
          <Typography color="textSecondary">
            No configuration available for this step type.
          </Typography>
        );
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Step Editor</Typography>
        <IconButton color="error" onClick={handleDeleteClick}>
          <DeleteIcon />
        </IconButton>
      </Box>

      <TextField
        label="Step Name"
        fullWidth
        margin="normal"
        value={localStep.name}
        onChange={(e) => handleChange('name', e.target.value)}
      />

      <FormControl fullWidth margin="normal" disabled>
        <InputLabel>Step Type</InputLabel>
        <Select value={localStep.type} label="Step Type">
          <MenuItem value="agent">Agent</MenuItem>
          <MenuItem value="transform">Transform</MenuItem>
          <MenuItem value="api">API</MenuItem>
          <MenuItem value="condition">Condition</MenuItem>
        </Select>
        <FormHelperText>Step type cannot be changed after creation</FormHelperText>
      </FormControl>

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle1" gutterBottom>
        Step Configuration
      </Typography>

      {renderStepTypeFields()}

      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Delete Step</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this step? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StepEditor;
