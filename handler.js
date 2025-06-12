'use strict';
const toolsService = require("./services/tools_service");
const flywireService = require("./services/flywire_service");
const hubspotService = require("./services/hubspot_service");

module.exports.process = async (event) => {
  let message;
  
  const yesterdayDate = await toolsService.getYesterdayDate();
  const refunds = await flywireService.getRefunds(yesterdayDate);
  if(refunds[0]){
    const csv = await toolsService.convertToCSV(refunds);
    const config = await hubspotService.getConfig();
    const importFileId = await hubspotService.importCsv(config, csv);
    if(importFileId){
      await hubspotService.monitorHubspotImportAndNotifySlack(importFileId)
    } else {
      message = "❌ Problème au niveau de la récupération de l'id de l'import.";
    }
  } else {
    message = '❌ Aucuns Refunds trouvés sur Flywire.';
  } 

  if(message){
    console.log(message);
    await toolsService.sendSlackAlert(message)
  }

  console.log('test')

  return {
    statusCode: 200,
    body: {
      message,
    }
  };
};
