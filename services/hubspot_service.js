const axios = require('axios');
const FormData = require('form-data');
const token = process.env.HS_TOKEN;

const hubspotService = {
  getConfig: async function(){
    const importRequest = {
      name: "Import Refunds",
      importOperations: {
        "2-44241619": "CREATE",
        "2-41439653": "UPDATE"
      },
      dateFormat: "YEAR_MONTH_DAY",
      files: [
        {
          fileName: "api-import-deals.csv",
          fileFormat: "CSV",
          fileImportPage: {
            hasHeader: true,
            columnMappings: [
              {
                columnObjectTypeId: "2-44241619",
                columnName: "flywire_refund_id",
                propertyName: "flywire_refund_id",
                columnType: "HUBSPOT_ALTERNATE_ID",
              },
              {
                columnObjectTypeId: "2-44241619",
                columnName: "name",
                propertyName: "name",
              },
              {
                columnObjectTypeId: "2-44241619",
                columnName: "refund_date",
                propertyName: "refund_date",
              },
              {
                columnObjectTypeId: "2-44241619",
                columnName: "refund_amount",
                propertyName: "refund_amount",
              },
              {
                columnObjectTypeId: "2-41439653",
                columnName: "payment__payment_id",
                propertyName: "payment_id",
                columnType: "HUBSPOT_ALTERNATE_ID",
              },
            ],
          },
        },
      ],
    };
    return importRequest;
  },
  importCsv: async function(importRequest, csvString){
    const url = `https://api.hubapi.com/crm/v3/imports`;
    const formData = new FormData();

    formData.append("importRequest", JSON.stringify(importRequest));

    const csvBuffer = Buffer.from(csvString, "utf-8");
    formData.append("files", csvBuffer, "api-import-deals.csv");

    try {
      const response = await axios.post(url, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          ...formData.getHeaders(),
        },
      });
      console.log('response', response?.data)
      console.log("  -> ✅ Import réussi\n");
      if(response?.data?.id){
        return response.data.id
      }
    } catch (error) {
      console.log("  -> ❌ Erreur lors de l'import :", JSON.stringify(error.response?.data) || JSON.stringify(error.message), '\n');
    }
  },
  monitorHubspotImportAndNotifySlack: async function(importId) {
    const importUrl = `https://api.hubapi.com/crm/v3/imports/${importId}`;
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    while (true) {
      try {
        const response = await axios.get(importUrl, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const { state, importName } = response.data;
        console.log(`⏳ Import "${importName}" - état : ${state}`);
        if (state === 'DONE' || state === 'FAILED') {
          let message = {
            text: `📦 Import HubSpot terminé : *${importName}* → État : *${state}*`
          };

          if(response?.data?.metadata){
            message.text = message.text + `\n\`\`\`${JSON.stringify(response.data.metadata, undefined, 2)}\`\`\``;
          }

          await axios.post(process.env.SLACK_WEBHOOK, message);
          console.log('✅ Notification Slack envoyée.');
          break;
        }

        await delay(1000);
      } catch (error) {
        console.error('❌ Erreur API HubSpot ou Slack :', error.response?.status, error.response?.data);
        break;
      }
    }
  }
}

module.exports = hubspotService;