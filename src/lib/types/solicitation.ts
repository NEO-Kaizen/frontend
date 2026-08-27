export type RequestStatus =
  | "Solicitação enviada"
  | "Aguardando triagem"
  | "Em triagem"
  | "Pendente de informações"
  | "Aguardando mapeamento"
  | "Mapeamento agendado"
  | "Em mapeamento"
  | "Em análise de viabilidade"
  | "Elegível"
  | "Não elegível"
  | "Priorizado"
  | "Backlog"
  | "Direcionado para outra área"
  | "Em desenvolvimento"
  | "Em homologação"
  | "Concluído"
  | "Cancelado";

export interface RequestDetail {
  protocol: string;
  demandTitle: string;
  processName: string;
  status: RequestStatus;
  assigneeName: string | null;
  openedAt: string;
  estimatedCompletion: string | null;
  mappingDate: string | null;
  meeting: {
    scheduledFor: string;
    link: string | null;
  } | null;
  pendingIssues: string[];
  nextStep: string;
  lastTechnicalMessage: string | null;
  lastUpdate: string;
  conclusion: {
    result: string;
    justification: string;
  } | null;
  email?: string; // Para testes no mock de busca por email
}
