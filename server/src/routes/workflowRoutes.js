const express = require('express');
const { body } = require('express-validator');
const workflowController = require('../controllers/workflowController');
const { protect, validateRequest } = require('../middleware');

const router = express.Router();

router.use(protect);

router.get('/dashboard', workflowController.getDashboard);
router.get('/', workflowController.listWorkflows);

router.post(
  '/',
  [body('name').trim().notEmpty().withMessage('Workflow name is required')],
  validateRequest,
  workflowController.createWorkflow
);

router.post(
  '/generate',
  [body('prompt').trim().notEmpty().withMessage('Prompt cannot be empty')],
  validateRequest,
  workflowController.generateWorkflow
);

router.get('/:id', workflowController.getWorkflow);
router.put('/:id', workflowController.updateWorkflow);
router.post('/:id/duplicate', workflowController.duplicateWorkflow);
router.post('/:id/execute', workflowController.executeWorkflow);
router.delete('/:id', workflowController.deleteWorkflow);

module.exports = router;
