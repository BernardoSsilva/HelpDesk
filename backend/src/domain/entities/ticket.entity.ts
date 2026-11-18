import type { TicketDepartmentEnum } from "../enums/ticketDepartment.enum.js";
import type { TicketPriorityEnum } from "../enums/ticketPriority.enum.js";
import { TicketStatusEnum } from "../enums/ticketStatus.enum.js";
import { BaseEntity } from "./base.entity.js";

type Props = {
    id?: string;
    title: string;
    description: string;
    requesterId: string;
    priority: TicketPriorityEnum;
    status?: TicketStatusEnum;
    responsibleId?: string | null;
    department?: TicketDepartmentEnum | null;
}

type UpdateProps = Partial<Omit<Props, "id" | "requesterId">>

export class TicketEntity extends BaseEntity {
    private title!: string;
    private description!: string;
    private requesterId!: string;
    private priority!: TicketPriorityEnum;
    private status!: TicketStatusEnum;
    private responsibleId!: string | null;
    private department!: TicketDepartmentEnum | null;

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

    public getDepartment() {
        return this.department
    }

    public setDepartment(value: TicketDepartmentEnum | null) {
        this.department = value
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

    constructor({ department = null, description, id, priority, requesterId, responsibleId = null, status = TicketStatusEnum.ABERTO, title }: Props) {
        super(id)

        this.setTitle(title)
        this.setDescription(description)
        this.setRequesterId(requesterId)
        this.setPriority(priority)
        this.setStatus(status)
        this.setResponsibleId(responsibleId)
        this.setDepartment(department)
    }

    public update(updatedFields: UpdateProps) {
        if (updatedFields.title) this.setTitle(updatedFields.title)
        if (updatedFields.description) this.setDescription(updatedFields.description)
        if (updatedFields.priority) this.setPriority(updatedFields.priority)
        if (updatedFields.status) this.setStatus(updatedFields.status)
        if (updatedFields.responsibleId !== undefined) this.setResponsibleId(updatedFields.responsibleId)
        if (updatedFields.department !== undefined) this.setDepartment(updatedFields.department)
        this.updatedAt = new Date();
    }
}
