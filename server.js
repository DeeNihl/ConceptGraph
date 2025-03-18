import express from 'express'
import cors from 'cors'
import pg from 'pg'

const app = express()
app.use(cors())
app.use(express.json())

// Database connection configuration
const dbConfig = {
    user: 'postgres',
    host: '127.0.0.1',
    database: 'postgres',
    password: 'mypass',
    port: 5432
}

console.log('Starting server with config:', {
    user: dbConfig.user,
    host: dbConfig.host,
    database: dbConfig.database,
    port: dbConfig.port
})

// Create the connection pool
const pool = new pg.Pool(dbConfig)

// Test database connection
pool.connect()
    .then(client => {
        console.log('Successfully connected to database')
        client.release()
    })
    .catch(err => {
        console.error('Error connecting to database:', err)
    })

// Test endpoint
app.get('/api/test', (req, res) => {
    console.log('Test endpoint called')
    res.json({ message: 'Server is running!' })
})

// Fetch concepts endpoint
app.post('/api/fetch-concepts', async (req, res) => {
    console.log('Fetch concepts endpoint called with body:', req.body)
    
    if (!req.body || !Array.isArray(req.body.conceptIds) || req.body.conceptIds.length === 0) {
        console.error('Invalid request body:', req.body)
        return res.status(400).json({ error: 'Invalid request body. Expected array of conceptIds.' })
    }

    const conceptIds = req.body.conceptIds
    console.log('Processing concept IDs:', conceptIds)

    try {
        const client = await pool.connect()
        console.log('Database connection acquired')

        try {
            // First, get the concepts
            const conceptQuery = `
                SELECT concept_id, concept_name, domain_id, vocabulary_id, concept_class_id, standard_concept
                FROM omop_vocab.concept
                WHERE concept_id = ANY($1)
            `
            console.log('Executing concept query with IDs:', conceptIds)
            const conceptResult = await client.query(conceptQuery, [conceptIds])
            console.log(`Found ${conceptResult.rows.length} concepts`)

            // Then, get the relationships
            const relationshipQuery = `
                SELECT cr.concept_id_1, cr.concept_id_2, cr.relationship_id,
                       c1.concept_name as concept_name_1, c2.concept_name as concept_name_2
                FROM omop_vocab.concept_relationship cr
                JOIN omop_vocab.concept c1 ON cr.concept_id_1 = c1.concept_id
                JOIN omop_vocab.concept c2 ON cr.concept_id_2 = c2.concept_id
                WHERE cr.concept_id_1 = ANY($1) OR cr.concept_id_2 = ANY($1)
            `
            console.log('Executing relationship query')
            const relationshipResult = await client.query(relationshipQuery, [conceptIds])
            console.log(`Found ${relationshipResult.rows.length} relationships`)

            // Get all related concept IDs from relationships
            const relatedConceptIds = relationshipResult.rows
                .flatMap(rel => [rel.concept_id_1, rel.concept_id_2])
                .filter(id => !conceptIds.includes(id))

            // Fetch related concepts if any exist
            let relatedConcepts = []
            if (relatedConceptIds.length > 0) {
                console.log('Fetching related concepts:', relatedConceptIds)
                const relatedConceptsQuery = `
                    SELECT concept_id, concept_name, domain_id, vocabulary_id, concept_class_id, standard_concept
                    FROM omop_vocab.concept
                    WHERE concept_id = ANY($1)
                `
                const relatedConceptsResult = await client.query(relatedConceptsQuery, [relatedConceptIds])
                relatedConcepts = relatedConceptsResult.rows
                console.log(`Found ${relatedConcepts.length} related concepts`)
            }

            // Transform the data for the frontend
            const nodes = [
                ...conceptResult.rows,
                ...relatedConcepts
            ].map(row => ({
                id: row.concept_id.toString(),
                captions: [{ value: row.concept_name }],
                properties: {
                    domain: row.domain_id,
                    vocabulary: row.vocabulary_id,
                    conceptClass: row.concept_class_id,
                    standardConcept: row.standard_concept
                }
            }))

            const relationships = relationshipResult.rows.map(row => ({
                id: `${row.concept_id_1}-${row.concept_id_2}-${row.relationship_id}`,
                from: row.concept_id_1.toString(),
                to: row.concept_id_2.toString(),
                captions: [{ value: row.relationship_id }],
                properties: {
                    conceptName1: row.concept_name_1,
                    conceptName2: row.concept_name_2
                }
            }))

            console.log('Sending response with:', {
                nodes: nodes.length,
                relationships: relationships.length
            })
            res.json({ nodes, relationships })
        } catch (err) {
            console.error('Error executing queries:', err)
            res.status(500).json({ error: 'Database query error', details: err.message })
        } finally {
            client.release()
            console.log('Database connection released')
        }
    } catch (err) {
        console.error('Error connecting to database:', err)
        res.status(500).json({ error: 'Database connection error', details: err.message })
    }
})

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err)
    res.status(500).json({ error: 'Internal server error', details: err.message })
})

// Start server
const PORT = process.env.PORT || 3000
try {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`)
    })
} catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
} 