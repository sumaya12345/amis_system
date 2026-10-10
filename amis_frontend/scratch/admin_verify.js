const axios = require('axios');
(async () => {
  try {
    const loginRes = await axios.post('http://localhost:5000/api/login', {username:'Admin', password:'111'});
    const sid = loginRes.data.sessionId;
    console.log('LOGIN SUCCESS');
    const dashRes = await axios.get('http://localhost:5000/api/admin/dashboard', {headers:{'X-Session-ID': sid}});
    console.log('DASHBOARD', JSON.stringify(dashRes.data));
    const hovRes = await axios.get('http://localhost:5000/api/admin/h-role-overview', {headers:{'X-Session-ID': sid}});
    console.log('H_OVERVIEW', JSON.stringify(hovRes.data));
    if (hovRes.data.success && hovRes.data.data && hovRes.data.data.length > 0) {
      const id = hovRes.data.data[0].id;
      const detailRes = await axios.get(`http://localhost:5000/api/admin/h-role-overview/${id}`, {headers:{'X-Session-ID': sid}});
      console.log('H_DETAIL', JSON.stringify(detailRes.data));
    }
  } catch (e) {
    console.error('ERROR', e.response?.status, e.response?.data);
  }
})();
