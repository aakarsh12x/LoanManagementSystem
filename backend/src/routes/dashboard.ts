import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getSalesData,
  getSanctionData,
  sanctionAction,
  getDisbursementData,
  disburseLoan,
  getCollectionData,
  recordPayment,
  getLoanPayments,
} from '../controllers/dashboardController';

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

// Sales module — accessible by admin and sales
router.get('/sales', authorize('admin', 'sales'), getSalesData);

// Sanction module — accessible by admin and sanction
router.get('/sanction', authorize('admin', 'sanction'), getSanctionData);
router.put('/sanction/:id', authorize('admin', 'sanction'), sanctionAction);

// Disbursement module — accessible by admin and disbursement
router.get('/disbursement', authorize('admin', 'disbursement'), getDisbursementData);
router.put('/disbursement/:id', authorize('admin', 'disbursement'), disburseLoan);

// Collection module — accessible by admin and collection
router.get('/collection', authorize('admin', 'collection'), getCollectionData);
router.post('/collection/:id/payment', authorize('admin', 'collection'), recordPayment);
router.get('/collection/:id/payments', authorize('admin', 'collection'), getLoanPayments);

export default router;
