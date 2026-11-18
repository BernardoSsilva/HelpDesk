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
} from "../../infrastructure/usecases/tickets/index.js";
import { authMiddleware, requireAuthUser } from "../middlewares/auth.middleware.js";
import { addCommentSchema, createTicketSchema, parse, parseId, updateTicketSchema } from "../validation/schemas.js";

const ticketsRoutes = Router()

ticketsRoutes.use(authMiddleware)

ticketsRoutes.post("/", async (req, res) => {
    const actor = requireAuthUser(req)
    const { title, description, priority, department, requesterId, responsibleId } = parse(createTicketSchema, req.body)

    const ticket = await new CreateTicketUseCase().execute({
        actor,
        title,
        description,
        priority,
        department,
        requesterId,
        responsibleId,
    })

    res.status(201).json(ticket)
})

ticketsRoutes.get("/", async (_req, res) => {
    res.status(200).json(await new ListTicketsUseCase().execute())
})

ticketsRoutes.get("/requester/:requesterId", async (req, res) => {
    const requesterId = parseId(req.params.requesterId, "requesterId")

    res.status(200).json(await new FindTicketsByRequesterIdUseCase().execute(requesterId))
})

ticketsRoutes.get("/responsible/:responsibleId", async (req, res) => {
    const responsibleId = parseId(req.params.responsibleId, "responsibleId")

    res.status(200).json(await new FindTicketsByResponsibleIdUseCase().execute(responsibleId))
})

ticketsRoutes.get("/:id/history", async (req, res) => {
    const id = parseId(req.params.id)

    res.status(200).json(await new FindTicketHistoryByTicketIdUseCase().execute(id))
})

ticketsRoutes.post("/:id/comments", async (req, res) => {
    const actor = requireAuthUser(req)
    const id = parseId(req.params.id)
    const { comment } = parse(addCommentSchema, req.body)

    const history = await new AddTicketCommentUseCase().execute({
        ticketId: id,
        changedByUserId: actor.id,
        comment,
    })

    res.status(201).json(history)
})

ticketsRoutes.get("/:id", async (req, res) => {
    const id = parseId(req.params.id)

    res.status(200).json(await new FindTicketByIdUseCase().execute(id))
})

ticketsRoutes.put("/:id", async (req, res) => {
    const actor = requireAuthUser(req)
    const id = parseId(req.params.id)
    const { title, description, priority, status, department, responsibleId, comment } = parse(updateTicketSchema, req.body)

    const ticket = await new UpdateTicketUseCase().execute({
        id,
        actor,
        title,
        description,
        priority,
        status,
        department,
        responsibleId,
        comment,
    })

    res.status(200).json(ticket)
})

ticketsRoutes.delete("/:id", async (req, res) => {
    const actor = requireAuthUser(req)
    const id = parseId(req.params.id)

    await new DeleteTicketUseCase().execute({ id, actor })

    res.status(204).send()
})

export { ticketsRoutes };
