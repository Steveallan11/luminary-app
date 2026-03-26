import { AgentName } from '@/types/agents';

export const AGENT_NAMES: AgentName[] = [
  'ceo',
  'product_tech',
  'content_curriculum',
  'growth',
  'support_success',
  'finance_ops',
];

export const PRIORITY_RANK: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};
