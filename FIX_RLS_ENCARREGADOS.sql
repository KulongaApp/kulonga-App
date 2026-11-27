-- KULONGA — correcção da política RLS de encarregados
-- Corrige a recursão infinita causada por uma policy de encarregados
-- que consultava alunos_do_encarregado(), que por sua vez consultava encarregados.

BEGIN;

-- O acesso ao próprio perfil já é suficiente para o fluxo do encarregado.
-- A associação encarregado_aluno continua protegida pela sua própria policy.
DROP POLICY IF EXISTS encarregados_staff ON public.encarregados;
DROP POLICY IF EXISTS encarregados_ver_propria_linha ON public.encarregados;
DROP POLICY IF EXISTS encarregados_proprio ON public.encarregados;

CREATE POLICY encarregados_proprio
  ON public.encarregados
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

NOTIFY pgrst, 'reload schema';

COMMIT;

-- Teste opcional, autenticado como encarregado:
-- SELECT id, nome FROM public.encarregados WHERE user_id = auth.uid();
