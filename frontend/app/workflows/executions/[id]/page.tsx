import React from 'react';
import ExecutionHistory from '../../../components/WorkflowExecution/ExecutionHistory';

interface ExecutionHistoryPageProps {
  params: {
    id: string;
  };
}

export default function ExecutionHistoryPage({ params }: ExecutionHistoryPageProps) {
  return <ExecutionHistory workflowId={params.id} />;
}
