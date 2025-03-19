import { NVL } from '@neo4j-nvl/base'
import { ZoomInteraction, PanInteraction } from '@neo4j-nvl/interaction-handlers'
import { ClickInteraction } from '@neo4j-nvl/interaction-handlers'
import { DragNodeInteraction } from '@neo4j-nvl/interaction-handlers'
// Get DOM elements
// check in
const container = document.getElementById('container')
const conceptInput = document.getElementById('concept-input')
const fetchButton = document.getElementById('fetch-button')
const loadingIndicator = document.getElementById('loading-indicator')
const nodeConceptId = document.getElementById('node-concept-id')
const nodeVocabulary = document.getElementById('node-concept-vocabulary')
const nodeDomain = document.getElementById('node-concept-domain')
const nodeConceptClass = document.getElementById('node-concept-class')
const nodeConceptName = document.getElementById('node-concept-name')
const nodeConceptCode = document.getElementById('node-concept-code')

// Configure NVL instance
const nvlConfig = {
    initialZoom: 1,
    style: {
        node: {
            radius: 60,
            fontSize: 12,
            fontColor: '#000000',
            borderWidth: 2,
            borderColor: '#1B03A3'
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
        id: 'legend-CDE',
        captions: [{ value: 'caDSR CDE' }],
        color: '#a8571d',
        properties: { type: 'test' }
    },
    {
        id: 'legend-LOINC',
        captions: [{ value: 'LOINC' }],
        color: '#1da89d',
        properties: { type: 'test' }
    },
    {
        id: 'legend-RxNorm',
        captions: [{ value: 'RxNorm' }],
        color: '#91dfed',
        properties: { type: 'test' }
    },
    {
        id: 'legend-UCUM',
        captions: [{ value: 'UCUM' }],
        color: '#a88f1d',
        properties: { type: 'test' }
    },
    {
        id: 'legend-Map',
        captions: [{ value: 'DTE Map' }],
        color: '#29a81d',
        size:45,
        properties: { type: 'test' }
    },
    {
        id: 'legend-DDC',
        captions: [{ value: 'DDC' }],
        color: '#1d4ea8',
        properties: { type: 'test' }
    },
    {
        id: 'legend-OptionGroup',
        captions: [{ value: 'Option Group' }],
        color: '#a11da8',
        properties: { type: 'test' }
    },
    {
        id: 'legend-Option',
        captions: [{ value: 'Option' }],
        color: '#e991ed',
        properties: { type: 'test' }
    }
]

const testRelationships = [
    {
        id: 'rel1',
        from: 'legend-Map',
        to: 'legend-CDE',
        captions: [{ value: 'Has NumericValue CDE' }],
        properties: { type: 'test' }
    },
    {
        id: 'rel10',
        from: 'legend-Map',
        to: 'legend-LOINC',
        captions: [{ value: 'Has LOINC' }],
        properties: { type: 'test' }
    },
    {
        id: 'rel11',
        from: 'legend-Map',
        to: 'legend-RxNorm',
        captions: [{ value: 'Has RxNorm' }],
        properties: { type: 'test' }
    },
    {
        id: 'rel2',
        from: 'legend-CDE',
        to: 'legend-DDC',
        captions: [{ value: 'Equals FDM DDC' }],
        properties: { type: 'test' }
    },
    {
        id: 'rel3',
        from: 'legend-DDC',
        to: 'legend-OptionGroup',
        captions: [{ value: 'Has FDM-OptionGroup' }],
        properties: { type: 'test' }
    },
    {
        id: 'rel4',
        from: 'legend-OptionGroup',
        to: 'legend-Option',
        captions: [{ value: 'Contains FDM-Option' }],
        properties: { type: 'test' }
    },    
    {
        id: 'rel5',
        from: 'legend-Option',
        to: 'legend-UCUM',
        captions: [{ value: 'FDM-Option equals' }],
        properties: { type: 'test' }
    } 
]

// Initialize NVL with test data
const nvl = new NVL(container, testNodes, testRelationships, nvlConfig)
const dragNodeInteraction = new DragNodeInteraction(nvl)
const clickInteraction = new ClickInteraction(nvl)
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

        //GEMINI: update the node color for node in data based on the rules below
        /*
        if  the node .properties.vocabulary === 'UCUM' then color should be '#a88f1d'
        if  the node .properties.vocabulary === 'CIBMTR-DTE' then color should be '#32a852'
        if  the node .properties.vocabulary === 'CIBMTR-FDM' and node .properties.conceptClass = 'Option' then color should be '#1B03A3'
        if  the node .properties.vocabulary === 'CIBMTR-FDM' and node .properties.conceptClass = 'OptionGroup' then color should be '#4603a3'
        if  the node .properties.vocabulary === 'CIBMTR-FDM' and node .properties.conceptClass = 'DDC'  then color should be '#1d4ea8'
        if  the node .properties.vocabulary === 'CIBMTR-caDSR' and node .properties.conceptClass = 'CDE'  then color should be '#a8571d'
        */
        data.nodes.forEach(node => {
            if (node.properties.vocabulary === 'UCUM') {
                node.color = '#a88f1d';
            } else if (node.properties.vocabulary === 'CIBMTR-DTE') {
                node.color = '#29a81d';
            } else if (node.properties.vocabulary === 'RxNorm') {
                node.color = '#91dfed';
            } else if (node.properties.vocabulary === 'CIBMTR-FDM' && node.properties.conceptClass === 'Option') {
                node.color = '#e991ed';
            } else if (node.properties.vocabulary === 'CIBMTR-FDM' && node.properties.conceptClass === 'OptionGroup') {
                node.color = '#a11da8';
            } else if (node.properties.vocabulary === 'CIBMTR-FDM' && node.properties.conceptClass === 'DDC') {
                node.color = '#1d4ea8';
            } else if (node.properties.vocabulary === 'CIBMTR-caDSR' && node.properties.conceptClass === 'CDE') {
                node.color = '#a8571d';
            }
        });
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
    if (event.key === '/') {
        nvl.deselectAll();
    }
    if (event.key === '=') {
        nvl.deselectAll();
    }
    if (event.key === 'p') {
        nvl.saveFullGraphToLargeFile();
    }
})
/*
div.addEventListener('keypress', (event) => {
    if (event.key === 'q') {
        nvl.deselectAll();
    }
    if (event.key === ' ') {
        selnodes= nvl.getSelectedNodes();
        selnodes.forEach(node => {{nvl.pinNode(node.id)}})
    }
    if (event.key === 'p') {
        nvl.saveFullGraphToLargeFile();
    }
})

container.addEventListener('click', (e) => {
    const { nvlTargets } = nvl.getHits(e)
    if (nvlTargets.nodes.length > 0) {
      if(nvlTargets.nodes[0].selected===true){
        nvl.addAndUpdateElementsInGraph([{ id: nvlTargets.nodes[0].data.id, selected: false }], [])      
        } else{
        nvl.addAndUpdateElementsInGraph([{ id: nvlTargets.nodes[0].data.id, selected: true }], [])
      }
    } else {
        nvl.addAndUpdateElementsInGraph([{ id: nvlTargets.nodes[0].data.id, selected: false }], []) 
        
    }
})

*/
clickInteraction.updateCallback('onNodeClick', (node) => {
    console.log('Node clicked', node);
    var desel=0;
    const nodes=[node];
    const selectedNodes= nvl.getSelectedNodes();
    selectedNodes.forEach(inode => {
        if (inode.id === node.id){
          nvl.addAndUpdateElementsInGraph([{ id: nodes[0].id, selected: false }], []);
          desel=1;
        }  
    });
    if(desel===0){
        nvl.addAndUpdateElementsInGraph([{ id: nodes[0].id, selected: true }], []);
    }
    nodeConceptName.value=node.captions[0].value;
    nodeConceptId.value=node.id;
    nodeConceptCode.value=node.properties.conceptCode || '';
    nodeVocabulary.value=node.properties.vocabulary;
    nodeDomain.value=node.properties.domain;
    nodeConceptClass.value=node.properties.conceptClass;
})

dragNodeInteraction.updateCallback('onDrag', (nodes) => {
  console.log('Dragged nodes:', nodes)
})