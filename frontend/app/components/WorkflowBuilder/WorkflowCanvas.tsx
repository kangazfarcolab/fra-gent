"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  PlayArrow as RunIcon,
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';

// Component types
const COMPONENT_TYPES = {
  USER_INPUT: 'user_input',
  LLM: 'llm',
  OUTPUT: 'output',
};

// Component colors
const COMPONENT_COLORS = {
  [COMPONENT_TYPES.USER_INPUT]: '#e3f2fd', // Light blue
  [COMPONENT_TYPES.LLM]: '#e8f5e9', // Light green
  [COMPONENT_TYPES.OUTPUT]: '#fff3e0', // Light orange
};

// Component icons
const COMPONENT_ICONS = {
  [COMPONENT_TYPES.USER_INPUT]: '📝',
  [COMPONENT_TYPES.LLM]: '🤖',
  [COMPONENT_TYPES.OUTPUT]: '📊',
};

interface Component {
  id: string;
  type: string;
  name: string;
  position: { x: number; y: number };
  config: any;
}

interface Connection {
  id: string;
  from: string;
  to: string;
}

interface WorkflowCanvasProps {
  workflowId?: string;
  initialName?: string;
  initialComponents?: Component[];
  initialConnections?: Connection[];
  onSave?: (workflow: any) => void;
}

const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  workflowId,
  initialName = '',
  initialComponents = [],
  initialConnections = [],
  onSave
}) => {
  const [components, setComponents] = useState<Component[]>(initialComponents);
  const [connections, setConnections] = useState<Connection[]>(initialConnections);
  const [workflowName, setWorkflowName] = useState(initialName);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [draggedComponent, setDraggedComponent] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('info');

  const canvasRef = useRef<HTMLDivElement>(null);

  // Fetch agents on component mount
  useEffect(() => {
    fetchAgents();
  }, []);

  // Fetch agents from the API
  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents');
      if (response.ok) {
        const data = await response.json();
        setAgents(data);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  // Handle canvas click to open the component menu
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setMenuPosition({ x, y });
      setMenuOpen(true);
    }
  };

  // Handle menu close
  const handleMenuClose = () => {
    setMenuOpen(false);
  };

  // Add a new component to the canvas
  const handleAddComponent = (type: string) => {
    const newComponent: Component = {
      id: uuidv4(),
      type,
      name: getDefaultComponentName(type),
      position: { ...menuPosition },
      config: getDefaultConfig(type),
    };

    setComponents([...components, newComponent]);
    handleMenuClose();
  };

  // Get default component name based on type
  const getDefaultComponentName = (type: string) => {
    switch (type) {
      case COMPONENT_TYPES.USER_INPUT:
        return 'User Input';
      case COMPONENT_TYPES.LLM:
        return 'LLM Agent';
      case COMPONENT_TYPES.OUTPUT:
        return 'Output';
      default:
        return 'Component';
    }
  };

  // Get default component config based on type
  const getDefaultConfig = (type: string) => {
    switch (type) {
      case COMPONENT_TYPES.USER_INPUT:
        return {}; // No configuration needed for user input
      case COMPONENT_TYPES.LLM:
        return { agent_id: agents.length > 0 ? agents[0].id : null };
      case COMPONENT_TYPES.OUTPUT:
        return {};
      default:
        return {};
    }
  };

  // Handle component drag start
  const handleComponentMouseDown = (e: React.MouseEvent, component: Component) => {
    e.stopPropagation();

    setSelectedComponent(component);
    setDraggedComponent(component.id);

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left - component.position.x,
        y: e.clientY - rect.top - component.position.y,
      });
    }
  };

  // Handle mouse move for dragging components
  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedComponent && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - dragOffset.x;
      const y = e.clientY - rect.top - dragOffset.y;

      setComponents(components.map(component =>
        component.id === draggedComponent
          ? { ...component, position: { x, y } }
          : component
      ));
    }
  };

  // Handle mouse up to end dragging
  const handleMouseUp = () => {
    setDraggedComponent(null);
  };

  // Handle component click
  const handleComponentClick = (e: React.MouseEvent, component: Component) => {
    e.stopPropagation();
    setSelectedComponent(component);
  };

  // Handle component double click to edit
  const handleComponentDoubleClick = (e: React.MouseEvent, component: Component) => {
    e.stopPropagation();
    setSelectedComponent(component);
    setEditDialogOpen(true);
  };

  // Handle component delete
  const handleDeleteComponent = (componentId: string) => {
    setComponents(components.filter(component => component.id !== componentId));
    setConnections(connections.filter(
      connection => connection.from !== componentId && connection.to !== componentId
    ));
    setSelectedComponent(null);
  };

  // Handle edit dialog close
  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
  };

  // Handle component update
  const handleUpdateComponent = (updatedComponent: Component) => {
    setComponents(components.map(component =>
      component.id === updatedComponent.id ? updatedComponent : component
    ));
    setSelectedComponent(updatedComponent);
    setEditDialogOpen(false);
  };

  // Handle connection creation
  const handleCreateConnection = (fromId: string, toId: string) => {
    // Check if connection already exists
    const connectionExists = connections.some(
      connection => connection.from === fromId && connection.to === toId
    );

    if (!connectionExists) {
      const newConnection: Connection = {
        id: uuidv4(),
        from: fromId,
        to: toId,
      };

      setConnections([...connections, newConnection]);
    }
  };

  // Handle save workflow
  const handleSaveWorkflow = () => {
    if (!workflowName.trim()) {
      showSnackbar('Please enter a workflow name', 'error');
      return;
    }

    const workflow = {
      name: workflowName,
      components,
      connections,
    };

    if (onSave) {
      onSave(workflow);
    }

    showSnackbar('Workflow saved successfully', 'success');
  };

  // Handle test workflow
  const handleTestWorkflow = () => {
    // Check if we have a valid workflow structure
    const userInputComponent = components.find(c => c.type === COMPONENT_TYPES.USER_INPUT);
    const llmComponent = components.find(c => c.type === COMPONENT_TYPES.LLM);
    const outputComponent = components.find(c => c.type === COMPONENT_TYPES.OUTPUT);

    if (!userInputComponent || !llmComponent || !outputComponent) {
      showSnackbar('Workflow must have User Input, LLM, and Output components', 'error');
      return;
    }

    // Check if components are connected properly
    const userToLlmConnection = connections.find(
      conn => conn.from === userInputComponent.id && conn.to === llmComponent.id
    );

    const llmToOutputConnection = connections.find(
      conn => conn.from === llmComponent.id && conn.to === outputComponent.id
    );

    if (!userToLlmConnection || !llmToOutputConnection) {
      showSnackbar('Components must be connected: User Input → LLM → Output', 'error');
      return;
    }

    setTestDialogOpen(true);
  };

  // Handle test dialog close
  const handleTestDialogClose = () => {
    setTestDialogOpen(false);
    setTestInput('');
    setTestResult(null);
  };

  // Handle run test
  const handleRunTest = async () => {
    if (!testInput.trim()) {
      showSnackbar('Please enter test input', 'error');
      return;
    }

    setTestLoading(true);

    try {
      // Find the LLM component
      const llmComponent = components.find(component => component.type === COMPONENT_TYPES.LLM);

      if (!llmComponent) {
        throw new Error('No LLM component found');
      }

      // Get the agent ID from the LLM component
      const agentId = llmComponent.config.agent_id;

      if (!agentId) {
        throw new Error('No agent selected for LLM component');
      }

      // Call the agent API
      const response = await fetch(`/api/agents/${agentId}/interact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: testInput,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to call agent API');
      }

      const data = await response.json();

      setTestResult(data);
      showSnackbar('Test completed successfully', 'success');
    } catch (error) {
      console.error('Error running test:', error);
      showSnackbar(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setTestLoading(false);
    }
  };

  // Show snackbar message
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Draw connection line between components
  const drawConnection = (fromId: string, toId: string) => {
    const fromComponent = components.find(c => c.id === fromId);
    const toComponent = components.find(c => c.id === toId);

    if (!fromComponent || !toComponent) return null;

    // Calculate positions
    const fromX = fromComponent.position.x + 100; // Right side of component
    const fromY = fromComponent.position.y + 50; // Middle of component
    const toX = toComponent.position.x; // Left side of component
    const toY = toComponent.position.y + 50; // Middle of component

    // Draw a bezier curve
    const controlPointX1 = fromX + 50;
    const controlPointX2 = toX - 50;

    return (
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <path
          d={`M ${fromX} ${fromY} C ${controlPointX1} ${fromY}, ${controlPointX2} ${toY}, ${toX} ${toY}`}
          stroke="#1976d2"
          strokeWidth={2}
          fill="none"
          markerEnd="url(#arrowhead)"
        />
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#1976d2" />
          </marker>
        </defs>
      </svg>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e0e0e0' }}>
        <TextField
          label="Workflow Name"
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          size="small"
          sx={{ width: 300 }}
        />
        <Box>
          <Button
            variant="outlined"
            startIcon={<RunIcon />}
            onClick={handleTestWorkflow}
            sx={{ mr: 1 }}
          >
            Test
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveWorkflow}
          >
            Save
          </Button>
        </Box>
      </Box>

      {/* Component Palette */}
      <Box sx={{ display: 'flex', height: 'calc(100% - 64px)' }}>
        <Box sx={{ width: 200, p: 2, borderRight: '1px solid #e0e0e0', overflowY: 'auto' }}>
          <Typography variant="subtitle1" gutterBottom>
            Components
          </Typography>

          <Paper
            sx={{
              p: 1,
              mb: 1,
              bgcolor: COMPONENT_COLORS[COMPONENT_TYPES.USER_INPUT],
              cursor: 'pointer',
              '&:hover': { boxShadow: 2 },
            }}
            onClick={() => {
              if (canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect();
                setMenuPosition({ x: rect.width / 3, y: rect.height / 3 });
                handleAddComponent(COMPONENT_TYPES.USER_INPUT);
              }
            }}
          >
            <Typography variant="body2">
              {COMPONENT_ICONS[COMPONENT_TYPES.USER_INPUT]} User Input
            </Typography>
          </Paper>

          <Paper
            sx={{
              p: 1,
              mb: 1,
              bgcolor: COMPONENT_COLORS[COMPONENT_TYPES.LLM],
              cursor: 'pointer',
              '&:hover': { boxShadow: 2 },
            }}
            onClick={() => {
              if (canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect();
                setMenuPosition({ x: rect.width / 2, y: rect.height / 2 });
                handleAddComponent(COMPONENT_TYPES.LLM);
              }
            }}
          >
            <Typography variant="body2">
              {COMPONENT_ICONS[COMPONENT_TYPES.LLM]} LLM Agent
            </Typography>
          </Paper>

          <Paper
            sx={{
              p: 1,
              mb: 1,
              bgcolor: COMPONENT_COLORS[COMPONENT_TYPES.OUTPUT],
              cursor: 'pointer',
              '&:hover': { boxShadow: 2 },
            }}
            onClick={() => {
              if (canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect();
                setMenuPosition({ x: rect.width * 2/3, y: rect.height * 2/3 });
                handleAddComponent(COMPONENT_TYPES.OUTPUT);
              }
            }}
          >
            <Typography variant="body2">
              {COMPONENT_ICONS[COMPONENT_TYPES.OUTPUT]} Output
            </Typography>
          </Paper>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            Drag components onto the canvas and connect them to create a workflow.
          </Typography>
        </Box>

        {/* Canvas */}
        <Box
          ref={canvasRef}
          sx={{
            flexGrow: 1,
            position: 'relative',
            overflow: 'auto',
            bgcolor: '#f5f5f5',
            backgroundImage: 'radial-gradient(#e0e0e0 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Components */}
          {components.map((component) => (
            <Paper
              key={component.id}
              elevation={selectedComponent?.id === component.id ? 8 : 3}
              sx={{
                position: 'absolute',
                left: component.position.x,
                top: component.position.y,
                width: 200,
                p: 2,
                cursor: 'move',
                bgcolor: COMPONENT_COLORS[component.type] || '#ffffff',
                border: selectedComponent?.id === component.id ? '2px solid #1976d2' : 'none',
                zIndex: 1,
              }}
              onMouseDown={(e) => handleComponentMouseDown(e, component)}
              onClick={(e) => handleComponentClick(e, component)}
              onDoubleClick={(e) => handleComponentDoubleClick(e, component)}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {COMPONENT_ICONS[component.type]} {component.name}
                </Typography>
                <Box>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedComponent(component);
                      setEditDialogOpen(true);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteComponent(component.id);
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              <Typography variant="body2" color="text.secondary" mb={1}>
                {getComponentDescription(component)}
              </Typography>

              {/* Connection points */}
              {component.type !== COMPONENT_TYPES.OUTPUT && (
                <Box
                  sx={{
                    position: 'absolute',
                    right: -6,
                    top: '50%',
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: '#1976d2',
                    transform: 'translateY(-50%)',
                    cursor: 'pointer',
                    zIndex: 2,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();

                    // Find a component to connect to
                    const targetComponent = components.find(c =>
                      c.type === (component.type === COMPONENT_TYPES.USER_INPUT ? COMPONENT_TYPES.LLM : COMPONENT_TYPES.OUTPUT)
                    );

                    if (targetComponent) {
                      handleCreateConnection(component.id, targetComponent.id);
                    }
                  }}
                />
              )}

              {component.type !== COMPONENT_TYPES.USER_INPUT && (
                <Box
                  sx={{
                    position: 'absolute',
                    left: -6,
                    top: '50%',
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: '#1976d2',
                    transform: 'translateY(-50%)',
                    cursor: 'pointer',
                    zIndex: 2,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();

                    // Find a component to connect from
                    const sourceComponent = components.find(c =>
                      c.type === (component.type === COMPONENT_TYPES.OUTPUT ? COMPONENT_TYPES.LLM : COMPONENT_TYPES.USER_INPUT)
                    );

                    if (sourceComponent) {
                      handleCreateConnection(sourceComponent.id, component.id);
                    }
                  }}
                />
              )}
            </Paper>
          ))}

          {/* Connections */}
          {connections.map((connection) => (
            drawConnection(connection.from, connection.to)
          ))}
        </Box>
      </Box>

      {/* Edit dialog */}
      <Dialog open={editDialogOpen} onClose={handleEditDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Edit {selectedComponent?.name}</DialogTitle>
        <DialogContent>
          {selectedComponent && (
            <Box sx={{ pt: 1 }}>
              <TextField
                label="Name"
                value={selectedComponent.name}
                onChange={(e) => setSelectedComponent({ ...selectedComponent, name: e.target.value })}
                fullWidth
                margin="normal"
              />

              {/* User Input has no editable configuration */}

              {selectedComponent.type === COMPONENT_TYPES.LLM && (
                <FormControl fullWidth margin="normal">
                  <InputLabel>Agent</InputLabel>
                  <Select
                    value={selectedComponent.config.agent_id || ''}
                    onChange={(e) => setSelectedComponent({
                      ...selectedComponent,
                      config: { ...selectedComponent.config, agent_id: e.target.value }
                    })}
                    label="Agent"
                  >
                    {agents.map((agent) => (
                      <MenuItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditDialogClose}>Cancel</Button>
          <Button
            onClick={() => selectedComponent && handleUpdateComponent(selectedComponent)}
            variant="contained"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Test dialog */}
      <Dialog open={testDialogOpen} onClose={handleTestDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>Test Workflow</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              label="Input"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              fullWidth
              multiline
              rows={4}
              margin="normal"
            />

            {testResult && (
              <Paper sx={{ p: 2, mt: 2, bgcolor: '#f5f5f5' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Result:
                </Typography>
                <Typography variant="body1">
                  {testResult.response}
                </Typography>
              </Paper>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleTestDialogClose}>Close</Button>
          <Button
            onClick={handleRunTest}
            variant="contained"
            disabled={testLoading}
            startIcon={testLoading ? <CircularProgress size={20} /> : <RunIcon />}
          >
            {testLoading ? 'Running...' : 'Run Test'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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
};

// Helper function to get component description
const getComponentDescription = (component: Component) => {
  switch (component.type) {
    case COMPONENT_TYPES.USER_INPUT:
      return 'Text entered during testing';
    case COMPONENT_TYPES.LLM:
      return `Agent: ${component.config.agent_id || 'None selected'}`;
    case COMPONENT_TYPES.OUTPUT:
      return 'Displays the result';
    default:
      return '';
  }
};

export default WorkflowCanvas;
