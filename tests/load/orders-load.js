import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '3m', target: 100 },
    { duration: '30s', target: 0 },
  ],
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3000';
const TOKEN = __ENV.API_TOKEN;

export default function () {
  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
  };

  const payload = JSON.stringify({
    clientId: __ENV.CLIENT_ID,
    deceasedId: __ENV.DECEASED_ID,
    packageId: __ENV.PACKAGE_ID,
    currency: 'RUB',
    services: [
      { serviceId: __ENV.SERVICE_ID, quantity: 1, unitPrice: 1000, discount: 0 },
    ],
  });

  const res = http.post(`${BASE_URL}/orders`, payload, { headers });
  check(res, {
    'status is 201/200': (r) => r.status === 201 || r.status === 200,
  });

  sleep(1);
}

