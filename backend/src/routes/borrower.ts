import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';
import {
  getProfile,
  updateProfile,
  uploadSalarySlip,
  applyLoan,
  getMyApplication,
} from '../controllers/borrowerController';

const router = Router();

// All routes require auth and borrower role
router.use(authenticate, authorize('borrower'));

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/upload-salary-slip', upload.single('salarySlip'), uploadSalarySlip);
router.post('/apply', applyLoan);
router.get('/application', getMyApplication);

export default router;
