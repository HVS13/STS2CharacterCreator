import { promises as fs } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { ProjectSchema } from '../src/lib/schema';

const root = process.cwd();
const outputPath = path.join(root, 'schemas', 'sts2-character-project.schema.json');
const schema = z.toJSONSchema(ProjectSchema) as Record<string, unknown>;
schema.title = 'STS2 Character Creator project';
schema.$id = 'https://sts2-character-creator.local/schemas/sts2-character-project.schema.json';

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(schema, null, 2)}\n`, 'utf8');
console.log(`Generated ${path.relative(root, outputPath)}`);
