import { AxiosError } from "axios";
import { describe, expect, it } from "vitest";
import { getErrorMessage, getErrorStatus } from "./errors";

function apiError(status: number, data: unknown) {
  return new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
    status,
    statusText: "",
    data,
    headers: {},
    config: {} as never,
  });
}

describe("getErrorMessage", () => {
  it("usa a mensagem enviada pela API (antes aparecia 'Request failed with status code 409')", () => {
    expect(getErrorMessage(apiError(409, { message: "Já existe um usuário com este e-mail" }))).toBe("Já existe um usuário com este e-mail");
  });

  it("sem resposta do servidor: mensagem de conexão", () => {
    expect(getErrorMessage(new AxiosError("Network Error", "ERR_NETWORK"))).toMatch(/conectar ao servidor/);
  });

  it("timeout tem mensagem própria", () => {
    expect(getErrorMessage(new AxiosError("timeout", "ECONNABORTED"))).toMatch(/demorou demais/);
  });

  it("resposta sem mensagem e erros desconhecidos caem no texto padrão informado", () => {
    expect(getErrorMessage(apiError(500, {}), "Falha ao salvar")).toBe("Falha ao salvar");
    expect(getErrorMessage(new Error("boom"), "Falha ao salvar")).toBe("Falha ao salvar");
    expect(getErrorMessage("texto")).toBe("Algo deu errado. Tente novamente.");
  });
});

describe("getErrorStatus", () => {
  it("devolve o status HTTP quando existe", () => {
    expect(getErrorStatus(apiError(404, {}))).toBe(404);
    expect(getErrorStatus(new Error("x"))).toBeUndefined();
  });
});
