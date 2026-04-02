import { ReactFlowProvider } from '@xyflow/react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Inspector } from '@/components/layout/Inspector';
import { Console } from '@/components/layout/Console';
import { WorkflowCanvas } from '@/components/canvas/WorkflowCanvas';

export default function App() {
  return (
    <ReactFlowProvider>
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Navbar />
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          <Sidebar />
          <WorkflowCanvas />
          <Inspector />
        </div>
        <Console />
      </div>
    </ReactFlowProvider>
  );
}
