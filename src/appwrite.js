import { Client, Databases, ID, Query } from 'appwrite'

const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID?.trim()
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID?.trim()
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID?.trim()
const ENDPOINT = 'https://fra.cloud.appwrite.io/v1'

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID)
const database = new Databases(client)

const ensureConfig = () => {
  if (!PROJECT_ID || !DATABASE_ID || !COLLECTION_ID) {
    throw new Error('Missing Appwrite configuration.')
  }
}

export const saveScore = async (playerName, score) => {
  ensureConfig()

  const trimmedName = playerName.trim()
  const numericScore = Math.max(0, Math.round(Number(score) || 0))

  if (!trimmedName) {
    throw new Error('Player name is required.')
  }

  const result = await database.createDocument(
    DATABASE_ID,
    COLLECTION_ID,
    ID.unique(),
    {
      player_name: trimmedName,
      score: numericScore,
    },
  )

  return {
    id: result.$id,
    playerName: result.player_name,
    score: result.score,
  }
}

export const getTopScores = async (limit = 3) => {
  ensureConfig()

  const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
    Query.orderDesc('score'),
    Query.limit(limit),
  ])

  return result.documents.map((document) => ({
    id: document.$id,
    playerName: document.player_name,
    score: document.score,
  }))
}