const axios = require('axios');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
  };

  try {
    const { path, httpMethod } = event;

    // Unread count endpoint
    if (httpMethod === 'GET' && path.includes('/api/messages/user/') && path.includes('/unread-count')) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          unreadCount: 0
        })
      };
    }

    // Company unread counts endpoint
    if (httpMethod === 'GET' && path.includes('/api/messages/company/') && path.includes('/unread-counts')) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          receivedUnreadCount: 0,
          sentUnreadCount: 0,
          totalUnreadCount: 0
        })
      };
    }

    // Messages endpoint
    if (httpMethod === 'GET' && path.includes('/api/messages')) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify([
          {
            id: 1,
            sender_email: 'admin@portal.sk',
            recipient_email: 'user@portal.sk',
            subject: 'Test správa',
            content: 'Toto je test správa',
            company_id: 1,
            message_type: 'notification',
            is_read: false,
            created_at: '2025-09-01T12:00:00Z'
          }
        ])
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Endpoint nenájdený' })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
