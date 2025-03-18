import { jest } from '@jest/globals'
import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { getUniqueConceptIds, mergeConceptRecords } from './generate-csv.js'
// check in
// Mock the database client
jest.mock('pg', () => {
  const mClient = {
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
  }
  return { Client: jest.fn(() => mClient) }
})

describe('Helper Functions', () => {
  describe('getUniqueConceptIds', () => {
    test('should extract unique concept IDs from relationships', () => {
      const relationships = [
        { source: 1, target: 2 },
        { source: 2, target: 3 },
        { source: 1, target: 4 }
      ]

      const uniqueIds = getUniqueConceptIds(relationships)
      expect(uniqueIds).toEqual([1, 2, 3, 4])
    })

    test('should handle empty relationships array', () => {
      const relationships = []
      const uniqueIds = getUniqueConceptIds(relationships)
      expect(uniqueIds).toEqual([])
    })
  })

  describe('mergeConceptRecords', () => {
    test('should merge new records while avoiding duplicates', () => {
      const existing = [
        { id: 1, name: 'Concept 1' },
        { id: 2, name: 'Concept 2' }
      ]
      const newRecords = [
        { id: 2, name: 'Concept 2 Updated' }, // Should be ignored as duplicate
        { id: 3, name: 'Concept 3' }
      ]

      const merged = mergeConceptRecords(existing, newRecords)
      expect(merged).toHaveLength(3)
      expect(merged).toEqual([
        { id: 1, name: 'Concept 1' },
        { id: 2, name: 'Concept 2' },
        { id: 3, name: 'Concept 3' }
      ])
    })

    test('should handle empty arrays', () => {
      expect(mergeConceptRecords([], [])).toEqual([])
      expect(mergeConceptRecords([], [{ id: 1, name: 'Test' }])).toEqual([{ id: 1, name: 'Test' }])
      expect(mergeConceptRecords([{ id: 1, name: 'Test' }], [])).toEqual([{ id: 1, name: 'Test' }])
    })
  })
})

describe('Database Integration', () => {
  let client
  let mockOutputDir

  beforeEach(() => {
    client = new pg.Client()
    mockOutputDir = path.join(process.cwd(), 'test-output')
    fs.mkdirSync(mockOutputDir, { recursive: true })
  })

  afterEach(() => {
    jest.clearAllMocks()
    fs.rmSync(mockOutputDir, { recursive: true, force: true })
  })

  test('should fetch and process relationships with related concepts', async () => {
    // Mock relationship query results
    const mockRelationships = [
      { source: 1, target: 2, type: 'is_a' },
      { source: 2, target: 3, type: 'is_a' }
    ]
    
    // Mock concept query results
    const mockConcepts = [
      { id: 1, name: 'Concept 1' },
      { id: 2, name: 'Concept 2' },
      { id: 3, name: 'Concept 3' }
    ]

    // Setup query mock to return different results based on the query
    client.query.mockImplementation((query, params) => {
      if (query.includes('COUNT')) {
        return Promise.resolve({ rows: [{ total: 2 }] })
      } else if (query.includes('concept_relationship')) {
        return Promise.resolve({ rows: mockRelationships })
      } else if (query.includes('concept')) {
        return Promise.resolve({ rows: mockConcepts })
      }
    })

    // Import the function to test
    const { generateRelationshipCsv } = await import('./generate-csv.js')

    // Run the function
    await generateRelationshipCsv(client, 'CONCEPT_RELATIONSHIP', {
      query: 'SELECT * FROM concept_relationship',
      countQuery: 'SELECT COUNT(*) FROM concept_relationship',
      headers: ['source', 'target', 'type']
    }, mockOutputDir, 10)

    // Verify database was queried correctly
    expect(client.query).toHaveBeenCalledWith(expect.stringContaining('COUNT'), [])
    expect(client.query).toHaveBeenCalledWith(expect.stringContaining('concept_relationship'), [10, 0])
    expect(client.query).toHaveBeenCalledWith(expect.stringContaining('concept'), [[1, 2, 3]])

    // Verify files were created
    expect(fs.existsSync(path.join(mockOutputDir, 'concept_relationship.csv'))).toBe(true)
    expect(fs.existsSync(path.join(mockOutputDir, 'concepts.csv'))).toBe(true)
  })
}) 