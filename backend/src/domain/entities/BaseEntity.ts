import { v4 as uuidv4 } from 'uuid';

export class BaseEntity {
    private id: string;
    public createdAt: Date;
    public updatedAt!: Date | null;

    constructor(id?: string) {
        this.id = id ?? uuidv4();
        this.createdAt = new Date;
    }

}