import { useEffect, useState } from "react";

/** Devolve `value` só depois de ficar `delay` ms sem mudar (evita uma requisição por tecla digitada). */
export function useDebouncedValue<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay);

    return () => clearTimeout(timeout);
  }, [value, delay]);

  return debounced;
}
