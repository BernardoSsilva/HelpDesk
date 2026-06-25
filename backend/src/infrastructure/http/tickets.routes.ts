import { Router } from "express";
import {
    AddTicketCommentUseCase,
    CreateTicketUseCase,
    DeleteTicketUseCase,
    FindTicketByIdUseCase,
    FindTicketHistoryByTicketIdUseCase,
    FindTicketsByRequesterIdUseCase,
    FindTicketsByResponsibleIdUseCase,
    ListTicketsUseCase,
    UpdateTicketUseCase,
} from "../usecases/tickets/index.js";
import { authMiddleware } from "./auth.middleware.js";

const ticketsRoutes = Router()

ticketsRoutes.use(authMiddleware)

function getAuthUserId(authUser: Express.Request["authUser"]) {
    if (!authUser) {
        throw new Error("Authenticated user not found")
    }

    return authUser.id
}

function getParam(value: string | string[] | undefined, name: string) {
    if (typeof value !== "string") {
        throw new Error(`${name} is required`)
    }

    return value
}

ticketsRoutes.post("/", async (req, res) => {
    try {
        const authUserId = getAuthUserId(req.authUser)
        const { title, description, requesterId, priority, responsibleId } = req.body

        const createTicketUseCase = new CreateTicketUseCase()
        const ticket = await createTicketUseCase.execute({
            title,
            description,
            requesterId: requesterId ?? authUserId,
            priority,
            responsibleId,
            changedByUserId: authUserId,
        })

        res.status(201).json(ticket)
    } catch (error) {
        res.status(400).json({ message: error instanceof Error ? error.message : "Error creating ticket" })
    }
})

ticketsRoutes.get("/", async (_req, res) => {
    try {
        const listTicketsUseCase = new ListTicketsUseCase()
        const tickets = await listTicketsUseCase.execute()

        res.status(200).json(tickets)
    } catch (error) {
        res.status(400).json({ message: error instanceof Error ? error.message : "Error listing tickets" })
    }
})

ticketsRoutes.get("/requester/:requesterId", async (req, res) => {
    try {
        const requesterId = getParam(req.params.requesterId, "Requester id")

        const findTicketsByRequesterIdUseCase = new FindTicketsByRequesterIdUseCase()
        const tickets = await findTicketsByRequesterIdUseCase.execute(requesterId)

        res.status(200).json(tickets)
    } catch (error) {
        res.status(400).json({ message: error instanceof Error ? error.message : "Error finding tickets" })
    }
})

ticketsRoutes.get("/responsible/:responsibleId", async (req, res) => {
    try {
        const responsibleId = getParam(req.params.responsibleId, "Responsible id")

        const findTicketsByResponsibleIdUseCase = new FindTicketsByResponsibleIdUseCase()
        const tickets = await findTicketsByResponsibleIdUseCase.execute(responsibleId)

        res.status(200).json(tickets)
    } catch (error) {
        res.status(400).json({ message: error instanceof Error ? error.message : "Error finding tickets" })
    }
})

ticketsRoutes.get("/:id/history", async (req, res) => {
    try {
        const id = getParam(req.params.id, "Ticket id")

        const findTicketHistoryByTicketIdUseCase = new FindTicketHistoryByTicketIdUseCase()
        const history = await findTicketHistoryByTicketIdUseCase.execute(id)

        res.status(200).json(history)
    } catch (error) {
        res.status(400).json({ message: error instanceof Error ? error.message : "Error finding ticket history" })
    }
})

ticketsRoutes.post("/:id/comments", async (req, res) => {
    try {
        const authUserId = getAuthUserId(req.authUser)
        const id = getParam(req.params.id, "Ticket id")
        const { comment } = req.body

        const addTicketCommentUseCase = new AddTicketCommentUseCase()
        const history = await addTicketCommentUseCase.execute({
            ticketId: id,
            changedByUserId: authUserId,
            comment,
        })

        res.status(201).json(history)
    } catch (error) {
        res.status(400).json({ message: error instanceof Error ? error.message : "Error adding ticket comment" })
    }
})

ticketsRoutes.get("/:id", async (req, res) => {
    try {
        const id = getParam(req.params.id, "Ticket id")

        const findTicketByIdUseCase = new FindTicketByIdUseCase()
        const ticket = await findTicketByIdUseCase.execute(id)

        if (!ticket) {
            res.status(404).json({ message: "Ticket not found" })
            return
        }

        res.status(200).json(ticket)
    } catch (error) {
        res.status(400).json({ message: error instanceof Error ? error.message : "Error finding ticket" })
    }
})

ticketsRoutes.put("/:id", async (req, res) => {
    try {
        const authUserId = getAuthUserId(req.authUser)
        const id = getParam(req.params.id, "Ticket id")
        const { title, description, priority, status, responsibleId, comment } = req.body

        const updateTicketUseCase = new UpdateTicketUseCase()
        const ticket = await updateTicketUseCase.execute({
            id,
            changedByUserId: authUserId,
            title,
            description,
            priority,
            status,
            responsibleId,
            comment,
        })

        res.status(200).json(ticket)
    } catch (error) {
        res.status(400).json({ message: error instanceof Error ? error.message : "Error updating ticket" })
    }
})

ticketsRoutes.delete("/:id", async (req, res) => {
    try {
        const id = getParam(req.params.id, "Ticket id")

        const deleteTicketUseCase = new DeleteTicketUseCase()
        await deleteTicketUseCase.execute(id)

        res.status(204).send()
    } catch (error) {
        res.status(400).json({ message: error instanceof Error ? error.message : "Error deleting ticket" })
    }
})

export { ticketsRoutes };
