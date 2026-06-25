import type { TicketPriorityEnum } from "../enums/TicketPriorityEnum.js";
import { TicketStatusEnum } from "../enums/TicketStatusEnum.js";
import { BaseEntity } from "./BaseEntity.js";

type Props = {
    title: string;
    description: string;
    requesterId: string;
    priority: TicketPriorityEnum;
    status?: TicketStatusEnum;
    responsibleId?: string | null;
}

type UpdateProps = Partial<Omit<Props, "requesterId">>

export class TicketEntity extends BaseEntity {
    private title!: string;
    private description!: string;
    private requesterId!: string;
    private priority!: TicketPriorityEnum;
    private status!: TicketStatusEnum;
    private responsibleId!: string | null;

    public getTitle() {
        return this.title
    }

    public getDescription() {
        return this.description
    }

    public getRequesterId() {
        return this.requesterId
    }

    public getPriority() {
        return this.priority
    }

    public getStatus() {
        return this.status
    }

    public getResponsibleId() {
        return this.responsibleId
    }

    public setTitle(value: string) {
        this.title = value
    }

    public setDescription(value: string) {
        this.description = value
    }

    public setRequesterId(value: string) {
        this.requesterId = value
    }

    public setPriority(value: TicketPriorityEnum) {
        this.priority = value
    }

    public setStatus(value: TicketStatusEnum) {
        this.status = value
    }

    public setResponsibleId(value: string | null) {
        this.responsibleId = value
    }

    constructor({ description, priority, requesterId, responsibleId = null, status = TicketStatusEnum.ABERTO, title }: Props) {
        super()

        this.setTitle(title)
        this.setDescription(description)
        this.setRequesterId(requesterId)
        this.setPriority(priority)
        this.setStatus(status)
        this.setResponsibleId(responsibleId)
    }

    public update(updatedFields: UpdateProps) {
        if (updatedFields.title) this.setTitle(updatedFields.title)
        if (updatedFields.description) this.setDescription(updatedFields.description)
        if (updatedFields.priority) this.setPriority(updatedFields.priority)
        if (updatedFields.status) this.setStatus(updatedFields.status)
        if (updatedFields.responsibleId !== undefined) this.setResponsibleId(updatedFields.responsibleId)
        this.updatedAt = new Date();
    }
}
