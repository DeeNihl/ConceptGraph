import fs from 'fs'
import path from 'path'
import pg from 'pg'

const dbConfig = {
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'mypass',
    port: 5432
}

const sqlFiles = [
    'omop_vocabulary.sql',
    'omop_domain.sql',
    'omop_concept_class.sql',
    'omop_concept.sql',
    'omop_concept_relationship.sql',
    'omop_concept_ancestor.sql',
    'omop_concept_synonym.sql',
    'omop_relationship.sql'
]

async function createTables() {
    const client = new pg.Client(dbConfig)
    
    try {
        await client.connect()
        console.log('Connected to database')

        for (const file of sqlFiles) {
            const filePath = path.join(process.cwd(), 'omop_vocab', 'sql', file)
            console.log(`Executing ${file}...`)
            
            const sql = fs.readFileSync(filePath, 'utf8')
            await client.query(sql)
            console.log(`Successfully executed ${file}`)
        }

        console.log('All tables created successfully')
    } catch (err) {
        console.error('Error creating tables:', err)
        throw err
    } finally {
        await client.end()
        console.log('Database connection closed')
    }
}

createTables().catch(console.error) 