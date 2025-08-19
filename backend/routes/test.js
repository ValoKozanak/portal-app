const express = require('express');
const emailService = require('../services/emailService');

const router = express.Router();

// Test endpoint pre email service
router.post('/send-test-email', (req, res) => {
  const { email, type } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email je povinný' });
  }

  try {
    switch (type) {
      case 'welcome':
        emailService.sendWelcomeEmail(email, 'Test User')
          .then(result => {
            if (result.success) {
              res.json({ message: 'Welcome email odoslaný úspešne', result });
            } else {
              res.status(500).json({ error: 'Chyba pri posielaní welcome emailu', result });
            }
          })
          .catch(error => {
            res.status(500).json({ error: 'Chyba pri posielaní welcome emailu', error: error.message });
          });
        break;

      case 'task':
        emailService.sendTaskNotification(email, 'Test User', 'Test Task', 'Test Description', 'Test Company')
          .then(result => {
            if (result.success) {
              res.json({ message: 'Task notification email odoslaný úspešne', result });
            } else {
              res.status(500).json({ error: 'Chyba pri posielaní task emailu', result });
            }
          })
          .catch(error => {
            res.status(500).json({ error: 'Chyba pri posielaní task emailu', error: error.message });
          });
        break;

      case 'deadline':
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        emailService.sendDeadlineReminder(email, 'Test User', 'Test Task', tomorrow, 'Test Company')
          .then(result => {
            if (result.success) {
              res.json({ message: 'Deadline reminder email odoslaný úspešne', result });
            } else {
              res.status(500).json({ error: 'Chyba pri posielaní deadline emailu', result });
            }
          })
          .catch(error => {
            res.status(500).json({ error: 'Chyba pri posielaní deadline emailu', error: error.message });
          });
        break;

      case 'document':
        emailService.sendDocumentNotification(email, 'Test User', 'test-dokument.pdf', 1024000, 'application/pdf', 'Test Company', 'test@portal.sk')
          .then(result => {
            if (result.success) {
              res.json({ message: 'Document notification email odoslaný úspešne', result });
            } else {
              res.status(500).json({ error: 'Chyba pri posielaní document emailu', result });
            }
          })
          .catch(error => {
            res.status(500).json({ error: 'Chyba pri posielaní document emailu', error: error.message });
          });
        break;

      case 'company':
        emailService.sendCompanyNotification(email, 'Test User', 'Test Company s.r.o.', 'owner@test.sk', '12345678', 'contact@test.sk')
          .then(result => {
            if (result.success) {
              res.json({ message: 'Company notification email odoslaný úspešne', result });
            } else {
              res.status(500).json({ error: 'Chyba pri posielaní company emailu', result });
            }
          })
          .catch(error => {
            res.status(500).json({ error: 'Chyba pri posielaní company emailu', error: error.message });
          });
        break;

      default:
        res.status(400).json({ error: 'Neplatný typ emailu. Použite: welcome, task, deadline, document, company' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Chyba pri posielaní emailu', error: error.message });
  }
});

module.exports = router;
