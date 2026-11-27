-- KULONGA — limpeza dos tokens fictícios usados nos testes
-- Executar no Supabase SQL Editor com privilégios de administrador.
-- Não executar através da API anon/authenticated.

BEGIN;

DO $$
DECLARE
  v_aluno_id uuid := '04d13f87-c464-4358-afdb-03ff95aefa2f';
  v_escola_id uuid;
  v_apagados integer;
BEGIN
  -- Barreira de segurança: confirma que o UUID pertence ao aluno fictício.
  SELECT a.escola_id
    INTO v_escola_id
  FROM public.alunos a
  JOIN public.escolas e ON e.id = a.escola_id
  WHERE a.id = v_aluno_id
    AND a.nome_completo = 'KULONGA TESTE Aluno'
    AND a.email = 'kulonga.qa.aluno.20261015093931@example.invalid'
    AND e.nome = 'Escola KULONGA TESTE 20261015093931';

  IF v_escola_id IS NULL THEN
    RAISE EXCEPTION 'Barreira de segurança: o aluno não corresponde ao conjunto de teste esperado';
  END IF;

  DELETE FROM public.tokens_acesso
  WHERE aluno_id = v_aluno_id;

  GET DIAGNOSTICS v_apagados = ROW_COUNT;
  RAISE NOTICE 'Tokens fictícios apagados: %', v_apagados;
END;
$$;

COMMIT;

-- Verificação esperada: 0 linhas.
SELECT id, aluno_id, codigo, tipo, ativo, criado_em
FROM public.tokens_acesso
WHERE aluno_id = '04d13f87-c464-4358-afdb-03ff95aefa2f';
