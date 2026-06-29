import { useCallback, useEffect, useState, type DependencyList } from "react";
import { AxiosError } from "axios";

export function useAsyncData<T>(loader: () => Promise<T>, dependencies: DependencyList = [], fallbackData: T) {
  const [data, setData] = useState(fallbackData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await loader();
      setData(result);
      return result;
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || "Nao foi possivel carregar os dados.");
      setData(fallbackData);
      return fallbackData;
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, error, loading, refresh, setData };
}
