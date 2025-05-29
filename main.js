// === CONFIGURABLE CONSTANTS ===
let DEFAULT_FONTS = "'JetBrains Mono', 'Consolas', 'Monaco', 'Courier New', monospace";
let LABELS = {
    'text-input': 'Text Input:',
    'number-input': 'Number Input:',
    'textarea': 'Text Area:',
    'select': 'Dropdown:',
    'checkbox': 'Checkbox Option',
    'label': 'Label Text',
    'calculated': 'Calculated:',
    'progress-bar': 'Progress Bar:',
    'dice-button': '🎲 Roll 1d20',
    'reference-button': '📚 View Spells', 
    'info-button': 'ℹ️ Show Info'
};

// === OPTIMIZED GLOBAL STATE ===
class AppState {
    constructor() {
        this.selectedItem = null;
        this.currentPanel = 'explorer';
        this.componentCounter = 0;
        this.currentDropdownMenu = null;
        this.undoStack = [];
        this.redoStack = [];
        this.maxUndoSteps = 50;
        this.sheetData = {
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
                }, {
                    name: "Magic Missile",
                    level: 1,
                    school: "Evocation",
                    description: "You create three glowing darts of magical force. Each dart hits a creature of your choice that you can see within range."
                }, {
                    name: "Heal",
                    level: 6,
                    school: "Evocation",
                    description: "Choose a creature that you can see within range. A surge of positive energy washes through the creature, causing it to regain 70 hit points."
                }],
                skills: [{
                    name: "Acrobatics",
                    ability: "Dexterity",
                    description: "Your Dexterity (Acrobatics) check covers your attempt to stay on your feet in a tricky situation."
                }, {
                    name: "Athletics",
                    ability: "Strength",
                    description: "Your Strength (Athletics) check covers difficult situations you encounter while climbing, jumping, or swimming."
                }, {
                    name: "Stealth",
                    ability: "Dexterity",
                    description: "Make a Dexterity (Stealth) check when you attempt to conceal yourself from enemies, slink past guards, slip away without being noticed."
                }],
                equipment: [{
                    name: "Longsword",
                    type: "Weapon",
                    damage: "1d8",
                    description: "A versatile weapon that can be used with one or two hands."
                }, {
                    name: "Shield",
                    type: "Armor",
                    ac: "+2",
                    description: "A shield is made from wood or metal and is carried in one hand."
                }, {
                    name: "Healing Potion",
                    type: "Consumable",
                    effect: "2d4+2",
                    description: "A character who drinks the magical red fluid in this vial regains hit points."
                }]
            }
        };
        this.domCache = new Map();
        this.eventListeners = new Map();
    }

    // Optimized DOM caching
    getElement(id) {
        if (!this.domCache.has(id)) {
            const element = document.getElementById(id);
            if (element) {
                this.domCache.set(id, element);
            }
        }
        return this.domCache.get(id) || null;
    }

    // Clear DOM cache when elements might have changed
    clearDOMCache() {
        this.domCache.clear();
    }

    // Undo/Redo system
    saveState(action) {
        const state = {
            action,
            timestamp: Date.now(),
            canvas: this.getElement('canvas')?.innerHTML || '',
            data: JSON.parse(JSON.stringify(this.sheetData)),
            selectedItem: this.selectedItem?.dataset?.id || null,
            componentCounter: this.componentCounter
        };
        
        this.undoStack.push(state);
        if (this.undoStack.length > this.maxUndoSteps) {
            this.undoStack.shift();
        }
        this.redoStack = []; // Clear redo stack on new action
        this.updateUndoRedoButtons();
    }

    undo() {
        if (this.undoStack.length === 0) return;
        
        const currentState = {
            canvas: this.getElement('canvas')?.innerHTML || '',
            data: JSON.parse(JSON.stringify(this.sheetData)),
            selectedItem: this.selectedItem?.dataset?.id || null,
            componentCounter: this.componentCounter
        };
        
        this.redoStack.push(currentState);
        const previousState = this.undoStack.pop();
        
        this.restoreState(previousState);
        this.updateUndoRedoButtons();
        updateStatus('Undo completed');
    }

    redo() {
        if (this.redoStack.length === 0) return;
        
        const currentState = {
            canvas: this.getElement('canvas')?.innerHTML || '',
            data: JSON.parse(JSON.stringify(this.sheetData)),
            selectedItem: this.selectedItem?.dataset?.id || null,
            componentCounter: this.componentCounter
        };
        
        this.undoStack.push(currentState);
        const nextState = this.redoStack.pop();
        
        this.restoreState(nextState);
        this.updateUndoRedoButtons();
        updateStatus('Redo completed');
    }

    restoreState(state) {
        try {
            const canvas = this.getElement('canvas');
            if (canvas) {
                canvas.innerHTML = state.canvas;
            }
            
            this.sheetData = JSON.parse(JSON.stringify(state.data));
            this.componentCounter = state.componentCounter;
            
            // Restore selected item
            if (state.selectedItem) {
                const element = document.querySelector(`[data-id="${state.selectedItem}"]`);
                if (element) {
                    selectItem(element);
                }
            } else {
                this.selectedItem = null;
                clearPropertiesPanel();
            }
            
            // Re-setup event listeners for restored elements
            this.setupAllEventListeners();
            updateComponentCount();
            updateSheetTree();
        } catch (error) {
            console.error('Error restoring state:', error);
            updateStatus('Error restoring state');
        }
    }

    updateUndoRedoButtons() {
        // Update undo/redo button states in menus
        const undoItems = document.querySelectorAll('[data-action="undo"]');
        const redoItems = document.querySelectorAll('[data-action="redo"]');
        
        undoItems.forEach(item => {
            if (this.undoStack.length === 0) {
                item.style.opacity = '0.5';
                item.style.pointerEvents = 'none';
            } else {
                item.style.opacity = '1';
                item.style.pointerEvents = 'auto';
            }
        });
        
        redoItems.forEach(item => {
            if (this.redoStack.length === 0) {
                item.style.opacity = '0.5';
                item.style.pointerEvents = 'none';
            } else {
                item.style.opacity = '1';
                item.style.pointerEvents = 'auto';
            }
        });
    }

    setupAllEventListeners() {
        // Re-setup drag and drop
        setupDragAndDrop();
        
        // Re-setup input listeners for all sheet items
        document.querySelectorAll('.sheet-item').forEach(item => {
            if (item.classList.contains('row') || item.classList.contains('column')) {
                setupContainerDragDrop(item);
            }
            setupInputListeners(item);
        });
    }

    // Memory cleanup
    cleanup() {
        this.domCache.clear();
        this.eventListeners.forEach((listener, element) => {
            element.removeEventListener(listener.event, listener.handler);
        });
        this.eventListeners.clear();
    }
}

// Global app state instance
const appState = new AppState();

// Expose global variables for backward compatibility
let selectedItem = null;
let currentPanel = 'explorer';
let componentCounter = 0;
let currentDropdownMenu = null;
let sheetData = appState.sheetData;

// === PERFORMANCE UTILITIES ===
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

const throttle = (func, limit) => {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// === OPTIMIZED INITIALIZATION ===
document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
    try {
        showLoadingIndicator();
        
        // Initialize core systems
        await Promise.all([
            initializeDragAndDrop(),
            initializeMenus(),
            initializeKeyboardShortcuts(),
            initializeEventDelegation()
        ]);
        
        // Update UI
        updateComponentCount();
        updateSheetTree();
        applyFontSetting();
        
        // Setup auto-save
        setupAutoSave();
        
        hideLoadingIndicator();
        updateStatus('Application initialized successfully');
        
    } catch (error) {
        console.error('Initialization error:', error);
        updateStatus('Error initializing application');
        hideLoadingIndicator();
    }
}

function showLoadingIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'loading-indicator';
    indicator.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                    background: rgba(0,0,0,0.8); display: flex; align-items: center; 
                    justify-content: center; z-index: 10000; color: white;">
            <div style="text-align: center;">
                <div style="font-size: 24px; margin-bottom: 10px;">⚙️</div>
                <div>Loading Character Sheet Builder...</div>
            </div>
        </div>
    `;
    document.body.appendChild(indicator);
}

function hideLoadingIndicator() {
    const indicator = document.getElementById('loading-indicator');
    if (indicator) {
        indicator.remove();
    }
}

// === OPTIMIZED EVENT DELEGATION ===
function initializeEventDelegation() {
    // Use event delegation for better performance
    document.addEventListener('click', handleGlobalClick);
    document.addEventListener('input', handleGlobalInput);
    document.addEventListener('change', handleGlobalChange);
}

function handleGlobalClick(e) {
    try {
        // Handle dropdown closing
        if (!e.target.closest('.menu-item')) {
            closeDropdown();
        }
        
        // Handle component selection
        if (e.target.closest('.sheet-item') && !e.target.closest('.item-controls')) {
            const item = e.target.closest('.sheet-item');
            selectItem(item);
        }
        
        // Handle control buttons
        if (e.target.matches('.control-btn')) {
            e.stopPropagation();
            const item = e.target.closest('.sheet-item');
            if (e.target.textContent === '⚙') {
                selectItem(item);
            } else if (e.target.textContent === '×') {
                deleteItem(item);
            }
        }
        
        // Prevent dropdown from closing when clicking inside
        if (e.target.closest('.dropdown-menu')) {
            e.stopPropagation();
        }
    } catch (error) {
        console.error('Global click handler error:', error);
    }
}

function handleGlobalInput(e) {
    try {
        if (e.target.matches('[data-json-path]')) {
            debouncedUpdateValue(e.target);
        }
    } catch (error) {
        console.error('Global input handler error:', error);
    }
}

function handleGlobalChange(e) {
    try {
        if (e.target.matches('[data-json-path]')) {
            updateDataValue(e.target);
        }
    } catch (error) {
        console.error('Global change handler error:', error);
    }
}

// Debounced update for better performance
const debouncedUpdateValue = debounce((input) => {
    updateDataValue(input);
}, 300);

function updateDataValue(input) {
    try {
        const path = input.dataset.jsonPath;
        if (!path) return;
        
        if (input.type === 'checkbox') {
            appState.sheetData.data[path] = input.checked;
        } else if (input.type === 'number') {
            appState.sheetData.data[path] = parseFloat(input.value) || 0;
        } else {
            appState.sheetData.data[path] = input.value;
        }
        
        debouncedCalculationUpdate();
    } catch (error) {
        console.error('Error updating data value:', error);
    }
}

// Throttled calculation updates for better performance
const debouncedCalculationUpdate = debounce(() => {
    updateCalculatedFields();
    triggerAutoSave();
}, 500);

// === AUTO-SAVE SYSTEM ===
let autoSaveInterval;
let hasUnsavedChanges = false;

function setupAutoSave() {
    // Auto-save every 2 minutes if there are changes
    autoSaveInterval = setInterval(() => {
        if (hasUnsavedChanges) {
            autoSave();
        }
    }, 120000);
    
    // Save on page unload
    window.addEventListener('beforeunload', (e) => {
        if (hasUnsavedChanges) {
            autoSave();
            e.preventDefault();
            e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        }
    });
}

function triggerAutoSave() {
    hasUnsavedChanges = true;
    updateStatus('Changes detected...');
}

function autoSave() {
    try {
        const autoSaveData = {
            ...appState.sheetData,
            canvas: appState.getElement('canvas')?.innerHTML || '',
            timestamp: new Date().toISOString(),
            fonts: DEFAULT_FONTS,
            labels: LABELS
        };
        
        localStorage.setItem('ttrpg_autosave', JSON.stringify(autoSaveData));
        hasUnsavedChanges = false;
        updateStatus('Auto-saved');
    } catch (error) {
        console.error('Auto-save error:', error);
    }
}

function loadAutoSave() {
    try {
        const autoSaveData = localStorage.getItem('ttrpg_autosave');
        if (autoSaveData && confirm('Found auto-saved data. Would you like to restore it?')) {
            const data = JSON.parse(autoSaveData);
            
            if (data.canvas) {
                const canvas = appState.getElement('canvas');
                if (canvas) {
                    canvas.innerHTML = data.canvas;
                }
            }
            
            if (data.data) {
                appState.sheetData.data = data.data;
            }
            
            if (data.styles) {
                appState.sheetData.styles = data.styles;
            }
            
            if (data.fonts) {
                DEFAULT_FONTS = data.fonts;
                applyFontSetting();
            }
            
            if (data.labels) {
                LABELS = data.labels;
            }
            
            appState.setupAllEventListeners();
            updateComponentCount();
            updateSheetTree();
            updateStatus('Auto-save restored');
        }
    } catch (error) {
        console.error('Error loading auto-save:', error);
    }
}

// === OPTIMIZED FONT MANAGEMENT ===
function applyFontSetting() {
    try {
        const style = document.getElementById('dynamic-fonts') || document.createElement('style');
        style.id = 'dynamic-fonts';
        style.textContent = `
            body, .sheet-item, .sheet-item input, .sheet-item select, .sheet-item textarea {
                font-family: ${DEFAULT_FONTS} !important;
            }
        `;
        if (!style.parentNode) {
            document.head.appendChild(style);
        }
    } catch (error) {
        console.error('Font setting error:', error);
    }
}

// === ENHANCED SETTINGS PANEL ===
function showSettingsPanel() {
    try {
        const modal = createSettingsModal();
        document.body.appendChild(modal);
        showModal('dynamic-settings-modal');
    } catch (error) {
        console.error('Error showing settings panel:', error);
    }
}

function createSettingsModal() {
    const modal = document.createElement('div');
    modal.id = 'dynamic-settings-modal';
    modal.className = 'modal';
    
    const labelRows = Object.entries(LABELS).map(([key, value]) => `
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #3e3e42;">${key}</td>
            <td style="padding: 8px; border-bottom: 1px solid #3e3e42;">
                <input type="text" data-label-key="${key}" value="${value}" 
                       style="width: 100%; background: #1e1e1e; border: 1px solid #3e3e42; 
                              color: #d4d4d4; padding: 4px; border-radius: 3px;">
            </td>
        </tr>
    `).join('');
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h3>Settings</h3>
                <button class="modal-close" onclick="closeModal('dynamic-settings-modal'); this.closest('.modal').remove();">×</button>
            </div>
            <div class="modal-body">
                <div class="settings-section">
                    <h4>Font Settings</h4>
                    <label>Font Family:</label>
                    <input type="text" id="dynamic-settings-fonts" value="${DEFAULT_FONTS}" 
                           style="width: 100%; background: #1e1e1e; border: 1px solid #3e3e42; 
                                  color: #d4d4d4; padding: 8px; border-radius: 3px; margin-top: 5px;">
                </div>
                
                <div class="settings-section" style="margin-top: 20px;">
                    <h4>Component Labels</h4>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #2d2d30;">
                                <th style="padding: 8px; text-align: left;">Component</th>
                                <th style="padding: 8px; text-align: left;">Label</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${labelRows}
                        </tbody>
                    </table>
                </div>
                
                <div class="settings-section" style="margin-top: 20px;">
                    <h4>Auto-Save Settings</h4>
                    <label>
                        <input type="checkbox" id="enable-autosave" ${autoSaveInterval ? 'checked' : ''}> 
                        Enable Auto-Save (every 2 minutes)
                    </label>
                    <br><br>
                    <button onclick="loadAutoSave()" style="background: #4fc3f7; color: white; border: none; padding: 8px 16px; border-radius: 3px; cursor: pointer;">
                        Load Auto-Save
                    </button>
                    <button onclick="clearAutoSave()" style="background: #f44336; color: white; border: none; padding: 8px 16px; border-radius: 3px; cursor: pointer; margin-left: 10px;">
                        Clear Auto-Save
                    </button>
                </div>
            </div>
            <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 10px; padding: 15px; border-top: 1px solid #3e3e42;">
                <button onclick="closeModal('dynamic-settings-modal'); this.closest('.modal').remove();" 
                        style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 3px; cursor: pointer;">
                    Cancel
                </button>
                <button onclick="saveDynamicSettings()" 
                        style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 3px; cursor: pointer;">
                    Save Settings
                </button>
            </div>
        </div>
    `;
    
    return modal;
}

function saveDynamicSettings() {
    try {
        appState.saveState('Settings Change');
        
        // Save font settings
        const fontsInput = document.getElementById('dynamic-settings-fonts');
        if (fontsInput) {
            DEFAULT_FONTS = fontsInput.value;
            applyFontSetting();
        }
        
        // Save label settings
        const oldLabels = {...LABELS};
        document.querySelectorAll('[data-label-key]').forEach(input => {
            LABELS[input.dataset.labelKey] = input.value;
        });
        
        // Handle auto-save setting
        const autoSaveCheckbox = document.getElementById('enable-autosave');
        if (autoSaveCheckbox) {
            if (autoSaveCheckbox.checked && !autoSaveInterval) {
                setupAutoSave();
            } else if (!autoSaveCheckbox.checked && autoSaveInterval) {
                clearInterval(autoSaveInterval);
                autoSaveInterval = null;
            }
        }
        
        // Ask if user wants to update existing components
        const hasExistingComponents = document.querySelectorAll('.sheet-item').length > 0;
        if (hasExistingComponents && JSON.stringify(oldLabels) !== JSON.stringify(LABELS)) {
            const updateExisting = confirm(
                'Label changes will apply to NEW components.\n\n' +
                'Would you also like to update existing components on the canvas?\n\n' +
                'Click OK to update existing components, or Cancel to only affect new components.'
            );
            
            if (updateExisting) {
                updateExistingComponentLabels(oldLabels, LABELS);
            }
        }
        
        closeModal('dynamic-settings-modal');
        document.getElementById('dynamic-settings-modal')?.remove();
        updateStatus('Settings saved successfully');
        triggerAutoSave();
    } catch (error) {
        console.error('Error saving settings:', error);
        updateStatus('Error saving settings');
    }
}

function clearAutoSave() {
    try {
        localStorage.removeItem('ttrpg_autosave');
        updateStatus('Auto-save data cleared');
    } catch (error) {
        console.error('Error clearing auto-save:', error);
    }
}

function updateExistingComponentLabels(oldLabels, newLabels) {
    try {
        let updatedCount = 0;
        
        document.querySelectorAll('.sheet-item').forEach(item => {
            const type = item.dataset.type;
            const oldLabel = oldLabels[type];
            const newLabel = newLabels[type];
            
            if (oldLabel && newLabel && oldLabel !== newLabel) {
                switch (type) {
                    case 'text-input':
                    case 'number-input':
                    case 'textarea':
                    case 'select':
                    case 'calculated':
                    case 'progress-bar':
                        const label = item.querySelector('label');
                        if (label && label.textContent === oldLabel) {
                            label.textContent = newLabel;
                            updatedCount++;
                        }
                        break;
                        
                    case 'checkbox':
                        const checkboxLabel = item.querySelector('label');
                        if (checkboxLabel && checkboxLabel.textContent.trim().endsWith(oldLabel)) {
                            const checkbox = item.querySelector('input[type="checkbox"]');
                            if (checkbox) {
                                checkboxLabel.innerHTML = checkbox.outerHTML + ' ' + newLabel;
                                updatedCount++;
                            }
                        }
                        break;
                        
                    case 'label':
                        const span = item.querySelector('span');
                        if (span && span.textContent === oldLabel) {
                            span.textContent = newLabel;
                            updatedCount++;
                        }
                        break;
                        
                    case 'dice-button':
                    case 'reference-button':
                    case 'info-button':
                        const button = item.querySelector('button');
                        if (button && button.textContent === oldLabel) {
                            button.textContent = newLabel;
                            const cleanText = newLabel.replace(/^[🎲📚ℹ️📖📋📊🎮⚙️🔧]\s*/, '').trim();
                            button.dataset.buttonText = cleanText;
                            updatedCount++;
                        }
                        break;
                }
            }
        });
        
        updateStatus(`Updated ${updatedCount} existing components`);
    } catch (error) {
        console.error('Error updating component labels:', error);
        updateStatus('Error updating components');
    }
}

// === OPTIMIZED DROPDOWN MENU SYSTEM ===
async function initializeMenus() {
    try {
        await createDropdownMenus();
    } catch (error) {
        console.error('Error initializing menus:', error);
    }
}

function createDropdownMenus() {
    const menuConfigs = [
        {
            name: 'File',
            id: 'file',
            items: [
                { text: 'New Sheet', shortcut: 'Ctrl+N', action: 'newSheet' },
                { text: 'Open Sheet...', shortcut: 'Ctrl+O', action: 'importSheet' },
                { separator: true },
                { text: 'Save Sheet', shortcut: 'Ctrl+S', action: 'exportSheet' },
                { text: 'Save As...', shortcut: 'Ctrl+Shift+S', action: 'exportSheetAs' },
                { separator: true },
                { text: 'Export Canvas Only', shortcut: '', action: 'exportCanvasOnly' },
                { text: 'Export for Print', shortcut: '', action: 'exportForPrint' },
                { separator: true },
                { text: 'Settings', shortcut: 'Ctrl+,', action: 'showSettingsPanel' }
            ]
        },
        {
            name: 'Edit',
            id: 'edit',
            items: [
                { text: 'Undo', shortcut: 'Ctrl+Z', action: 'undo', disabled: () => appState.undoStack.length === 0 },
                { text: 'Redo', shortcut: 'Ctrl+Y', action: 'redo', disabled: () => appState.redoStack.length === 0 },
                { separator: true },
                { text: 'Delete Selected', shortcut: 'Delete', action: 'deleteSelected' },
                { text: 'Clear Canvas', shortcut: 'Ctrl+Del', action: 'clearCanvas' },
                { separator: true },
                { text: 'Edit Data...', shortcut: 'Ctrl+D', action: 'showDataEditor' }
            ]
        },
        {
            name: 'View',
            id: 'view',
            items: [
                { text: 'Preview Sheet', shortcut: 'Ctrl+P', action: 'previewSheet' },
                { text: 'Toggle Sidebar', shortcut: 'Ctrl+B', action: 'toggleSidebar' },
                { separator: true },
                { text: 'Custom CSS...', shortcut: '', action: 'showGlobalCSS' },
                { text: 'Component Tree', shortcut: '', action: () => switchPanel('explorer') },
                { separator: true },
                { text: 'Zoom In', shortcut: 'Ctrl++', action: 'zoomIn' },
                { text: 'Zoom Out', shortcut: 'Ctrl+-', action: 'zoomOut' },
                { text: 'Reset Zoom', shortcut: 'Ctrl+0', action: 'resetZoom' }
            ]
        },
        {
            name: 'Help',
            id: 'help',
            items: [
                { text: 'Getting Started', shortcut: '', action: 'showGettingStarted' },
                { text: 'Calculation Rules', shortcut: '', action: 'showCalculationHelp' },
                { text: 'Component Guide', shortcut: '', action: 'showComponentGuide' },
                { text: 'Keyboard Shortcuts', shortcut: '', action: 'showKeyboardShortcuts' },
                { separator: true },
                { text: 'About', shortcut: '', action: 'showAbout' }
            ]
        }
    ];

    menuConfigs.forEach(config => {
        createAndAttachMenu(config.name, config.id, config.items);
    });
}

function createAndAttachMenu(menuText, menuType, items) {
    try {
        const menuItem = Array.from(document.querySelectorAll('.menu-item'))
            .find(item => item.textContent.trim() === menuText);
        
        if (!menuItem) {
            console.warn(`Menu item not found: ${menuText}`);
            return;
        }
        
        menuItem.style.position = 'relative';
        menuItem.style.cursor = 'pointer';
        
        const menu = createDropdownMenu(menuType, items);
        menuItem.appendChild(menu);
        
        menuItem.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleDropdown(menu);
        });
    } catch (error) {
        console.error(`Error creating menu ${menuText}:`, error);
    }
}

function toggleDropdown(targetMenu) {
    // Close other dropdowns
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        if (menu !== targetMenu) {
            menu.style.display = 'none';
        }
    });
    
    // Toggle target dropdown
    if (targetMenu.style.display === 'block') {
        targetMenu.style.display = 'none';
        currentDropdownMenu = null;
    } else {
        targetMenu.style.display = 'block';
        currentDropdownMenu = targetMenu;
    }
}

function createDropdownMenu(menuType, items) {
    const menu = document.createElement('div');
    menu.className = 'dropdown-menu';
    menu.id = `${menuType}-dropdown`;
    
    menu.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        background: #2d2d30;
        border: 1px solid #3e3e42;
        border-radius: 4px;
        min-width: 200px;
        display: none;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        max-height: 400px;
        overflow-y: auto;
    `;
    
    items.forEach((item, index) => {
        if (item.separator) {
            const separator = document.createElement('div');
            separator.style.cssText = 'height: 1px; background: #3e3e42; margin: 4px 0;';
            menu.appendChild(separator);
        } else {
            const menuItem = createMenuItem(item, menu);
            menu.appendChild(menuItem);
        }
    });
    
    return menu;
}

function createMenuItem(item, parentMenu) {
    const menuItem = document.createElement('div');
    menuItem.className = 'dropdown-item';
    menuItem.dataset.action = item.action;
    
    const isDisabled = typeof item.disabled === 'function' ? item.disabled() : item.disabled;
    
    menuItem.innerHTML = `
        <span style="flex: 1;">${item.text}</span>
        <span style="color: #858585; font-size: 11px; margin-left: 20px;">${item.shortcut || ''}</span>
    `;
    
    menuItem.style.cssText = `
        padding: 8px 12px;
        cursor: ${isDisabled ? 'not-allowed' : 'pointer'};
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: ${isDisabled ? '#858585' : '#d4d4d4'};
        opacity: ${isDisabled ? '0.5' : '1'};
        transition: background-color 0.2s;
    `;
    
    if (!isDisabled) {
        menuItem.addEventListener('click', (e) => {
            e.stopPropagation();
            closeDropdown();
            executeMenuAction(item.action);
        });
        
        menuItem.addEventListener('mouseenter', () => {
            menuItem.style.background = '#3e3e42';
        });
        
        menuItem.addEventListener('mouseleave', () => {
            menuItem.style.background = '';
        });
    }
    
    return menuItem;
}

function executeMenuAction(action) {
    try {
        if (typeof action === 'string') {
            if (window[action] && typeof window[action] === 'function') {
                window[action]();
            } else {
                console.error(`Function not found: ${action}`);
            }
        } else if (typeof action === 'function') {
            action();
        }
    } catch (error) {
        console.error('Error executing menu action:', error);
        updateStatus('Error executing menu action');
    }
}

function closeDropdown() {
    if (currentDropdownMenu) {
        currentDropdownMenu.style.display = 'none';
        currentDropdownMenu = null;
    }
    
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.style.display = 'none';
    });
}

// === ZOOM FUNCTIONALITY ===
let currentZoom = 1;

function zoomIn() {
    currentZoom = Math.min(currentZoom + 0.1, 2);
    applyZoom();
}

function zoomOut() {
    currentZoom = Math.max(currentZoom - 0.1, 0.5);
    applyZoom();
}

function resetZoom() {
    currentZoom = 1;
    applyZoom();
}

function applyZoom() {
    const canvas = appState.getElement('canvas');
    if (canvas) {
        canvas.style.transform = `scale(${currentZoom})`;
        canvas.style.transformOrigin = 'top left';
        updateStatus(`Zoom: ${Math.round(currentZoom * 100)}%`);
    }
}

// === ENHANCED HELP SYSTEM ===
const helpContent = {
    'getting-started': {
        title: '🚀 Getting Started',
        content: `
            <h4>Welcome to TTRPG Character Sheet Builder!</h4>
            <p>This tool helps you create custom character sheets for tabletop RPGs.</p>
            
            <h5>Quick Start:</h5>
            <ol>
                <li><strong>Add Components:</strong> Click the 🧩 Components tab and drag elements to the canvas</li>
                <li><strong>Layout:</strong> Use Row and Column containers to organize your sheet</li>
                <li><strong>Configure:</strong> Select components to edit their properties in the ⚙️ Properties panel</li>
                <li><strong>Calculate:</strong> Use calculated fields for automatic stat calculations</li>
                <li><strong>Export:</strong> Save your sheet using File → Export Canvas Only</li>
            </ol>
            
            <h5>Tips:</h5>
            <ul>
                <li>Drag components from sidebar to canvas or containers</li>
                <li>Hover over components to see edit/delete controls</li>
                <li>Use File → Settings to customize labels and fonts</li>
                <li>Preview your sheet anytime with View → Preview Sheet</li>
                <li>Auto-save keeps your work safe automatically</li>
            </ul>
        `
    },
    'calculation-rules': {
        title: '🧮 Calculation Rules',
        content: `
            <h4>Calculated Field Rules</h4>
            <p>Calculated fields automatically compute values based on other fields in your sheet.</p>
            
            <h5>Basic Syntax:</h5>
            <ul>
                <li><strong>[fieldName]</strong> - Reference another field's value</li>
                <li><strong>Multiple rules</strong> - Separate with semicolons (;)</li>
            </ul>
            
            <h5>Functions:</h5>
            <ul>
                <li><strong>sum([field1],[field2],...))</strong> - Add multiple fields</li>
                <li><strong>max([field1],[field2],...))</strong> - Get maximum value</li>
                <li><strong>min([field1],[field2],...))</strong> - Get minimum value</li>
                <li><strong>avg([field1],[field2],...))</strong> - Calculate average</li>
                <li><strong>count([field1],[field2],...))</strong> - Count non-zero values</li>
            </ul>
            
            <h5>Math Operations:</h5>
            <ul>
                <li><strong>[strength] + [dexterity]</strong> - Addition</li>
                <li><strong>[level] * 2</strong> - Multiplication</li>
                <li><strong>([strength] - 10) / 2</strong> - Complex expressions</li>
                <li><strong>floor([dexterity] / 2)</strong> - Floor division</li>
                <li><strong>ceil([constitution] / 3)</strong> - Ceiling division</li>
            </ul>
            
            <h5>Conditional Logic:</h5>
            <ul>
                <li><strong>if([level] > 5, [level] * 2, [level])</strong> - If-then-else</li>
                <li><strong>max(0, [strength] - 10)</strong> - Ensure minimum value</li>
            </ul>
            
            <h5>Examples:</h5>
            <pre style="background: #1e1e1e; padding: 10px; border-radius: 4px; margin: 10px 0;">
// Add strength and constitution bonuses
sum([strength],[constitution])

// Calculate ability modifier
floor(([strength] - 10) / 2)

// Hit points calculation with level scaling
[level] * 8 + [constitution] + if([level] > 10, 20, 0)

// Multi-rule calculation
[level] + [bonus]; max([strength],[dexterity])

// Conditional armor class
10 + [dexterity] + if([armor], [armor], 0)
            </pre>
            
            <p><strong>Note:</strong> Field names are case-sensitive and should match the JSON Path of your inputs.</p>
        `
    },
    'component-guide': {
        title: '🧩 Component Guide',
        content: `
            <h4>Available Components</h4>
            
            <h5>📋 Layout Components:</h5>
            <ul>
                <li><strong>Row Container:</strong> Arranges items horizontally with flexible spacing</li>
                <li><strong>Column Container:</strong> Stacks items vertically with consistent alignment</li>
            </ul>
            
            <h5>📝 Form Elements:</h5>
            <ul>
                <li><strong>Text Input:</strong> Single-line text field with validation</li>
                <li><strong>Number Input:</strong> Numeric input with min/max validation</li>
                <li><strong>Text Area:</strong> Multi-line text field with resizable height</li>
                <li><strong>Dropdown:</strong> Selection from predefined options with custom values</li>
                <li><strong>Checkbox:</strong> True/false toggle with custom labels</li>
            </ul>
            
            <h5>🏷️ Display Components:</h5>
            <ul>
                <li><strong>Label:</strong> Static text display with rich formatting</li>
                <li><strong>Calculated Field:</strong> Auto-computed values with real-time updates</li>
                <li><strong>Progress Bar:</strong> Visual progress indicator with customizable colors</li>
            </ul>
            
            <h5>🎲 Interactive Components:</h5>
            <ul>
                <li><strong>Dice Roll Button:</strong> Roll dice with custom formulas including field references</li>
                <li><strong>Reference List Button:</strong> Show spells, skills, or equipment with detailed descriptions</li>
                <li><strong>Info Box Button:</strong> Display helpful information and tooltips</li>
            </ul>
            
            <h5>Configuration Tips:</h5>
            <ul>
                <li>Select any component to edit its properties in real-time</li>
                <li>Set JSON Path to link inputs to your data model</li>
                <li>Use Events to trigger actions on input changes</li>
                <li>Customize labels in File → Settings for consistency</li>
                <li>Use containers to create responsive layouts</li>
                <li>Test calculations frequently with the preview feature</li>
            </ul>
            
            <h5>Advanced Features:</h5>
            <ul>
                <li><strong>Field References:</strong> Link calculated fields to form inputs</li>
                <li><strong>Dynamic Updates:</strong> Changes propagate automatically</li>
                <li><strong>Custom Styling:</strong> Apply CSS for unique appearances</li>
                <li><strong>Print Optimization:</strong> Export versions optimized for printing</li>
            </ul>
        `
    },
    'keyboard-shortcuts': {
        title: '⌨️ Keyboard Shortcuts',
        content: `
            <h4>Keyboard Shortcuts</h4>
            
            <h5>File Operations:</h5>
            <ul>
                <li><strong>Ctrl+N</strong> - New Sheet</li>
                <li><strong>Ctrl+O</strong> - Open Sheet</li>
                <li><strong>Ctrl+S</strong> - Save Sheet</li>
                <li><strong>Ctrl+Shift+S</strong> - Save As</li>
                <li><strong>Ctrl+,</strong> - Settings</li>
            </ul>
            
            <h5>Editing:</h5>
            <ul>
                <li><strong>Ctrl+Z</strong> - Undo (with full state restoration)</li>
                <li><strong>Ctrl+Y</strong> - Redo</li>
                <li><strong>Delete</strong> - Delete selected component</li>
                <li><strong>Ctrl+Del</strong> - Clear entire canvas</li>
                <li><strong>Ctrl+D</strong> - Edit data JSON</li>
                <li><strong>Escape</strong> - Deselect current component</li>
            </ul>
            
            <h5>View:</h5>
            <ul>
                <li><strong>Ctrl+P</strong> - Preview sheet</li>
                <li><strong>Ctrl+B</strong> - Toggle sidebar</li>
                <li><strong>Ctrl++</strong> - Zoom in</li>
                <li><strong>Ctrl+-</strong> - Zoom out</li>
                <li><strong>Ctrl+0</strong> - Reset zoom</li>
            </ul>
            
            <h5>Navigation:</h5>
            <ul>
                <li><strong>Tab</strong> - Navigate between form elements</li>
                <li><strong>Shift+Tab</strong> - Navigate backwards</li>
                <li><strong>Arrow Keys</strong> - Navigate component tree</li>
                <li><strong>Enter</strong> - Activate selected item</li>
            </ul>
            
            <h5>Component Shortcuts:</h5>
            <ul>
                <li>Click component to select and view properties</li>
                <li>Hover over components to see edit controls</li>
                <li>Use Explorer panel to navigate complex sheets</li>
                <li>Right-click for context menu (coming soon)</li>
            </ul>
            
            <h5>Pro Tips:</h5>
            <ul>
                <li>Hold Shift while dragging to snap to grid</li>
                <li>Double-click components for quick editing</li>
                <li>Use Ctrl+A to select all components</li>
                <li>F11 for fullscreen mode</li>
            </ul>
        `
    },
    'about': {
        title: 'ℹ️ About',
        content: `
            <h4>TTRPG Character Sheet Builder</h4>
            <p>Version 2.1 - Professional Edition</p>
            
            <p>A powerful, visual tool for creating custom character sheets for tabletop role-playing games. 
            Build interactive sheets with calculated fields, dice rollers, and reference systems.</p>
            
            <h5>New in Version 2.1:</h5>
            <ul>
                <li>Enhanced performance with optimized DOM operations</li>
                <li>Full undo/redo system with state management</li>
                <li>Auto-save functionality with crash recovery</li>
                <li>Improved calculation engine with new functions</li>
                <li>Zoom controls for better sheet editing</li>
                <li>Advanced keyboard shortcuts</li>
                <li>Memory optimization and cleanup</li>
            </ul>
            
            <h5>Core Features:</h5>
            <ul>
                <li>Drag-and-drop interface with snap-to-grid</li>
                <li>Real-time calculated fields with advanced math</li>
                <li>Integrated dice rolling system with field references</li>
                <li>Reference management (spells, skills, equipment)</li>
                <li>Custom CSS styling with live preview</li>
                <li>JSON-based data management</li>
                <li>Export for print or web use</li>
                <li>Responsive design for mobile devices</li>
            </ul>
            
            <h5>Supported Game Systems:</h5>
            <p>Perfect for D&D 5e, Pathfinder, World of Darkness, FATE, and other tabletop RPG systems.</p>
            
            <h5>Technical Information:</h5>
            <ul>
                <li>Built with modern JavaScript (ES2020+)</li>
                <li>Optimized for performance and memory usage</li>
                <li>Cross-browser compatible</li>
                <li>No external dependencies required</li>
                <li>Local storage for data persistence</li>
            </ul>
            
            <p style="margin-top: 20px; padding: 10px; background: #1e1e1e; border-radius: 4px; border-left: 3px solid #4fc3f7;">
                <small>This tool is designed by tabletop gamers, for tabletop gamers. 
                Feedback and suggestions are always welcome!</small>
            </p>
        `
    }
};

function showGettingStarted() { showHelpModal('getting-started'); }
function showCalculationHelp() { showHelpModal('calculation-rules'); }
function showComponentGuide() { showHelpModal('component-guide'); }
function showKeyboardShortcuts() { showHelpModal('keyboard-shortcuts'); }
function showAbout() { showHelpModal('about'); }

function showHelpModal(contentKey) {
    try {
        const helpData = helpContent[contentKey];
        if (!helpData) {
            console.error(`Help content not found: ${contentKey}`);
            return;
        }
        
        let helpModal = document.getElementById('help-modal');
        if (!helpModal) {
            helpModal = document.createElement('div');
            helpModal.id = 'help-modal';
            helpModal.className = 'modal';
            helpModal.innerHTML = `
                <div class="modal-content" style="max-width: 800px; max-height: 80vh; overflow-y: auto;">
                    <div class="modal-header">
                        <h3 id="help-title"></h3>
                        <button class="modal-close" onclick="closeModal('help-modal')">×</button>
                    </div>
                    <div id="help-content" style="line-height: 1.6; padding: 20px;"></div>
                </div>
            `;
            document.body.appendChild(helpModal);
        }
        
        document.getElementById('help-title').innerHTML = helpData.title;
        document.getElementById('help-content').innerHTML = helpData.content;
        showModal('help-modal');
    } catch (error) {
        console.error('Error showing help modal:', error);
    }
}

// === ENHANCED EXPORT FUNCTIONS ===
function exportSheet() { exportCanvasOnly(); }

function exportSheetAs() {
    const filename = prompt('Enter filename (without extension):');
    if (filename) {
        exportCanvasOnly(filename);
    }
}

function exportCanvasOnly(customFilename = null) {
    try {
        appState.saveState('Export');
        
        const canvas = appState.getElement('canvas');
        if (!canvas) {
            updateStatus('Canvas not found');
            return;
        }
        
        const canvasData = {
            version: '2.1',
            html: canvas.innerHTML,
            styles: appState.sheetData.styles || '',
            data: appState.sheetData.data || {},
            references: appState.sheetData.references || {},
            fonts: DEFAULT_FONTS,
            labels: LABELS,
            componentCounter: appState.componentCounter,
            timestamp: new Date().toISOString(),
            metadata: {
                components: document.querySelectorAll('.sheet-item').length,
                calculatedFields: document.querySelectorAll('.calculated-value').length,
                creator: 'TTRPG Character Sheet Builder v2.1'
            }
        };
        
        downloadJSON(canvasData, (customFilename || 'character-sheet') + '.json');
        updateStatus('Canvas exported successfully');
    } catch (error) {
        console.error('Export error:', error);
        updateStatus('Error exporting canvas');
    }
}

function exportForPrint() {
    try {
        const canvas = appState.getElement('canvas');
        if (!canvas) {
            updateStatus('Canvas not found');
            return;
        }
        
        const clone = canvas.cloneNode(true);
        
        // Remove edit controls and optimize for print
        clone.querySelectorAll('.item-controls, .canvas-placeholder').forEach(el => el.remove());
        
        // Optimize colors and styling for print
        const printStyles = `
            ${appState.sheetData.styles || ''}
            @media print {
                body { font-family: ${DEFAULT_FONTS}; }
                .sheet-item { 
                    background: white !important; 
                    color: black !important; 
                    border-color: #333 !important; 
                    page-break-inside: avoid;
                }
                .sheet-item input, .sheet-item select, .sheet-item textarea { 
                    background: white !important; 
                    color: black !important; 
                    border-color: #333 !important; 
                }
                .calculated-value {
                    color: #000 !important;
                    background: #f0f0f0 !important;
                }
                button {
                    border: 1px solid #333 !important;
                    background: #f9f9f9 !important;
                    color: #333 !important;
                }
            }
        `;
        
        const printData = {
            version: '2.1-print',
            html: clone.innerHTML,
            styles: printStyles,
            fonts: DEFAULT_FONTS,
            timestamp: new Date().toISOString(),
            printOptimized: true
        };
        
        downloadJSON(printData, 'character-sheet-print.json');
        updateStatus('Print version exported');
    } catch (error) {
        console.error('Print export error:', error);
        updateStatus('Error exporting print version');
    }
}

function downloadJSON(data, filename) {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// === ENHANCED SHEET MANAGEMENT ===
function newSheet() {
    if (confirm('Create new sheet? This will clear current work.')) {
        appState.saveState('New Sheet');
        clearCanvas();
        appState.componentCounter = 0;
        appState.sheetData.data = {
            strength: 15,
            dexterity: 12,
            constitution: 14,
            level: 3,
            bonus: 2
        };
        appState.clearDOMCache();
        updateStatus('New sheet created');
        triggerAutoSave();
    }
}

function deleteSelected() {
    if (appState.selectedItem) {
        deleteItem(appState.selectedItem);
    } else {
        updateStatus('No component selected');
    }
}

function toggleSidebar() {
    try {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.toggle('collapsed');
            updateStatus(sidebar.classList.contains('collapsed') ? 'Sidebar hidden' : 'Sidebar shown');
        }
    } catch (error) {
        console.error('Error toggling sidebar:', error);
    }
}

// === ENHANCED PANEL MANAGEMENT ===
function switchPanel(panelName) {
    try {
        // Remove active class from all icons
        document.querySelectorAll('.activity-icon').forEach(icon => icon.classList.remove('active'));
        
        // Add active class to selected panel
        const targetIcon = document.querySelector(`[data-panel="${panelName}"]`);
        if (targetIcon) {
            targetIcon.classList.add('active');
        }
        
        // Hide all panels
        document.querySelectorAll('.panel-content').forEach(panel => panel.style.display = 'none');
        
        // Show selected panel
        const targetPanel = document.getElementById(panelName + '-panel');
        if (targetPanel) {
            targetPanel.style.display = 'block';
        }
        
        // Update sidebar title
        const titles = {
            'explorer': 'EXPLORER',
            'components': 'COMPONENTS', 
            'properties': 'PROPERTIES',
            'data': 'DATA'
        };
        
        const sidebarTitle = document.getElementById('sidebar-title');
        if (sidebarTitle) {
            sidebarTitle.textContent = titles[panelName] || panelName.toUpperCase();
        }
        
        appState.currentPanel = panelName;
        currentPanel = panelName; // Keep global sync
        
        // Trigger panel-specific updates
        if (panelName === 'properties' && appState.selectedItem) {
            showItemProperties(appState.selectedItem);
        }
        
    } catch (error) {
        console.error('Error switching panel:', error);
    }
}

// === ENHANCED CANVAS MANAGEMENT ===
function clearCanvas() {
    try {
        if (document.querySelectorAll('.sheet-item').length > 0) {
            appState.saveState('Clear Canvas');
        }
        
        const canvas = appState.getElement('canvas');
        if (canvas) {
            canvas.innerHTML = `
                <div class="canvas-placeholder" style="text-align: center; padding: 50px; color: #858585;">
                    <div style="font-size: 48px; margin-bottom: 20px;">📋</div>
                    <h3>Start Building Your Character Sheet</h3>
                    <p>Drag components from the sidebar to begin</p>
                    <small>Tip: Use containers to organize your layout</small>
                </div>
            `;
        }
        
        appState.selectedItem = null;
        selectedItem = null; // Keep global sync
        clearPropertiesPanel();
        updateComponentCount();
        updateSheetTree();
        updateStatus('Canvas cleared');
        triggerAutoSave();
    } catch (error) {
        console.error('Error clearing canvas:', error);
        updateStatus('Error clearing canvas');
    }
}

// === ENHANCED CALCULATION SYSTEM ===
function updateCalculatedFields() {
    try {
        const calculatedElements = document.querySelectorAll('.calculated-value[data-rules]');
        let updatedCount = 0;
        
        calculatedElements.forEach(element => {
            const rules = element.dataset.rules;
            if (rules && rules.trim()) {
                try {
                    const result = evaluateCalculationRules(rules);
                    if (element.textContent !== String(result)) {
                        element.textContent = result;
                        updatedCount++;
                        
                        // Add visual feedback for updates
                        element.style.backgroundColor = '#4fc3f7';
                        setTimeout(() => {
                            element.style.backgroundColor = '#1e1e1e';
                        }, 200);
                    }
                } catch (error) {
                    element.textContent = 'Error';
                    element.title = error.message; // Show error on hover
                    console.error('Calculation error:', error);
                }
            }
        });
        
        if (updatedCount > 0) {
            updateStatus(`Updated ${updatedCount} calculated fields`);
        }
    } catch (error) {
        console.error('Error updating calculated fields:', error);
    }
}

function evaluateCalculationRules(rules) {
    try {
        const expressions = rules.split(';').filter(rule => rule.trim());
        let result = 0;

        expressions.forEach((expression, index) => {
            const trimmed = expression.trim();
            
            // Enhanced function support
            if (trimmed.includes('sum(')) {
                result = evaluateFunction('sum', trimmed);
            } else if (trimmed.includes('max(')) {
                result = evaluateFunction('max', trimmed);
            } else if (trimmed.includes('min(')) {
                result = evaluateFunction('min', trimmed);
            } else if (trimmed.includes('avg(')) {
                result = evaluateFunction('avg', trimmed);
            } else if (trimmed.includes('count(')) {
                result = evaluateFunction('count', trimmed);
            } else if (trimmed.includes('floor(')) {
                result = evaluateFunction('floor', trimmed);
            } else if (trimmed.includes('ceil(')) {
                result = evaluateFunction('ceil', trimmed);
            } else if (trimmed.includes('if(')) {
                result = evaluateConditional(trimmed);
            } else if (trimmed.includes('+') || trimmed.includes('-') || trimmed.includes('*') || trimmed.includes('/')) {
                result = evaluateExpression(trimmed);
            } else if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                const fieldName = trimmed.slice(1, -1);
                result = parseFloat(getFieldValue(fieldName)) || 0;
            } else {
                result = parseFloat(trimmed) || 0;
            }
        });

        return Math.round(result * 100) / 100; // Round to 2 decimal places
    } catch (error) {
        console.error('Evaluation error:', error);
        throw new Error(`Calculation error: ${error.message}`);
    }
}

function evaluateFunction(funcName, expression) {
    const match = expression.match(new RegExp(`${funcName}\\(([^)]+)\\)`));
    if (!match) throw new Error(`Invalid ${funcName} function syntax`);
    
    const fields = match[1].split(',').map(f => f.trim());
    const values = fields.map(field => parseFloat(getFieldValue(field)) || 0);
    
    switch (funcName) {
        case 'sum':
            return values.reduce((acc, val) => acc + val, 0);
        case 'max':
            return Math.max(...values);
        case 'min':
            return Math.min(...values);
        case 'avg':
            return values.reduce((acc, val) => acc + val, 0) / values.length;
        case 'count':
            return values.filter(val => val !== 0).length;
        case 'floor':
            return Math.floor(values[0]);
        case 'ceil':
            return Math.ceil(values[0]);
        default:
            throw new Error(`Unknown function: ${funcName}`);
    }
}

function evaluateConditional(expression) {
    const match = expression.match(/if\s*\(\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/);
    if (!match) throw new Error('Invalid if function syntax');
    
    const [, condition, trueValue, falseValue] = match;
    
    // Evaluate condition
    const conditionResult = evaluateExpression(condition);
    
    // Return appropriate value
    if (conditionResult) {
        return isNaN(parseFloat(trueValue)) ? evaluateExpression(trueValue) : parseFloat(trueValue);
    } else {
        return isNaN(parseFloat(falseValue)) ? evaluateExpression(falseValue) : parseFloat(falseValue);
    }
}

function evaluateExpression(expr) {
    try {
        let expression = expr.trim();
        
        // Replace field references
        const fieldMatches = expression.match(/\[([^\]]+)\]/g);
        if (fieldMatches) {
            fieldMatches.forEach(match => {
                const fieldName = match.slice(1, -1);
                const value = getFieldValue(fieldName) || 0;
                expression = expression.replace(match, value);
            });
        }
        
        // Clean and evaluate expression
        const cleanExpr = expression.replace(/[^0-9+\-*/().\s]/g, '');
        return Function('"use strict"; return (' + cleanExpr + ')')();
    } catch (error) {
        console.error('Expression evaluation error:', error);
        throw new Error(`Invalid expression: ${expr}`);
    }
}

function getFieldValue(fieldName) {
    try {
        // First check app state data
        if (appState.sheetData.data[fieldName] !== undefined) {
            return appState.sheetData.data[fieldName];
        }
        
        // Then check DOM elements
        const element = document.querySelector(`[data-json-path="${fieldName}"]`);
        if (element) {
            if (element.type === 'checkbox') {
                return element.checked ? 1 : 0;
            } else if (element.type === 'number') {
                return parseFloat(element.value) || 0;
            } else {
                return element.value || 0;
            }
        }
        
        return 0;
    } catch (error) {
        console.error('Error getting field value:', error);
        return 0;
    }
}

// === OPTIMIZED DRAG & DROP SYSTEM ===
async function initializeDragAndDrop() {
    try {
        const componentItems = document.querySelectorAll('.component-item[draggable="true"]');
        const canvas = appState.getElement('canvas');

        if (!canvas) {
            console.error('Canvas element not found');
            return;
        }

        componentItems.forEach(item => {
            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragend', handleDragEnd);
        });

        canvas.addEventListener('dragover', handleCanvasDragOver);
        canvas.addEventListener('dragleave', handleCanvasDragLeave);
        canvas.addEventListener('drop', handleCanvasDrop);
        
    } catch (error) {
        console.error('Error setting up drag and drop:', error);
    }
}

function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', this.dataset.type);
    this.style.opacity = '0.5';
    this.classList.add('dragging');
}

function handleDragEnd(e) {
    this.style.opacity = '';
    this.classList.remove('dragging');
}

function handleCanvasDragOver(e) {
    e.preventDefault();
    this.classList.add('drag-over');
}

function handleCanvasDragLeave(e) {
    if (!this.contains(e.relatedTarget)) {
        this.classList.remove('drag-over');
    }
}

function handleCanvasDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    
    const componentType = e.dataTransfer.getData('text/plain');
    const container = findDropTarget(e.target) || this;

    if (componentType) {
        appState.saveState('Add Component');
        createComponent(componentType, container);
        updateComponentCount();
        updateSheetTree();
        updateStatus(`${componentType} component added`);
        triggerAutoSave();
    }
}

function setupDragAndDrop() {
    // This function is kept for backward compatibility
    // The actual implementation is now in initializeDragAndDrop
    return initializeDragAndDrop();
}

function findDropTarget(element) {
    while (element && element !== appState.getElement('canvas')) {
        if (element.classList.contains('row') || element.classList.contains('column') || element.id === 'canvas') {
            return element;
        }
        element = element.parentElement;
    }
    return null;
}

// === ENHANCED COMPONENT CREATION ===
function createComponent(type, container) {
    try {
        const id = 'item_' + (++appState.componentCounter);
        componentCounter = appState.componentCounter; // Keep global sync
        
        const placeholder = container.querySelector('.canvas-placeholder, .container-placeholder');
        if (placeholder) placeholder.remove();
        
        const label = LABELS[type] || type;
        const componentHTML = generateComponentHTML(type, id, label);
        
        if (componentHTML) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = componentHTML;
            const newElement = tempDiv.firstElementChild;
            
            // Add smooth animation for new components
            newElement.style.opacity = '0';
            newElement.style.transform = 'scale(0.8)';
            container.appendChild(newElement);
            
            // Animate in
            requestAnimationFrame(() => {
                newElement.style.transition = 'all 0.3s ease';
                newElement.style.opacity = '1';
                newElement.style.transform = 'scale(1)';
            });
            
            // Setup event listeners
            if (type === 'row' || type === 'column') {
                setupContainerDragDrop(newElement);
            }
            setupInputListeners(newElement);
            
            // Auto-select new component
            setTimeout(() => selectItem(newElement), 100);
        }
    } catch (error) {
        console.error('Error creating component:', error);
        updateStatus('Error creating component');
    }
}

function generateComponentHTML(type, id, label) {
    const componentTemplates = {
        'row': `<div class="row sheet-item" data-type="row" data-id="${id}">
            <div class="item-controls">
                <button class="control-btn" title="Edit">⚙</button>
                <button class="control-btn delete" title="Delete">×</button>
            </div>
            <div class="container-placeholder" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #858585; pointer-events: none; font-size: 12px;">
                Row Container - Drop items here
            </div>
        </div>`,
        
        'column': `<div class="column sheet-item" data-type="column" data-id="${id}">
            <div class="item-controls">
                <button class="control-btn" title="Edit">⚙</button>
                <button class="control-btn delete" title="Delete">×</button>
            </div>
            <div class="container-placeholder" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #858585; pointer-events: none; font-size: 12px;">
                Column Container - Drop items here
            </div>
        </div>`,
        
        'text-input': `<div class="sheet-item" data-type="text-input" data-id="${id}">
            <div class="item-controls">
                <button class="control-btn" title="Edit">⚙</button>
                <button class="control-btn delete" title="Delete">×</button>
            </div>
            <label>${label}</label>
            <input type="text" placeholder="Enter text..." data-json-path="textInput_${id}" data-events="">
        </div>`,
        
        'number-input': `<div class="sheet-item" data-type="number-input" data-id="${id}">
            <div class="item-controls">
                <button class="control-btn" title="Edit">⚙</button>
                <button class="control-btn delete" title="Delete">×</button>
            </div>
            <label>${label}</label>
            <input type="number" placeholder="0" data-json-path="numberInput_${id}" data-events="">
        </div>`,
        
        'textarea': `<div class="sheet-item" data-type="textarea" data-id="${id}">
            <div class="item-controls">
                <button class="control-btn" title="Edit">⚙</button>
                <button class="control-btn delete" title="Delete">×</button>
            </div>
            <label>${label}</label>
            <textarea rows="3" placeholder="Enter multi-line text..." data-json-path="textarea_${id}" data-events=""></textarea>
        </div>`,
        
        'select': `<div class="sheet-item" data-type="select" data-id="${id}">
            <div class="item-controls">
                <button class="control-btn" title="Edit">⚙</button>
                <button class="control-btn delete" title="Delete">×</button>
            </div>
            <label>${label}</label>
            <select data-json-path="select_${id}" data-events="">
                <option value="">Select option...</option>
                <option value="option1">Option 1</option>
                <option value="option2">Option 2</option>
            </select>
        </div>`,
        
        'checkbox': `<div class="sheet-item" data-type="checkbox" data-id="${id}">
            <div class="item-controls">
                <button class="control-btn" title="Edit">⚙</button>
                <button class="control-btn delete" title="Delete">×</button>
            </div>
            <label><input type="checkbox" data-json-path="checkbox_${id}" data-events=""> ${label}</label>
        </div>`,
        
        'label': `<div class="sheet-item" data-type="label" data-id="${id}">
            <div class="item-controls">
                <button class="control-btn" title="Edit">⚙</button>
                <button class="control-btn delete" title="Delete">×</button>
            </div>
            <span data-json-path="label_${id}">${label}</span>
        </div>`,
        
        'calculated': `<div class="sheet-item" data-type="calculated" data-id="${id}">
            <div class="item-controls">
                <button class="control-btn" title="Edit">⚙</button>
                <button class="control-btn delete" title="Delete">×</button>
            </div>
            <label>${label}</label>
            <span class="calculated-value" data-calculation="0" data-rules="" 
                  style="font-weight: bold; color: #4fc3f7; display: block; padding: 6px; 
                         background: #1e1e1e; border: 1px solid #3e3e42; border-radius: 4px; 
                         transition: background-color 0.2s;">0</span>
        </div>`,
        
        'progress-bar': `<div class="sheet-item" data-type="progress-bar" data-id="${id}">
            <div class="item-controls">
                <button class="control-btn" title="Edit">⚙</button>
                <button class="control-btn delete" title="Delete">×</button>
            </div>
            <label>${label}</label>
            <div style="width: 100%; background: #1e1e1e; border: 1px solid #3e3e42; border-radius: 4px; height: 20px; overflow: hidden; margin-top: 5px;">
                <div style="height: 100%; background: linear-gradient(90deg, #4fc3f7, #29b6f6); width: 50%; transition: width 0.3s;" data-json-path="progress_${id}"></div>
            </div>
        </div>`,
        
        'dice-button': `<div class="sheet-item" data-type="dice-button" data-id="${id}">
            <div class="item-controls">
                <button class="control-btn" title="Edit">⚙</button>
                <button class="control-btn delete" title="Delete">×</button>
            </div>
            <button class="btn" onclick="rollDice('1d20', this)" data-dice="1d20" data-button-text="Roll 1d20">${label}</button>
        </div>`,
        
        'reference-button': `<div class="sheet-item" data-type="reference-button" data-id="${id}">
            <div class="item-controls">
                <button class="control-btn" title="Edit">⚙</button>
                <button class="control-btn delete" title="Delete">×</button>
            </div>
            <button class="btn" onclick="showReferenceList('spells', this)" data-reference="spells" data-button-text="View Spells">${label}</button>
        </div>`,
        
        'info-button': `<div class="sheet-item" data-type="info-button" data-id="${id}">
            <div class="item-controls">
                <button class="control-btn" title="Edit">⚙</button>
                <button class="control-btn delete" title="Delete">×</button>
            </div>
            <button class="btn" onclick="showInfoBox('Information', 'This is sample information content.', this)" 
                    data-info-title="Information" data-info-content="This is sample information content." 
                    data-button-text="Show Info">${label}</button>
        </div>`
    };

    return componentTemplates[type] || null;
}

function setupContainerDragDrop(container) {
    try {
        container.addEventListener('dragover', handleContainerDragOver);
        container.addEventListener('dragleave', handleContainerDragLeave);
        container.addEventListener('drop', handleContainerDrop);
    } catch (error) {
        console.error('Error setting up container drag and drop:', error);
    }
}

function handleContainerDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.add('drag-over');
}

function handleContainerDragLeave(e) {
    if (!this.contains(e.relatedTarget)) {
        this.classList.remove('drag-over');
    }
}

function handleContainerDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.remove('drag-over');

    const componentType = e.dataTransfer.getData('text/plain');
    if (componentType) {
        const placeholder = this.querySelector('.container-placeholder');
        if (placeholder) placeholder.remove();

        appState.saveState('Add to Container');
        createComponent(componentType, this);
        updateComponentCount();
        updateSheetTree();
        updateStatus(`${componentType} added to container`);
        triggerAutoSave();
    }
}

function setupInputListeners(element) {
    try {
        const inputs = element.querySelectorAll('[data-json-path]');
        inputs.forEach(input => {
            // Remove existing listeners to prevent duplicates
            input.removeEventListener('change', updateDataValue);
            input.removeEventListener('input', handleGlobalInput);
            
            // Use the global event delegation system instead
            // This is more efficient and prevents memory leaks
        });
    } catch (error) {
        console.error('Error setting up input listeners:', error);
    }
}

// === ENHANCED ITEM MANAGEMENT ===
function selectItem(item) {
    try {
        if (!item) return;
        
        // Remove previous selection
        document.querySelectorAll('.sheet-item').forEach(el => el.classList.remove('selected'));
        
        // Add selection to new item
        item.classList.add('selected');
        appState.selectedItem = item;
        selectedItem = item; // Keep global sync
        
        // Switch to properties panel and show item properties
        switchPanel('properties');
        showItemProperties(item);
        
        // Add visual feedback
        item.style.outline = '2px solid #4fc3f7';
        setTimeout(() => {
            item.style.outline = '';
        }, 1000);
        
        updateStatus(`Selected ${item.dataset.type} component`);
    } catch (error) {
        console.error('Error selecting item:', error);
    }
}

function deleteItem(item) {
    try {
        if (!item) return;
        
        const itemType = item.dataset.type;
        
        if (confirm(`Delete this ${itemType} component?`)) {
            appState.saveState('Delete Component');
            
            // Add deletion animation
            item.style.transition = 'all 0.3s ease';
            item.style.transform = 'scale(0.8)';
            item.style.opacity = '0';
            
            setTimeout(() => {
                item.remove();
                
                if (appState.selectedItem === item) {
                    appState.selectedItem = null;
                    selectedItem = null; // Keep global sync
                    clearPropertiesPanel();
                }
                
                updateComponentCount();
                updateSheetTree();
                updateStatus(`${itemType} component deleted`);
                triggerAutoSave();
            }, 300);
        }
    } catch (error) {
        console.error('Error deleting item:', error);
    }
}

function showItemProperties(item) {
    try {
        const propertiesContent = appState.getElement('properties-content');
        if (!propertiesContent) {
            console.error('Properties content element not found');
            return;
        }
        
        const type = item.dataset.type;
        const id = item.dataset.id;

        let html = `
            <div class="properties-container">
                <div class="properties-header" style="margin-bottom: 20px; padding: 15px; background: #2d2d30; border-radius: 4px;">
                    <h4 style="margin: 0; color: #4fc3f7; display: flex; align-items: center; gap: 10px;">
                        <span>${getComponentIcon(type)}</span>
                        Component Properties
                    </h4>
                    <small style="color: #858585;">Configure this ${type} component</small>
                </div>
                
                <div class="form-group">
                    <label>Type:</label>
                    <input type="text" value="${type}" readonly style="opacity: 0.7; background: #2d2d30;">
                </div>
                <div class="form-group">
                    <label>ID:</label>
                    <input type="text" value="${id}" readonly style="opacity: 0.7; background: #2d2d30;">
                </div>
        `;

        // Generate type-specific properties
        html += generatePropertiesHTML(type, item);
        html += '</div>';
        
        propertiesContent.innerHTML = html;
        
        // Add smooth transition
        propertiesContent.style.opacity = '0';
        setTimeout(() => {
            propertiesContent.style.transition = 'opacity 0.3s ease';
            propertiesContent.style.opacity = '1';
        }, 50);
        
    } catch (error) {
        console.error('Error showing item properties:', error);
    }
}

function generatePropertiesHTML(type, item) {
    const generators = {
        'text-input': (item) => `
            <div class="form-group">
                <label>Label:</label>
                <input type="text" value="${item.querySelector('label')?.textContent || ''}" 
                       onchange="updateItemProperty('label', this.value)" placeholder="Enter label text">
            </div>
            <div class="form-group">
                <label>Placeholder:</label>
                <input type="text" value="${item.querySelector('input')?.placeholder || ''}" 
                       onchange="updateItemProperty('placeholder', this.value)" placeholder="Enter placeholder text">
            </div>
            <div class="form-group">
                <label>JSON Path:</label>
                <input type="text" value="${item.querySelector('[data-json-path]')?.dataset.jsonPath || ''}" 
                       onchange="updateItemProperty('json-path', this.value)" placeholder="field_name">
                <small style="color: #858585;">Used to link this field to data</small>
            </div>
            <div class="form-group">
                <label>Events:</label>
                <input type="text" value="${item.querySelector('[data-events]')?.dataset.events || ''}" 
                       onchange="updateItemProperty('events', this.value)" placeholder="event1,event2">
                <small style="color: #858585;">Comma-separated list of events to trigger</small>
            </div>`,
            
        'number-input': (item) => generators['text-input'](item),
        
        'textarea': (item) => `
            <div class="form-group">
                <label>Label:</label>
                <input type="text" value="${item.querySelector('label')?.textContent || ''}" 
                       onchange="updateItemProperty('label', this.value)">
            </div>
            <div class="form-group">
                <label>Placeholder:</label>
                <input type="text" value="${item.querySelector('textarea')?.placeholder || ''}" 
                       onchange="updateItemProperty('placeholder', this.value)">
            </div>
            <div class="form-group">
                <label>Rows:</label>
                <input type="number" value="${item.querySelector('textarea')?.rows || 3}" 
                       onchange="updateItemProperty('rows', this.value)" min="1" max="20">
            </div>
            <div class="form-group">
                <label>JSON Path:</label>
                <input type="text" value="${item.querySelector('[data-json-path]')?.dataset.jsonPath || ''}" 
                       onchange="updateItemProperty('json-path', this.value)">
            </div>`,
            
        'select': (item) => `
            <div class="form-group">
                <label>Label:</label>
                <input type="text" value="${item.querySelector('label')?.textContent || ''}" 
                       onchange="updateItemProperty('label', this.value)">
            </div>
            <div class="form-group">
                <label>Options (one per line):</label>
                <textarea rows="6" onchange="updateItemProperty('options', this.value)" 
                          placeholder="value1:Display Text 1&#10;value2:Display Text 2&#10;value3:Display Text 3"
                          style="font-family: monospace;">${getSelectOptions(item)}</textarea>
                <small style="color: #858585;">Format: value:Display Text (one per line)</small>
            </div>
            <div class="form-group">
                <label>JSON Path:</label>
                <input type="text" value="${item.querySelector('[data-json-path]')?.dataset.jsonPath || ''}" 
                       onchange="updateItemProperty('json-path', this.value)">
            </div>`,
            
        'checkbox': (item) => `
            <div class="form-group">
                <label>Label Text:</label>
                <input type="text" value="${getCheckboxLabel(item)}" 
                       onchange="updateItemProperty('checkbox-label', this.value)">
            </div>
            <div class="form-group">
                <label>JSON Path:</label>
                <input type="text" value="${item.querySelector('[data-json-path]')?.dataset.jsonPath || ''}" 
                       onchange="updateItemProperty('json-path', this.value)">
            </div>`,
            
        'label': (item) => `
            <div class="form-group">
                <label>Text:</label>
                <textarea rows="3" onchange="updateItemProperty('text', this.value)" 
                          placeholder="Enter display text">${item.querySelector('span')?.textContent || ''}</textarea>
            </div>
            <div class="form-group">
                <label>JSON Path (optional):</label>
                <input type="text" value="${item.querySelector('[data-json-path]')?.dataset.jsonPath || ''}" 
                       onchange="updateItemProperty('json-path', this.value)">
                <small style="color: #858585;">Leave empty for static text</small>
            </div>`,
            
        'calculated': (item) => `
            <div class="form-group">
                <label>Label:</label>
                <input type="text" value="${item.querySelector('label')?.textContent || ''}" 
                       onchange="updateItemProperty('label', this.value)">
            </div>
            <div class="form-group">
                <label>Calculation Rules:</label>
                <textarea rows="6" onchange="updateItemProperty('rules', this.value)" 
                          placeholder="Examples:&#10;sum([field1],[field2])&#10;[strength] + [dexterity]&#10;floor(([strength] - 10) / 2)&#10;if([level] > 5, [level] * 2, [level])"
                          style="font-family: monospace;">${item.querySelector('[data-rules]')?.dataset.rules || ''}</textarea>
                <small style="color: #858585;">
                    Use [fieldName] to reference fields. Available functions: sum, max, min, avg, count, floor, ceil, if<br>
                    <a href="#" onclick="showCalculationHelp(); return false;" style="color: #4fc3f7;">View full calculation guide</a>
                </small>
            </div>
            <div class="form-group">
                <button onclick="testCalculation()" style="background: #4fc3f7; color: white; border: none; padding: 8px 16px; border-radius: 3px; cursor: pointer;">
                    Test Calculation
                </button>
            </div>`,
            
        'progress-bar': (item) => `
            <div class="form-group">
                <label>Label:</label>
                <input type="text" value="${item.querySelector('label')?.textContent || ''}" 
                       onchange="updateItemProperty('label', this.value)">
            </div>
            <div class="form-group">
                <label>JSON Path:</label>
                <input type="text" value="${item.querySelector('[data-json-path]')?.dataset.jsonPath || ''}" 
                       onchange="updateItemProperty('json-path', this.value)">
                <small style="color: #858585;">Field should contain percentage value (0-100)</small>
            </div>
            <div class="form-group">
                <label>Color Scheme:</label>
                <select onchange="updateItemProperty('color-scheme', this.value)">
                    <option value="blue">Blue (default)</option>
                    <option value="green">Green</option>
                    <option value="red">Red</option>
                    <option value="purple">Purple</option>
                    <option value="orange">Orange</option>
                </select>
            </div>`,
            
        'dice-button': (item) => `
            <div class="form-group">
                <label>Button Text:</label>
                <input type="text" value="${getButtonText(item)}" 
                       onchange="updateItemProperty('text', this.value)" placeholder="Roll dice">
            </div>
            <div class="form-group">
                <label>Dice Formula:</label>
                <input type="text" value="${item.querySelector('[data-dice]')?.dataset.dice || ''}" 
                       onchange="updateItemProperty('dice', this.value)" 
                       placeholder="1d20, 2d6+3, 1d4+[level]">
                <small style="color: #858585;">Use [fieldName] to reference character stats</small>
            </div>
            <div class="form-group">
                <button onclick="testDiceRoll()" style="background: #4fc3f7; color: white; border: none; padding: 8px 16px; border-radius: 3px; cursor: pointer;">
                    Test Roll
                </button>
            </div>`,
            
        'reference-button': (item) => `
            <div class="form-group">
                <label>Button Text:</label>
                <input type="text" value="${getButtonText(item)}" 
                       onchange="updateItemProperty('text', this.value)">
            </div>
            <div class="form-group">
                <label>Reference Type:</label>
                <select onchange="updateItemProperty('reference', this.value)">
                    <option value="spells" ${item.querySelector('[data-reference]')?.dataset.reference === 'spells' ? 'selected' : ''}>Spells</option>
                    <option value="skills" ${item.querySelector('[data-reference]')?.dataset.reference === 'skills' ? 'selected' : ''}>Skills</option>
                    <option value="equipment" ${item.querySelector('[data-reference]')?.dataset.reference === 'equipment' ? 'selected' : ''}>Equipment</option>
                </select>
            </div>
            <div class="form-group">
                <button onclick="previewReference()" style="background: #4fc3f7; color: white; border: none; padding: 8px 16px; border-radius: 3px; cursor: pointer;">
                    Preview Reference
                </button>
            </div>`,
            
        'info-button': (item) => `
            <div class="form-group">
                <label>Button Text:</label>
                <input type="text" value="${getButtonText(item)}" 
                       onchange="updateItemProperty('text', this.value)">
            </div>
            <div class="form-group">
                <label>Info Title:</label>
                <input type="text" value="${item.querySelector('[data-info-title]')?.dataset.infoTitle || ''}" 
                       onchange="updateItemProperty('info-title', this.value)">
            </div>
            <div class="form-group">
                <label>Info Content:</label>
                <textarea rows="4" onchange="updateItemProperty('info-content', this.value)" 
                          placeholder="Enter helpful information or instructions">${item.querySelector('[data-info-content]')?.dataset.infoContent || ''}</textarea>
            </div>
            <div class="form-group">
                <button onclick="previewInfo()" style="background: #4fc3f7; color: white; border: none; padding: 8px 16px; border-radius: 3px; cursor: pointer;">
                    Preview Info
                </button>
            </div>`,
            
        'row': () => `
            <div class="form-group">
                <label>Container Type:</label>
                <input type="text" value="Row Container" readonly style="opacity: 0.7; background: #2d2d30;">
                <small style="color: #858585;">Arranges child components horizontally</small>
            </div>
            <div class="form-group">
                <label>Gap Size:</label>
                <select onchange="updateItemProperty('gap', this.value)">
                    <option value="small">Small (5px)</option>
                    <option value="medium" selected>Medium (10px)</option>
                    <option value="large">Large (20px)</option>
                </select>
            </div>`,
            
        'column': () => `
            <div class="form-group">
                <label>Container Type:</label>
                <input type="text" value="Column Container" readonly style="opacity: 0.7; background: #2d2d30;">
                <small style="color: #858585;">Arranges child components vertically</small>
            </div>
            <div class="form-group">
                <label>Gap Size:</label>
                <select onchange="updateItemProperty('gap', this.value)">
                    <option value="small">Small (5px)</option>
                    <option value="medium" selected>Medium (10px)</option>
                    <option value="large">Large (20px)</option>
                </select>
            </div>`
    };

    const generator = generators[type];
    return generator ? generator(item) : '<p style="color: #858585;">No additional properties available for this component type.</p>';
}

// Test functions for property panel
function testCalculation() {
    if (!appState.selectedItem) return;
    
    const rulesElement = appState.selectedItem.querySelector('[data-rules]');
    if (!rulesElement) return;
    
    const rules = rulesElement.dataset.rules;
    if (!rules.trim()) {
        alert('Please enter calculation rules first.');
        return;
    }
    
    try {
        const result = evaluateCalculationRules(rules);
        alert(`Calculation Result: ${result}\n\nRules: ${rules}`);
    } catch (error) {
        alert(`Calculation Error: ${error.message}\n\nRules: ${rules}`);
    }
}

function testDiceRoll() {
    if (!appState.selectedItem) return;
    
    const diceElement = appState.selectedItem.querySelector('[data-dice]');
    if (!diceElement) return;
    
    const formula = diceElement.dataset.dice;
    if (!formula.trim()) {
        alert('Please enter a dice formula first.');
        return;
    }
    
    rollDice(formula);
}

function previewReference() {
    if (!appState.selectedItem) return;
    
    const refElement = appState.selectedItem.querySelector('[data-reference]');
    if (!refElement) return;
    
    const refType = refElement.dataset.reference;
    showReferenceList(refType);
}

function previewInfo() {
    if (!appState.selectedItem) return;
    
    const titleElement = appState.selectedItem.querySelector('[data-info-title]');
    const contentElement = appState.selectedItem.querySelector('[data-info-content]');
    
    const title = titleElement?.dataset.infoTitle || 'Information';
    const content = contentElement?.dataset.infoContent || 'No content specified.';
    
    showInfoBox(title, content);
}

function getButtonText(item) {
    try {
        const button = item.querySelector('button');
        if (!button) return '';
        
        const storedText = button.dataset.buttonText;
        if (storedText) return storedText;
        
        const displayedText = button.textContent.trim();
        const cleanText = displayedText
            .replace(/^🎲\s*/, '')
            .replace(/^📚\s*/, '')
            .replace(/^ℹ️\s*/, '')
            .replace(/^[📖📋📊🎮⚙️🔧]\s*/, '')
            .trim();
        
        if (cleanText && cleanText !== displayedText) {
            button.dataset.buttonText = cleanText;
        }
        
        return cleanText || displayedText;
    } catch (error) {
        console.error('Error getting button text:', error);
        return '';
    }
}

function getSelectOptions(item) {
    try {
        const select = item.querySelector('select');
        if (!select) return '';
        
        const options = Array.from(select.options).slice(1);
        return options.map(opt => `${opt.value}:${opt.textContent}`).join('\n');
    } catch (error) {
        console.error('Error getting select options:', error);
        return '';
    }
}

function getCheckboxLabel(item) {
    try {
        const label = item.querySelector('label');
        if (!label) return '';
        
        const text = label.textContent.trim();
        return text.replace(/^\s*/, '');
    } catch (error) {
        console.error('Error getting checkbox label:', error);
        return '';
    }
}

function clearPropertiesPanel() {
    try {
        const propertiesContent = appState.getElement('properties-content');
        if (propertiesContent) {
            propertiesContent.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #858585;">
                    <div style="font-size: 48px; margin-bottom: 20px;">⚙️</div>
                    <h4>No Component Selected</h4>
                    <p>Select a component to edit its properties</p>
                    <small>Click on any component in the canvas or component tree</small>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error clearing properties panel:', error);
    }
}

function updateItemProperty(property, value) {
    try {
        if (!appState.selectedItem) return;
        
        appState.saveState('Update Property');

        switch (property) {
            case 'label':
                const label = appState.selectedItem.querySelector('label');
                if (label) label.textContent = value;
                break;
                
            case 'text':
                const textElement = appState.selectedItem.querySelector('span:not(.calculated-value), button');
                if (textElement) {
                    if (textElement.tagName === 'BUTTON') {
                        const originalText = textElement.textContent;
                        const emojiMatch = originalText.match(/^([🎲📚ℹ️📖📋📊🎮⚙️🔧]\s*)/);
                        const emojiPrefix = emojiMatch ? emojiMatch[1] : '';
                        textElement.textContent = emojiPrefix + value;
                        textElement.dataset.buttonText = value;
                    } else {
                        textElement.textContent = value;
                    }
                }
                break;
                
            case 'placeholder':
                const input = appState.selectedItem.querySelector('input, textarea');
                if (input) input.placeholder = value;
                break;
                
            case 'rows':
                const textarea = appState.selectedItem.querySelector('textarea');
                if (textarea) textarea.rows = parseInt(value) || 3;
                break;
                
            case 'json-path':
                const jsonElement = appState.selectedItem.querySelector('[data-json-path]');
                if (jsonElement) jsonElement.dataset.jsonPath = value;
                break;
                
            case 'checkbox-label':
                const checkboxLabel = appState.selectedItem.querySelector('label');
                const checkbox = appState.selectedItem.querySelector('input[type="checkbox"]');
                if (checkboxLabel && checkbox) {
                    checkboxLabel.innerHTML = checkbox.outerHTML + ' ' + value;
                }
                break;
                
            case 'options':
                updateSelectOptions(appState.selectedItem, value);
                break;
                
            case 'rules':
                const calculatedElement = appState.selectedItem.querySelector('[data-rules]');
                if (calculatedElement) {
                    calculatedElement.dataset.rules = value;
                    debouncedCalculationUpdate();
                }
                break;
                
            case 'dice':
                const diceButton = appState.selectedItem.querySelector('[data-dice]');
                if (diceButton) diceButton.dataset.dice = value;
                break;
                
            case 'reference':
                const refButton = appState.selectedItem.querySelector('[data-reference]');
                if (refButton) {
                    refButton.dataset.reference = value;
                    refButton.onclick = () => showReferenceList(value, refButton);
                }
                break;
                
            case 'info-title':
                const infoButton = appState.selectedItem.querySelector('[data-info-title]');
                if (infoButton) infoButton.dataset.infoTitle = value;
                break;
                
            case 'info-content':
                const infoContentButton = appState.selectedItem.querySelector('[data-info-content]');
                if (infoContentButton) infoContentButton.dataset.infoContent = value;
                break;
                
            case 'gap':
                updateContainerGap(appState.selectedItem, value);
                break;
                
            case 'color-scheme':
                updateProgressBarColor(appState.selectedItem, value);
                break;
        }
        
        updateStatus('Property updated');
        triggerAutoSave();
    } catch (error) {
        console.error('Error updating item property:', error);
        updateStatus('Error updating property');
    }
}

function updateSelectOptions(item, optionsText) {
    try {
        const select = item.querySelector('select');
        if (!select) return;
        
        // Clear existing options except the first empty one
        while (select.options.length > 1) {
            select.removeChild(select.lastChild);
        }
        
        // Add new options
        const lines = optionsText.split('\n').filter(line => line.trim());
        lines.forEach(line => {
            const [value, text] = line.split(':').map(s => s.trim());
            const option = document.createElement('option');
            option.value = value || text;
            option.textContent = text || value;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error updating select options:', error);
    }
}

function updateContainerGap(item, gapSize) {
    try {
        const gapValues = {
            'small': '5px',
            'medium': '10px',
            'large': '20px'
        };
        
        const gap = gapValues[gapSize] || '10px';
        item.style.gap = gap;
    } catch (error) {
        console.error('Error updating container gap:', error);
    }
}

function updateProgressBarColor(item, colorScheme) {
    try {
        const colorSchemes = {
            'blue': 'linear-gradient(90deg, #4fc3f7, #29b6f6)',
            'green': 'linear-gradient(90deg, #4caf50, #66bb6a)',
            'red': 'linear-gradient(90deg, #f44336, #ef5350)',
            'purple': 'linear-gradient(90deg, #9c27b0, #ba68c8)',
            'orange': 'linear-gradient(90deg, #ff9800, #ffb74d)'
        };
        
        const progressBar = item.querySelector('[data-json-path] div');
        if (progressBar) {
            progressBar.style.background = colorSchemes[colorScheme] || colorSchemes.blue;
        }
    } catch (error) {
        console.error('Error updating progress bar color:', error);
    }
}

// === ENHANCED INTERACTIVE FUNCTIONS ===
function rollDice(formula, button = null) {
    try {
        let processedFormula = formula;
        const fieldMatches = formula.match(/\[([^\]]+)\]/g);
        if (fieldMatches) {
            fieldMatches.forEach(match => {
                const fieldName = match.slice(1, -1);
                const value = getFieldValue(fieldName) || 0;
                processedFormula = processedFormula.replace(match, value);
            });
        }
        
        const match = processedFormula.match(/(\d+)d(\d+)([+-]\d+)?/);
        if (!match) throw new Error('Invalid dice formula');

        const numDice = parseInt(match[1]);
        const diceSize = parseInt(match[2]);
        const modifier = match[3] ? parseInt(match[3]) : 0;

        if (numDice > 100) throw new Error('Too many dice (max 100)');
        if (diceSize > 1000) throw new Error('Dice size too large (max 1000)');

        let total = 0;
        let rolls = [];

        for (let i = 0; i < numDice; i++) {
            const roll = Math.floor(Math.random() * diceSize) + 1;
            rolls.push(roll);
            total += roll;
        }

        total += modifier;

        // Create or update dice modal
        showDiceResult(total, processedFormula, rolls, modifier);

    } catch (error) {
        console.error('Dice roll error:', error);
        alert('Invalid dice formula: ' + error.message);
    }
}

function showDiceResult(total, formula, rolls, modifier) {
    const modal = createDiceModal();
    document.body.appendChild(modal);
    
    const resultElement = modal.querySelector('#dice-result');
    const criticalClass = (rolls.some(r => r === Math.max(...rolls)) && Math.max(...rolls) === 20) ? ' critical' : '';
    
    resultElement.innerHTML = `
        <div class="dice-total${criticalClass}" style="font-size: 48px; margin-bottom: 15px; color: white; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
            ${total}
        </div>
        <div class="dice-details" style="font-size: 16px; color: rgba(255,255,255,0.9); line-height: 1.4;">
            <div><strong>Formula:</strong> ${formula}</div>
            <div><strong>Individual Rolls:</strong> ${rolls.join(', ')}</div>
            ${modifier !== 0 ? `<div><strong>Modifier:</strong> ${modifier >= 0 ? '+' : ''}${modifier}</div>` : ''}
            <div style="margin-top: 10px; font-size: 14px; color: rgba(255,255,255,0.7);">
                ${rolls.length > 1 ? `Sum of rolls: ${rolls.reduce((a, b) => a + b, 0)}` : ''}
            </div>
        </div>
    `;
    
    showModal('dynamic-dice-modal');
}

function createDiceModal() {
    const existingModal = document.getElementById('dynamic-dice-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'dynamic-dice-modal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px; background: linear-gradient(135deg, #2d2d30, #1e1e1e); border: 2px solid #4fc3f7;">
            <div class="modal-header" style="text-align: center; border-bottom: 1px solid #4fc3f7;">
                <h3 style="margin: 0; color: #4fc3f7;">🎲 Dice Roll Result</h3>
                <button class="modal-close" onclick="closeModal('dynamic-dice-modal'); this.closest('.modal').remove();">×</button>
            </div>
            <div id="dice-result" style="padding: 30px; text-align: center;"></div>
            <div class="modal-footer" style="text-align: center; padding: 15px;">
                <button onclick="closeModal('dynamic-dice-modal'); this.closest('.modal').remove();" 
                        style="background: #4fc3f7; color: white; border: none; padding: 10px 20px; border-radius: 3px; cursor: pointer;">
                    Close
                </button>
            </div>
        </div>
    `;
    
    return modal;
}

function showReferenceList(type, button = null) {
    try {
        const references = appState.sheetData.references[type];
        if (!references || references.length === 0) {
            alert(`No reference data found for: ${type}`);
            return;
        }

        const modal = createReferenceModal(type, references);
        document.body.appendChild(modal);
        showModal('dynamic-reference-modal');

    } catch (error) {
        console.error('Error showing reference list:', error);
    }
}

function createReferenceModal(type, references) {
    const existingModal = document.getElementById('dynamic-reference-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'dynamic-reference-modal';
    modal.className = 'modal';
    
    const referenceItems = references.map(item => `
        <div class="reference-item" style="padding: 15px; margin-bottom: 10px; background: #2d2d30; 
                                           border-radius: 4px; cursor: pointer; transition: background 0.2s;"
             onclick="showReferenceDetail('${item.name}', '${item.description}')">
            <h4 style="margin: 0 0 8px 0; color: #4fc3f7;">${item.name}</h4>
            <div style="font-size: 12px; color: #888; margin-bottom: 8px;">
                ${item.level ? `Level ${item.level} ${item.school || ''}` : ''}
                ${item.ability ? `${item.ability} based` : ''}
                ${item.type ? `${item.type}` : ''}
                ${item.damage ? `Damage: ${item.damage}` : ''}
                ${item.ac ? `AC: ${item.ac}` : ''}
                ${item.effect ? `Effect: ${item.effect}` : ''}
            </div>
            <p style="margin: 0; font-size: 14px; line-height: 1.4;">${item.description}</p>
        </div>
    `).join('');
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px; max-height: 80vh;">
            <div class="modal-header">
                <h3>📚 ${type.charAt(0).toUpperCase() + type.slice(1)} Reference</h3>
                <button class="modal-close" onclick="closeModal('dynamic-reference-modal'); this.closest('.modal').remove();">×</button>
            </div>
            <div style="padding: 20px; max-height: 60vh; overflow-y: auto;">
                ${referenceItems}
            </div>
        </div>
    `;
    
    return modal;
}

function showReferenceDetail(name, description) {
    showInfoBox(name, description);
    closeModal('dynamic-reference-modal');
    document.getElementById('dynamic-reference-modal')?.remove();
}

function showInfoBox(title, content, button = null) {
    try {
        const modal = createInfoModal(title, content);
        document.body.appendChild(modal);
        showModal('dynamic-info-modal');
    } catch (error) {
        console.error('Error showing info box:', error);
    }
}

function createInfoModal(title, content) {
    const existingModal = document.getElementById('dynamic-info-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'dynamic-info-modal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h3>ℹ️ ${title}</h3>
                <button class="modal-close" onclick="closeModal('dynamic-info-modal'); this.closest('.modal').remove();">×</button>
            </div>
            <div style="padding: 20px; line-height: 1.6;">
                ${content}
            </div>
            <div class="modal-footer" style="text-align: right; padding: 15px;">
                <button onclick="closeModal('dynamic-info-modal'); this.closest('.modal').remove();" 
                        style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 3px; cursor: pointer;">
                    Close
                </button>
            </div>
        </div>
    `;
    
    return modal;
}

// === ENHANCED DATA MANAGEMENT ===
function showDataEditor() {
    try {
        const modal = createDataEditorModal();
        document.body.appendChild(modal);
        showModal('dynamic-data-modal');
    } catch (error) {
        console.error('Error showing data editor:', error);
    }
}

function createDataEditorModal() {
    const existingModal = document.getElementById('dynamic-data-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'dynamic-data-modal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px; max-height: 80vh;">
            <div class="modal-header">
                <h3>📊 Sheet Data Editor</h3>
                <button class="modal-close" onclick="closeModal('dynamic-data-modal'); this.closest('.modal').remove();">×</button>
            </div>
            <div style="padding: 20px;">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px;">JSON Data:</label>
                    <textarea id="dynamic-data-editor" rows="20" 
                              style="width: 100%; background: #1e1e1e; border: 1px solid #3e3e42; 
                                     color: #d4d4d4; padding: 10px; border-radius: 3px; font-family: monospace;"
                              placeholder="Enter JSON data...">${JSON.stringify(appState.sheetData, null, 2)}</textarea>
                </div>
                <div style="color: #858585; font-size: 12px; margin-bottom: 15px;">
                    <strong>Tip:</strong> This editor contains all your sheet data including references, styles, and form values.
                    Be careful when editing to maintain valid JSON format.
                </div>
            </div>
            <div class="modal-footer" style="display: flex; justify-content: space-between; padding: 15px; border-top: 1px solid #3e3e42;">
                <div>
                    <button onclick="formatDynamicJSON()" 
                            style="background: #17a2b8; color: white; border: none; padding: 8px 16px; border-radius: 3px; cursor: pointer; margin-right: 10px;">
                        Format JSON
                    </button>
                    <button onclick="validateDynamicJSON()" 
                            style="background: #ffc107; color: black; border: none; padding: 8px 16px; border-radius: 3px; cursor: pointer;">
                        Validate
                    </button>
                </div>
                <div>
                    <button onclick="closeModal('dynamic-data-modal'); this.closest('.modal').remove();" 
                            style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 3px; cursor: pointer; margin-right: 10px;">
                        Cancel
                    </button>
                    <button onclick="saveDynamicSheetData()" 
                            style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 3px; cursor: pointer;">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return modal;
}

function saveDynamicSheetData() {
    try {
        const dataEditor = document.getElementById('dynamic-data-editor');
        if (!dataEditor) {
            console.error('Data editor element not found');
            return;
        }
        
        appState.saveState('Data Update');
        const newData = JSON.parse(dataEditor.value);
        appState.sheetData = newData;
        sheetData = newData; // Keep global sync
        
        closeModal('dynamic-data-modal');
        document.getElementById('dynamic-data-modal')?.remove();
        
        // Update calculated fields with new data
        debouncedCalculationUpdate();
        updateStatus('Data saved successfully');
        triggerAutoSave();
    } catch (error) {
        console.error('Save data error:', error);
        alert('Invalid JSON: ' + error.message);
    }
}

function formatDynamicJSON() {
    try {
        const dataEditor = document.getElementById('dynamic-data-editor');
        if (!dataEditor) return;
        
        const data = JSON.parse(dataEditor.value);
        dataEditor.value = JSON.stringify(data, null, 2);
        updateStatus('JSON formatted');
    } catch (error) {
        alert('Invalid JSON: ' + error.message);
    }
}

function validateDynamicJSON() {
    try {
        const dataEditor = document.getElementById('dynamic-data-editor');
        if (!dataEditor) return;
        
        JSON.parse(dataEditor.value);
        alert('✅ JSON is valid!');
    } catch (error) {
        alert('❌ Invalid JSON: ' + error.message);
    }
}

function importSheet() {
    try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        appState.saveState('Import Sheet');
                        const importedData = JSON.parse(e.target.result);
                        
                        // Handle different import formats
                        if (importedData.version && importedData.html && importedData.data) {
                            // New format with version info
                            const canvas = appState.getElement('canvas');
                            if (canvas) {
                                canvas.innerHTML = importedData.html;
                            }
                            
                            appState.sheetData.data = importedData.data || {};
                            appState.sheetData.styles = importedData.styles || '';
                            appState.sheetData.references = importedData.references || appState.sheetData.references;
                            
                            if (importedData.fonts) DEFAULT_FONTS = importedData.fonts;
                            if (importedData.labels) LABELS = importedData.labels;
                            if (importedData.componentCounter) appState.componentCounter = importedData.componentCounter;
                            
                            applyFontSetting();
                        } else if (importedData.html && importedData.data) {
                            // Legacy canvas-only export
                            const canvas = appState.getElement('canvas');
                            if (canvas) {
                                canvas.innerHTML = importedData.html;
                            }
                            appState.sheetData.data = importedData.data;
                            appState.sheetData.styles = importedData.styles || '';
                            if (importedData.fonts) DEFAULT_FONTS = importedData.fonts;
                            if (importedData.labels) LABELS = importedData.labels;
                            applyFontSetting();
                        } else {
                            // Full sheet data
                            appState.sheetData = importedData;
                        }
                        
                        // Keep global sync
                        sheetData = appState.sheetData;
                        componentCounter = appState.componentCounter;
                        
                        // Re-setup all systems
                        appState.clearDOMCache();
                        appState.setupAllEventListeners();
                        updateComponentCount();
                        updateSheetTree();
                        debouncedCalculationUpdate();
                        
                        updateStatus(`Sheet imported successfully (${importedData.version || 'legacy'} format)`);
                        triggerAutoSave();
                    } catch (error) {
                        console.error('Import error:', error);
                        alert('Invalid file: ' + error.message);
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    } catch (error) {
        console.error('Error importing sheet:', error);
        updateStatus('Error importing sheet');
    }
}

// === CSS & PREVIEW ===
function previewSheet() {
    try {
        const modal = createPreviewModal();
        document.body.appendChild(modal);
        showModal('dynamic-preview-modal');
    } catch (error) {
        console.error('Error showing preview:', error);
        updateStatus('Error showing preview');
    }
}

function createPreviewModal() {
    const existingModal = document.getElementById('dynamic-preview-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const canvas = appState.getElement('canvas');
    if (!canvas) {
        throw new Error('Canvas not found');
    }
    
    const clone = canvas.cloneNode(true);
    clone.querySelectorAll('.item-controls, .canvas-placeholder').forEach(el => el.remove());
    clone.style.fontFamily = DEFAULT_FONTS;
    clone.style.transform = 'scale(1)'; // Reset any zoom
    
    const modal = document.createElement('div');
    modal.id = 'dynamic-preview-modal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 90vw; max-height: 90vh;">
            <div class="modal-header">
                <h3>👁️ Sheet Preview</h3>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <button onclick="printPreview()" 
                            style="background: #17a2b8; color: white; border: none; padding: 6px 12px; border-radius: 3px; cursor: pointer; font-size: 12px;">
                        Print
                    </button>
                    <button class="modal-close" onclick="closeModal('dynamic-preview-modal'); this.closest('.modal').remove();">×</button>
                </div>
            </div>
            <div id="preview-content" style="padding: 20px; max-height: 70vh; overflow: auto; background: white; color: black;">
                <!-- Preview content will be inserted here -->
            </div>
        </div>
    `;
    
    const previewContent = modal.querySelector('#preview-content');
    previewContent.appendChild(clone);
    
    return modal;
}

function printPreview() {
    const previewContent = document.getElementById('preview-content');
    if (previewContent) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Character Sheet - Print Preview</title>
                <style>
                    body { 
                        font-family: ${DEFAULT_FONTS}; 
                        margin: 20px; 
                        color: black; 
                        background: white; 
                    }
                    .sheet-item { 
                        margin: 10px 0; 
                        page-break-inside: avoid; 
                    }
                    input, select, textarea { 
                        border: 1px solid #333 !important; 
                        background: white !important; 
                        color: black !important; 
                    }
                    @media print {
                        body { margin: 0; }
                        .sheet-item { margin: 5px 0; }
                    }
                </style>
            </head>
            <body>
                ${previewContent.innerHTML}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }
}

function showGlobalCSS() {
    try {
        const modal = createCSSModal();
        document.body.appendChild(modal);
        showModal('dynamic-css-modal');
    } catch (error) {
        console.error('Error showing CSS editor:', error);
    }
}

function createCSSModal() {
    const existingModal = document.getElementById('dynamic-css-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'dynamic-css-modal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px; max-height: 80vh;">
            <div class="modal-header">
                <h3>🎨 Custom CSS Editor</h3>
                <button class="modal-close" onclick="closeModal('dynamic-css-modal'); this.closest('.modal').remove();">×</button>
            </div>
            <div style="padding: 20px;">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px;">Custom CSS Styles:</label>
                    <textarea id="dynamic-css-editor" rows="15" 
                              style="width: 100%; background: #1e1e1e; border: 1px solid #3e3e42; 
                                     color: #d4d4d4; padding: 10px; border-radius: 3px; font-family: monospace;"
                              placeholder="/* Enter your custom CSS styles here */&#10;.sheet-item {&#10;  /* Your custom styles */&#10;}">${appState.sheetData.styles || ''}</textarea>
                </div>
                <div style="color: #858585; font-size: 12px; margin-bottom: 15px;">
                    <strong>Tips:</strong>
                    <ul style="margin: 5px 0; padding-left: 20px;">
                        <li>Use <code>.sheet-item</code> to style all components</li>
                        <li>Use <code>[data-type="text-input"]</code> to target specific component types</li>
                        <li>Changes are applied immediately and saved with your sheet</li>
                        <li>Use browser developer tools to inspect elements</li>
                    </ul>
                </div>
            </div>
            <div class="modal-footer" style="display: flex; justify-content: space-between; padding: 15px; border-top: 1px solid #3e3e42;">
                <div>
                    <button onclick="resetDynamicCSS()" 
                            style="background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 3px; cursor: pointer;">
                        Reset CSS
                    </button>
                </div>
                <div>
                    <button onclick="closeModal('dynamic-css-modal'); this.closest('.modal').remove();" 
                            style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 3px; cursor: pointer; margin-right: 10px;">
                        Cancel
                    </button>
                    <button onclick="applyDynamicGlobalCSS()" 
                            style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 3px; cursor: pointer;">
                        Apply CSS
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return modal;
}

function applyDynamicGlobalCSS() {
    try {
        const cssEditor = document.getElementById('dynamic-css-editor');
        if (!cssEditor) return;
        
        appState.saveState('CSS Update');
        const css = cssEditor.value;
        
        let style = document.getElementById('custom-styles');
        if (!style) {
            style = document.createElement('style');
            style.id = 'custom-styles';
            document.head.appendChild(style);
        }
        style.textContent = css;
        appState.sheetData.styles = css;
        
        closeModal('dynamic-css-modal');
        document.getElementById('dynamic-css-modal')?.remove();
        updateStatus('CSS applied successfully');
        triggerAutoSave();
    } catch (error) {
        console.error('Error applying CSS:', error);
        updateStatus('Error applying CSS');
    }
}

function resetDynamicCSS() {
    if (confirm('Reset all custom CSS? This cannot be undone.')) {
        const cssEditor = document.getElementById('dynamic-css-editor');
        if (cssEditor) {
            cssEditor.value = '';
        }
        
        const style = document.getElementById('custom-styles');
        if (style) style.remove();
        appState.sheetData.styles = '';
        updateStatus('CSS reset');
    }
}

// === ENHANCED MODAL FUNCTIONS ===
function showModal(modalId) {
    try {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            modal.style.display = 'flex';
            
            // Add smooth fade-in animation
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.style.transition = 'opacity 0.3s ease';
                modal.style.opacity = '1';
            }, 10);
            
            // Focus management for accessibility
            const firstInput = modal.querySelector('input, textarea, button');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        } else {
            console.error(`Modal not found: ${modalId}`);
        }
    } catch (error) {
        console.error('Error showing modal:', error);
    }
}

function closeModal(modalId) {
    try {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.transition = 'opacity 0.3s ease';
            modal.style.opacity = '0';
            
            setTimeout(() => {
                modal.classList.remove('show');
                modal.style.display = 'none';
                modal.style.opacity = '';
                modal.style.transition = '';
            }, 300);
        }
    } catch (error) {
        console.error('Error closing modal:', error);
    }
}

// === ENHANCED UTILITY FUNCTIONS ===
function updateComponentCount() {
    try {
        const count = document.querySelectorAll('.sheet-item').length;
        const componentCountElement = appState.getElement('component-count');
        if (componentCountElement) {
            componentCountElement.textContent = `Components: ${count}`;
        }
        
        // Update memory usage info
        const memoryInfo = performance.memory;
        if (memoryInfo) {
            const usedMB = Math.round(memoryInfo.usedJSHeapSize / 1048576);
            updateStatus(`${count} components loaded (${usedMB}MB used)`);
        }
    } catch (error) {
        console.error('Error updating component count:', error);
    }
}

function updateStatus(message) {
    try {
        const statusElement = appState.getElement('sheet-status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.style.opacity = '1';
            
            // Clear status after delay
            clearTimeout(updateStatus.timeout);
            updateStatus.timeout = setTimeout(() => {
                statusElement.style.transition = 'opacity 0.5s ease';
                statusElement.style.opacity = '0.7';
                setTimeout(() => {
                    statusElement.textContent = 'Ready';
                    statusElement.style.opacity = '1';
                    statusElement.style.transition = '';
                }, 500);
            }, 3000);
        }
    } catch (error) {
        console.error('Error updating status:', error);
    }
}

function updateSheetTree() {
    try {
        const tree = appState.getElement('sheet-tree');
        if (!tree) {
            console.error('Sheet tree element not found');
            return;
        }
        
        const items = document.querySelectorAll('.sheet-item');

        if (items.length === 0) {
            tree.innerHTML = `
                <div style="color: #858585; font-size: 11px; text-align: center; padding: 30px;">
                    <div style="font-size: 24px; margin-bottom: 10px;">📋</div>
                    <div>No components added yet</div>
                    <small>Components will appear here as you add them</small>
                </div>
            `;
            return;
        }

        let html = '';
        items.forEach((item, index) => {
            const type = item.dataset.type;
            const id = item.dataset.id;
            const icon = getComponentIcon(type);
            const isSelected = item === appState.selectedItem;
            const isContainer = type === 'row' || type === 'column';
            const childCount = isContainer ? item.querySelectorAll('.sheet-item').length : 0;
            
            html += `
                <div class="tree-item ${isSelected ? 'selected' : ''}" 
                     style="padding: 8px; cursor: pointer; border-radius: 3px; font-size: 11px; 
                            display: flex; align-items: center; gap: 8px; margin: 2px 0;
                            background: ${isSelected ? '#094771' : 'transparent'};
                            color: ${isSelected ? '#4fc3f7' : '#d4d4d4'};
                            transition: background-color 0.2s;"
                     onclick="selectItem(document.querySelector('[data-id=\\'${id}\\']'))"
                     onmouseenter="this.style.background = this.classList.contains('selected') ? '#094771' : '#2d2d30'"
                     onmouseleave="this.style.background = this.classList.contains('selected') ? '#094771' : 'transparent'">
                    <span style="font-size: 14px;">${icon}</span>
                    <span style="flex: 1;">${type.replace('-', ' ')}</span>
                    ${isContainer ? `<span style="color: #858585; font-size: 10px;">${childCount}</span>` : ''}
                    <span style="color: #858585; font-size: 10px;">${id.split('_')[1]}</span>
                </div>
            `;
        });

        tree.innerHTML = html;
    } catch (error) {
        console.error('Error updating sheet tree:', error);
    }
}

function getComponentIcon(type) {
    const icons = {
        'row': '📋',
        'column': '📊',
        'text-input': '📝',
        'number-input': '🔢',
        'textarea': '📄',
        'select': '🔽',
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

// === ENHANCED KEYBOARD SHORTCUTS ===
async function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
}

function handleKeyDown(e) {
    try {
        // Prevent shortcuts when typing in inputs
        if (e.target.matches('input, textarea, [contenteditable]')) {
            // Allow Ctrl+A in text fields
            if (e.ctrlKey && e.key === 'a') {
                return;
            }
            // Only process escape in input fields
            if (e.key !== 'Escape') {
                return;
            }
        }
        
        // Handle Escape key
        if (e.key === 'Escape') {
            // Close any open modals
            const openModals = document.querySelectorAll('.modal.show, .modal[style*="display: flex"]');
            if (openModals.length > 0) {
                openModals.forEach(modal => {
                    closeModal(modal.id);
                    if (modal.id.startsWith('dynamic-')) {
                        modal.remove();
                    }
                });
                return;
            }
            
            // Deselect current item
            if (appState.selectedItem) {
                document.querySelectorAll('.sheet-item').forEach(el => el.classList.remove('selected'));
                appState.selectedItem = null;
                selectedItem = null;
                clearPropertiesPanel();
                updateStatus('Selection cleared');
                return;
            }
        }
        
        // Handle Ctrl/Cmd shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 's':
                    e.preventDefault();
                    if (e.shiftKey) {
                        exportSheetAs();
                    } else {
                        exportCanvasOnly();
                    }
                    break;
                case 'o':
                    e.preventDefault();
                    importSheet();
                    break;
                case 'n':
                    e.preventDefault();
                    newSheet();
                    break;
                case 'p':
                    e.preventDefault();
                    previewSheet();
                    break;
                case 'b':
                    e.preventDefault();
                    toggleSidebar();
                    break;
                case 'd':
                    e.preventDefault();
                    showDataEditor();
                    break;
                case ',':
                    e.preventDefault();
                    showSettingsPanel();
                    break;
                case 'z':
                    e.preventDefault();
                    if (e.shiftKey) {
                        appState.redo();
                    } else {
                        appState.undo();
                    }
                    break;
                case 'y':
                    e.preventDefault();
                    appState.redo();
                    break;
                case 'Delete':
                    e.preventDefault();
                    clearCanvas();
                    break;
                case '+':
                case '=':
                    e.preventDefault();
                    zoomIn();
                    break;
                case '-':
                    e.preventDefault();
                    zoomOut();
                    break;
                case '0':
                    e.preventDefault();
                    resetZoom();
                    break;
                case 'a':
                    if (!e.target.matches('input, textarea')) {
                        e.preventDefault();
                        selectAllComponents();
                    }
                    break;
            }
        }
        
        // Handle Delete key
        if (e.key === 'Delete' && appState.selectedItem && !e.target.matches('input, textarea')) {
            e.preventDefault();
            deleteItem(appState.selectedItem);
        }
        
        // Handle F11 for fullscreen
        if (e.key === 'F11') {
            e.preventDefault();
            toggleFullscreen();
        }
        
    } catch (error) {
        console.error('Keyboard shortcut error:', error);
    }
}

function handleKeyUp(e) {
    // Handle any key up events if needed
}

function selectAllComponents() {
    const components = document.querySelectorAll('.sheet-item');
    components.forEach(comp => comp.classList.add('selected'));
    updateStatus(`Selected ${components.length} components`);
}

function toggleFullscreen() {
    try {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            updateStatus('Entered fullscreen mode');
        } else {
            document.exitFullscreen();
            updateStatus('Exited fullscreen mode');
        }
    } catch (error) {
        console.error('Fullscreen error:', error);
    }
}

// === UNDO/REDO FUNCTIONS ===
function undo() {
    appState.undo();
}

function redo() {
    appState.redo();
}

// === CLEANUP AND OPTIMIZATION ===
window.addEventListener('beforeunload', () => {
    appState.cleanup();
});

// Performance monitoring
if (window.performance && window.performance.mark) {
    window.performance.mark('app-initialization-start');
    window.addEventListener('load', () => {
        window.performance.mark('app-initialization-end');
        window.performance.measure('app-initialization', 'app-initialization-start', 'app-initialization-end');
    });
}

// Check for auto-save on load
window.addEventListener('load', () => {
    setTimeout(loadAutoSave, 1000);
});
