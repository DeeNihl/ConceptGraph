# OMOP Vocabulary CSV Generator

This project provides a tool to generate CSV files from OMOP vocabulary tables for use in Neo4j graph databases. It's designed to handle large datasets efficiently by processing data in batches and maintaining relationships between concepts.

## Features

- Batch processing of large datasets
- Automatic relationship resolution
- Duplicate concept prevention
- Progress tracking
- Configurable batch sizes
- Support for all major OMOP vocabulary tables
- Process specific concepts and their relationships
- Support for concept lists from file

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database containing OMOP vocabulary tables
- Neo4j database (for importing the generated CSVs)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd ConceptGraph
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Configure your database connection in `.env`:
   ```
   DB_USER=your_database_user
   DB_PASSWORD=your_database_password
   DB_HOST=localhost
   DB_NAME=your_database_name
   DB_PORT=5432
   ```

## Usage

The basic command structure is:
```bash
npm run generate-csv -- [options] [entities/relationships]
```

### Available Options

- `--help`: Show help message
- `--batch-size=<size>`: Number of records to process at once (default: 1000)
- `--concepts=<ids>`: Comma-separated list of concept IDs to process
- `--concept-file=<path>`: Path to file containing concept IDs (one per line)

### Available Entities

- `concept`: Main concept table with all attributes
- `vocabulary`: Vocabulary metadata
- `domain`: Domain information
- `concept_class`: Concept class information

### Available Relationships

- `CONCEPT_RELATIONSHIP`: Direct relationships between concepts
- `CONCEPT_ANCESTOR`: Hierarchical relationships between concepts
- `CONCEPT_SYNONYM`: Concept synonyms

### Processing Specific Concepts

You can process specific concepts in two ways:

1. Using a comma-separated list:
   ```bash
   npm run generate-csv -- --concepts=1234,5678,9012
   ```

2. Using a file containing concept IDs:
   ```bash
   npm run generate-csv -- --concept-file=./my-concepts.txt
   ```
   
   The concept file should contain one concept ID per line:
   ```
   1234
   5678
   9012
   ```

When processing specific concepts, the script will:
1. Fetch the specified concepts
2. Find all relationships where these concepts are involved
3. Fetch any additional concepts that are related to the specified concepts
4. Generate CSV files containing:
   - All specified and related concepts (`concepts.csv`)
   - All relationships between these concepts (`concept_relationship.csv`, etc.)

This is particularly useful when you want to:
- Extract a subset of the vocabulary for analysis
- Focus on specific concept hierarchies
- Create targeted graph databases
- Analyze specific medical terms and their relationships

### Examples

1. Show help:
   ```bash
   npm run generate-csv -- --help
   ```

2. Generate all CSVs:
   ```bash
   npm run generate-csv -- all
   ```

3. Generate specific entity:
   ```bash
   npm run generate-csv -- concept
   ```

4. Generate relationship with custom batch size:
   ```bash
   npm run generate-csv -- --batch-size=5000 CONCEPT_RELATIONSHIP
   ```

5. Generate multiple items:
   ```bash
   npm run generate-csv -- concept CONCEPT_RELATIONSHIP
   ```

## Output Files

The script generates CSV files in the `import` directory:

- Entity files:
  - `concept.csv`: Main concepts
  - `vocabulary.csv`: Vocabulary metadata
  - `domain.csv`: Domain information
  - `concept_class.csv`: Concept class information

- Relationship files:
  - `concept_relationship.csv`: Direct relationships
  - `concept_ancestor.csv`: Hierarchical relationships
  - `concept_synonym.csv`: Synonyms

When generating relationship files, the script will also create or update `concepts.csv` containing all concepts referenced in the relationships.

## File Format

### Entity Files
Each entity CSV includes headers specific to that entity type. For example, the concept.csv includes:
- id
- name
- domain_id
- vocabulary_id
- concept_class_id
- standard_concept
- concept_code
- valid_start_date
- valid_end_date
- invalid_reason

### Relationship Files
Relationship CSVs include:
- source: Source concept ID
- target: Target concept ID
- Additional attributes specific to each relationship type

## Batch Processing

The script processes data in configurable batches to manage memory usage efficiently:

1. For entities:
   - Fetches records in batches
   - Maintains unique records
   - Writes all records at the end

2. For relationships:
   - Processes relationships in batches
   - Extracts concept IDs from each batch
   - Fetches and stores related concepts
   - Prevents duplicate concepts
   - Writes relationships and concepts to separate files

## Development

### Running Tests

```bash
npm test
```

The test suite includes:
- Unit tests for helper functions
- Integration tests for database operations
- Mock database client for testing

### Adding New Entities or Relationships

To add new entities or relationships:

1. Add the configuration to `ENTITIES` or `RELATIONSHIPS` in `generate-csv.js`
2. Include:
   - SQL query with LIMIT/OFFSET
   - Count query
   - Header definitions

## Troubleshooting

1. Memory Issues
   - Reduce batch size: `--batch-size=500`
   - Monitor system memory usage
   - Consider splitting large tables into multiple runs

2. Database Connection
   - Verify database credentials in `.env`
   - Check database server status
   - Ensure proper network connectivity

3. Missing Tables
   - Verify schema name ('omop_vocab')
   - Check table permissions
   - Run `npm run generate-csv` without arguments to list available tables

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add or update tests
5. Submit a pull request

## License

 