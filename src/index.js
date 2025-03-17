import { NVL } from '@neo4j-nvl/base'
import { ZoomInteraction, PanInteraction } from '@neo4j-nvl/interaction-handlers'

// Get DOM elements
// check in
const container = document.getElementById('container')
const conceptInput = document.getElementById('concept-input')
const fetchButton = document.getElementById('fetch-button')
const loadingIndicator = document.getElementById('loading-indicator')

// Configure NVL instance
const nvlConfig = {
    initialZoom: 1,
    style: {
        node: {
            color: '#4CAF50',
            radius: 40,
            fontSize: 14,
            fontColor: '#000000',
            borderWidth: 2,
            borderColor: '#2E7D32'
        },
        relationship: {
            width: 2,
            color: '#757575',
            fontSize: 12,
            fontColor: '#000000',
            arrow: {
                width: 4,
                height: 8,
                margin: 4
            }
        }
    },
    layout: {
        name: 'force',
        options: {
            nodeSpacing: 100,
            edgeLength: 200
        }
    }
}

// Initialize NVL with test data
const testNodes = [
    {
        id: 'test1',
        captions: [{ value: 'Test Node 1' }],
        properties: { type: 'test' }
    },
    {
        id: 'test2',
        captions: [{ value: 'Test Node 2' }],
        properties: { type: 'test' }
    }
]

const testRelationships = [
    {
        id: 'rel1',
        from: 'test1',
        to: 'test2',
        captions: [{ value: 'Test Relationship' }],
        properties: { type: 'test' }
    }
]

// Initialize NVL with test data
const nvl = new NVL(container, testNodes, testRelationships, nvlConfig)

// Add interactions
new ZoomInteraction(nvl)
new PanInteraction(nvl)

// Center and fit the graph after a short delay
setTimeout(() => {
    nvl.fit()
}, 500)

// Function to fetch and display concepts
async function fetchConcepts() {
    const input = conceptInput.value.trim()
    if (!input) {
        alert('Please enter concept IDs')
        return
    }

    // Parse concept IDs
    const conceptIds = input.split(',')
        .map(id => id.trim())
        .filter(id => id.length > 0)
        .map(id => parseInt(id))
        .filter(id => !isNaN(id))

    if (conceptIds.length === 0) {
        alert('Please enter valid concept IDs')
        return
    }

    // Show loading state
    fetchButton.disabled = true
    loadingIndicator.style.display = 'inline'

    try {
        // Fetch concepts from server
        const response = await fetch('http://localhost:3000/api/fetch-concepts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ conceptIds })
        })

        if (!response.ok) {
            throw new Error('Failed to fetch concepts')
        }

        const data = await response.json()
        console.log('Graph data loaded:', data)

        // Update the graph
        nvl.addAndUpdateElementsInGraph(
            data.nodes,
            data.relationships
        )

        // Center and fit the graph
        setTimeout(() => {
            nvl.fit()
        }, 500)
    } catch (error) {
        console.error('Error:', error)
        alert('Failed to fetch concepts. Please try again.')
    } finally {
        // Reset loading state
        fetchButton.disabled = false
        loadingIndicator.style.display = 'none'
    }
}

// Add event listeners
fetchButton.addEventListener('click', fetchConcepts)
conceptInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        fetchConcepts()
    }
})
