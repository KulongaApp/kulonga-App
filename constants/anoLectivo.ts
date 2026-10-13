// Ano lectivo corrente em formado "AAAA/AAAA".
// Convenção usada em toda a app: o ano lectivo vira em Setembro.
// Estava escrito à mão como "2025/2026" em vários ecrãs e ficava desactualizado.
export function anoLectivoActual(data: Date = new Date()): string {
  const ano = data.getFullYear();
  return data.getMonth() >= 8 ? `${ano}/${ano + 1}` : `${ano - 1}/${ano}`;
}
