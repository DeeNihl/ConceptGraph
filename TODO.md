# OMOP Concept Graph Visualization Enhancements
# check in
## 1. Custom Node Colors Based on Domain/Vocabulary

Implement domain and vocabulary-based coloring for better visual categorization:

1. Create a color mapping object in the HTML file:
```javascript
const domainColors = {
  'Condition': '#FF6B6B',
  'Drug': '#4ECDC4',
  'Procedure': '#45B7D1',
  'Measurement': '#96CEB4',
  'Observation': '#FFEEAD',
  // Add more domains as needed
}

const vocabularyColors = {
  'SNOMED': '#6C5B7B',
  'RxNorm': '#C06C84',
  'ICD10': '#F8B195',
  'LOINC': '#355C7D',
  // Add more vocabularies as needed
}
```

2. Modify the NVL initialization to use dynamic colors:
```javascript
const nvl = new NVL(
    document.getElementById('container'),
    data.nodes,
    data.relationships,
    {
        backgroundColor: '#ffffff',
        relationshipColor: '#b3b3b3',
        nodeColorFunction: (node) => domainColors[node.domain] || '#4C8BF5',
        nodeCaptionColor: '#2A2A2A'
    }
)
```

3. Add a legend component to explain the color coding.

## 2. Relationship Type Filtering Controls

Add UI controls to filter relationships by type:

1. Add HTML controls above the graph:
```html
<div id="filters">
    <h3>Relationship Types</h3>
    <div id="relationshipFilters"></div>
</div>
```

2. Add JavaScript to manage filters:
```javascript
function initializeFilters(relationships) {
    const types = new Set(relationships.map(r => r.captions[0].value))
    const filterContainer = document.getElementById('relationshipFilters')
    
    types.forEach(type => {
        const checkbox = document.createElement('input')
        checkbox.type = 'checkbox'
        checkbox.id = `filter-${type}`
        checkbox.checked = true
        checkbox.addEventListener('change', updateVisibleRelationships)
        
        const label = document.createElement('label')
        label.htmlFor = `filter-${type}`
        label.textContent = type
        
        filterContainer.appendChild(checkbox)
        filterContainer.appendChild(label)
    })
}

function updateVisibleRelationships() {
    const activeTypes = Array.from(document.querySelectorAll('#relationshipFilters input:checked'))
        .map(cb => cb.id.replace('filter-', ''))
    
    nvl.updateElementsInGraph(
        [],
        relationships.map(rel => ({
            ...rel,
            disabled: !activeTypes.includes(rel.captions[0].value)
        }))
    )
}
```

## 3. Search Functionality

Implement search to find and highlight specific concepts:

1. Add search UI:
```html
<div id="search">
    <input type="text" id="searchInput" placeholder="Search concepts...">
    <div id="searchResults"></div>
</div>
```

2. Add search logic:
```javascript
function initializeSearch(nodes) {
    const searchInput = document.getElementById('searchInput')
    const searchResults = document.getElementById('searchResults')
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase()
        if (query.length < 2) {
            searchResults.innerHTML = ''
            return
        }
        
        const matches = nodes
            .filter(n => n.captions[0].value.toLowerCase().includes(query))
            .slice(0, 10)
        
        searchResults.innerHTML = matches
            .map(n => `<div class="result" data-id="${n.id}">${n.captions[0].value}</div>`)
            .join('')
    })
    
    searchResults.addEventListener('click', (e) => {
        const resultEl = e.target.closest('.result')
        if (!resultEl) return
        
        const nodeId = resultEl.dataset.id
        nvl.addAndUpdateElementsInGraph(
            nodes.map(n => ({
                ...n,
                selected: n.id === nodeId
            })),
            []
        )
        nvl.fit([nodeId])
    })
}
```

## 4. Node Property Display on Selection

Show detailed node information when selected:

1. Add info panel HTML:
```html
<div id="infoPanel">
    <h3>Selected Concept</h3>
    <div id="conceptDetails"></div>
</div>
```

2. Add selection handling:
```javascript
function initializeInfoPanel() {
    const container = document.getElementById('container')
    const details = document.getElementById('conceptDetails')
    
    container.addEventListener('click', (e) => {
        const { nvlTargets } = nvl.getHits(e)
        if (nvlTargets.nodes.length > 0) {
            const node = nvlTargets.nodes[0].data
            details.innerHTML = `
                <table>
                    <tr><th>Name:</th><td>${node.captions[0].value}</td></tr>
                    <tr><th>Domain:</th><td>${node.domain}</td></tr>
                    <tr><th>Vocabulary:</th><td>${node.vocabulary}</td></tr>
                    <tr><th>Class:</th><td>${node.conceptClass}</td></tr>
                    <tr><th>Standard:</th><td>${node.standardConcept ? 'Yes' : 'No'}</td></tr>
                </table>
            `
        } else {
            details.innerHTML = '<p>No concept selected</p>'
        }
    })
}
```

3. Add CSS styling:
```css
#infoPanel {
    position: fixed;
    right: 20px;
    top: 20px;
    background: white;
    padding: 15px;
    border-radius: 5px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    max-width: 300px;
}

#conceptDetails table {
    width: 100%;
    border-collapse: collapse;
}

#conceptDetails th, #conceptDetails td {
    padding: 5px;
    border-bottom: 1px solid #eee;
    text-align: left;
}
```

To implement these features:

1. Create a new branch for the enhancements
2. Modify the `generateNVLJson` function to include all necessary node properties
3. Update the HTML template generation to include the new UI elements
4. Add the JavaScript functions for each feature
5. Add CSS styling for the new components
6. Test with different concept sets to ensure performance
7. Add error handling for edge cases (no results, large datasets, etc.)

Remember to:
- Keep the graph performant with large datasets
- Maintain clean separation of concerns
- Add appropriate error handling
- Document the new features in the README
- Consider mobile responsiveness for the UI elements 