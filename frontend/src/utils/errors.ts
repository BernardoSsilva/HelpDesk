import { isAxiosError } from "axios";

type ApiError = {
  message?: string;
};

/** Texto amigável para exibir ao usuário a partir de qualquer erro de uma chamada à API. */
export function getErrorMessage(error: unknown, fallback = "Algo deu errado. Tente novamente.") {
  if (isAxiosError<ApiError>(error)) {
    const apiMessage = error.response?.data?.message;

    if (apiMessage) {
      return apiMessage;
    }

    if (error.code === "ECONNABORTED") {
      return "O servidor demorou demais para responder. Tente novamente.";
    }

    if (!error.response) {
      return "Não foi possível conectar ao servidor. Verifique sua conexão.";
    }
  }

  return fallback;
}

/** Status HTTP do erro, quando houver (útil para diferenciar 404 de falhas de rede). */
export function getErrorStatus(error: unknown) {
  return isAxiosError(error) ? error.response?.status : undefined;
}
