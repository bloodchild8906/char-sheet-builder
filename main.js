// Global Variables
let selectedItem = null;
let currentPanel = 'explorer';
let componentCounter = 0;
let sheetData = {
    layout: [],
    data: {
        strength: 15,
        dexterity: 12,
        constitution: 14,
        level: 3,
        bonus: 2
    },
    styles: '',
    references: {
        spells: [{
            name: "Fireball",
            level: 3,
            school: "Evocation",
            description: "A bright streak flashes from your pointing finger to a point you choose within range and then blossoms with a low roar into an explosion of flame."
        },
            {
                name: "Magic Missile",
                level: 1,
                school: "Evocation",
                description: "You create three glowing darts of magical force. Each dart hits a creature of your choice that you can see within range."
            },
            {
                name: "Heal",
                level: 6,
                school: "Evocation",
                description: "Choose a creature that you can see within range. A surge of positive energy washes through the creature, causing it to regain 70 hit points."
            }],
        skills: [{
            name: "Acrobatics",
            ability: "Dexterity",
            description: "Your Dexterity (Acrobatics) check covers your attempt to stay on your feet in a tricky situation."
        },
            {
                name: "Athletics",
                ability: "Strength",
                description: "Your Strength (Athletics) check covers difficult situations you encounter while climbing, jumping, or swimming."
            },
            {
                name: "Stealth",
                ability: "Dexterity",
                description: "Make a Dexterity (Stealth) check when you attempt to conceal yourself from enemies, slink past guards, slip away without being noticed."
            }],
        equipment: [{
            name: "Longsword",
            type: "Weapon",
            damage: "1d8",
            description: "A versatile weapon that can be used with one or two hands."
        },
            {
                name: "Shield",
                type: "Armor",
                ac: "+2",
                description: "A shield is made from wood or metal and is carried in one hand."
            },
            {
                name: "Healing Potion",
                type: "Consumable",
                effect: "2d4+2",
                description: "A character who drinks the magical red fluid in this vial regains hit points."
            }]
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    setupDragAndDrop();
    updateComponentCount();
    updateSheetTree();
});

// Menu Functions
function showFileMenu() {
    if (confirm('File Menu:\nNew Sheet (Ctrl+N)\nSave Sheet (Ctrl+S)\nImport/Export\n\nCreate new sheet?')) {
        newSheet();
    }
}

function showEditMenu() {
    alert('Edit Menu:\nCopy/Paste - Coming Soon\nUndo/Redo - Coming Soon\nDelete Component (Delete)');
}

function showViewMenu() {
    alert('View Menu:\nZoom Controls - Coming Soon\nToggle Panels - Coming Soon\nGrid View - Coming Soon');
}

function showHelpMenu() {
    alert('TTRPG Character Sheet Builder Help:\n\n• Drag components from sidebar to canvas\n• Select components to edit properties\n• Use calculated fields with rules like: sum([field1],[field2])\n• Link input events: dice-roll, update-calculations\n• Export/Import JSON sheets\n\nKeyboard Shortcuts:\nCtrl+S: Export\nCtrl+O: Import\nDelete: Remove selected');
}

function newSheet() {
    if (confirm('Create new sheet? This will clear current work.')) {
        clearCanvas();
        componentCounter = 0;
        sheetData.data = {
            strength: 15,
            dexterity: 12,
            constitution: 14,
            level: 3,
            bonus: 2
        };
        updateStatus('New sheet created');
    }
}

// Panel Management
function switchPanel(panelName) {
    document.querySelectorAll('.activity-icon').forEach(icon => icon.classList.remove('active'));
    document.querySelector(`[data-panel="${panelName}"]`).classList.add('active');
    document.querySelectorAll('.panel-content').forEach(panel => panel.style.display = 'none');
    document.getElementById(panelName + '-panel').style.display = 'block';
    const titles = {
        'explorer': 'EXPLORER',
        'components': 'COMPONENTS',
        'properties': 'PROPERTIES',
        'data': 'DATA'
    };
    document.getElementById('sidebar-title').textContent = titles[panelName];
    currentPanel = panelName;
}

// Canvas Management
function clearCanvas() {
    document.getElementById('canvas').innerHTML = '<div class="canvas-placeholder"><h3>Start Building Your Character Sheet</h3><p>Drag components from the sidebar to begin</p></div>';
    selectedItem = null;
    clearPropertiesPanel();
    updateComponentCount();
    updateSheetTree();
    updateStatus('Canvas cleared');
}

// Data Management
function showDataEditor() {
    document.getElementById('data-editor').value = JSON.stringify(sheetData, null, 2);
    showModal('data-modal');
}

function saveSheetData() {
    try {
        sheetData = JSON.parse(document.getElementById('data-editor').value);
        closeModal('data-modal');
        updateStatus('Data saved');
    } catch (error) {
        alert('Invalid JSON: ' + error.message);
    }
}

function formatJSON() {
    try {
        const data = JSON.parse(document.getElementById('data-editor').value);
        document.getElementById('data-editor').value = JSON.stringify(data, null, 2);
    } catch (error) {
        alert('Invalid JSON: ' + error.message);
    }
}

function validateJSON() {
    try {
        JSON.parse(document.getElementById('data-editor').value);
        alert('✅ JSON is valid!');
    } catch (error) {
        alert('❌ Invalid JSON: ' + error.message);
    }
}

function exportSheet() {
    const dataStr = JSON.stringify(sheetData, null, 2);
    const blob = new Blob([dataStr], {
        type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'character-sheet.json';
    link.click();
    URL.revokeObjectURL(url);
    updateStatus('Sheet exported');
}

function importSheet() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    sheetData = JSON.parse(e.target.result);
                    updateStatus('Sheet imported');
                } catch (error) {
                    alert('Invalid file: ' + error.message);
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

// Preview & CSS
function previewSheet() {
    const canvas = document.getElementById('canvas');
    const clone = canvas.cloneNode(true);
    clone.querySelectorAll('.item-controls, .canvas-placeholder').forEach(el => el.remove());
    document.getElementById('preview-content').innerHTML = '';
    document.getElementById('preview-content').appendChild(clone);
    showModal('preview-modal');
}

function showGlobalCSS() {
    showModal('css-modal');
}

function applyGlobalCSS() {
    const css = document.getElementById('css-editor').value;
    let style = document.getElementById('custom-styles');
    if (!style) {
        style = document.createElement('style');
        style.id = 'custom-styles';
        document.head.appendChild(style);
    }
    style.textContent = css;
    sheetData.styles = css;
    closeModal('css-modal');
    updateStatus('CSS applied');
}

function resetCSS() {
    document.getElementById('css-editor').value = '';
    const style = document.getElementById('custom-styles');
    if (style) style.remove();
    sheetData.styles = '';
    updateStatus('CSS reset');
}

// Drag & Drop
function setupDragAndDrop() {
    const componentItems = document.querySelectorAll('.component-item[draggable="true"]');
    const canvas = document.getElementById('canvas');

    componentItems.forEach(item => {
        item.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('text/plain', this.dataset.type);
        });
    });

    canvas.addEventListener('dragover', function(e) {
        e.preventDefault();
    });

    canvas.addEventListener('drop', function(e) {
        e.preventDefault();
        const componentType = e.dataTransfer.getData('text/plain');
        const container = findDropTarget(e.target) || canvas;

        if (componentType) {
            createComponent(componentType, container);
            updateComponentCount();
            updateSheetTree();
            updateStatus('Component added');
        }
    });
}

function findDropTarget(element) {
    while (element && element !== document.getElementById('canvas')) {
        if (element.classList.contains('row') || element.classList.contains('column') || element.id === 'canvas') {
            return element;
        }
        element = element.parentElement;
    }
    return null;
}

// Component Creation
function createComponent(type, container) {
    const id = 'item_' + (++componentCounter);
    const placeholder = container.querySelector('.canvas-placeholder, .container-placeholder');
    if (placeholder) placeholder.remove();

    const componentMap = {
        'row': `<div class="row sheet-item" data-type="row" data-id="${id}" style="border: 2px dashed #ccc; min-height: 60px; padding: 15px; margin: 10px 0; display: flex; flex-wrap: wrap; gap: 10px; position: relative;">
        <div class="item-controls" style="position: absolute; top: -8px; right: -8px; display: none; gap: 4px;">
        <button onclick="selectItem(this.parentElement.parentElement)">⚙</button>
        <button onclick="deleteItem(this.parentElement.parentElement)">×</button>
        </div>
        <div class="container-placeholder" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #999; pointer-events: none;">Row Container</div>
        </div>`,
        'column': `<div class="column sheet-item" data-type="column" data-id="${id}" style="border: 2px dashed #ccc; min-height: 60px; padding: 15px; margin: 10px 0; display: flex; flex-direction: row; flex-wrap: wrap; gap: 10px; flex: 1; min-width: 200px; position: relative;">`,
        'text-input': `<div class="sheet-item" data-type="text-input" data-id="${id}" style="border: 1px solid #ddd; padding: 12px; margin: 8px; position: relative;">
        <div class="item-controls" style="position: absolute; top: -8px; right: -8px; display: none; gap: 4px;">
        <button onclick="selectItem(this.parentElement.parentElement)">⚙</button>
        <button onclick="deleteItem(this.parentElement.parentElement)">×</button>
        </div>
        <label>Text Input:</label>
        <input type="text" placeholder="Enter text..." data-json-path="textInput_${id}" data-events="" style="width: 100%; padding: 6px;">
        </div>`,
        'number-input': `<div class="sheet-item" data-type="number-input" data-id="${id}" style="border: 1px solid #ddd; padding: 12px; margin: 8px; position: relative;">
        <div class="item-controls" style="position: absolute; top: -8px; right: -8px; display: none; gap: 4px;">
        <button onclick="selectItem(this.parentElement.parentElement)">⚙</button>
        <button onclick="deleteItem(this.parentElement.parentElement)">×</button>
        </div>
        <label>Number Input:</label>
        <input type="number" placeholder="0" data-json-path="numberInput_${id}" data-events="" style="width: 100%; padding: 6px;">
        </div>`,
        'textarea': `<div class="sheet-item" data-type="textarea" data-id="${id}" style="border: 1px solid #ddd; padding: 12px; margin: 8px; position: relative;">
        <div class="item-controls" style="position: absolute; top: -8px; right: -8px; display: none; gap: 4px;">
        <button onclick="selectItem(this.parentElement.parentElement)">⚙</button>
        <button onclick="deleteItem(this.parentElement.parentElement)">×</button>
        </div>
        <label>Text Area:</label>
        <textarea rows="3" placeholder="Enter multi-line text..." data-json-path="textarea_${id}" data-events="" style="width: 100%; padding: 6px;"></textarea>
        </div>`,
        'select': `<div class="sheet-item" data-type="select" data-id="${id}" style="border: 1px solid #ddd; padding: 12px; margin: 8px; position: relative;">
        <div class="item-controls" style="position: absolute; top: -8px; right: -8px; display: none; gap: 4px;">
        <button onclick="selectItem(this.parentElement.parentElement)">⚙</button>
        <button onclick="deleteItem(this.parentElement.parentElement)">×</button>
        </div>
        <label>Dropdown:</label>
        <select data-json-path="select_${id}" data-events="" style="width: 100%; padding: 6px;">
        <option value="">Select option...</option>
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
        </select>
        </div>`,
        'checkbox': `<div class="sheet-item" data-type="checkbox" data-id="${id}" style="border: 1px solid #ddd; padding: 12px; margin: 8px; position: relative;">
        <div class="item-controls" style="position: absolute; top: -8px; right: -8px; display: none; gap: 4px;">
        <button onclick="selectItem(this.parentElement.parentElement)">⚙</button>
        <button onclick="deleteItem(this.parentElement.parentElement)">×</button>
        </div>
        <label><input type="checkbox" data-json-path="checkbox_${id}" data-events=""> Checkbox Option</label>
        </div>`,
        'label': `<div class="sheet-item" data-type="label" data-id="${id}" style="border: 1px solid #ddd; padding: 12px; margin: 8px; position: relative;">
        <div class="item-controls" style="position: absolute; top: -8px; right: -8px; display: none; gap: 4px;">
        <button onclick="selectItem(this.parentElement.parentElement)">⚙</button>
        <button onclick="deleteItem(this.parentElement.parentElement)">×</button>
        </div>
        <span data-json-path="label_${id}">Label Text</span>
        </div>`,
        'calculated': `<div class="sheet-item" data-type="calculated" data-id="${id}" style="border: 1px solid #ddd; padding: 12px; margin: 8px; position: relative;">
        <div class="item-controls" style="position: absolute; top: -8px; right: -8px; display: none; gap: 4px;">
        <button onclick="selectItem(this.parentElement.parentElement)">⚙</button>
        <button onclick="deleteItem(this.parentElement.parentElement)">×</button>
        </div>
        <label>Calculated:</label>
        <span class="calculated-value" data-calculation="0" data-rules="" style="font-weight: bold; color: #4fc3f7;">0</span>
        </div>`,
        'progress-bar': `<div class="sheet-item" data-type="progress-bar" data-id="${id}" style="border: 1px solid #ddd; padding: 12px; margin: 8px; position: relative;">
        <div class="item-controls" style="position: absolute; top: -8px; right: -8px; display: none; gap: 4px;">
        <button onclick="selectItem(this.parentElement.parentElement)">⚙</button>
        <button onclick="deleteItem(this.parentElement.parentElement)">×</button>
        </div>
        <label>Progress Bar:</label>
        <div style="width: 100%; background: #f0f0f0; border-radius: 4px; height: 16px; overflow: hidden; margin-top: 5px;">
        <div style="height: 100%; background: linear-gradient(90deg, #4fc3f7, #29b6f6); width: 50%; transition: width 0.3s;" data-json-path="progress_${id}"></div>
        </div>
        </div>`,
        'dice-button': `<div class="sheet-item" data-type="dice-button" data-id="${id}" style="border: 1px solid #ddd; padding: 12px; margin: 8px; position: relative;">
        <div class="item-controls" style="position: absolute; top: -8px; right: -8px; display: none; gap: 4px;">
        <button onclick="selectItem(this.parentElement.parentElement)">⚙</button>
        <button onclick="deleteItem(this.parentElement.parentElement)">×</button>
        </div>
        <button onclick="rollDice('1d20', this)" data-dice="1d20" style="padding: 6px 12px; background: #0e639c; color: white; border: none; border-radius: 4px;">🎲 Roll 1d20</button>
        </div>`,
        'reference-button': `<div class="sheet-item" data-type="reference-button" data-id="${id}" style="border: 1px solid #ddd; padding: 12px; margin: 8px; position: relative;">
        <div class="item-controls" style="position: absolute; top: -8px; right: -8px; display: none; gap: 4px;">
        <button onclick="selectItem(this.parentElement.parentElement)">⚙</button>
        <button onclick="deleteItem(this.parentElement.parentElement)">×</button>
        </div>
        <button onclick="showReferenceList('spells', this)" data-reference="spells" style="padding: 6px 12px; background: #0e639c; color: white; border: none; border-radius: 4px;">📚 View Spells</button>
        </div>`,
        'info-button': `<div class="sheet-item" data-type="info-button" data-id="${id}" style="border: 1px solid #ddd; padding: 12px; margin: 8px; position: relative;">
        <div class="item-controls" style="position: absolute; top: -8px; right: -8px; display: none; gap: 4px;">
        <button onclick="selectItem(this.parentElement.parentElement)">⚙</button>
        <button onclick="deleteItem(this.parentElement.parentElement)">×</button>
        </div>
        <button onclick="showInfoBox('Information', 'This is sample information content.', this)" data-info-title="Information" data-info-content="This is sample information content." style="padding: 6px 12px; background: #0e639c; color: white; border: none; border-radius: 4px;">ℹ️ Show Info</button>
        </div>`
    };

    const html = componentMap[type];
    if (html) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const newElement = tempDiv.firstElementChild;
        container.appendChild(newElement);

        if (type === 'row' || type === 'column') {
            setupContainerDragDrop(newElement);
        }
        setupInputListeners(newElement);
        setupItemHover(newElement);
    }
}

function setupContainerDragDrop(container) {
    container.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
    });

    container.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();

        const componentType = e.dataTransfer.getData('text/plain');

        if (componentType) {
            const placeholder = this.querySelector('.container-placeholder');
            if (placeholder) placeholder.remove();

            createComponent(componentType, this);
            updateComponentCount();
            updateSheetTree();
            updateStatus('Component added to container');
        }
    });
}

function setupInputListeners(element) {
    const inputs = element.querySelectorAll('[data-json-path]');
    inputs.forEach(input => {
        input.addEventListener('change', function() {
            const path = this.dataset.jsonPath;
            if (this.type === 'checkbox') {
                sheetData.data[path] = this.checked;
            } else if (this.type === 'number') {
                sheetData.data[path] = parseFloat(this.value) || 0;
            } else {
                sheetData.data[path] = this.value;
            }

            const events = this.dataset.events;
            if (events) executeInputEvents(events, this, path);

            updateCalculatedFields();
            updateStatus('Data updated');
        });

        input.addEventListener('input',
            function() {
                const path = this.dataset.jsonPath;
                if (this.type === 'number') {
                    sheetData.data[path] = parseFloat(this.value) || 0;
                } else if (this.type !== 'checkbox') {
                    sheetData.data[path] = this.value;
                }
                updateCalculatedFields();
            });
    });
}

function setupItemHover(element) {
    element.addEventListener('mouseenter', function() {
        const controls = this.querySelector('.item-controls');
        if (controls) controls.style.display = 'flex';
    });

    element.addEventListener('mouseleave',
        function() {
            const controls = this.querySelector('.item-controls');
            if (controls) controls.style.display = 'none';
        });
}

function executeInputEvents(events, inputElement, jsonPath) {
    try {
        const eventList = events.split(',').map(e => e.trim());
        eventList.forEach(event => {
            switch (event) {
                case 'dice-roll':
                    rollDice(inputElement.value || '1d20');
                    break;
                case 'update-calculations':
                    updateCalculatedFields();
                    break;
                case 'show-reference':
                    showReferenceList('spells');
                    break;
                case 'validate-input':
                    validateInputValue(inputElement);
                    break;
            }
        });
    } catch (error) {
        console.error('Error executing input events:',
            error);
    }
}

function validateInputValue(input) {
    if (input.type === 'number') {
        const num = parseFloat(input.value);
        if (isNaN(num)) {
            input.style.borderColor = '#e81123';
            setTimeout(() => input.style.borderColor = '', 2000);
        } else {
            input.style.borderColor = '#4fc3f7';
            setTimeout(() => input.style.borderColor = '', 1000);
        }
    }
}

function updateCalculatedFields() {
    const calculatedElements = document.querySelectorAll('.calculated-value[data-rules]');
    calculatedElements.forEach(element => {
        const rules = element.dataset.rules;
        if (rules) {
            try {
                const result = evaluateCalculationRules(rules);
                element.textContent = result;
            } catch (error) {
                element.textContent = 'Error';
                console.error('Calculation error:', error);
            }
        }
    });
}

function evaluateCalculationRules(rules) {
    try {
        const expressions = rules.split(';').filter(rule => rule.trim());
        let result = 0;

        expressions.forEach(expression => {
            const trimmed = expression.trim();
            if (trimmed.startsWith('sum(')) {
                const fields = trimmed.slice(4, -1).split(',').map(f => f.trim());
                result = fields.reduce((acc, field) => acc + (parseFloat(getFieldValue(field)) || 0), 0);
            } else if (trimmed.startsWith('max(')) {
                const fields = trimmed.slice(4, -1).split(',').map(f => f.trim());
                const values = fields.map(field => parseFloat(getFieldValue(field)) || 0);
                result = Math.max(...values);
            } else if (trimmed.startsWith('min(')) {
                const fields = trimmed.slice(4, -1).split(',').map(f => f.trim());
                const values = fields.map(field => parseFloat(getFieldValue(field)) || 0);
                result = Math.min(...values);
            } else if (trimmed.includes('+') || trimmed.includes('-') || trimmed.includes('*') || trimmed.includes('/')) {
                let expr = trimmed;
                const fieldMatches = expr.match(/\[([^\]]+)\]/g);
                if (fieldMatches) {
                    fieldMatches.forEach(match => {
                        const fieldName = match.slice(1, -1);
                        const value = getFieldValue(fieldName) || 0;
                        expr = expr.replace(match, value);
                    });
                }
                result = evaluateExpression(expr);
            } else if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                const fieldName = trimmed.slice(1, -1);
                result = parseFloat(getFieldValue(fieldName)) || 0;
            } else {
                result = parseFloat(trimmed) || 0;
            }
        });

        return result;
    } catch (error) {
        return 'Error';
    }
}

function getFieldValue(fieldName) {
    if (sheetData.data[fieldName] !== undefined) {
        return sheetData.data[fieldName];
    }

    const element = document.querySelector(`[data-json-path="${fieldName}"]`);
    if (element) {
        return element.type === 'checkbox' ? (element.checked ? 1: 0): (element.value || 0);
    }
    return 0;
}

function evaluateExpression(expr) {
    const cleanExpr = expr.replace(/[^0-9+\-*/().\s]/g, '');
    try {
        return Function('"use strict"; return (' + cleanExpr + ')')();
    } catch (error) {
        return 0;
    }
}

// Item Management
function selectItem(item) {
    document.querySelectorAll('.sheet-item').forEach(el => el.style.background = '');
    item.style.background = '#e3f2fd';
    selectedItem = item;
    switchPanel('properties');
    showItemProperties(item);
    updateStatus('Item selected');
}

function deleteItem(item) {
    if (confirm('Delete this component?')) {
        item.remove();
        if (selectedItem === item) {
            selectedItem = null;
            clearPropertiesPanel();
        }
        updateComponentCount();
        updateSheetTree();
        updateStatus('Component deleted');
    }
}

function showItemProperties(item) {
    const propertiesContent = document.getElementById('properties-content');
    const type = item.dataset.type;
    const id = item.dataset.id;

    let html = `<h4>Component Properties</h4>
    <div><label>Type:</label><input type="text" value="${type}" readonly></div>
    <div><label>ID:</label><input type="text" value="${id}" readonly></div>`;

    switch (type) {
        case 'text-input':
            case 'number-input':
                html += `
                <div><label>Label:</label><input type="text" value="${item.querySelector('label')?.textContent || ''}" onchange="updateItemProperty('label', this.value)"></div>
                <div><label>Placeholder:</label><input type="text" value="${item.querySelector('input')?.placeholder || ''}" onchange="updateItemProperty('placeholder', this.value)"></div>
                <div><label>JSON Path:</label><input type="text" value="${item.querySelector('[data-json-path]')?.dataset.jsonPath || ''}" onchange="updateItemProperty('json-path', this.value)"></div>
                <div><label>Events:</label><input type="text" value="${item.querySelector('[data-events]')?.dataset.events || ''}" onchange="updateItemProperty('events', this.value)" placeholder="dice-roll, update-calculations"></div>
                `;
                break;
            case 'calculated':
                html += `
                <div><label>Label:</label><input type="text" value="${item.querySelector('label')?.textContent || ''}" onchange="updateItemProperty('label', this.value)"></div>
                <div><label>Rules:</label><textarea rows="4" onchange="updateItemProperty('rules', this.value)" placeholder="sum([field1],[field2])&#10;[strength] + [dexterity]">${item.querySelector('[data-rules]')?.dataset.rules || ''}</textarea></div>
                `;
                break;
            case 'dice-button':
                html += `
                <div><label>Button Text:</label><input type="text" value="${item.querySelector('button')?.textContent || ''}" onchange="updateItemProperty('text', this.value)"></div>
                <div><label>Dice Formula:</label><input type="text" value="${item.querySelector('[data-dice]')?.dataset.dice || ''}" onchange="updateItemProperty('dice', this.value)"></div>
                `;
                break;
    }

    propertiesContent.innerHTML = html;
}

function clearPropertiesPanel() {
    document.getElementById('properties-content').innerHTML = 'Select an item to edit its properties';
}

function updateItemProperty(property, value) {
    if (!selectedItem) return;

    switch (property) {
        case 'label':
            const label = selectedItem.querySelector('label');
            if (label) label.textContent = value;
            break;
        case 'placeholder':
            const input = selectedItem.querySelector('input, textarea');
            if (input) input.placeholder = value;
            break;
        case 'json-path':
            const jsonElement = selectedItem.querySelector('[data-json-path]');
            if (jsonElement) jsonElement.dataset.jsonPath = value;
            break;

        case 'events':
            const eventElement = selectedItem.querySelector('[data-events]');
            if (eventElement) {
                eventElement.dataset.events = value;
                setupInputListeners(selectedItem);
            }
            break;
        case 'rules':
            const calculatedElement = selectedItem.querySelector('[data-rules]');
            if (calculatedElement) {
                calculatedElement.dataset.rules = value;
                updateCalculatedFields();
            }
            break;
        case 'text':
            const textElement = selectedItem.querySelector('span, button');
            if (textElement) textElement.textContent = value;
            break;
        case 'dice':
            const diceButton = selectedItem.querySelector('[data-dice]');
            if (diceButton) diceButton.dataset.dice = value;
            break;
    }
    updateStatus('Property updated');
}

// Interactive Functions
function rollDice(formula, button) {
    try {
        const match = formula.match(/(\d+)d(\d+)([+-]\d+)?/);
        if (!match) throw new Error('Invalid dice formula');

        const numDice = parseInt(match[1]);
        const diceSize = parseInt(match[2]);
        const modifier = match[3] ? parseInt(match[3]): 0;

        let total = 0;
        let rolls = [];

        for (let i = 0; i < numDice; i++) {
            const roll = Math.floor(Math.random() * diceSize) + 1;
            rolls.push(roll);
            total += roll;
        }

        total += modifier;

        document.getElementById('dice-result').innerHTML = `
        <div style="font-size: 32px; margin-bottom: 10px;">${total}</div>
        <div style="font-size: 14px;">
        Formula: ${formula}<br>
        Rolls: ${rolls.join(', ')}${modifier !== 0 ? ` + ${modifier}`: ''}
        </div>
        `;

        showModal('dice-modal');
    } catch (error) {
        alert('Invalid dice formula: ' + formula);
    }
}

function showReferenceList(type, button) {
    const references = sheetData.references[type];
    if (!references) {
        alert('No reference data found for: ' + type);
        return;
    }

    const referenceList = document.getElementById('reference-list');
    referenceList.innerHTML = '';

    references.forEach(item => {
        const div = document.createElement('div');
        div.style.cssText = 'border: 1px solid #ddd; padding: 12px; margin: 8px 0; cursor: pointer; border-radius: 4px;';
        div.innerHTML = `
        <h4>${item.name}</h4>
        <p><strong>Type:</strong> ${item.level ? `Level ${item.level}`: item.ability || item.type || 'N/A'}</p>
        <p>${item.description}</p>
        `;
        div.onclick = () => {
            closeModal('reference-modal');
            showInfoBox(item.name, item.description);
        };
        referenceList.appendChild(div);
    });

    showModal('reference-modal');
}

function showInfoBox(title, content, button = null) {
    document.getElementById('info-title').textContent = title;
    document.getElementById('info-content').innerHTML = `<p>${content}</p>`;
    showModal('info-modal');
}

// Modal Functions
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Utility Functions
function updateComponentCount() {
    const count = document.querySelectorAll('.sheet-item').length;
    document.getElementById('component-count').textContent = `Components: ${count}`;
}

function updateStatus(message) {
    document.getElementById('sheet-status').textContent = message;
    setTimeout(() => {
        document.getElementById('sheet-status').textContent = 'Ready';
    }, 2000);
}

function updateSheetTree() {
    const tree = document.getElementById('sheet-tree');
    const items = document.querySelectorAll('.sheet-item');

    if (items.length === 0) {
        tree.innerHTML = 'No components added yet';
        return;
    }

    let html = '';
    items.forEach(item => {
        const type = item.dataset.type;
        const id = item.dataset.id;
        const icon = getComponentIcon(type);
        html += `<div style="padding: 4px; cursor: pointer;" onclick="selectItem(document.querySelector('[data-id=\\'${id}\\']'))">${icon} ${type} (${id})</div>`;
    });

    tree.innerHTML = html;
}

function getComponentIcon(type) {
    const icons = {
        'row': '📋',
        'column': '📊',
        'text-input': '📝',
        'number-input': '🔢',
        'textarea': '📄',
        'select': '📋',
        'checkbox': '☑️',
        'label': '🏷️',
        'calculated': '🧮',
        'progress-bar': '📊',
        'dice-button': '🎲',
        'reference-button': '📚',
        'info-button': 'ℹ️'
    };
    return icons[type] || '📦';
}

// Keyboard Shortcuts
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 's':
                e.preventDefault();
                exportSheet();
                break;
            case 'o':
                e.preventDefault();
                importSheet();
                break;
            case 'n':
                e.preventDefault();
                newSheet();
                break;
        }
    }
    if (e.key === 'Delete' && selectedItem) {
        e.preventDefault();
        deleteItem(selectedItem);
    }
});