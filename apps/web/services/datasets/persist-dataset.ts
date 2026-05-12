import { saveDataset } from "@/repositories/datasets/dataset.repository"

export async function persistDataset(
    dataset: any
) {
    return saveDataset(dataset)
}