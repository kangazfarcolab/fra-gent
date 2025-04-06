"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Divider,
} from '@mui/material';

interface ConnectionEditorProps {
  connection: any;
  onChange: (updatedConnection: any) => void;
}

const ConnectionEditor: React.FC<ConnectionEditorProps> = ({
  connection,
  onChange,
}) => {
  const [localConnection, setLocalConnection] = useState<any>(connection);

  useEffect(() => {
    setLocalConnection(connection);
  }, [connection]);

  const handleChange = (field: string, value: any) => {
    const updatedConnection = {
      ...localConnection,
      [field]: value,
    };
    setLocalConnection(updatedConnection);
    onChange(updatedConnection);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Connection Editor
      </Typography>

      <Typography variant="body2" color="textSecondary" paragraph>
        Configure how data flows between steps in your workflow.
      </Typography>

      <FormControl fullWidth margin="normal">
        <InputLabel>Source Step</InputLabel>
        <Select
          value={localConnection.source || ''}
          onChange={(e) => handleChange('source', e.target.value)}
          label="Source Step"
        >
          <MenuItem value="step1">Step 1</MenuItem>
          <MenuItem value="step2">Step 2</MenuItem>
          {/* This would be populated dynamically with actual step IDs */}
        </Select>
      </FormControl>

      <FormControl fullWidth margin="normal">
        <InputLabel>Target Step</InputLabel>
        <Select
          value={localConnection.target || ''}
          onChange={(e) => handleChange('target', e.target.value)}
          label="Target Step"
        >
          <MenuItem value="step2">Step 2</MenuItem>
          <MenuItem value="step3">Step 3</MenuItem>
          {/* This would be populated dynamically with actual step IDs */}
        </Select>
      </FormControl>

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle1" gutterBottom>
        Data Mapping
      </Typography>

      <Typography variant="body2" color="textSecondary" paragraph>
        Define how data from the source step is mapped to the target step's inputs.
      </Typography>

      <TextField
        label="Source Output"
        fullWidth
        margin="normal"
        value={localConnection.sourceOutput || ''}
        onChange={(e) => handleChange('sourceOutput', e.target.value)}
        helperText="The output field from the source step (e.g., 'result' or 'data.items')"
      />

      <TextField
        label="Target Input"
        fullWidth
        margin="normal"
        value={localConnection.targetInput || ''}
        onChange={(e) => handleChange('targetInput', e.target.value)}
        helperText="The input field on the target step (e.g., 'input' or 'parameters.query')"
      />

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle1" gutterBottom>
        Conditional Flow
      </Typography>

      <Typography variant="body2" color="textSecondary" paragraph>
        Optionally, specify conditions for when this connection should be active.
      </Typography>

      <FormControl fullWidth margin="normal">
        <InputLabel>Condition Type</InputLabel>
        <Select
          value={localConnection.conditionType || 'always'}
          onChange={(e) => handleChange('conditionType', e.target.value)}
          label="Condition Type"
        >
          <MenuItem value="always">Always</MenuItem>
          <MenuItem value="if">If Condition</MenuItem>
          <MenuItem value="unless">Unless Condition</MenuItem>
        </Select>
      </FormControl>

      {localConnection.conditionType !== 'always' && (
        <TextField
          label="Condition Expression"
          fullWidth
          margin="normal"
          value={localConnection.condition || ''}
          onChange={(e) => handleChange('condition', e.target.value)}
          helperText="JavaScript expression that evaluates to true/false"
        />
      )}

      <Box mt={3} display="flex" justifyContent="flex-end">
        <Button variant="contained" color="primary">
          Apply Changes
        </Button>
      </Box>
    </Box>
  );
};

export default ConnectionEditor;
