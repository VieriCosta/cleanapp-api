import { Request, Response } from 'express';
import * as Categories from './service';

export async function listCtrl(_req: Request, res: Response) {
  const items = await Categories.listActive();
  res.status(200).json({ items });
}
