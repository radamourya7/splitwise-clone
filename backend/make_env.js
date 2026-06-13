const fs = require('fs');
fs.writeFileSync(__dirname + '/.env', `DATABASE_URL="postgresql://neondb_owner:npg_jPSl6XrmYU9h@ep-muddy-river-aho06x6m.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"
PORT=5000
JWT_SECRET="splitwise_clone_secret_key_123"`);
console.log(".env generated");
