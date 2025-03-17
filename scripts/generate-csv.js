import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import dotenv from 'dotenv'
import { createObjectCsvWriter } from 'csv-writer'
import { parse } from 'csv-parse'
import readline from 'readline'
const { Pool } = pg
// check in
// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Default batch size for queries
const DEFAULT_BATCH_SIZE = 1000

// Database connection configuration
const dbConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
}

const pool = new Pool(dbConfig)

// Entity definitions with their SQL queries
const ENTITIES = {
  concept: {
    query: `
      SELECT 
        concept_id as id,
        concept_name as name,
        domain_id,
        vocabulary_id,
        concept_class_id,
        standard_concept,
        concept_code,
        valid_start_date,
        valid_end_date,
        invalid_reason
      FROM omop_vocab.concept
      WHERE concept_id = ANY($1)
    `,
    batchQuery: `
      SELECT 
        concept_id as id,
        concept_name as name,
        domain_id,
        vocabulary_id,
        concept_class_id,
        standard_concept,
        concept_code,
        valid_start_date,
        valid_end_date,
        invalid_reason
      FROM omop_vocab.concept
      LIMIT $1 OFFSET $2
    `,
    countQuery: `
      SELECT COUNT(*) as total FROM omop_vocab.concept
    `,
    headers: ['id', 'name', 'domain_id', 'vocabulary_id', 'concept_class_id', 
             'standard_concept', 'concept_code', 'valid_start_date', 'valid_end_date', 'invalid_reason']
  },
  vocabulary: {
    query: `
      SELECT 
        vocabulary_id as id,
        vocabulary_name as name,
        vocabulary_reference,
        vocabulary_version,
        vocabulary_concept_id
      FROM omop_vocab.vocabulary
      LIMIT $1 OFFSET $2
    `,
    countQuery: `
      SELECT COUNT(*) as total FROM omop_vocab.vocabulary
    `,
    headers: ['id', 'name', 'vocabulary_reference', 'vocabulary_version', 'vocabulary_concept_id']
  },
  domain: {
    query: `
      SELECT 
        domain_id as id,
        domain_name as name,
        domain_concept_id
      FROM omop_vocab.domain
      LIMIT $1 OFFSET $2
    `,
    countQuery: `
      SELECT COUNT(*) as total FROM omop_vocab.domain
    `,
    headers: ['id', 'name', 'domain_concept_id']
  },
  concept_class: {
    query: `
      SELECT 
        concept_class_id as id,
        concept_class_name as name,
        concept_class_concept_id
      FROM omop_vocab.concept_class
      LIMIT $1 OFFSET $2
    `,
    countQuery: `
      SELECT COUNT(*) as total FROM omop_vocab.concept_class
    `,
    headers: ['id', 'name', 'concept_class_concept_id']
  }
}

// Relationship definitions with their SQL queries
const RELATIONSHIPS = {
  CONCEPT_RELATIONSHIP: {
    query: `
      SELECT 
        concept_id_1 as source,
        concept_id_2 as target,
        relationship_id as type,
        valid_start_date,
        valid_end_date,
        invalid_reason
      FROM omop_vocab.concept_relationship
      LIMIT $1 OFFSET $2
    `,
    countQuery: `
      SELECT COUNT(*) as total FROM omop_vocab.concept_relationship
    `,
    headers: ['source', 'target', 'type', 'valid_start_date', 'valid_end_date', 'invalid_reason']
  },
  CONCEPT_ANCESTOR: {
    query: `
      SELECT 
        ancestor_concept_id as source,
        descendant_concept_id as target,
        min_levels_of_separation,
        max_levels_of_separation
      FROM omop_vocab.concept_ancestor
      LIMIT $1 OFFSET $2
    `,
    countQuery: `
      SELECT COUNT(*) as total FROM omop_vocab.concept_ancestor
    `,
    headers: ['source', 'target', 'min_levels_of_separation', 'max_levels_of_separation']
  },
  CONCEPT_SYNONYM: {
    query: `
      SELECT 
        concept_id as source,
        concept_synonym_name as synonym_name,
        language_concept_id
      FROM omop_vocab.concept_synonym
      LIMIT $1 OFFSET $2
    `,
    countQuery: `
      SELECT COUNT(*) as total FROM omop_vocab.concept_synonym
    `,
    headers: ['source', 'synonym_name', 'language_concept_id']
  }
}

// Helper function to get unique concept IDs from relationships
function getUniqueConceptIds(relationships) {
  const conceptIds = new Set()
  relationships.forEach(rel => {
    conceptIds.add(rel.source)
    conceptIds.add(rel.target)
  })
  return Array.from(conceptIds)
}

// Helper function to merge new concepts with existing ones (avoiding duplicates)
function mergeConceptRecords(existing, newRecords) {
  const merged = [...existing]
  const existingIds = new Set(existing.map(c => c.id))
  
  newRecords.forEach(record => {
    if (!existingIds.has(record.id)) {
      merged.push(record)
      existingIds.add(record.id)
    }
  })
  
  return merged
}

async function getAvailableTables(client) {
  const query = `
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'omop_vocab'
  `
  const result = await client.query(query)
  return result.rows.map(row => row.table_name)
}

async function getTotalCount(client, query) {
  const result = await client.query(query)
  return parseInt(result.rows[0].total)
}

async function generateEntityCsv(client, entityName, entityConfig, outputDir, batchSize = DEFAULT_BATCH_SIZE) {
  console.log(`Generating CSV for entity: ${entityName}`)
  
  try {
    // Get total count
    const totalCount = await getTotalCount(client, entityConfig.countQuery)
    console.log(`Total ${entityName} records: ${totalCount}`)

    // Create CSV writer
    const csvWriter = createObjectCsvWriter({
      path: path.join(outputDir, `${entityName}.csv`),
      header: entityConfig.headers.map(id => ({ id, title: id }))
    })

    // Process in batches
    let offset = 0
    let processedCount = 0
    let allRecords = []

    while (offset < totalCount) {
      const result = await client.query(entityConfig.batchQuery, [batchSize, offset])
      
      if (result.rows.length === 0) break

      allRecords = mergeConceptRecords(allRecords, result.rows)
      processedCount += result.rows.length
      offset += batchSize

      // Log progress
      const progress = Math.round((processedCount / totalCount) * 100)
      console.log(`Progress: ${progress}% (${processedCount}/${totalCount} records)`)
    }

    // Write all records at once
    await csvWriter.writeRecords(allRecords)
    console.log(`Generated ${entityName}.csv with ${allRecords.length} unique records`)
  } catch (error) {
    console.error(`Error generating CSV for ${entityName}:`, error)
  }
}

async function generateRelationshipCsv(client, relName, relConfig, outputDir, batchSize = DEFAULT_BATCH_SIZE) {
  console.log(`Generating CSV for relationship: ${relName}`)
  
  try {
    // Get total count
    const totalCount = await getTotalCount(client, relConfig.countQuery)
    console.log(`Total ${relName} records: ${totalCount}`)

    // Create CSV writers for both relationships and concepts
    const relWriter = createObjectCsvWriter({
      path: path.join(outputDir, `${relName.toLowerCase()}.csv`),
      header: relConfig.headers.map(id => ({ id, title: id }))
    })

    const conceptWriter = createObjectCsvWriter({
      path: path.join(outputDir, 'concepts.csv'),
      header: ENTITIES.concept.headers.map(id => ({ id, title: id }))
    })

    // Process in batches
    let offset = 0
    let processedCount = 0
    let allRelationships = []
    let allConcepts = []

    while (offset < totalCount) {
      // Get batch of relationships
      const relResult = await client.query(relConfig.query, [batchSize, offset])
      
      if (relResult.rows.length === 0) break

      // Store relationships
      allRelationships = [...allRelationships, ...relResult.rows]

      // Get all unique concept IDs from this batch of relationships
      const conceptIds = getUniqueConceptIds(relResult.rows)
      
      // Fetch all related concepts
      if (conceptIds.length > 0) {
        const conceptResult = await client.query(ENTITIES.concept.query, [conceptIds])
        allConcepts = mergeConceptRecords(allConcepts, conceptResult.rows)
      }

      processedCount += relResult.rows.length
      offset += batchSize

      // Log progress
      const progress = Math.round((processedCount / totalCount) * 100)
      console.log(`Progress: ${progress}% (${processedCount}/${totalCount} relationships, ${allConcepts.length} unique concepts)`)
    }

    // Write all records
    await relWriter.writeRecords(allRelationships)
    await conceptWriter.writeRecords(allConcepts)
    
    console.log(`Generated ${relName.toLowerCase()}.csv with ${allRelationships.length} relationships`)
    console.log(`Updated concepts.csv with ${allConcepts.length} unique concepts`)
  } catch (error) {
    console.error(`Error generating CSV for ${relName}:`, error)
  }
}

// Add new function to read concepts from file
async function readConceptsFromFile(filePath) {
  const concepts = new Set()
  
  const fileStream = fs.createReadStream(filePath)
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  })

  for await (const line of rl) {
    const trimmed = line.trim()
    if (trimmed && !isNaN(trimmed)) {
      concepts.add(parseInt(trimmed))
    }
  }

  return Array.from(concepts)
}

// Add new function to process specific concepts
async function processSpecificConcepts(conceptIds) {
  try {
    // Get concepts
    const conceptQuery = `
      SELECT concept_id, concept_name, domain_id, vocabulary_id, concept_class_id, standard_concept, concept_code
      FROM concept
      WHERE concept_id = ANY($1)
    `
    const conceptResult = await pool.query(conceptQuery, [conceptIds])
    const concepts = conceptResult.rows

    // Get relationships
    const relationshipQuery = `
      SELECT cr.concept_id_1, cr.concept_id_2, cr.relationship_id,
             c1.concept_name as concept_name_1,
             c2.concept_name as concept_name_2
      FROM concept_relationship cr
      JOIN concept c1 ON cr.concept_id_1 = c1.concept_id
      JOIN concept c2 ON cr.concept_id_2 = c2.concept_id
      WHERE cr.concept_id_1 = ANY($1) OR cr.concept_id_2 = ANY($1)
    `
    const relationshipResult = await pool.query(relationshipQuery, [conceptIds])
    const relationships = relationshipResult.rows

    // Get additional related concepts
    const relatedConceptIds = new Set()
  try {
    // First, fetch the specified concepts
    const conceptWriter = createObjectCsvWriter({
      path: path.join(outputDir, 'concepts.csv'),
      header: ENTITIES.concept.headers.map(id => ({ id, title: id }))
    })

    const conceptResult = await client.query(ENTITIES.concept.query, [conceptIds])
    const concepts = conceptResult.rows
    await conceptWriter.writeRecords(concepts)
    console.log(`Generated concepts.csv with ${concepts.length} concepts`)

    // Then fetch all relationships for these concepts
    const relationshipTypes = Object.entries(RELATIONSHIPS)
    for (const [relName, relConfig] of relationshipTypes) {
      const relWriter = createObjectCsvWriter({
        path: path.join(outputDir, `${relName.toLowerCase()}.csv`),
        header: relConfig.headers.map(id => ({ id, title: id }))
      })

      // Modify query based on relationship type
      let relationshipQuery
      if (relName === 'CONCEPT_RELATIONSHIP') {
        relationshipQuery = `
          SELECT 
            r.concept_id_1 as source,
            r.concept_id_2 as target,
            r.relationship_id as type,
            r.valid_start_date,
            r.valid_end_date,
            r.invalid_reason
          FROM omop_vocab.concept_relationship r
          WHERE r.concept_id_1 = ANY($1) OR r.concept_id_2 = ANY($1)
        `
      } else if (relName === 'CONCEPT_ANCESTOR') {
        relationshipQuery = `
          SELECT 
            r.ancestor_concept_id as source,
            r.descendant_concept_id as target,
            r.min_levels_of_separation,
            r.max_levels_of_separation
          FROM omop_vocab.concept_ancestor r
          WHERE r.ancestor_concept_id = ANY($1) OR r.descendant_concept_id = ANY($1)
        `
      } else if (relName === 'CONCEPT_SYNONYM') {
        relationshipQuery = `
          SELECT 
            r.concept_id as source,
            r.concept_synonym_name as synonym_name,
            r.language_concept_id
          FROM omop_vocab.concept_synonym r
          WHERE r.concept_id = ANY($1)
        `
      }

      try {
        const relResult = await client.query(relationshipQuery, [conceptIds])
        const relationships = relResult.rows

        if (relationships.length > 0) {
          // For relationships that have both source and target concepts
          if (relName !== 'CONCEPT_SYNONYM') {
            // Get related concepts that weren't in our original list
            const allConceptIds = getUniqueConceptIds(relationships)
            const newConceptIds = allConceptIds.filter(id => !conceptIds.includes(id))

            if (newConceptIds.length > 0) {
              const relatedConceptResult = await client.query(ENTITIES.concept.query, [newConceptIds])
              const allConcepts = mergeConceptRecords(concepts, relatedConceptResult.rows)
              await conceptWriter.writeRecords(allConcepts)
              console.log(`Updated concepts.csv with ${allConcepts.length} concepts (added ${newConceptIds.length} related concepts)`)
            }
          }

          await relWriter.writeRecords(relationships)
          console.log(`Generated ${relName.toLowerCase()}.csv with ${relationships.length} relationships`)
        } else {
          console.log(`No ${relName} relationships found for the specified concepts`)
          // Create empty file to maintain consistency
          await relWriter.writeRecords([])
        }
      } catch (error) {
        console.error(`Error processing ${relName} relationships:`, error)
        // Create empty file to maintain consistency
        await relWriter.writeRecords([])
      }
    }
  } catch (error) {
    console.error('Error processing specific concepts:', error)
  }
}

// Add after the helper functions and before main()
async function generateNVLJson(outputDir) {
  console.log('Generating NVL-compatible JSON file...')
  
  try {
    // Read concepts.csv
    const conceptsData = await new Promise((resolve, reject) => {
      const concepts = []
      fs.createReadStream(path.join(outputDir, 'concepts.csv'))
        .pipe(parse({ columns: true, skip_empty_lines: true }))
        .on('data', (row) => {
          concepts.push({
            id: row.id,
            captions: [{ value: row.name }],
            // Add additional properties that might be useful for visualization
            domain: row.domain_id,
            vocabulary: row.vocabulary_id,
            conceptClass: row.concept_class_id,
            standardConcept: row.standard_concept === 'S'
          })
        })
        .on('end', () => resolve(concepts))
        .on('error', reject)
    })

    // Read concept_relationship.csv
    const relationshipsData = await new Promise((resolve, reject) => {
      const relationships = []
      fs.createReadStream(path.join(outputDir, 'concept_relationship.csv'))
        .pipe(parse({ columns: true, skip_empty_lines: true }))
        .on('data', (row) => {
          relationships.push({
            id: `${row.source}_${row.target}_${row.type}`,
            from: row.source,
            to: row.target,
            captions: [{ value: row.type }],
            // Add relationship metadata
            validStart: row.valid_start_date,
            validEnd: row.valid_end_date
          })
        })
        .on('end', () => resolve(relationships))
        .on('error', reject)
    })

    // Create NVL-compatible JSON structure
    const nvlData = {
      nodes: conceptsData,
      relationships: relationshipsData
    }

    // Write to file
    const nvlOutputPath = path.join(outputDir, 'nvl-graph.json')
    await fs.promises.writeFile(nvlOutputPath, JSON.stringify(nvlData, null, 2))
    console.log(`Generated NVL-compatible JSON file at: ${nvlOutputPath}`)

    // Generate example HTML file to visualize the graph
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>OMOP Concept Graph Viewer</title>
    <style>
        #container {
            width: 100%;
            height: 100vh;
            margin: 0;
            padding: 0;
        }
    </style>
</head>
<body>
    <div id="container"></div>
    <script type="module">
        import { NVL } from 'https://unpkg.com/@neo4j-nvl/base'
        
        // Load graph data
        fetch('nvl-graph.json')
            .then(response => response.json())
            .then(data => {
                const nvl = new NVL(
                    document.getElementById('container'),
                    data.nodes,
                    data.relationships,
                    {
                        backgroundColor: '#ffffff',
                        relationshipColor: '#b3b3b3',
                        nodeColor: '#4C8BF5',
                        nodeCaptionColor: '#2A2A2A'
                    }
                )
            })
            .catch(error => console.error('Error loading graph:', error))
    </script>
</body>
</html>`

    const htmlOutputPath = path.join(outputDir, 'graph-viewer.html')
    await fs.promises.writeFile(htmlOutputPath, htmlContent)
    console.log(`Generated graph viewer HTML file at: ${htmlOutputPath}`)

  } catch (error) {
    console.error('Error generating NVL JSON:', error)
  }
}

// Help text for the script
const HELP_TEXT = `
OMOP Vocabulary CSV Generator
============================

This script generates CSV files from OMOP vocabulary tables for use in Neo4j.

Usage:
  npm run generate-csv -- [options] [entities/relationships]

Options:
  --help                Show this help message
  --batch-size=<size>  Number of records to process at once (default: 1000)
  --concepts=<ids>      Comma-separated list of concept IDs to process
  --concept-file=<path> Path to file containing concept IDs (one per line)
  
Commands:
  all                   Generate all entities and relationships
  <entity>             Generate specific entity CSV (see Entities below)
  <relationship>       Generate specific relationship CSV (see Relationships below)

Entities:
  concept              Main concept table with all attributes
  vocabulary           Vocabulary metadata
  domain               Domain information
  concept_class        Concept class information

Relationships:
  CONCEPT_RELATIONSHIP Direct relationships between concepts
  CONCEPT_ANCESTOR     Hierarchical relationships between concepts
  CONCEPT_SYNONYM      Concept synonyms

Examples:
  # Show this help message
  npm run generate-csv -- --help

  # Generate all CSVs
  npm run generate-csv -- all

  # Generate specific entity
  npm run generate-csv -- concept

  # Generate specific relationship with custom batch size
  npm run generate-csv -- --batch-size=5000 CONCEPT_RELATIONSHIP

  # Generate multiple items
  npm run generate-csv -- concept CONCEPT_RELATIONSHIP

  # Process specific concept IDs
  npm run generate-csv -- --concepts=1234,5678,9012

  # Process concepts from file
  npm run generate-csv -- --concept-file=./my-concepts.txt

Output:
  The script will create CSV files in the 'import' directory:
  - <entity>.csv for each entity
  - <relationship>.csv for each relationship
  - concepts.csv containing all concepts referenced in relationships

Note:
  When generating relationship CSVs, the script will automatically:
  1. Process relationships in batches
  2. Extract all concept IDs from the relationships
  3. Fetch and save the related concepts
  4. Ensure no duplicate concepts are stored
`

async function main() {
  // Check for help parameter first
  if (process.argv.includes('--help')) {
    console.log(HELP_TEXT)
    return
  }

  const client = new pg.Client(dbConfig)
  
  try {
    await client.connect()
    console.log('Connected to database successfully')

    // Create output directory if it doesn't exist
    const outputDir = path.join(__dirname, '..', 'import')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // Get batch size from command line or use default
    const batchSizeArg = process.argv.find(arg => arg.startsWith('--batch-size='))
    const batchSize = batchSizeArg 
      ? parseInt(batchSizeArg.split('=')[1]) 
      : DEFAULT_BATCH_SIZE

    // Check for concept list or file
    const conceptsArg = process.argv.find(arg => arg.startsWith('--concepts='))
    const conceptFileArg = process.argv.find(arg => arg.startsWith('--concept-file='))

    if (conceptsArg || conceptFileArg) {
      let conceptIds = []
      
      if (conceptsArg) {
        // Parse comma-separated concept IDs
        conceptIds = conceptsArg
          .replace('--concepts=', '')
          .split(',')
          .map(id => parseInt(id.trim()))
          .filter(id => !isNaN(id))
      } else {
        // Read concepts from file
        const filePath = conceptFileArg.replace('--concept-file=', '')
        conceptIds = await readConceptsFromFile(filePath)
      }

      if (conceptIds.length === 0) {
        console.error('No valid concept IDs provided')
        return
      }

      await processSpecificConcepts(client, conceptIds, outputDir, batchSize)
      await generateNVLJson(outputDir)
      return
    }

    // Process command line arguments
    const args = process.argv.slice(2).filter(arg => !arg.startsWith('--'))
    
    if (args.length === 0) {
      console.log('No arguments provided. Use --help for usage information.')
      console.log('\nQuick Reference:')
      console.log('Generate all: npm run generate-csv -- all')
      console.log('Show help: npm run generate-csv -- --help')
      
      // List available items
      console.log('\nAvailable entities:')
      Object.keys(ENTITIES).forEach(entity => console.log(`- ${entity}`))
      
      console.log('\nAvailable relationships:')
      Object.keys(RELATIONSHIPS).forEach(rel => console.log(`- ${rel}`))
    } else if (args[0] === 'all') {
      // Generate all entities and relationships
      for (const [entityName, entityConfig] of Object.entries(ENTITIES)) {
        await generateEntityCsv(client, entityName, entityConfig, outputDir, batchSize)
      }
      for (const [relName, relConfig] of Object.entries(RELATIONSHIPS)) {
        await generateRelationshipCsv(client, relName, relConfig, outputDir, batchSize)
      }
      await generateNVLJson(outputDir)
    } else {
      // Generate requested CSVs
      for (const arg of args) {
        if (arg in ENTITIES) {
          await generateEntityCsv(client, arg, ENTITIES[arg], outputDir, batchSize)
        } else if (arg in RELATIONSHIPS) {
          await generateRelationshipCsv(client, arg, RELATIONSHIPS[arg], outputDir, batchSize)
        } else {
          console.log(`Unknown entity/relationship: ${arg}`)
        }
      }
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.end()
  }
}

// Export helper functions for testing
export { getUniqueConceptIds, mergeConceptRecords, generateEntityCsv, generateRelationshipCsv }

main() 