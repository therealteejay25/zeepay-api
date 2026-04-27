import express, { Router } from 'express';
import * as queryController from '../controllers/queryController.js';

const router: Router = express.Router();

router.get('/balance/:accountId', queryController.getBalance);
router.get('/transactions/:accountId', queryController.getTransactions);
router.get('/account/:accountId', queryController.getAccount);
router.get('/accounts', queryController.getAllAccounts);

export default router;
