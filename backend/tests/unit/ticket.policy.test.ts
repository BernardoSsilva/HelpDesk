import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canCreateTicketFor, canDeleteTicket, canEditTicket } from "../../src/domain/policies/ticket.policy.js";

const admin = { id: "admin", role: "ADMIN" };
const requester = { id: "req", role: "USER" };
const responsible = { id: "resp", role: "USER" };
const stranger = { id: "other", role: "USER" };
const ticket = { requesterId: "req", responsibleId: "resp" };
const unassigned = { requesterId: "req", responsibleId: null };

describe("ticket.policy", () => {
    describe("canEditTicket", () => {
        it("permite admin, solicitante e responsável", () => {
            assert.equal(canEditTicket(admin, ticket), true);
            assert.equal(canEditTicket(requester, ticket), true);
            assert.equal(canEditTicket(responsible, ticket), true);
        });

        it("nega quem não tem relação com o ticket", () => {
            assert.equal(canEditTicket(stranger, ticket), false);
            assert.equal(canEditTicket(stranger, unassigned), false);
        });
    });

    describe("canDeleteTicket", () => {
        it("permite admin e solicitante", () => {
            assert.equal(canDeleteTicket(admin, ticket), true);
            assert.equal(canDeleteTicket(requester, ticket), true);
        });

        it("nega o responsável e terceiros", () => {
            assert.equal(canDeleteTicket(responsible, ticket), false);
            assert.equal(canDeleteTicket(stranger, ticket), false);
        });
    });

    describe("canCreateTicketFor", () => {
        it("usuário comum só cria para si mesmo", () => {
            assert.equal(canCreateTicketFor(requester, "req"), true);
            assert.equal(canCreateTicketFor(requester, "outro"), false);
        });

        it("admin cria em nome de qualquer pessoa", () => {
            assert.equal(canCreateTicketFor(admin, "outro"), true);
        });
    });
});
