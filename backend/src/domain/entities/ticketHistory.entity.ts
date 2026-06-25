import type { TicketHistoryActionEnum } from "../enums/ticketHistoryAction.enum.js";
import { BaseEntity } from "./base.entity.js";

type Props = {
    id?: string;
    ticketId: string;
    action: TicketHistoryActionEnum;
    changedByUserId: string;
    previousValue?: string | null;
    newValue?: string | null;
    comment?: string | null;
}

export class TicketHistoryEntity extends BaseEntity {
    private ticketId!: string;
    private action!: TicketHistoryActionEnum;
    private changedByUserId!: string;
    private previousValue!: string | null;
    private newValue!: string | null;
    private comment!: string | null;

    public getTicketId() {
        return this.ticketId
    }

    public getAction() {
        return this.action
    }

    public getChangedByUserId() {
        return this.changedByUserId
    }

    public getPreviousValue() {
        return this.previousValue
    }

    public getNewValue() {
        return this.newValue
    }

    public getComment() {
        return this.comment
    }

    public setTicketId(value: string) {
        this.ticketId = value
    }

    public setAction(value: TicketHistoryActionEnum) {
        this.action = value
    }

    public setChangedByUserId(value: string) {
        this.changedByUserId = value
    }

    public setPreviousValue(value: string | null) {
        this.previousValue = value
    }

    public setNewValue(value: string | null) {
        this.newValue = value
    }

    public setComment(value: string | null) {
        this.comment = value
    }

    constructor({ action, changedByUserId, comment = null, id, newValue = null, previousValue = null, ticketId }: Props) {
        super(id)

        this.setTicketId(ticketId)
        this.setAction(action)
        this.setChangedByUserId(changedByUserId)
        this.setPreviousValue(previousValue)
        this.setNewValue(newValue)
        this.setComment(comment)
    }
}
