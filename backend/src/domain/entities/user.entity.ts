import type { UserRoleEnum } from "../enums/userRole.enum.js";
import { BaseEntity } from "./base.entity.js";


type Props = {
    id?: string;
    userEmail: string;
    userName: string;
    password: string;
    userRole: UserRoleEnum
}
export class UserEntity extends BaseEntity {
    private userEmail!: string;
    private userName!: string;
    private password!: string;
    private userRole!: UserRoleEnum

    public getEmail() {
        return this.userEmail
    }

    public getUserName() {
        return this.userName
    }

    public getUserRole() {
        return this.userRole
    }

    public getPassword() {
        return this.password
    }

    public setEmail(value: string) {
        this.userEmail = value
    }

    public setUserName(value: string) {
        this.userName = value
    }

    public setUserRole(value: UserRoleEnum) {
        this.userRole = value
    }

    public setPassword(value: string) {
        this.password = value
    }
    constructor({ id, password, userEmail, userName, userRole }: Props) {
        super(id)

        this.setEmail(userEmail)
        this.setUserName(userName)
        this.setUserRole(userRole)
        this.setPassword(password)
    }

    public update(updatedFields: Partial<Props>) {
        if (updatedFields.password) this.setPassword(updatedFields.password)
        if (updatedFields.userEmail) this.setEmail(updatedFields.userEmail)
        if (updatedFields.userName) this.setUserName(updatedFields.userName)
        if (updatedFields.userRole) this.setUserRole(updatedFields.userRole)
        this.updatedAt = new Date();
    }
}
