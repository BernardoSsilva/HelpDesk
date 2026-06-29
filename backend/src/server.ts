import express from 'express'
import { ticketsRoutes } from './http/routes/tickets.routes.js';
import { usersRoutes } from './http/routes/users.routes.js';
import { swaggerRoutes } from './http/routes/swagger.routes.js';

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json())

app.get('/', (req, res) => {
    res.send(`Listening on port ${process.env.PORT}`);
});

app.use('/api', swaggerRoutes)
app.use('/users', usersRoutes)
app.use('/tickets', ticketsRoutes)

app.listen(port, () => {
    console.log(`app listening on port ${port}`);
});
