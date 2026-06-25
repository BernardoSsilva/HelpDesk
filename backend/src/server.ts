import express from 'express'
import { ticketsRoutes } from './infrastructure/http/tickets.routes.js';
import { usersRoutes } from './infrastructure/http/users.routes.js';

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json())

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.use('/users', usersRoutes)
app.use('/tickets', ticketsRoutes)

app.listen(port, () => {
    console.log(`app listening on port ${port}`);
});
