const axios = require('axios');

const toolsService = {
  getYesterdayDate: async function(){
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  },
  convertToCSV: async function(data, separator = ';') {
    if (!Array.isArray(data) || data.length === 0) {
      return '';
    }

    const headers = Object.keys(data[0]);
    const escapeValue = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      return /[",\n;]/.test(str)
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    };

    const csvRows = [
      headers.join(separator),
      ...data.map(row => headers.map(field => escapeValue(row[field])).join(separator))
    ];

    return csvRows.join('\n');
  },
  sendSlackAlert: async function(messageText) {
    const webhookUrl = process.env.SLACK_WEBHOOK;
    const message = {
      text: messageText
    };

    axios.post(webhookUrl, message)
      .then(() => {
        console.log('✅ Message envoyé sur Slack');
      })
      .catch(error => {
        console.error('❌ Erreur Slack:', error.response?.status, error.response?.data);
      });
  }
}

module.exports = toolsService;