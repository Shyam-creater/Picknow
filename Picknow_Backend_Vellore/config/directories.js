import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const directories = {
    documents: path.join(__dirname, '..', 'uploads', 'documents'),
    profiles: path.join(__dirname, '..', 'uploads', 'profiles')
};

// Create directories if they don't exist
Object.values(directories).forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

export { directories }; 