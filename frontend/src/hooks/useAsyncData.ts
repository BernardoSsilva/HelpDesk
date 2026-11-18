import { useCallback, useEffect, useRef, useState, type DependencyList } from "react";
import { getErrorMessage, getErrorStatus } from "../utils/errors";

/**
 * Carrega dados assíncronos e expõe `loading`, `error` e `refresh`.
 *
 * - Respostas fora de ordem são descartadas: só a chamada mais recente atualiza o estado
 *   (evita que uma resposta lenta de um filtro antigo sobrescreva a atual).
 * - Nada é atualizado depois que o componente é desmontado.
 * - Em caso de erro, `data` volta ao valor inicial e `error`/`errorStatus` descrevem a falha.
 *   Dados fictícios nunca são exibidos no lugar de dados reais.
 */
export function useAsyncData<T>(loader: () => Promise<T>, dependencies: DependencyList = [], initialData: T) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState<number | undefined>(undefined);

  const loaderRef = useRef(loader);
  const initialRef = useRef(initialData);
  const requestId = useRef(0);
  const mounted = useRef(true);

  loaderRef.current = loader;

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    const currentRequest = ++requestId.current;
    const isCurrent = () => mounted.current && currentRequest === requestId.current;

    setLoading(true);
    setError("");
    setErrorStatus(undefined);

    try {
      const result = await loaderRef.current();

      if (isCurrent()) {
        setData(result);
      }

      return result;
    } catch (err) {
      if (isCurrent()) {
        setError(getErrorMessage(err, "Não foi possível carregar os dados."));
        setErrorStatus(getErrorStatus(err));
        setData(initialRef.current);
      }

      return initialRef.current;
    } finally {
      if (isCurrent()) {
        setLoading(false);
      }
    }
    // As dependências informadas pelo chamador decidem quando recarregar.
  }, dependencies);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, error, errorStatus, loading, refresh, setData };
}
