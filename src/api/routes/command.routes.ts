import express, { Router } from 'express';
import * as commandController from '../controllers/commandController.js';
import { validate, createAccountSchema, depositSchema, withdrawSchema, transferSchema } from '../../middleware/validation.js';

const router: Router = express.Router();

router.post('/create-account', validate(createAccountSchema), commandController.createAccount);
router.post('/deposit', validate(depositSchema), commandController.deposit);
router.post('/withdraw', validate(withdrawSchema), commandController.withdraw);
router.post('/transfer', validate(transferSchema), commandController.transfer);
router.post('/replay/:accountId', commandController.replay);

export default router;
