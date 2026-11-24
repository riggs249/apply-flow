import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const raw = (process.env.API_URL || '/api/v1').trim();
const apiUrl = raw.replace(/\/$/, '') || '/api/v1';

const contents = `export const environment = {
  production: true,
  apiUrl: '${apiUrl.replace(/'/g, "\\'")}',
};
`;

const target = resolve(__dirname, '../src/environments/environment.production.ts');
writeFileSync(target, contents);
console.log(`Wrote production environment apiUrl=${apiUrl}`);
