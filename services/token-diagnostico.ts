// Mensagens de token. Ficheiro sem dependências para ser fácil de testar.

export type TipoToken = 'professor' | 'aluno' | 'encarregado';
export type MotivoToken =
  | 'ok' | 'inexistente' | 'tipo_errado' | 'usado' | 'anulado'
  | 'expirado' | 'bloqueado' | 'email_diferente' | 'limite';

export interface DiagnosticoToken {
  motivo: MotivoToken;
  tipoReal?: TipoToken;
  expiraEm?: string;
}

export function formatarDataHora(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// Mensagem para o utilizador. "expirado" só quando o prazo realmente passou.
export function mensagemDoDiagnostico(d: DiagnosticoToken, esperado: TipoToken): string {
  switch (d.motivo) {
    case 'tipo_errado':
      return `Este token não pertence a um ${esperado}: é um token de ${d.tipoReal ?? 'outro tipo de utilizador'}. Entra pela área certa ou consulta a escola se achas que o token está errado.`;
    case 'inexistente':
      return 'Token não encontrado. Confirma se copiaste o código completo ou consulta a escola.';
    case 'usado':
      return 'Este token já foi utilizado. Se foste tu, entra com a tua conta. Se não foste, pede um novo à escola.';
    case 'anulado':
      return 'Este token foi anulado, porque a escola gerou um novo ou o cancelou. Pede à escola o token mais recente.';
    case 'expirado': {
      const quando = formatarDataHora(d.expiraEm);
      return quando ? `Este token expirou em ${quando}. Pede um novo à escola.` : 'Este token expirou. Pede um novo à escola.';
    }
    case 'bloqueado':
      return 'Este token está bloqueado por tentativas falhadas. Tenta mais tarde ou consulta a escola.';
    case 'email_diferente':
      return 'O email não corresponde ao convite. Usa o email para o qual a escola enviou o convite.';
    case 'limite':
      return 'Demasiadas tentativas seguidas. Espera uns minutos e tenta outra vez.';
    default:
      return '';
  }
}
