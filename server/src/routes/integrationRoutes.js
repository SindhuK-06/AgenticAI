const express = require('express');
const { body } = require('express-validator');
const integrationController = require('../controllers/integrationController');
const { protect, validateRequest } = require('../middleware');

const router = express.Router();

// Public OAuth Callback endpoints
router.get('/oauth/error', integrationController.oauthError);
router.get('/oauth/:provider/callback', integrationController.handleOAuthCallback);

// Protected routes
router.use(protect);

router.get('/', integrationController.listIntegrations);
router.get('/status', integrationController.getStatus);
router.get('/oauth/:provider/start', integrationController.startOAuth);

router.post(
  '/',
  [
    body('provider').isIn(['gmail', 'slack', 'discord', 'google-sheets', 'openrouter', 'gemini']).withMessage('Invalid provider'),
  ],
  validateRequest,
  integrationController.saveManual
);

router.post('/:provider/test', integrationController.testIntegration);
router.delete('/:provider', integrationController.disconnect);

module.exports = router;
