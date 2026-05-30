import { clearAllTables, seedBootstrapDataset } from "./bootstrapDataset";

export async function runBootstrapSeed(): Promise<void> {
    await seedBootstrapDataset();
}

export { clearAllTables, seedBootstrapDataset };
