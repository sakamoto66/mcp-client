import fs from 'fs';
import path from 'path';

export async function loadJs(filePath: string) {
    const modulePath = path.resolve(filePath);
    if (fs.existsSync(modulePath)) {
        const module = await import(`file://${modulePath}`);
        return module.default;
    } else {
        throw new Error(`Module at ${filePath} does not exist.`);
    }
}
