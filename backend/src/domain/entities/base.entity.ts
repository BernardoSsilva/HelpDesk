import { randomUUID } from "node:crypto";

export class BaseEntity {
    private id: string;
    public createdAt: Date;
    public updatedAt!: Date | null;

    constructor(id?: string) {
        this.id = id ?? randomUUID();
        this.createdAt = new Date();
    }

    public getId() {
        return this.id
    }
}
