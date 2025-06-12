const axios = require('axios');

const flywireService = {
  getRefunds: async function(date = '2025-06-01'){
    const token = process.env.FLY_API_KEY
    try {
      const headers = {
        "Content-Type": "application/json",
        "X-Authentication-Key": `${token}`,
      };
      const url = `https://api-platform.flywire.com/payments/v1/refunds?created_from=${date}&per_page=100`;
      const response = await axios.get(url, { headers });
      if(response?.data?.refunds?.[0]){
        return await flywireService.cleanRefunds(response.data.refunds)
      } else return [];
    } catch (error) {
      return []
    }
  },
  cleanRefunds: async function(data){
    let results = [];
    for(let iRefund = 0; iRefund < data.length; iRefund++){
      results.push({
        flywire_refund_id: data[iRefund]?.refund_id ?? '',
        name: `Refund ${data[iRefund]?.refund_id}`,
        refund_date: data[iRefund]?.created_at ? new Date(data[iRefund].created_at).toISOString().split('T')[0] : '',
        refund_amount: data[iRefund]?.amount ?? '',
        payment__payment_id: data[iRefund]?.payment_id ?? '',
      })
    }
    return results;
  }
}

module.exports = flywireService;