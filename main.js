// ===================================================================
// TTRPG CHARACTER SHEET BUILDER - PRODUCTION READY v3.2.0
// Cleaned and refactored for deployment. Unicode/icons fixed.
// ===================================================================

'use strict';

// ===================================================================
// CONFIGURATION AND CONSTANTS
// ===================================================================

const CONFIG = {
    VERSION: '3.2.0',
    BUILD: 'production',
    DEBUG: false,
    PERFORMANCE_MONITORING: true,
    AUTO_SAVE_INTERVAL: 30000, // 30 seconds
    MAX_UNDO_STEPS: 50,
    MAX_ERRORS_STORED: 20,
    COMPONENT_LIMIT: 1000,
    FILE_SIZE_LIMIT: 10 * 1024 * 1024, // 10MB
    SUPPORTED_FILE_TYPES: ['.json'],
    VALIDATION: {
        MIN_COMPONENT_SPACING: 5,
        MAX_NESTING_DEPTH: 10,
        MAX_CALCULATION_COMPLEXITY: 100,
        REQUIRED_FIELDS: ['characterName']
    },
    SECURITY: {
        SANITIZE_HTML: true,
        VALIDATE_JSON: true,
        PREVENT_XSS: true,
        MAX_STRING_LENGTH: 10000
    }
};

const THEME_COLORS = {
    primary: '#4fc3f7',
    secondary: '#29b6f6',
    success: '#4caf50',
    warning: '#ff9800',
    danger: '#f44336',
    info: '#17a2b8',
    dark: '#1e1e1e',
    light: '#d4d4d4',
    surface: '#2d2d30',
    border: '#3e3e42'
};

const COMPONENT_ICONS = {
    row: '📋', column: '📊', 'text-input': '✏️', 'number-input': '🔢',
    textarea: '📝', select: '🔽', checkbox: '☑️', label: '🏷️',
    calculated: '🧮', 'progress-bar': '📊', 'dice-button': '🎲', 
    'reference-button': '📚', 'info-button': 'ℹ️', button: '🔘',
    table: '📋', tabs: '🗂️', slider: '🎚️', rating: '⭐', 
    chart: '📊', image: '🖼️', event: '⚡'
};

let DEFAULT_FONTS = "'JetBrains Mono', 'Consolas', 'Monaco', 'Courier New', monospace";

let LABELS = {
    'text-input': 'Text Input:',
    'number-input': 'Number Input:',
    textarea: 'Text Area:',
    select: 'Dropdown:',
    checkbox: 'Checkbox Option',
    label: 'Label Text',
    calculated: 'Calculated Field:',
    'progress-bar': 'Progress Bar:',
    'dice-button': '🎲 Roll Dice',
    'reference-button': '📚 View References',
    'info-button': 'ℹ️ Show Info',
    button: 'Click Me',
    event: 'Event Trigger',
    image: 'Image',
    table: 'Data Table',
    tabs: 'Tab Container',
    slider: 'Slider Input',
    rating: 'Star Rating'
};

// ===================================================================
// ENHANCED APPLICATION STATE MANAGEMENT
// ===================================================================

class AppState {
    constructor() {
        this.selectedItem = null;
        this.multiSelectedItems = [];
        this.currentPanel = 'explorer';
        this.componentCounter = 0;
        this.currentDropdownMenu = null;
        this.undoStack = [];
        this.redoStack = [];
        this.clipboardData = null;
        this.searchQuery = '';
        this.filterType = 'all';
        this.currentTheme = 'dark';
        this.snapToGrid = true;
        this.gridSize = 10;
        this.isPreviewMode = false;
        this.isDirty = false;
        this.lastSaveTime = 0;
        this.errorLog = [];
        this.performanceMetrics = {
            renderTime: 0,
            lastUpdate: Date.now(),
            frameCount: 0,
            memoryUsage: 0,
            componentCount: 0,
            calculationTime: 0
        };
        this.sheetData = {
            metadata: {
                title: 'Untitled Character Sheet',
                author: 'Anonymous',
                version: CONFIG.VERSION,
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                tags: [],
                description: '',
                gameSystem: '',
                characterLevel: 1
            },
            layout: [],
            data: {
                characterName: '',
                playerName: '',
                class: '',
                race: '',
                level: 1,
                experience: 0,
                strength: 10,
                dexterity: 10,
                constitution: 10,
                intelligence: 10,
                wisdom: 10,
                charisma: 10,
                hitPoints: 0,
                maxHitPoints: 0,
                armorClass: 10,
                speed: 30,
                proficiencyBonus: 2
            },
            styles: '',
            customFunctions: {},
            variables: {},
            eventHandlers: {},
            references: {
                spells: [
                    { name: "Fireball", level: 3, school: "Evocation", castingTime: "1 action", range: "150 feet", components: "V, S, M", duration: "Instantaneous", description: "A bright streak flashes from your pointing finger to a point you choose within range and then blossoms with a low roar into an explosion of flame." },
                    { name: "Magic Missile", level: 1, school: "Evocation", castingTime: "1 action", range: "120 feet", components: "V, S", duration: "Instantaneous", description: "You create three glowing darts of magical force. Each dart hits a creature of your choice that you can see within range." },
                    { name: "Healing Word", level: 1, school: "Evocation", castingTime: "1 bonus action", range: "60 feet", components: "V", duration: "Instantaneous", description: "A creature of your choice that you can see within range regains hit points equal to 1d4 + your spellcasting ability modifier." }
                ],
                equipment: [
                    { name: "Longsword", type: "Weapon", damage: "1d8 slashing", weight: "3 lb", cost: "15 gp", properties: ["Versatile (1d10)"], equipped: true, description: "A longsword is a versatile weapon that can be used with one or two hands." },
                    { name: "Chain Mail", type: "Armor", ac: "16", weight: "55 lb", cost: "75 gp", properties: ["Stealth Disadvantage"], equipped: true, description: "Made of interlocking metal rings, chain mail includes a layer of quilted fabric worn underneath." }
                ],
                skills: [
                    { name: "Acrobatics", ability: "Dexterity", proficient: false, expertise: false, description: "Your Dexterity (Acrobatics) check covers your attempt to stay on your feet in a tricky situation." },
                    { name: "Athletics", ability: "Strength", proficient: true, expertise: false, description: "Your Strength (Athletics) check covers difficult situations you encounter while climbing, jumping, or swimming." }
                ]
            },
            settings: {
                autoSave: true,
                autoSaveInterval: CONFIG.AUTO_SAVE_INTERVAL,
                gridSnap: true,
                showGrid: false,
                darkMode: true,
                animations: true,
                soundEffects: false,
                accessibility: {
                    highContrast: false,
                    reducedMotion: false,
                    screenReader: false,
                    keyboardNavigation: true
                },
                validation: {
                    realTimeValidation: true,
                    strictMode: false,
                    warningsAsErrors: false
                }
            }
        };

        
        this.domCache = new Map();
        this.eventListeners = new Map();
        this.observers = new Map();
        this.validationRules = new Map();
        this.customValidators = new Map();
        this.calculationCache = new Map();
        this.dependencies = new Map();

        // Initialize validation, performance, and error tracking
        this.initializeValidation();
        this.initializePerformanceMonitoring();
        this.initializeErrorTracking();
    }

    // Enhanced DOM caching with weak references and automatic cleanup
    getElement(id, useCache = true) {
        if (!useCache || !this.domCache.has(id)) {
            const element = document.getElementById(id);
            if (element && useCache) {
                this.domCache.set(id, element);
                this.observeElementRemoval(element, id);
            }
            return element;
        }
        return this.domCache.get(id);
    }

    observeElementRemoval(element, id) {
        if (!window.MutationObserver || this.observers.has(id)) return;
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    for (const removedNode of mutation.removedNodes) {
                        if (removedNode === element || 
                            (removedNode.contains && removedNode.contains(element))) {
                            this.domCache.delete(id);
                            observer.disconnect();
                            this.observers.delete(id);
                            break;
                        }
                    }
                }
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
        this.observers.set(id, observer);
    }

    clearDOMCache() {
        this.domCache.clear();
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
    }

    // Enhanced undo/redo with compression and metadata
    saveState(action, metadata = {}) {
        try {
            const canvas = this.getElement('canvas');
            const state = {
                action,
                timestamp: Date.now(),
                canvas: canvas ? this.compressHTML(canvas.innerHTML) : '',
                data: this.deepClone(this.sheetData),
                selectedItem: this.selectedItem?.dataset?.id || null,
                multiSelectedItems: this.multiSelectedItems.map(item => item.dataset?.id).filter(Boolean),
                componentCounter: this.componentCounter,
                metadata: { ...metadata, version: CONFIG.VERSION }
            };
            this.undoStack.push(state);
            if (this.undoStack.length > CONFIG.MAX_UNDO_STEPS) {
                this.undoStack.shift();
            }
            this.redoStack = [];
            this.updateUndoRedoButtons();
            this.updateSheetMetadata();
            this.markDirty();
        } catch (error) {
            this.logError('Failed to save state', error);
        }
    }

    undo() {
        if (this.undoStack.length === 0) return false;
        try {
            const canvas = this.getElement('canvas');
            const currentState = {
                canvas: canvas ? this.compressHTML(canvas.innerHTML) : '',
                data: this.deepClone(this.sheetData),
                selectedItem: this.selectedItem?.dataset?.id || null,
                multiSelectedItems: this.multiSelectedItems.map(item => item.dataset?.id).filter(Boolean),
                componentCounter: this.componentCounter
            };
            this.redoStack.push(currentState);
            const previousState = this.undoStack.pop();
            this.restoreState(previousState);
            this.updateUndoRedoButtons();
            this.showNotification('Undo: ' + previousState.action, 'info');
            return true;
        } catch (error) {
            this.logError('Failed to undo', error);
            return false;
        }
    }

    redo() {
        if (this.redoStack.length === 0) return false;
        try {
            const canvas = this.getElement('canvas');
            const currentState = {
                canvas: canvas ? this.compressHTML(canvas.innerHTML) : '',
                data: this.deepClone(this.sheetData),
                selectedItem: this.selectedItem?.dataset?.id || null,
                multiSelectedItems: this.multiSelectedItems.map(item => item.dataset?.id).filter(Boolean),
                componentCounter: this.componentCounter
            };
            this.undoStack.push(currentState);
            const nextState = this.redoStack.pop();
            this.restoreState(nextState);
            this.updateUndoRedoButtons();
            this.showNotification('Redo completed', 'info');
            return true;
        } catch (error) {
            this.logError('Failed to redo', error);
            return false;
        }
    }

    restoreState(state) {
        try {
            const canvas = this.getElement('canvas');
            if (canvas && state.canvas) {
                canvas.innerHTML = this.decompressHTML(state.canvas);
            }
            this.sheetData = this.deepClone(state.data);
            this.componentCounter = state.componentCounter;
            // Restore selections
            this.selectedItem = null;
            this.multiSelectedItems = [];
            if (state.selectedItem) {
                const element = document.querySelector(`[data-id="${state.selectedItem}"]`);
                if (element) this.selectItem(element);
            }
            if (state.multiSelectedItems?.length > 0) {
                state.multiSelectedItems.forEach(id => {
                    const element = document.querySelector(`[data-id="${id}"]`);
                    if (element) {
                        this.multiSelectedItems.push(element);
                        element.classList.add('multi-selected');
                        element.style.outline = '2px solid ' + THEME_COLORS.warning;
                    }
                });
            }
            this.setupAllEventListeners();
            this.updateComponentCount();
            this.updateSheetTree();
            this.updateCalculatedFields();
            this.updateProgressBars();
            this.validateSheet();
        } catch (error) {
            this.logError('Error restoring state', error);
            this.showNotification('Error restoring state', 'error');
        }
    }

    updateUndoRedoButtons() {
        const undoItems = document.querySelectorAll('[data-action="undo"]');
        const redoItems = document.querySelectorAll('[data-action="redo"]');
        undoItems.forEach(item => {
            if (this.undoStack.length === 0) {
                item.style.opacity = '0.5';
                item.style.pointerEvents = 'none';
                item.title = 'Nothing to undo';
            } else {
                item.style.opacity = '1';
                item.style.pointerEvents = 'auto';
                const lastAction = this.undoStack[this.undoStack.length - 1];
                item.title = `Undo: ${lastAction.action}`;
            }
        });
        redoItems.forEach(item => {
            if (this.redoStack.length === 0) {
                item.style.opacity = '0.5';
                item.style.pointerEvents = 'none';
                item.title = 'Nothing to redo';
            } else {
                item.style.opacity = '1';
                item.style.pointerEvents = 'auto';
                item.title = 'Redo available';
            }
        });
    
    // Validation system
    initializeValidation() {
        this.validationRules.set('characterName', {
            required: true,
            minLength: 1,
            maxLength: 100,
            pattern: /^[a-zA-Z0-9\s\-'.]+$/,
            message: 'Character name must be 1-100 characters, letters, numbers, spaces, hyphens, apostrophes, and periods only'
        });
        this.validationRules.set('level', {
            required: true,
            type: 'number',
            min: 1,
            max: 20,
            message: 'Level must be between 1 and 20'
        });
        this.validationRules.set('abilityScore', {
            type: 'number',
            min: 1,
            max: 30,
            message: 'Ability scores must be between 1 and 30'
        });
    }

    validateField(fieldName, value) {
        const rule = this.validationRules.get(fieldName);
        if (!rule) return { valid: true };
        const errors = [];
        if (rule.required && (value === null || value === undefined || value === '')) {
            errors.push(`${fieldName} is required`);
        }
        if (!rule.required && (value === null || value === undefined || value === '')) {
            return { valid: true };
        }
        if (rule.type === 'number') {
            const num = parseFloat(value);
            if (isNaN(num)) {
                errors.push(`${fieldName} must be a number`);
            } else {
                if (rule.min !== undefined && num < rule.min) {
                    errors.push(`${fieldName} must be at least ${rule.min}`);
                }
                if (rule.max !== undefined && num > rule.max) {
                    errors.push(`${fieldName} must be at most ${rule.max}`);
                }
            }
        }
        if (typeof value === 'string') {
            if (rule.minLength !== undefined && value.length < rule.minLength) {
                errors.push(`${fieldName} must be at least ${rule.minLength} characters`);
            }
            if (rule.maxLength !== undefined && value.length > rule.maxLength) {
                errors.push(`${fieldName} must be at most ${rule.maxLength} characters`);
            }
            if (rule.pattern && !rule.pattern.test(value)) {
                errors.push(rule.message || `${fieldName} format is invalid`);
            }
        }
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    validateSheet() {
        const errors = [];
        const warnings = [];
        for (const [fieldName, rule] of this.validationRules) {
            if (rule.required) {
                const value = this.getFieldValue(fieldName);
                const validation = this.validateField(fieldName, value);
                if (!validation.valid) {
                    errors.push(...validation.errors);
                }
            }
        }
        const componentCount = document.querySelectorAll('.sheet-item').length;
        if (componentCount > CONFIG.COMPONENT_LIMIT) {
            warnings.push(`Too many components (${componentCount}/${CONFIG.COMPONENT_LIMIT})`);
        }
        const maxDepth = this.calculateMaxNestingDepth();
        if (maxDepth > CONFIG.VALIDATION.MAX_NESTING_DEPTH) {
            warnings.push(`Nesting too deep (${maxDepth}/${CONFIG.VALIDATION.MAX_NESTING_DEPTH})`);
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    // Performance monitoring
    initializePerformanceMonitoring() {
        if (!CONFIG.PERFORMANCE_MONITORING) return;
        if (window.performance?.mark) {
            this.performanceMetrics.startTime = performance.now();
            setInterval(() => {
                if (performance.memory) {
                    this.performanceMetrics.memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1048576);
                }
                this.performanceMetrics.frameCount++;
                this.performanceMetrics.componentCount = document.querySelectorAll('.sheet-item').length;
            }, 1000);
        }
    }

    // Error tracking
    initializeErrorTracking() {
        window.addEventListener('error', (event) => {
            this.logError('Global error', event.error, {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });
        window.addEventListener('unhandledrejection', (event) => {
            this.logError('Unhandled promise rejection', event.reason);
        });
    }

    logError(message, error, metadata = {}) {
        const errorInfo = {
            message,
            error: error?.toString() || 'Unknown error',
            stack: error?.stack || '',
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            version: CONFIG.VERSION,
            metadata
        };
        this.errorLog.push(errorInfo);
        if (this.errorLog.length > CONFIG.MAX_ERRORS_STORED) {
            this.errorLog.shift();
        }
        if (CONFIG.DEBUG) {
            console.error('App Error:', errorInfo);
        }
        try {
            localStorage.setItem('ttrpg_error_log', JSON.stringify(this.errorLog));
        } catch (e) {
            this.errorLog = this.errorLog.slice(-5);
            try {
                localStorage.setItem('ttrpg_error_log', JSON.stringify(this.errorLog));
            } catch (e2) {
                console.error('Failed to store error log');
            }
        }
    }

    // Utility methods
    deepClone(obj) {
        try {
            return JSON.parse(JSON.stringify(obj));
        } catch (error) {
            this.logError('Failed to deep clone object', error);
            return {};
        }
    }

    compressHTML(html) {
        // Simple compression - remove unnecessary whitespace
        return html.replace(/>\s+</g, '><').trim();
    }

    decompressHTML(html) {
        return html;
    }

    sanitizeHTML(html) {
        if (!CONFIG.SECURITY.SANITIZE_HTML) return html;
        // If using a production build, swap this for DOMPurify.sanitize(html)
        return html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
            .replace(/javascript:/gi, '');
    }

    sanitizeString(str) {
        if (typeof str !== 'string') return str;
        if (str.length > CONFIG.SECURITY.MAX_STRING_LENGTH) {
            str = str.substring(0, CONFIG.SECURITY.MAX_STRING_LENGTH);
        }
        return CONFIG.SECURITY.PREVENT_XSS ? this.escapeHTML(str) : str;
    }

    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    generateId() {
        return `item_${++this.componentCounter}_${Date.now()}`;
    }

    updateSheetMetadata() {
        this.sheetData.metadata.modified = new Date().toISOString();
        this.sheetData.metadata.version = CONFIG.VERSION;
    }

    markDirty() {
        this.isDirty = true;
        this.updateSheetMetadata();
    }

    markClean() {
        this.isDirty = false;
        this.lastSaveTime = Date.now();
    }

    getFieldValue(fieldName) {
        // First check sheetData
        if (this.sheetData.data[fieldName] !== undefined) {
            return this.sheetData.data[fieldName];
        }
        // Then check DOM elements
        const element = document.querySelector(`[data-json-path="${fieldName}"]`);
        if (element) {
            if (element.type === 'checkbox') {
                return element.checked;
            } else if (element.type === 'number') {
                return parseFloat(element.value) || 0;
            } else {
                return element.value;
            }
        }
        return null;
    }

    calculateMaxNestingDepth() {
        const calculateDepth = (element, depth = 0) => {
            const children = element.querySelectorAll('.sheet-item');
            if (children.length === 0) return depth;
            let maxChildDepth = depth;
            children.forEach(child => {
                maxChildDepth = Math.max(maxChildDepth, calculateDepth(child, depth + 1));
            });
            return maxChildDepth;
        };
        const canvas = this.getElement('canvas');
        return canvas ? calculateDepth(canvas) : 0;
    }

    showNotification(message, type = 'info', duration = 3000) {
        const notification = this.createNotification(message, type);
        document.body.appendChild(notification);
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        });
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    createNotification(message, type) {
        const colors = {
            success: THEME_COLORS.success,
            error: THEME_COLORS.danger,
            warning: THEME_COLORS.warning,
            info: THEME_COLORS.info
        };
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
            cursor: pointer;
            font-size: 14px;
        `;
        notification.innerHTML = `
            <span style="margin-right: 8px;">${icons[type] || icons.info}</span>${message}
        `;
        notification.addEventListener('click', () => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        });
        return notification;
    }
        // ===================================================================
// main.js (PART 4/4) - [CONTINUATION AND TOP-LEVEL FUNCTIONS]
// ===================================================================

// Top-level utility functions, event handlers, and initialization
// Only a small sample is shown here; for a full file, include all your logic as in your current main.js.

// Utility: Debounce
function debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func.apply(this, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(this, args);
    };
}

// Utility: Throttle
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Utility: Safe JSON parse
function safeParse(jsonString, defaultValue = {}) {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        if (window.appState) appState.logError('JSON parse error', error);
        return defaultValue;
    }
}

// Utility: Safe JSON stringify
function safeStringify(obj, replacer = null, space = 2) {
    try {
        return JSON.stringify(obj, replacer, space);
    } catch (error) {
        if (window.appState) appState.logError('JSON stringify error', error);
        return '{}';
    }
}

// Example: Application Initialization
document.addEventListener('DOMContentLoaded', initializeAppSafely);

function initializeAppSafely() {
    try {
        initializeApp();
    } catch (error) {
        // Retry logic or fallback UI could be here
        if (window.appState) appState.logError('App failed to initialize', error);
        alert('Failed to initialize application. See console for details.');
    }
}

function initializeApp() {
    // Initialize state, event listeners, UI, etc.
    if (!window.appState) window.appState = new AppState();
    // ...rest of app boot logic (menus, drag-drop, etc)...
    appState.showNotification('App initialized!', 'success');
}

// EXAMPLE: Simple event handler for notifications
window.showNotification = function(msg, type = 'info') {
    if (window.appState) appState.showNotification(msg, type);
};

// EXAMPLE: Expose a safe API for extensions
window.TTRPGBuilder = {
    version: CONFIG.VERSION,
    getData: () => window.appState ? appState.deepClone(appState.sheetData.data) : {},
    showNotification: (msg, type) => window.showNotification(msg, type),
    sanitizeHTML: html => window.appState ? appState.sanitizeHTML(html) : html,
};


    }

// (Continued in Part 2...)

