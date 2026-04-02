/**
 * 九部制 Mock：覆盖主要 AgentStatus / Ministry（合并 cyber-edict-ide 数据，吏部 id 为 libu_hr）
 */
import type { Edge, Node } from '@xyflow/react';
import type { AgentFlowData, AgentNodeData, LogEntry, SOULConfig, WorkflowMode } from '../types/agent';

const mode: WorkflowMode = 'design';

const makeSoul = (role: string, persona: string, skills: string[], model = 'claude-sonnet-4'): SOULConfig => ({
  role,
  persona,
  skills,
  model,
  temperature: 0.7,
  maxTokens: 4096,
  rules: ['输出结构化内容', '遵循分权制衡原则', '保持日志完整性'],
  outputFormat: 'markdown',
});

type NodeCore = Omit<AgentNodeData, 'id' | 'label' | 'mode' | 'soulConfig' | 'logs'>;

function buildNode(
  id: string,
  label: string,
  partial: NodeCore & { soulConfig?: SOULConfig; logs?: LogEntry[] },
  position: { x: number; y: number }
): Node<AgentFlowData, 'agentNode'> {
  const { soulConfig, logs, ...core } = partial;
  const data = {
    id,
    label,
    mode,
    soulConfig: soulConfig ?? makeSoul(label, `${label}职守`, ['reasoning']),
    logs: logs ?? [],
    ...core,
  } satisfies AgentNodeData;
  return {
    id,
    type: 'agentNode',
    position,
    data: data as AgentFlowData,
  };
}

export const initialNodes: Node<AgentFlowData, 'agentNode'>[] = [
  buildNode(
    'zhongshu',
    '中书省',
    {
      role: 'Zhongshu',
      status: 'idle',
      tokenCount: 12480,
      lastActive: Date.now() - 3000,
      soulConfig: makeSoul(
        '中书令',
        '帝国首席规划官，负责接旨、拆解任务、制定执行方案。思维严密，善于将复杂需求分解为可执行的子任务序列。',
        ['task_planning', 'requirement_analysis', 'workflow_design']
      ),
      logs: [
        {
          id: 'l1',
          timestamp: Date.now() - 5000,
          agentId: 'zhongshu',
          level: 'system',
          message:
            '[演示] 初始为空闲。运行模式「下旨」后状态与日志才会变化；未勾选自动模型时不会调用 API。',
          taskId: 't-demo',
        },
      ],
    },
    { x: 420, y: 60 }
  ),
  buildNode(
    'menxia',
    '门下省',
    {
      role: 'Menxia',
      status: 'idle',
      tokenCount: 8920,
      lastActive: Date.now() - 1000,
      soulConfig: makeSoul(
        '侍中',
        '帝国首席审核官，负责对中书省的规划进行质量审核和风险评估。铁面无私，发现问题坚决封驳打回。',
        ['quality_review', 'risk_assessment', 'logic_validation']
      ),
      logs: [
        {
          id: 'l3',
          timestamp: Date.now() - 2000,
          agentId: 'menxia',
          level: 'system',
          message: '[演示] 初始为空闲。有「待审议」旨意时顶栏会出现「继续审议」。',
          taskId: 't-demo',
        },
      ],
    },
    { x: 420, y: 220 }
  ),
  buildNode(
    'shangshu',
    '尚书省',
    {
      role: 'Shangshu',
      status: 'idle',
      tokenCount: 6100,
      lastActive: Date.now() - 60000,
      soulConfig: makeSoul(
        '尚书令',
        '帝国调度总枢，负责将审核通过的任务分发至六部，协调并行执行，汇总最终结果回奏。',
        ['task_dispatch', 'coordination', 'result_aggregation']
      ),
      logs: [],
    },
    { x: 420, y: 380 }
  ),
  buildNode(
    'hubu',
    '户部',
    {
      role: 'Worker',
      ministry: 'Hu',
      status: 'completed',
      tokenCount: 21340,
      lastActive: Date.now() - 120000,
      soulConfig: makeSoul(
        '户部尚书',
        '数据与资源管理专家，擅长数据处理、统计分析和报表生成。',
        ['data_processing', 'statistical_analysis', 'report_generation']
      ),
      logs: [
        {
          id: 'l4',
          timestamp: Date.now() - 130000,
          agentId: 'hubu',
          level: 'info',
          message: '数据采集完成：共 1,240 条记录',
          taskId: 't2',
        },
        {
          id: 'l5',
          timestamp: Date.now() - 120000,
          agentId: 'hubu',
          level: 'system',
          message: '任务完成，结果已提交尚书省',
          taskId: 't2',
        },
      ],
    },
    { x: 80, y: 560 }
  ),
  buildNode(
    'libu',
    '礼部',
    {
      role: 'Worker',
      ministry: 'Li',
      status: 'idle',
      tokenCount: 15600,
      lastActive: Date.now() - 2000,
      soulConfig: makeSoul(
        '礼部尚书',
        '文档与规范制定专家，负责技术文档、API 文档和报告生成，输出格式规范严谨。',
        ['document_writing', 'api_documentation', 'technical_reporting']
      ),
      logs: [
        {
          id: 'l6',
          timestamp: Date.now() - 5000,
          agentId: 'libu',
          level: 'info',
          message: '[演示] 示例日志：非真实模型在跑；真实输出仅在配置 API 并下旨/测试后出现',
          taskId: 't3',
        },
      ],
    },
    { x: 280, y: 560 }
  ),
  buildNode(
    'bingbu',
    '兵部',
    {
      role: 'Worker',
      ministry: 'Bing',
      status: 'idle',
      tokenCount: 9800,
      lastActive: Date.now() - 300000,
      soulConfig: makeSoul(
        '兵部尚书',
        '工程实现专家，负责代码开发、算法实现和系统巡检，代码质量至上。',
        ['code_development', 'algorithm_design', 'code_review', 'bug_fixing']
      ),
      logs: [],
    },
    { x: 480, y: 560 }
  ),
  buildNode(
    'xingbu',
    '刑部',
    {
      role: 'Worker',
      ministry: 'Xing',
      status: 'rejected',
      tokenCount: 4320,
      lastActive: Date.now() - 45000,
      soulConfig: makeSoul(
        '刑部尚书',
        '安全与合规专家，负责安全扫描、合规检查和红线管控。发现违规立即上报，绝不妥协。',
        ['security_scanning', 'compliance_check', 'risk_control']
      ),
      logs: [
        {
          id: 'l7',
          timestamp: Date.now() - 45000,
          agentId: 'xingbu',
          level: 'error',
          message: '合规检查不通过：检测到敏感数据暴露风险',
          taskId: 't4',
        },
      ],
    },
    { x: 680, y: 560 }
  ),
  buildNode(
    'gongbu',
    '工部',
    {
      role: 'Worker',
      ministry: 'Gong',
      status: 'idle',
      tokenCount: 7650,
      lastActive: Date.now() - 600000,
      soulConfig: makeSoul(
        '工部尚书',
        '基础设施专家，负责 CI/CD 配置、Docker 部署、自动化工具链搭建。',
        ['cicd_pipeline', 'docker_config', 'automation', 'monitoring']
      ),
      logs: [],
    },
    { x: 880, y: 560 }
  ),
  buildNode(
    'libu_hr',
    '吏部',
    {
      role: 'Worker',
      ministry: 'Li_personnel',
      status: 'blocked',
      tokenCount: 3200,
      lastActive: Date.now() - 900000,
      soulConfig: makeSoul(
        '吏部尚书',
        '人事与 Agent 治理专家，负责官员名册、权限与培训体系维护。',
        ['agent_registry', 'permissions', 'training', 'hr_policy']
      ),
      logs: [
        {
          id: 'l8',
          timestamp: Date.now() - 900000,
          agentId: 'libu_hr',
          level: 'warn',
          message: '外部名录同步超时，人事任务阻塞',
          taskId: 't5',
        },
      ],
    },
    { x: 1080, y: 560 }
  ),
];

export const initialEdges: Edge[] = [
  /** 默认不动画，避免误以为数据在「一直传输」 */
  { id: 'e-zh-mx', source: 'zhongshu', target: 'menxia', animated: false, type: 'smoothstep' },
  { id: 'e-mx-ss', source: 'menxia', target: 'shangshu', animated: false, type: 'smoothstep' },
  { id: 'e-mx-zh', source: 'menxia', target: 'zhongshu', animated: false, type: 'smoothstep', label: '封驳' },
  { id: 'e-ss-hu', source: 'shangshu', target: 'hubu', animated: false, type: 'smoothstep' },
  { id: 'e-ss-li', source: 'shangshu', target: 'libu', animated: false, type: 'smoothstep' },
  { id: 'e-ss-bi', source: 'shangshu', target: 'bingbu', animated: false, type: 'smoothstep' },
  { id: 'e-ss-xi', source: 'shangshu', target: 'xingbu', animated: false, type: 'smoothstep' },
  { id: 'e-ss-go', source: 'shangshu', target: 'gongbu', animated: false, type: 'smoothstep' },
  { id: 'e-ss-hr', source: 'shangshu', target: 'libu_hr', animated: false, type: 'smoothstep' },
];
