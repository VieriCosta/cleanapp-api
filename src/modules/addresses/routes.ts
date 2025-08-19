import { Router } from 'express';
import { listCtrl, createCtrl, setDefaultCtrl, deleteCtrl } from './controller';

const r = Router();

// GET /api/addresses
r.get('/', listCtrl);

// POST /api/addresses
r.post('/', createCtrl);

// POST /api/addresses/:id/set-default
r.post('/:id/set-default', setDefaultCtrl);

// DELETE /api/addresses/:id
r.delete('/:id', deleteCtrl);

export default r;
