import React from 'react';
import ExecutionDetails from '../../../../components/WorkflowExecution/ExecutionDetails';

interface ExecutionDetailsPageProps {
  params: {
    id: string;
    executionId: string;
  };
}

export default function ExecutionDetailsPage({ params }: ExecutionDetailsPageProps) {
  return <ExecutionDetails workflowId={params.id} executionId={params.executionId} />;
}
