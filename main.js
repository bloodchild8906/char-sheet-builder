// ===================================================================
// TTRPG CHARACTER SHEET BUILDER - PRODUCTION READY v3.1.0
// Professional drag-and-drop character sheet builder for tabletop RPGs
// ===================================================================

'use strict';

// ===================================================================
// CONFIGURATION AND CONSTANTS
// ===================================================================

const CONFIG = {
    VERSION: '3.1.0',
    BUILD: 'production',
    DEBUG: false,
    PERFORMANCE_MONITORING: true,
    AUTO_SAVE_INTERVAL: 30000, // 30 seconds
    MAX_UNDO_STEPS: 50,
    MAX_ERRORS_STORED: 20,
    COMPONENT_LIMIT: 1000,
    FILE_SIZE_LIMIT: 10 * 1024 * 1024, // 10MB
    SUPPORTED_FILE_TYPES: ['.json'],
    
    // Validation rules
    VALIDATION: {
        MIN_COMPONENT_SPACING: 5,
        MAX_NESTING_DEPTH: 10,
        MAX_CALCULATION_COMPLEXITY: 100,
        REQUIRED_FIELDS: ['characterName']
    },
    
    // Security settings
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
    'row': 'ðŸ“‹', 'column': 'ðŸ“Š', 'text-input': 'ðŸ“', 'number-input': 'ðŸ”¢',
    'textarea': 'ðŸ“„', 'select': 'ðŸ”½', 'checkbox': 'â˜‘ï¸', 'label': 'ðŸ·ï¸',
    'calculated': 'ðŸ§®', 'progress-bar': 'ðŸ“Š', 'dice-button': 'ðŸŽ²', 
    'reference-button': 'ðŸ“š', 'info-button': 'â„¹ï¸', 'button': 'ðŸ”˜',
    'table': 'ðŸ“‹', 'tabs': 'ðŸ“‚', 'slider': 'ðŸŽšï¸', 'rating': 'â­', 
    'chart': 'ðŸ“Š', 'image': 'ðŸ–¼ï¸', 'event': 'âš¡'
};

let DEFAULT_FONTS = "'JetBrains Mono', 'Consolas', 'Monaco', 'Courier New', monospace";

let LABELS = {
    'text-input': 'Text Input:',
    'number-input': 'Number Input:',
    'textarea': 'Text Area:',
    'select': 'Dropdown:',
    'checkbox': 'Checkbox Option',
    'label': 'Label Text',
    'calculated': 'Calculated Field:',
    'progress-bar': 'Progress Bar:',
    'dice-button': 'ðŸŽ² Roll Dice',
    'reference-button': 'ðŸ“š View References',
    'info-button': 'â„¹ï¸ Show Info',
    'button': 'Click Me',
    'event': 'Event Trigger',
    'image': 'Image',
    'table': 'Data Table',
    'tabs': 'Tab Container',
    'slider': 'Slider Input',
    'rating': 'Star Rating'
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
                // Character basics
                characterName: '',
                playerName: '',
                class: '',
                race: '',
                level: 1,
                experience: 0,
                // Ability scores
                strength: 10,
                dexterity: 10,
                constitution: 10,
                intelligence: 10,
                wisdom: 10,
                charisma: 10,
                // Derived stats
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
                    {
                        name: "Fireball",
                        level: 3,
                        school: "Evocation",
                        castingTime: "1 action",
                        range: "150 feet",
                        components: "V, S, M",
                        duration: "Instantaneous",
                        description: "A bright streak flashes from your pointing finger to a point you choose within range and then blossoms with a low roar into an explosion of flame."
                    },
                    {
                        name: "Magic Missile",
                        level: 1,
                        school: "Evocation",
                        castingTime: "1 action",
                        range: "120 feet",
                        components: "V, S",
                        duration: "Instantaneous",
                        description: "You create three glowing darts of magical force. Each dart hits a creature of your choice that you can see within range."
                    },
                    {
                        name: "Healing Word",
                        level: 1,
                        school: "Evocation",
                        castingTime: "1 bonus action",
                        range: "60 feet",
                        components: "V",
                        duration: "Instantaneous",
                        description: "A creature of your choice that you can see within range regains hit points equal to 1d4 + your spellcasting ability modifier."
                    }
                ],
                equipment: [
                    {
                        name: "Longsword",
                        type: "Weapon",
                        damage: "1d8 slashing",
                        weight: "3 lb",
                        cost: "15 gp",
                        properties: ["Versatile (1d10)"],
                        equipped: true,
                        description: "A longsword is a versatile weapon that can be used with one or two hands."
                    },
                    {
                        name: "Chain Mail",
                        type: "Armor",
                        ac: "16",
                        weight: "55 lb",
                        cost: "75 gp",
                        properties: ["Stealth Disadvantage"],
                        equipped: true,
                        description: "Made of interlocking metal rings, chain mail includes a layer of quilted fabric worn underneath."
                    }
                ],
                skills: [
                    {
                        name: "Acrobatics",
                        ability: "Dexterity",
                        proficient: false,
                        expertise: false,
                        description: "Your Dexterity (Acrobatics) check covers your attempt to stay on your feet in a tricky situation."
                    },
                    {
                        name: "Athletics",
                        ability: "Strength",
                        proficient: true,
                        expertise: false,
                        description: "Your Strength (Athletics) check covers difficult situations you encounter while climbing, jumping, or swimming."
                    }
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
        
        // Initialize validation system
        this.initializeValidation();
        
        // Initialize performance monitoring
        this.initializePerformanceMonitoring();
        
        // Initialize error tracking
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
                if (element) {
                    this.selectItem(element);
                }
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
    }
    
    // Validation system
    initializeValidation() {
        this.validationRules.set('characterName', {
            required: true,
            minLength: 1,
            maxLength: 100,
            pattern: /^[a-zA-Z0-9\s\-\'\.]+$/,
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
        
        // Required validation
        if (rule.required && (value === null || value === undefined || value === '')) {
            errors.push(`${fieldName} is required`);
        }
        
        // Skip other validations if empty and not required
        if (!rule.required && (value === null || value === undefined || value === '')) {
            return { valid: true };
        }
        
        // Type validation
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
        
        // String validations
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
        
        // Validate required fields
        for (const [fieldName, rule] of this.validationRules) {
            if (rule.required) {
                const value = this.getFieldValue(fieldName);
                const validation = this.validateField(fieldName, value);
                if (!validation.valid) {
                    errors.push(...validation.errors);
                }
            }
        }
        
        // Validate component count
        const componentCount = document.querySelectorAll('.sheet-item').length;
        if (componentCount > CONFIG.COMPONENT_LIMIT) {
            warnings.push(`Too many components (${componentCount}/${CONFIG.COMPONENT_LIMIT})`);
        }
        
        // Validate nesting depth
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
        
        // Store in localStorage for debugging
        try {
            localStorage.setItem('ttrpg_error_log', JSON.stringify(this.errorLog));
        } catch (e) {
            // Storage might be full, clear old errors
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
        
        // Basic HTML sanitization - remove script tags and dangerous attributes
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
        
        // Animate in
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        });
        
        // Auto-hide
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
            success: 'âœ…',
            error: 'âŒ',
            warning: 'âš ï¸',
            info: 'â„¹ï¸'
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
    
    setupAllEventListeners() {
        this.setupDragAndDrop();
        this.setupKeyboardShortcuts();
        this.setupContextMenu();
        this.setupTooltips();
        this.setupAccessibility();
        
        const sheetItems = document.querySelectorAll('.sheet-item');
        sheetItems.forEach(item => {
            if (item.classList.contains('row') || item.classList.contains('column')) {
                this.setupContainerDragDrop(item);
            }
            this.setupInputListeners(item);
            this.setupAdvancedInteractions(item);
        });
    }
    
    cleanup() {
        this.clearDOMCache();
        this.eventListeners.forEach((listener, element) => {
            element.removeEventListener(listener.event, listener.handler);
        });
        this.eventListeners.clear();
        
        // Cancel any running timers
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        if (this.performanceTimer) {
            clearInterval(this.performanceTimer);
        }
    }
}

// ===================================================================
// GLOBAL INSTANCE AND BACKWARD COMPATIBILITY
// ===================================================================

const appState = new AppState();

// Backward compatibility
let selectedItem = null;
let currentPanel = 'explorer';
let componentCounter = 0;
let currentDropdownMenu = null;
let sheetData = appState.sheetData;

// ===================================================================
// UTILITY FUNCTIONS
// ===================================================================

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

function safeParse(jsonString, defaultValue = {}) {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        appState.logError('JSON parse error', error);
        return defaultValue;
    }
}

function safeStringify(obj, replacer = null, space = 2) {
    try {
        return JSON.stringify(obj, replacer, space);
    } catch (error) {
        appState.logError('JSON stringify error', error);
        return '{}';
    }
}

// ===================================================================
// APPLICATION INITIALIZATION
// ===================================================================

document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
    try {
        showLoadingIndicator();
        
        // Check browser compatibility
        if (!checkBrowserCompatibility()) {
            showBrowserWarning();
            return;
        }
        
        // Initialize all systems
        await Promise.all([
            initializeDragAndDrop(),
            initializeMenus(),
            initializeKeyboardShortcuts(),
            initializeEventDelegation(),
            loadUserPreferences(),
            setupAutoSave(),
            setupPerformanceMonitoring()
        ]);
        
        // Initial UI updates
        updateComponentCount();
        updateSheetTree();
        applyFontSetting();
        applyTheme();
        
        hideLoadingIndicator();
        appState.showNotification('Application initialized successfully', 'success');
        
        // Load auto-save if available
        setTimeout(loadAutoSave, 1000);
        
        // Show welcome for new users
        if (isFirstTimeUser()) {
            setTimeout(showWelcome, 2000);
        }
        
    } catch (error) {
        appState.logError('Initialization error', error);
        hideLoadingIndicator();
        showErrorDialog('Initialization failed: ' + error.message);
    }
}

function checkBrowserCompatibility() {
    const features = {
        localStorage: typeof Storage !== 'undefined',
        json: typeof JSON !== 'undefined',
        classList: 'classList' in document.createElement('div'),
        addEventListener: 'addEventListener' in window,
        promises: typeof Promise !== 'undefined',
        fetch: typeof fetch !== 'undefined'
    };
    
    const missing = Object.entries(features)
        .filter(([name, supported]) => !supported)
        .map(([name]) => name);
    
    if (missing.length > 0) {
        console.error('Browser missing required features:', missing);
        return false;
    }
    return true;
}

function showBrowserWarning() {
    const warning = document.createElement('div');
    warning.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.9); color: white; display: flex;
        align-items: center; justify-content: center; z-index: 10000;
        font-family: Arial, sans-serif; text-align: center;
    `;
    
    warning.innerHTML = `
        <div>
            <h2>âš ï¸ Browser Not Supported</h2>
            <p>This application requires a modern browser with support for:</p>
            <ul style="text-align: left; display: inline-block;">
                <li>Local Storage</li>
                <li>JSON parsing</li>
                <li>DOM classList</li>
                <li>Event listeners</li>
                <li>Promises</li>
                <li>Fetch API</li>
            </ul>
            <p>Please update your browser or try:</p>
            <p><strong>Chrome 60+, Firefox 55+, Safari 12+, Edge 79+</strong></p>
        </div>
    `;
    
    document.body.appendChild(warning);
}

function showLoadingIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'loading-indicator';
    indicator.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: linear-gradient(135deg, #1e1e1e, #2d2d30);
        display: flex; align-items: center; justify-content: center;
        z-index: 10000; color: white;
    `;
    
    indicator.innerHTML = `
        <div style="text-align: center; max-width: 400px; padding: 40px;">
            <div class="loading-spinner" style="
                width: 60px; height: 60px; border: 4px solid #3e3e42;
                border-top: 4px solid #4fc3f7; border-radius: 50%;
                animation: spin 1s linear infinite; margin: 0 auto 30px;
            "></div>
            <h2 style="margin: 0 0 20px 0; color: #4fc3f7;">TTRPG Character Sheet Builder</h2>
            <div style="font-size: 18px; margin-bottom: 15px;">Loading Professional Edition v${CONFIG.VERSION}</div>
            <div style="font-size: 14px; color: #858585; line-height: 1.6;">
                Initializing advanced features...<br>
                Enhanced drag & drop, real-time calculations, auto-save
            </div>
            <div class="loading-bar" style="
                width: 100%; height: 4px; background: #3e3e42;
                border-radius: 2px; margin-top: 30px; overflow: hidden;
            ">
                <div style="
                    width: 0%; height: 100%; background: linear-gradient(90deg, #4fc3f7, #29b6f6);
                    animation: loadProgress 2s ease-out;
                "></div>
            </div>
        </div>
        <style>
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            @keyframes loadProgress { 0% { width: 0%; } 100% { width: 100%; } }
        </style>
    `;
    
    document.body.appendChild(indicator);
}

function hideLoadingIndicator() {
    const indicator = document.getElementById('loading-indicator');
    if (indicator) {
        indicator.style.transition = 'opacity 0.5s ease';
        indicator.style.opacity = '0';
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }, 500);
    }
}

function isFirstTimeUser() {
    return !localStorage.getItem('ttrpg_builder_visited');
}

function showWelcome() {
    localStorage.setItem('ttrpg_builder_visited', 'true');
    
    const modal = createWelcomeModal();
    document.body.appendChild(modal);
    showModal('welcome-modal');
}

function createWelcomeModal() {
    const modal = document.createElement('div');
    modal.id = 'welcome-modal';
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px; text-align: center;">
            <div class="modal-header">
                <h2 style="margin: 0; color: #4fc3f7;">ðŸŽ² Welcome to Character Sheet Builder!</h2>
            </div>
            <div style="padding: 30px; line-height: 1.6;">
                <div style="font-size: 18px; margin-bottom: 25px;">Create professional character sheets for any TTRPG system</div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0;">
                    <div style="padding: 20px; background: #2d2d30; border-radius: 8px;">
                        <div style="font-size: 24px; margin-bottom: 10px;">ðŸš€</div>
                        <h4 style="margin: 0 0 10px 0;">Quick Start</h4>
                        <p style="margin: 0; font-size: 14px;">Drag components from the sidebar to build your sheet</p>
                    </div>
                    <div style="padding: 20px; background: #2d2d30; border-radius: 8px;">
                        <div style="font-size: 24px; margin-bottom: 10px;">ðŸ§®</div>
                        <h4 style="margin: 0 0 10px 0;">Smart Calculations</h4>
                        <p style="margin: 0; font-size: 14px;">Auto-calculate stats, modifiers, and more</p>
                    </div>
                    <div style="padding: 20px; background: #2d2d30; border-radius: 8px;">
                        <div style="font-size: 24px; margin-bottom: 10px;">ðŸŽ²</div>
                        <h4 style="margin: 0 0 10px 0;">Interactive Features</h4>
                        <p style="margin: 0; font-size: 14px;">Dice rolling, progress bars, reference system</p>
                    </div>
                    <div style="padding: 20px; background: #2d2d30; border-radius: 8px;">
                        <div style="font-size: 24px; margin-bottom: 10px;">ðŸ’¾</div>
                        <h4 style="margin: 0 0 10px 0;">Auto-Save</h4>
                        <p style="margin: 0; font-size: 14px;">Never lose your work with automatic saving</p>
                    </div>
                </div>
                
                <div style="background: #1e4d2b; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h4 style="margin: 0 0 10px 0; color: #4caf50;">âœ¨ New in v${CONFIG.VERSION}</h4>
                    <ul style="margin: 0; padding-left: 20px; text-align: left;">
                        <li>Enhanced validation and error handling</li>
                        <li>Improved performance monitoring</li>
                        <li>Advanced accessibility features</li>
                        <li>Production-ready security measures</li>
                        <li>Comprehensive undo/redo system</li>
                    </ul>
                </div>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 20px;">
                <div>
                    <button onclick="showTutorial()" class="btn" style="margin-right: 10px;">
                        ðŸ“š Take Tutorial
                    </button>
                    <button onclick="loadTemplate()" class="btn btn-secondary">
                        ðŸ“‹ Load Template
                    </button>
                </div>
                <button onclick="closeModal('welcome-modal'); this.closest('.modal').remove();" class="btn" style="background: #4fc3f7;">
                    Let's Build! ðŸš€
                </button>
            </div>
        </div>
    `;
    
    return modal;
}

// ===================================================================
// EVENT DELEGATION SYSTEM
// ===================================================================

function initializeEventDelegation() {
    document.addEventListener('click', handleGlobalClick);
    document.addEventListener('input', handleGlobalInput);
    document.addEventListener('change', handleGlobalChange);
    document.addEventListener('keydown', handleGlobalKeyDown);
    document.addEventListener('contextmenu', handleGlobalContextMenu);
    document.addEventListener('dragstart', handleGlobalDragStart);
    document.addEventListener('dragover', handleGlobalDragOver);
    document.addEventListener('drop', handleGlobalDrop);
    document.addEventListener('dragend', handleGlobalDragEnd);
    
    return Promise.resolve();
}

function handleGlobalClick(e) {
    try {
        // Multi-selection with Ctrl+Click
        if (e.ctrlKey && e.target.closest('.sheet-item')) {
            e.preventDefault();
            const item = e.target.closest('.sheet-item');
            toggleMultiSelect(item);
            return;
        }
        
        // Handle dropdown closing
        if (!e.target.closest('.menu-item') && !e.target.closest('.dropdown-menu')) {
            closeDropdown();
        }
        
        // Handle component selection
        if (e.target.closest('.sheet-item') && !e.target.closest('.item-controls')) {
            const item = e.target.closest('.sheet-item');
            selectItem(item);
        }
        
        // Handle control buttons
        if (e.target.classList.contains('control-btn')) {
            e.stopPropagation();
            const item = e.target.closest('.sheet-item');
            const btnText = e.target.textContent;
            
            // Add click animation
            e.target.style.transform = 'scale(0.9)';
            setTimeout(() => {
                e.target.style.transform = '';
            }, 150);
            
            switch (btnText) {
                case 'âš™':
                    selectItem(item);
                    break;
                case 'Ã—':
                    deleteItem(item);
                    break;
                case 'ðŸ“‹':
                    copyComponent(item);
                    break;
                case 'â†‘':
                    moveComponentUp(item);
                    break;
                case 'â†“':
                    moveComponentDown(item);
                    break;
            }
        }
        
        // Handle dice rolls
        if (e.target.closest('[data-type="dice-button"]')) {
            const button = e.target.closest('[data-type="dice-button"]');
            rollDice(button);
        }
        
        // Handle reference buttons
        if (e.target.closest('[data-type="reference-button"]')) {
            const button = e.target.closest('[data-type="reference-button"]');
            showReferenceList(button);
        }
        
        // Handle info buttons
        if (e.target.closest('[data-type="info-button"]')) {
            const button = e.target.closest('[data-type="info-button"]');
            showInfoBox(button);
        }
        
    } catch (error) {
        appState.logError('Global click handler error', error);
    }
}

const debouncedUpdateValue = debounce((input) => {
    updateDataValue(input);
    validateInput(input);
    updateDependentComponents(input);
}, 300);

function handleGlobalInput(e) {
    try {
        if (e.target.matches('[data-json-path]')) {
            debouncedUpdateValue(e.target);
        }
        
        if (e.target.matches('[data-search]')) {
            performSearch(e.target.value);
        }
        
    } catch (error) {
        appState.logError('Global input handler error', error);
    }
}

function handleGlobalChange(e) {
    try {
        if (e.target.matches('[data-json-path]')) {
            updateDataValue(e.target);
            triggerChangeEvents(e.target);
        }
    } catch (error) {
        appState.logError('Global change handler error', error);
    }
}

function handleGlobalKeyDown(e) {
    if (e.target.matches('input, textarea, [contenteditable]')) {
        if (e.key !== 'Escape' && !(e.ctrlKey || e.metaKey)) {
            return;
        }
    }
    
    handleKeyboardShortcuts(e);
}

function handleGlobalContextMenu(e) {
    if (e.target.closest('.sheet-item')) {
        e.preventDefault();
        showContextMenu(e, e.target.closest('.sheet-item'));
    }
}

function handleGlobalDragStart(e) {
    if (e.target.matches('.component-item[draggable="true"]')) {
        e.dataTransfer.setData('text/plain', e.target.dataset.type);
        e.target.style.opacity = '0.5';
        addDragPreview(e);
    }
}

function handleGlobalDragOver(e) {
    const dropZone = findDropZone(e.target);
    if (dropZone) {
        e.preventDefault();
        highlightDropZone(dropZone, true);
    }
}

function handleGlobalDrop(e) {
    const dropZone = findDropZone(e.target);
    if (dropZone) {
        e.preventDefault();
        highlightDropZone(dropZone, false);
        
        const componentType = e.dataTransfer.getData('text/plain');
        if (componentType) {
            handleComponentDrop(componentType, dropZone, e);
        }
    }
}

function handleGlobalDragEnd(e) {
    if (e.target.matches('.component-item[draggable="true"]')) {
        e.target.style.opacity = '';
        removeDragPreview();
    }
    
    // Clear all drop zone highlights
    document.querySelectorAll('.drag-over').forEach(element => {
        highlightDropZone(element, false);
    });
}

// ===================================================================
// DRAG AND DROP SYSTEM
// ===================================================================

function initializeDragAndDrop() {
    try {
        const componentItems = document.querySelectorAll('.component-item[draggable="true"]');
        const canvas = appState.getElement('canvas');

        if (!canvas) {
            throw new Error('Canvas element not found');
        }

        componentItems.forEach(item => {
            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragend', handleDragEnd);
        });

        canvas.addEventListener('dragover', handleCanvasDragOver);
        canvas.addEventListener('dragleave', handleCanvasDragLeave);
        canvas.addEventListener('drop', handleCanvasDrop);
        
        return Promise.resolve();
    } catch (error) {
        appState.logError('Error setting up drag and drop', error);
        return Promise.reject(error);
    }
}

function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', this.dataset.type);
    e.dataTransfer.effectAllowed = 'copy';
    this.style.opacity = '0.5';
    this.classList.add('dragging');
}

function handleDragEnd(e) {
    this.style.opacity = '';
    this.classList.remove('dragging');
}

function handleCanvasDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
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
        handleComponentDrop(componentType, container, e);
    }
}

function handleComponentDrop(componentType, container, e) {
    try {
        appState.saveState('Add Component');
        const newElement = createComponent(componentType, container);
        
        if (newElement && e) {
            positionDroppedComponent(newElement, container, e);
        }
        
        updateComponentCount();
        updateSheetTree();
        updateStatus(`${componentType} component added`);
        triggerAutoSave();
        
        // Auto-select new component
        if (newElement) {
            setTimeout(() => selectItem(newElement), 100);
        }
        
        // Validate after adding component
        if (appState.sheetData.settings.validation.realTimeValidation) {
            const validation = appState.validateSheet();
            if (!validation.valid || validation.warnings.length > 0) {
                showValidationResults(validation);
            }
        }
        
    } catch (error) {
        appState.logError('Error handling component drop', error);
        appState.showNotification('Failed to create component', 'error');
    }
}

function positionDroppedComponent(element, container, e) {
    try {
        const rect = container.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;
        
        if (appState.snapToGrid) {
            x = Math.round(x / appState.gridSize) * appState.gridSize;
            y = Math.round(y / appState.gridSize) * appState.gridSize;
        }
        
        // Apply positioning for absolute positioned components
        if (container.id === 'canvas' && 
            window.getComputedStyle(element).position === 'absolute') {
            element.style.left = x + 'px';
            element.style.top = y + 'px';
        }
    } catch (error) {
        appState.logError('Error positioning dropped component', error);
    }
}

function findDropTarget(element) {
    while (element && element !== appState.getElement('canvas')) {
        if (element.classList.contains('row') || 
            element.classList.contains('column') || 
            element.id === 'canvas') {
            return element;
        }
        element = element.parentElement;
    }
    return null;
}

function findDropZone(element) {
    while (element && element !== document.body) {
        if (element.classList.contains('sheet-item') || element.id === 'canvas') {
            return element;
        }
        element = element.parentElement;
    }
    return null;
}

function addDragPreview(e) {
    const preview = document.createElement('div');
    preview.id = 'drag-preview';
    preview.style.cssText = `
        position: absolute; pointer-events: none; z-index: 10000;
        background: ${THEME_COLORS.primary}; color: white; padding: 8px 12px;
        border-radius: 4px; font-size: 12px; transform: translate(-50%, -100%);
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    preview.textContent = `Creating ${e.target.dataset.type}`;
    
    document.body.appendChild(preview);
    
    const updatePreview = (event) => {
        preview.style.left = event.pageX + 'px';
        preview.style.top = event.pageY + 'px';
    };
    
    document.addEventListener('dragover', updatePreview);
    document.addEventListener('dragend', () => {
        document.removeEventListener('dragover', updatePreview);
        removeDragPreview();
    });
}

function removeDragPreview() {
    const preview = document.getElementById('drag-preview');
    if (preview && preview.parentNode) {
        preview.parentNode.removeChild(preview);
    }
}

function highlightDropZone(zone, highlight) {
    if (highlight) {
        zone.classList.add('drag-over');
        zone.style.backgroundColor = 'rgba(79, 195, 247, 0.1)';
        zone.style.borderColor = THEME_COLORS.primary;
        zone.style.borderStyle = 'dashed';
        zone.style.borderWidth = '2px';
    } else {
        zone.classList.remove('drag-over');
        zone.style.backgroundColor = '';
        zone.style.borderColor = '';
        zone.style.borderStyle = '';
        zone.style.borderWidth = '';
    }
}

// ===================================================================
// COMPONENT CREATION AND MANAGEMENT
// ===================================================================

function createComponent(type, container) {
    try {
        const id = appState.generateId();
        
        // Remove placeholder if exists
        const placeholder = container.querySelector('.canvas-placeholder, .container-placeholder');
        if (placeholder) {
            placeholder.remove();
        }
        
        const label = LABELS[type] || type;
        const componentHTML = generateComponentHTML(type, id, label);
        
        if (!componentHTML) {
            throw new Error(`Unknown component type: ${type}`);
        }
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = appState.sanitizeHTML(componentHTML);
        const newElement = tempDiv.firstElementChild;
        
        if (!newElement) {
            throw new Error('Failed to create component element');
        }
        
        // Add smooth animation for new components
        newElement.style.opacity = '0';
        newElement.style.transform = 'scale(0.8)';
        container.appendChild(newElement);
        
        // Animate in
        requestAnimationFrame(() => {
            newElement.style.transition = 'all 0.3s ease';
            newElement.style.opacity = '1';
            newElement.style.transform = 'scale(1)';
            
            // Remove transition after animation
            setTimeout(() => {
                newElement.style.transition = '';
            }, 300);
        });
        
        // Setup event listeners
        if (type === 'row' || type === 'column') {
            setupContainerDragDrop(newElement);
        }
        setupInputListeners(newElement);
        setupAdvancedInteractions(newElement);
        
        return newElement;
        
    } catch (error) {
        appState.logError('Error creating component', error);
        appState.showNotification(`Error creating ${type} component`, 'error');
        return null;
    }
}

function generateComponentHTML(type, id, label) {
    const baseControls = `
        <div class="item-controls">
            <button class="control-btn" title="Settings" data-action="settings">âš™</button>
            <button class="control-btn" title="Copy" data-action="copy">ðŸ“‹</button>
            <button class="control-btn" title="Move Up" data-action="up">â†‘</button>
            <button class="control-btn" title="Move Down" data-action="down">â†“</button>
            <button class="control-btn delete" title="Delete" data-action="delete">Ã—</button>
        </div>
    `;
    
    const templates = {
        'text-input': () => `
            <div class="sheet-item" data-type="text-input" data-id="${id}">
                ${baseControls}
                <label>${label}</label>
                <input type="text" placeholder="Enter text..." data-json-path="textInput_${id}" 
                       style="width: 100%;" onfocus="this.style.borderColor='${THEME_COLORS.primary}'" 
                       onblur="this.style.borderColor='#3e3e42'">
            </div>
        `,
        
        'number-input': () => `
            <div class="sheet-item" data-type="number-input" data-id="${id}">
                ${baseControls}
                <label>${label}</label>
                <input type="number" placeholder="0" data-json-path="numberInput_${id}" 
                       style="width: 100%;" onfocus="this.style.borderColor='${THEME_COLORS.primary}'" 
                       onblur="this.style.borderColor='#3e3e42'">
            </div>
        `,
        
        'textarea': () => `
            <div class="sheet-item" data-type="textarea" data-id="${id}">
                ${baseControls}
                <label>${label}</label>
                <textarea placeholder="Enter text..." data-json-path="textarea_${id}" 
                          rows="3" style="width: 100%; resize: vertical;" 
                          onfocus="this.style.borderColor='${THEME_COLORS.primary}'" 
                          onblur="this.style.borderColor='#3e3e42'"></textarea>
            </div>
        `,
        
        'select': () => `
            <div class="sheet-item" data-type="select" data-id="${id}">
                ${baseControls}
                <label>${label}</label>
                <select data-json-path="select_${id}" style="width: 100%;" 
                        onfocus="this.style.borderColor='${THEME_COLORS.primary}'" 
                        onblur="this.style.borderColor='#3e3e42'">
                    <option value="">Choose an option</option>
                    <option value="option1">Option 1</option>
                    <option value="option2">Option 2</option>
                    <option value="option3">Option 3</option>
                </select>
            </div>
        `,
        
        'checkbox': () => `
            <div class="sheet-item" data-type="checkbox" data-id="${id}">
                ${baseControls}
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                    <input type="checkbox" data-json-path="checkbox_${id}" 
                           style="width: auto; margin: 0;">
                    <span>${label}</span>
                </label>
            </div>
        `,
        
        'label': () => `
            <div class="sheet-item" data-type="label" data-id="${id}">
                ${baseControls}
                <div style="font-weight: bold; font-size: 16px; color: ${THEME_COLORS.primary};">
                    ${label}
                </div>
            </div>
        `,
        
        'calculated': () => `
            <div class="sheet-item" data-type="calculated" data-id="${id}">
                ${baseControls}
                <label>${label}</label>
                <div style="position: relative;">
                    <span class="calculated-value" data-calculation="0" data-rules="" 
                          style="font-weight: bold; color: ${THEME_COLORS.primary}; display: block; 
                                 padding: 12px; background: #1e1e1e; border: 1px solid #3e3e42; 
                                 border-radius: 4px; font-size: 16px; text-align: center; min-height: 20px;">0</span>
                    <div class="calculation-indicator" style="position: absolute; top: -8px; right: -8px; 
                                                               width: 16px; height: 16px; background: ${THEME_COLORS.primary}; 
                                                               border-radius: 50%; display: flex; align-items: center; 
                                                               justify-content: center; font-size: 10px; color: white;">ðŸ§®</div>
                </div>
            </div>
        `,
        
        'progress-bar': () => `
            <div class="sheet-item" data-type="progress-bar" data-id="${id}">
                ${baseControls}
                <label>${label}</label>
                <div class="progress-container" style="width: 100%; height: 20px; background: #3e3e42; 
                                                       border-radius: 10px; overflow: hidden; position: relative;">
                    <div class="progress-fill" data-json-path="progress_${id}" data-max-value="100" 
                         style="height: 100%; background: linear-gradient(90deg, ${THEME_COLORS.success}, #66bb6a); 
                                width: 0%; transition: width 0.3s ease;"></div>
                    <div class="progress-text" style="position: absolute; top: 50%; left: 50%; 
                                                      transform: translate(-50%, -50%); color: white; 
                                                      font-size: 12px; font-weight: bold;">0%</div>
                </div>
            </div>
        `,
        
        'dice-button': () => `
            <div class="sheet-item" data-type="dice-button" data-id="${id}">
                ${baseControls}
                <button class="btn" onclick="rollDice(this)" style="width: 100%; padding: 12px;">
                    ðŸŽ² ${label}
                </button>
            </div>
        `,
        
        'reference-button': () => `
            <div class="sheet-item" data-type="reference-button" data-id="${id}">
                ${baseControls}
                <button class="btn" onclick="showReferenceList(this)" style="width: 100%; padding: 12px;">
                    ðŸ“š ${label}
                </button>
            </div>
        `,
        
        'info-button': () => `
            <div class="sheet-item" data-type="info-button" data-id="${id}">
                ${baseControls}
                <button class="btn btn-secondary" onclick="showInfoBox(this)" style="width: 100%; padding: 12px;">
                    â„¹ï¸ ${label}
                </button>
            </div>
        `,
        
        'row': () => `
            <div class="row sheet-item" data-type="row" data-id="${id}" 
                 style="display: flex; flex-direction: row; gap: 12px; padding: 16px; 
                        border: 2px dashed transparent; min-height: 80px; position: relative; 
                        border-radius: 8px; transition: all 0.3s ease;" 
                 onmouseover="this.style.borderColor='${THEME_COLORS.primary}'" 
                 onmouseout="this.style.borderColor='transparent'">
                ${baseControls}
                <div class="container-placeholder" style="position: absolute; top: 50%; left: 50%; 
                                                           transform: translate(-50%, -50%); color: #858585; 
                                                           pointer-events: none; font-size: 14px; text-align: center;">
                    <div style="font-size: 24px; margin-bottom: 8px;">ðŸ“‹</div>
                    <div>Row Container</div>
                    <small>Drop items here</small>
                </div>
            </div>
        `,
        
        'column': () => `
            <div class="column sheet-item" data-type="column" data-id="${id}" 
                 style="display: flex; flex-direction: column; gap: 12px; padding: 16px; 
                        border: 2px dashed transparent; min-height: 80px; position: relative; 
                        border-radius: 8px; transition: all 0.3s ease;" 
                 onmouseover="this.style.borderColor='${THEME_COLORS.primary}'" 
                 onmouseout="this.style.borderColor='transparent'">
                ${baseControls}
                <div class="container-placeholder" style="position: absolute; top: 50%; left: 50%; 
                                                           transform: translate(-50%, -50%); color: #858585; 
                                                           pointer-events: none; font-size: 14px; text-align: center;">
                    <div style="font-size: 24px; margin-bottom: 8px;">ðŸ“Š</div>
                    <div>Column Container</div>
                    <small>Drop items here</small>
                </div>
            </div>
        `
    };
    
    const generator = templates[type];
    return generator ? generator() : null;
}

function setupContainerDragDrop(container) {
    try {
        container.addEventListener('dragover', handleContainerDragOver);
        container.addEventListener('dragleave', handleContainerDragLeave);
        container.addEventListener('drop', handleContainerDrop);
    } catch (error) {
        appState.logError('Error setting up container drag and drop', error);
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
        if (placeholder) {
            placeholder.remove();
        }
        handleComponentDrop(componentType, this, e);
    }
}

function setupInputListeners(element) {
    try {
        const inputs = element.querySelectorAll('[data-json-path]');
        inputs.forEach(input => {
            // Enhanced listeners for different input types
            if (input.type === 'number') {
                input.addEventListener('input', function() {
                    const value = parseFloat(this.value);
                    if (!isNaN(value)) {
                        updateDataValue(this);
                        updateProgressBars();
                        updateCalculatedFields();
                    }
                });
            } else if (input.type === 'checkbox') {
                input.addEventListener('change', function() {
                    updateDataValue(this);
                    updateCalculatedFields();
                });
            } else {
                input.addEventListener('input', function() {
                    updateDataValue(this);
                });
            }
            
            // Real-time validation
            if (appState.sheetData.settings.validation.realTimeValidation) {
                input.addEventListener('blur', function() {
                    validateInput(this);
                });
            }
        });
        
        // Setup listeners for progress bars
        if (element.dataset.type === 'progress-bar') {
            updateProgressBars();
        }
        
    } catch (error) {
        appState.logError('Error setting up input listeners', error);
    }
}

function setupAdvancedInteractions(element) {
    try {
        const type = element.dataset.type;
        
        // Add hover effects with performance optimization
        let hoverTimeout;
        element.addEventListener('mouseenter', function() {
            clearTimeout(hoverTimeout);
            if (!this.classList.contains('selected')) {
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = `0 4px 12px rgba(79, 195, 247, 0.2)`;
            }
        });
        
        element.addEventListener('mouseleave', function() {
            hoverTimeout = setTimeout(() => {
                if (!this.classList.contains('selected')) {
                    this.style.transform = '';
                    this.style.boxShadow = '';
                }
            }, 100);
        });
        
        // Type-specific setup
        switch (type) {
            case 'calculated':
                setupCalculatedField(element);
                break;
            case 'progress-bar':
                setupProgressBar(element);
                break;
            case 'dice-button':
                setupDiceButton(element);
                break;
            case 'reference-button':
                setupReferenceButton(element);
                break;
            case 'info-button':
                setupInfoButton(element);
                break;
        }
        
    } catch (error) {
        appState.logError('Error setting up advanced interactions', error);
    }
}

function setupCalculatedField(element) {
    const calculatedValue = element.querySelector('.calculated-value');
    if (calculatedValue) {
        // Initialize with default calculation
        calculatedValue.dataset.rules = calculatedValue.dataset.rules || '0';
        updateCalculatedFields();
    }
}

function setupProgressBar(element) {
    const progressFill = element.querySelector('.progress-fill');
    if (progressFill) {
        // Initialize progress bar
        progressFill.dataset.maxValue = progressFill.dataset.maxValue || '100';
        updateProgressBars();
    }
}

function setupDiceButton(element) {
    const button = element.querySelector('button');
    if (button && !button.dataset.diceType) {
        button.dataset.diceType = '1d20';
    }
}

function setupReferenceButton(element) {
    const button = element.querySelector('button');
    if (button && !button.dataset.referenceType) {
        button.dataset.referenceType = 'spells';
    }
}

function setupInfoButton(element) {
    const button = element.querySelector('button');
    if (button && !button.dataset.infoContent) {
        button.dataset.infoContent = 'Click to edit this information box content.';
    }
}

// ===================================================================
// COMPONENT INTERACTION HANDLERS
// ===================================================================

function rollDice(button) {
    try {
        const diceType = button.dataset.diceType || '1d20';
        const result = calculateDiceRoll(diceType);
        
        const modal = appState.getElement('dice-modal');
        const resultElement = appState.getElement('dice-result');
        
        if (modal && resultElement) {
            resultElement.innerHTML = `
                <div style="font-size: 36px; margin-bottom: 10px;">${result.total}</div>
                <div style="font-size: 14px; opacity: 0.8;">
                    ${diceType}: ${result.rolls.join(' + ')}
                    ${result.modifier ? ` + ${result.modifier}` : ''}
                </div>
            `;
            
            showModal('dice-modal');
            
            // Add animation
            resultElement.style.transform = 'scale(0.8)';
            resultElement.style.opacity = '0';
            setTimeout(() => {
                resultElement.style.transition = 'all 0.3s ease';
                resultElement.style.transform = 'scale(1)';
                resultElement.style.opacity = '1';
            }, 100);
        }
        
        appState.showNotification(`Rolled ${diceType}: ${result.total}`, 'info');
        
    } catch (error) {
        appState.logError('Error rolling dice', error);
        appState.showNotification('Error rolling dice', 'error');
    }
}

function calculateDiceRoll(diceString) {
    try {
        // Parse dice string like "2d6+3" or "1d20"
        const match = diceString.match(/(\d+)d(\d+)(?:([+-])(\d+))?/i);
        if (!match) {
            throw new Error('Invalid dice format');
        }
        
        const [, numDice, diceSize, modifierSign, modifierValue] = match;
        const rolls = [];
        
        for (let i = 0; i < parseInt(numDice); i++) {
            rolls.push(Math.floor(Math.random() * parseInt(diceSize)) + 1);
        }
        
        let total = rolls.reduce((sum, roll) => sum + roll, 0);
        let modifier = 0;
        
        if (modifierSign && modifierValue) {
            modifier = parseInt(modifierValue);
            if (modifierSign === '-') modifier = -modifier;
            total += modifier;
        }
        
        return {
            total,
            rolls,
            modifier,
            diceString
        };
        
    } catch (error) {
        appState.logError('Error calculating dice roll', error);
        return { total: 0, rolls: [0], modifier: 0, diceString };
    }
}

function showReferenceList(button) {
    try {
        const referenceType = button.dataset.referenceType || 'spells';
        const references = appState.sheetData.references[referenceType] || [];
        
        const modal = appState.getElement('reference-modal');
        const listElement = appState.getElement('reference-list');
        
        if (modal && listElement) {
            listElement.innerHTML = references.map(ref => `
                <div class="reference-item" onclick="showReferenceDetails('${ref.name}', '${referenceType}')">
                    <h4>${ref.name}</h4>
                    <p>${ref.description || ref.effect || 'No description available'}</p>
                    ${ref.level ? `<div style="font-size: 11px; color: #858585;">Level ${ref.level}</div>` : ''}
                </div>
            `).join('');
            
            // Update modal title
            const modalTitle = modal.querySelector('.modal-header h3');
            if (modalTitle) {
                modalTitle.textContent = `ðŸ“š ${referenceType.charAt(0).toUpperCase() + referenceType.slice(1)}`;
            }
            
            showModal('reference-modal');
        }
        
    } catch (error) {
        appState.logError('Error showing reference list', error);
        appState.showNotification('Error loading references', 'error');
    }
}

function showReferenceDetails(name, type) {
    try {
        const references = appState.sheetData.references[type] || [];
        const reference = references.find(ref => ref.name === name);
        
        if (reference) {
            const detailsHtml = `
                <h3>${reference.name}</h3>
                ${reference.level ? `<p><strong>Level:</strong> ${reference.level}</p>` : ''}
                ${reference.school ? `<p><strong>School:</strong> ${reference.school}</p>` : ''}
                ${reference.castingTime ? `<p><strong>Casting Time:</strong> ${reference.castingTime}</p>` : ''}
                ${reference.range ? `<p><strong>Range:</strong> ${reference.range}</p>` : ''}
                ${reference.components ? `<p><strong>Components:</strong> ${reference.components}</p>` : ''}
                ${reference.duration ? `<p><strong>Duration:</strong> ${reference.duration}</p>` : ''}
                ${reference.damage ? `<p><strong>Damage:</strong> ${reference.damage}</p>` : ''}
                ${reference.effect ? `<p><strong>Effect:</strong> ${reference.effect}</p>` : ''}
                <p><strong>Description:</strong> ${reference.description}</p>
            `;
            
            showInfoModal(reference.name, detailsHtml);
        }
        
    } catch (error) {
        appState.logError('Error showing reference details', error);
    }
}

function showInfoBox(button) {
    try {
        const infoContent = button.dataset.infoContent || 'No information available.';
        const infoTitle = button.dataset.infoTitle || 'Information';
        
        showInfoModal(infoTitle, infoContent);
        
    } catch (error) {
        appState.logError('Error showing info box', error);
        appState.showNotification('Error loading information', 'error');
    }
}

function showInfoModal(title, content) {
    const modal = appState.getElement('info-modal');
    const titleElement = appState.getElement('info-title');
    const contentElement = appState.getElement('info-content');
    
    if (modal && titleElement && contentElement) {
        titleElement.textContent = title;
        contentElement.innerHTML = content;
        showModal('info-modal');
    }
}

// ===================================================================
// SELECTION AND MULTI-SELECT SYSTEM
// ===================================================================

function selectItem(item) {
    try {
        if (!item) return;
        
        // Clear multi-selection if not holding Ctrl
        if (!event || !event.ctrlKey) {
            clearMultiSelection();
        }
        
        // Remove previous single selection
        const selected = document.querySelectorAll('.sheet-item.selected');
        selected.forEach(el => {
            el.classList.remove('selected');
            el.style.outline = '';
        });
        
        // Add selection to new item
        item.classList.add('selected');
        item.style.outline = `2px solid ${THEME_COLORS.primary}`;
        appState.selectedItem = item;
        selectedItem = item; // Keep global sync
        
        // Switch to properties panel
        switchPanel('properties');
        showItemProperties(item);
        
        // Update status
        updateStatus(`Selected ${item.dataset.type} component`);
        
        // Accessibility announcement
        if (appState.sheetData.settings.accessibility.screenReader) {
            announceToScreenReader(`Selected ${item.dataset.type} component`);
        }
        
    } catch (error) {
        appState.logError('Error selecting item', error);
    }
}

function toggleMultiSelect(item) {
    try {
        const index = appState.multiSelectedItems.indexOf(item);
        
        if (index === -1) {
            // Add to selection
            appState.multiSelectedItems.push(item);
            item.classList.add('multi-selected');
            item.style.outline = `2px solid ${THEME_COLORS.warning}`;
        } else {
            // Remove from selection
            appState.multiSelectedItems.splice(index, 1);
            item.classList.remove('multi-selected');
            item.style.outline = '';
        }
        
        updateStatus(`Selected ${appState.multiSelectedItems.length} components`);
        updateMultiSelectActions();
        
    } catch (error) {
        appState.logError('Error toggling multi-select', error);
    }
}

function clearMultiSelection() {
    appState.multiSelectedItems.forEach(item => {
        item.classList.remove('multi-selected');
        item.style.outline = '';
    });
    appState.multiSelectedItems = [];
    updateMultiSelectActions();
}

function updateMultiSelectActions() {
    const toolbar = document.getElementById('multi-select-toolbar');
    if (!toolbar && appState.multiSelectedItems.length > 0) {
        createMultiSelectToolbar();
    } else if (toolbar && appState.multiSelectedItems.length === 0) {
        toolbar.remove();
    } else if (toolbar) {
        // Update count
        const countSpan = toolbar.querySelector('.selection-count');
        if (countSpan) {
            countSpan.textContent = `${appState.multiSelectedItems.length} selected`;
        }
    }
}

function createMultiSelectToolbar() {
    const toolbar = document.createElement('div');
    toolbar.id = 'multi-select-toolbar';
    toolbar.style.cssText = `
        position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
        background: ${THEME_COLORS.surface}; border: 1px solid ${THEME_COLORS.primary};
        border-radius: 8px; padding: 12px; display: flex; gap: 12px;
        z-index: 1000; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        align-items: center;
    `;
    
    toolbar.innerHTML = `
        <span class="selection-count" style="color: ${THEME_COLORS.primary}; font-weight: bold;">
            ${appState.multiSelectedItems.length} selected
        </span>
        <button onclick="deleteMultiSelected()" class="btn btn-danger">Delete All</button>
        <button onclick="copyMultiSelected()" class="btn">Copy All</button>
        <button onclick="alignMultiSelected()" class="btn btn-secondary">Align</button>
        <button onclick="clearMultiSelection()" class="btn btn-secondary">Clear</button>
    `;
    
    document.body.appendChild(toolbar);
}

function deleteMultiSelected() {
    if (appState.multiSelectedItems.length === 0) return;
    
    if (confirm(`Delete ${appState.multiSelectedItems.length} selected components?`)) {
        appState.saveState('Delete Multiple Components');
        
        appState.multiSelectedItems.forEach(item => {
            if (item.parentNode) {
                item.remove();
            }
        });
        
        clearMultiSelection();
        updateComponentCount();
        updateSheetTree();
        updateStatus('Deleted multiple components');
        triggerAutoSave();
    }
}

function copyMultiSelected() {
    if (appState.multiSelectedItems.length === 0) return;
    
    try {
        const clipboardData = appState.multiSelectedItems.map(item => {
            const clone = item.cloneNode(true);
            const controls = clone.querySelector('.item-controls');
            if (controls) controls.remove();
            
            return {
                type: item.dataset.type,
                html: clone.outerHTML
            };
        });
        
        appState.clipboardData = {
            type: 'multiple',
            data: clipboardData,
            timestamp: Date.now()
        };
        
        appState.showNotification(`Copied ${appState.multiSelectedItems.length} components`, 'success');
        
    } catch (error) {
        appState.logError('Error copying multiple components', error);
        appState.showNotification('Error copying components', 'error');
    }
}

function alignMultiSelected() {
    if (appState.multiSelectedItems.length < 2) return;
    
    appState.saveState('Align Components');
    
    // Get the first item as reference
    const reference = appState.multiSelectedItems[0];
    const refRect = reference.getBoundingClientRect();
    
    appState.multiSelectedItems.slice(1).forEach(item => {
        // Align to top of reference item
        item.style.position = 'relative';
        item.style.top = (refRect.top - item.getBoundingClientRect().top) + 'px';
    });
    
    appState.showNotification(`Aligned ${appState.multiSelectedItems.length} components`, 'success');
    triggerAutoSave();
}

function selectAllComponents() {
    try {
        const components = document.querySelectorAll('.sheet-item');
        appState.multiSelectedItems = [];
        
        components.forEach(component => {
            component.classList.add('multi-selected');
            component.style.outline = `2px solid ${THEME_COLORS.warning}`;
            appState.multiSelectedItems.push(component);
        });
        
        updateMultiSelectActions();
        appState.showNotification(`Selected ${components.length} components`, 'info');
        
    } catch (error) {
        appState.logError('Error selecting all components', error);
    }
}

// ===================================================================
// COMPONENT OPERATIONS
// ===================================================================

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
                if (item.parentNode) {
                    item.remove();
                }
                
                if (appState.selectedItem === item) {
                    appState.selectedItem = null;
                    selectedItem = null;
                    clearPropertiesPanel();
                }
                
                updateComponentCount();
                updateSheetTree();
                updateStatus(`${itemType} component deleted`);
                triggerAutoSave();
            }, 300);
        }
    } catch (error) {
        appState.logError('Error deleting item', error);
    }
}

function copyComponent(item) {
    if (!item) {
        item = appState.selectedItem;
    }
    
    if (!item) {
        appState.showNotification('No component selected to copy', 'warning');
        return;
    }
    
    try {
        const clone = item.cloneNode(true);
        const controls = clone.querySelector('.item-controls');
        if (controls) controls.remove();
        
        appState.clipboardData = {
            type: 'single',
            data: {
                type: item.dataset.type,
                html: clone.outerHTML
            },
            timestamp: Date.now()
        };
        
        appState.showNotification('Component copied', 'success');
    } catch (error) {
        appState.logError('Error copying component', error);
        appState.showNotification('Error copying component', 'error');
    }
}

function pasteComponent() {
    if (!appState.clipboardData) {
        appState.showNotification('Nothing to paste', 'warning');
        return;
    }
    
    try {
        const canvas = appState.getElement('canvas');
        if (!canvas) {
            appState.showNotification('Canvas not found', 'error');
            return;
        }
        
        appState.saveState('Paste Component');
        
        if (appState.clipboardData.type === 'single') {
            pasteSingleComponent(appState.clipboardData.data, canvas);
        } else if (appState.clipboardData.type === 'multiple') {
            appState.clipboardData.data.forEach(componentData => {
                pasteSingleComponent(componentData, canvas);
            });
        }
        
        updateComponentCount();
        updateSheetTree();
        triggerAutoSave();
        
    } catch (error) {
        appState.logError('Error pasting component', error);
        appState.showNotification('Error pasting component', 'error');
    }
}

function pasteSingleComponent(componentData, container) {
    try {
        const newId = appState.generateId();
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = componentData.html;
        const newElement = tempDiv.firstElementChild;
        
        // Update ID and data attributes
        newElement.dataset.id = newId;
        
        // Add controls back
        const controlsHTML = `
            <div class="item-controls">
                <button class="control-btn" title="Settings" data-action="settings">âš™</button>
                <button class="control-btn" title="Copy" data-action="copy">ðŸ“‹</button>
                <button class="control-btn" title="Move Up" data-action="up">â†‘</button>
                <button class="control-btn" title="Move Down" data-action="down">â†“</button>
                <button class="control-btn delete" title="Delete" data-action="delete">Ã—</button>
            </div>
        `;
        newElement.insertAdjacentHTML('afterbegin', controlsHTML);
        
        // Update JSON paths
        const jsonPathElements = newElement.querySelectorAll('[data-json-path]');
        jsonPathElements.forEach(element => {
            const oldPath = element.dataset.jsonPath;
            const newPath = oldPath.replace(/_\d+$/, '_' + newId.split('_')[1]);
            element.dataset.jsonPath = newPath;
        });
        
        container.appendChild(newElement);
        
        // Setup event listeners
        if (componentData.type === 'row' || componentData.type === 'column') {
            setupContainerDragDrop(newElement);
        }
        setupInputListeners(newElement);
        setupAdvancedInteractions(newElement);
        
        // Select the new component
        selectItem(newElement);
        
        appState.showNotification('Component pasted', 'success');
        
    } catch (error) {
        appState.logError('Error pasting single component', error);
        throw error;
    }
}

function duplicateComponent(item) {
    if (!item) item = appState.selectedItem;
    if (!item) return;
    
    copyComponent(item);
    pasteComponent();
}

function moveComponentUp(item) {
    if (!item) return;
    
    const parent = item.parentElement;
    const previousSibling = item.previousElementSibling;
    
    if (previousSibling && !previousSibling.classList.contains('container-placeholder')) {
        appState.saveState('Move Component Up');
        parent.insertBefore(item, previousSibling);
        triggerAutoSave();
        appState.showNotification('Component moved up', 'info');
    }
}

function moveComponentDown(item) {
    if (!item) return;
    
    const parent = item.parentElement;
    const nextSibling = item.nextElementSibling;
    
    if (nextSibling) {
        appState.saveState('Move Component Down');
        parent.insertBefore(nextSibling, item);
        triggerAutoSave();
        appState.showNotification('Component moved down', 'info');
    }
}

// ===================================================================
// DATA MANAGEMENT
// ===================================================================

function updateDataValue(input) {
    try {
        const path = input.dataset.jsonPath;
        if (!path) return;
        
        const oldValue = appState.sheetData.data[path];
        let newValue;
        
        if (input.type === 'checkbox') {
            newValue = input.checked;
        } else if (input.type === 'number') {
            newValue = parseFloat(input.value) || 0;
        } else {
            newValue = appState.sanitizeString(input.value);
        }
        
        appState.sheetData.data[path] = newValue;
        
        // Trigger change events only if value actually changed
        if (oldValue !== newValue) {
            triggerChangeEvents(input);
            appState.markDirty();
        }
        
    } catch (error) {
        appState.logError('Error updating data value', error);
    }
}

function triggerChangeEvents(input) {
    try {
        // Update calculated fields
        updateCalculatedFields();
        
        // Update progress bars
        updateProgressBars();
        
        // Update dependent components
        updateDependentComponents(input);
        
        // Trigger auto-save
        triggerAutoSave();
        
    } catch (error) {
        appState.logError('Error triggering change events', error);
    }
}

function updateDependentComponents(input) {
    try {
        const path = input.dataset.jsonPath;
        if (!path) return;
        
        // Find components that depend on this field
        const dependents = document.querySelectorAll(`[data-depends*="${path}"]`);
        dependents.forEach(dependent => {
            if (dependent.classList.contains('calculated-value')) {
                const rules = dependent.dataset.rules;
                if (rules) {
                    try {
                        const result = evaluateCalculationRules(rules);
                        dependent.textContent = formatCalculationResult(result, dependent);
                        
                        // Visual feedback for update
                        dependent.style.backgroundColor = THEME_COLORS.primary;
                        setTimeout(() => {
                            dependent.style.backgroundColor = '#1e1e1e';
                        }, 300);
                    } catch (error) {
                        dependent.textContent = 'Error';
                        dependent.title = error.message;
                        dependent.style.backgroundColor = THEME_COLORS.danger;
                    }
                }
            }
        });
    } catch (error) {
        appState.logError('Error updating dependent components', error);
    }
}

function validateInput(input) {
    try {
        if (!appState.sheetData.settings.validation.realTimeValidation) return;
        
        const path = input.dataset.jsonPath;
        const value = input.value;
        
        // Extract field name from path (e.g., "characterName" from "textInput_characterName_123")
        const fieldName = path.split('_')[1] || path;
        
        const validation = appState.validateField(fieldName, value);
        
        // Clear previous validation state
        input.classList.remove('validation-error', 'validation-warning');
        input.removeAttribute('title');
        
        if (!validation.valid) {
            input.classList.add('validation-error');
            input.style.borderColor = THEME_COLORS.danger;
            input.title = validation.errors.join(', ');
            
            if (appState.sheetData.settings.validation.warningsAsErrors) {
                appState.showNotification(`Validation error: ${validation.errors[0]}`, 'error');
            }
        } else {
            input.style.borderColor = '#3e3e42';
        }
        
        return validation;
        
    } catch (error) {
        appState.logError('Error validating input', error);
        return { valid: true };
    }
}

// ===================================================================
// CALCULATION ENGINE
// ===================================================================

function updateCalculatedFields() {
    try {
        const startTime = performance.now();
        const calculatedElements = document.querySelectorAll('.calculated-value[data-rules]');
        let updatedCount = 0;
        let errorCount = 0;
        
        // Clear calculation cache for this update cycle
        appState.calculationCache.clear();
        
        calculatedElements.forEach(element => {
            const rules = element.dataset.rules;
            if (rules && rules.trim()) {
                try {
                    const result = evaluateCalculationRules(rules, element);
                    const formattedResult = formatCalculationResult(result, element);
                    
                    if (element.textContent !== formattedResult) {
                        element.textContent = formattedResult;
                        updatedCount++;
                        
                        // Enhanced visual feedback
                        element.style.backgroundColor = THEME_COLORS.primary;
                        element.style.transform = 'scale(1.05)';
                        setTimeout(() => {
                            element.style.backgroundColor = '#1e1e1e';
                            element.style.transform = 'scale(1)';
                        }, 300);
                    }
                    
                    // Clear error state
                    element.classList.remove('calculation-error');
                    element.removeAttribute('title');
                    
                } catch (error) {
                    element.textContent = 'Error';
                    element.classList.add('calculation-error');
                    element.style.backgroundColor = THEME_COLORS.danger;
                    element.title = error.message;
                    errorCount++;
                    appState.logError('Calculation error in element', error, { elementId: element.closest('.sheet-item')?.dataset?.id });
                }
            }
        });
        
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        
        if (updatedCount > 0 || errorCount > 0) {
            let message = `Updated ${updatedCount} calculated fields`;
            if (errorCount > 0) {
                message += ` (${errorCount} errors)`;
            }
            message += ` in ${duration}ms`;
            updateStatus(message);
        }
        
        // Update performance metrics
        appState.performanceMetrics.calculationTime = duration;
        appState.performanceMetrics.lastCalculationCount = calculatedElements.length;
        
    } catch (error) {
        appState.logError('Critical error in calculation engine', error);
        appState.showNotification('Calculation engine error', 'error');
    }
}

function evaluateCalculationRules(rules, element) {
    const cacheKey = rules + '_' + JSON.stringify(appState.sheetData.data);
    
    if (appState.calculationCache.has(cacheKey)) {
        return appState.calculationCache.get(cacheKey);
    }
    
    try {
        const expressions = rules.split(';').filter(rule => rule.trim());
        let result = 0;
        const context = createCalculationContext();

        for (const expression of expressions) {
            result = evaluateExpression(expression.trim(), context);
        }

        // Cache the result
        appState.calculationCache.set(cacheKey, result);
        return result;
        
    } catch (error) {
        throw new Error(`Calculation error: ${error.message}`);
    }
}

function createCalculationContext() {
    return {
        variables: appState.sheetData.data,
        functions: {
            // Mathematical functions
            sum(...values) {
                return values.reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
            },
            avg(...values) {
                const nums = values.map(v => parseFloat(v) || 0);
                return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
            },
            max(...values) {
                const nums = values.map(v => parseFloat(v) || 0);
                return Math.max(...nums);
            },
            min(...values) {
                const nums = values.map(v => parseFloat(v) || 0);
                return Math.min(...nums);
            },
            count(...values) {
                return values.filter(v => v !== null && v !== undefined && v !== '').length;
            },
            round(value, precision = 0) {
                const factor = Math.pow(10, precision);
                return Math.round((parseFloat(value) || 0) * factor) / factor;
            },
            floor(value) {
                return Math.floor(parseFloat(value) || 0);
            },
            ceil(value) {
                return Math.ceil(parseFloat(value) || 0);
            },
            abs(value) {
                return Math.abs(parseFloat(value) || 0);
            },
            
            // Conditional functions
            if(condition, trueValue, falseValue) {
                return condition ? trueValue : falseValue;
            },
            
            // RPG-specific functions
            mod(value, divisor = 1) {
                return (parseFloat(value) || 0) % (parseFloat(divisor) || 1);
            },
            modifier(abilityScore) {
                return Math.floor(((parseFloat(abilityScore) || 10) - 10) / 2);
            },
            proficiencyBonus(level) {
                return Math.ceil((parseFloat(level) || 1) / 4) + 1;
            },
            clamp(value, min, max) {
                const num = parseFloat(value) || 0;
                const minNum = parseFloat(min) || 0;
                const maxNum = parseFloat(max) || 100;
                return Math.max(minNum, Math.min(maxNum, num));
            },
            
            // String functions
            concat(...values) {
                return values.join('');
            },
            
            // Array functions
            join(array, separator = ', ') {
                return Array.isArray(array) ? array.join(separator) : array;
            }
        }
    };
}

function evaluateExpression(expression, context) {
    try {
        // Simple expression evaluator for basic mathematical operations
        // Replace variable references with actual values
        let processedExpression = expression;
        
        // Replace field references like [fieldName]
        const fieldMatches = expression.match(/\[([^\]]+)\]/g);
        if (fieldMatches) {
            fieldMatches.forEach(match => {
                const fieldName = match.slice(1, -1);
                const value = appState.getFieldValue(fieldName) || 0;
                processedExpression = processedExpression.replace(match, value);
            });
        }
        
        // Replace function calls
        const functionMatches = expression.match(/(\w+)\([^)]*\)/g);
        if (functionMatches) {
            functionMatches.forEach(match => {
                const functionCall = match;
                const functionName = functionCall.split('(')[0];
                
                if (context.functions[functionName]) {
                    try {
                        // Extract arguments
                        const argsString = functionCall.slice(functionName.length + 1, -1);
                        const args = argsString.split(',').map(arg => {
                            const trimmed = arg.trim();
                            // Check if it's a number
                            if (!isNaN(trimmed) && trimmed !== '') {
                                return parseFloat(trimmed);
                            }
                            // Check if it's a field reference
                            if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                                const fieldName = trimmed.slice(1, -1);
                                return appState.getFieldValue(fieldName) || 0;
                            }
                            // Return as string
                            return trimmed.replace(/^['"]|['"]$/g, '');
                        });
                        
                        const result = context.functions[functionName](...args);
                        processedExpression = processedExpression.replace(match, result);
                    } catch (error) {
                        throw new Error(`Error in function ${functionName}: ${error.message}`);
                    }
                }
            });
        }
        
        // Evaluate the final mathematical expression
        // This is a simplified evaluator - in production, consider using a proper expression parser
        const result = evaluateBasicMath(processedExpression);
        
        if (isNaN(result)) {
            throw new Error(`Invalid calculation result: ${processedExpression}`);
        }
        
        return result;
        
    } catch (error) {
        throw new Error(`Expression evaluation failed: ${error.message}`);
    }
}

function evaluateBasicMath(expression) {
    try {
        // Basic safety check - only allow numbers, operators, parentheses, and whitespace
        if (!/^[\d\s+\-*/().]+$/.test(expression)) {
            throw new Error('Invalid characters in expression');
        }
        
        // Use Function constructor as a safer alternative to eval for mathematical expressions
        return new Function('return ' + expression)();
    } catch (error) {
        throw new Error(`Math evaluation failed: ${error.message}`);
    }
}

function formatCalculationResult(result, element) {
    try {
        const formatType = element.dataset.format || 'number';
        const precision = parseInt(element.dataset.precision) || 2;
        
        switch (formatType) {
            case 'integer':
                return Math.round(result).toString();
            case 'currency':
                return ' + result.toFixed(2);
            case 'percentage':
                return (result * 100).toFixed(1) + '%';
            case 'signed':
                return (result >= 0 ? '+' : '') + result.toFixed(precision);
            case 'modifier':
                return (result >= 0 ? '+' : '') + Math.floor(result).toString();
            default:
                if (result === Math.floor(result)) {
                    return result.toString();
                }
                return result.toFixed(precision);
        }
    } catch (error) {
        appState.logError('Error formatting calculation result', error);
        return result.toString();
    }
}

// ===================================================================
// PROGRESS BAR MANAGEMENT
// ===================================================================

function updateProgressBars() {
    try {
        const progressBars = document.querySelectorAll('[data-type="progress-bar"]');
        
        progressBars.forEach(progressBar => {
            const progressFill = progressBar.querySelector('.progress-fill');
            const progressText = progressBar.querySelector('.progress-text');
            
            if (!progressFill) return;
            
            const listenTo = progressFill.dataset.listenTo;
            const maxValue = parseFloat(progressFill.dataset.maxValue) || 100;
            let percentage = 0;
            let currentValue = 0;
            let targetMaxValue = maxValue;
            
            if (listenTo) {
                const targetComponent = document.querySelector(`[data-id="${listenTo}"]`);
                if (targetComponent) {
                    if (targetComponent.dataset.type === 'fraction-number') {
                        const currentInput = targetComponent.querySelector('[data-json-path*="current"]');
                        const maxInput = targetComponent.querySelector('[data-json-path*="max"]');
                        currentValue = currentInput ? parseFloat(currentInput.value) || 0 : 0;
                        targetMaxValue = maxInput ? parseFloat(maxInput.value) || maxValue : maxValue;
                    } else if (targetComponent.dataset.type === 'number-input') {
                        const input = targetComponent.querySelector('input[type="number"]');
                        currentValue = input ? parseFloat(input.value) || 0 : 0;
                    }
                }
            } else {
                const jsonPath = progressFill.dataset.jsonPath;
                if (jsonPath) {
                    currentValue = appState.getFieldValue(jsonPath) || 0;
                }
            }
            
            percentage = targetMaxValue > 0 ? (currentValue / targetMaxValue) * 100 : 0;
            percentage = Math.max(0, Math.min(100, percentage));
            
            // Update progress bar
            progressFill.style.width = percentage + '%';
            
            // Update text
            if (progressText) {
                progressText.textContent = `${Math.round(percentage)}%`;
            }
            
            // Dynamic color based on percentage
            let color;
            if (percentage < 25) {
                color = `linear-gradient(90deg, ${THEME_COLORS.danger}, #ef5350)`;
            } else if (percentage < 50) {
                color = `linear-gradient(90deg, ${THEME_COLORS.warning}, #ffb74d)`;
            } else if (percentage < 75) {
                color = 'linear-gradient(90deg, #ffc107, #ffca28)';
            } else {
                color = `linear-gradient(90deg, ${THEME_COLORS.success}, #66bb6a)`;
            }
            progressFill.style.background = color;
        });
        
    } catch (error) {
        appState.logError('Error updating progress bars', error);
    }
}

// ===================================================================
// PANEL MANAGEMENT
// ===================================================================

function switchPanel(panelName) {
    try {
        // Remove active class from all icons
        const activityIcons = document.querySelectorAll('.activity-icon');
        activityIcons.forEach(icon => icon.classList.remove('active'));
        
        // Add active class to selected panel
        const targetIcon = document.querySelector(`[data-panel="${panelName}"]`);
        if (targetIcon) {
            targetIcon.classList.add('active');
        }
        
        // Hide all panels
        const panels = document.querySelectorAll('.panel-content');
        panels.forEach(panel => panel.style.display = 'none');
        
        // Show selected panel
        const targetPanel = document.getElementById(`${panelName}-panel`);
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
        
        const sidebarTitle = appState.getElement('sidebar-title');
        if (sidebarTitle) {
            sidebarTitle.textContent = titles[panelName] || panelName.toUpperCase();
        }
        
        appState.currentPanel = panelName;
        currentPanel = panelName;
        
        // Panel-specific updates with error handling
        try {
            if (panelName === 'properties' && appState.selectedItem) {
                showItemProperties(appState.selectedItem);
            } else if (panelName === 'explorer') {
                updateSheetTree();
            } else if (panelName === 'data') {
                // Use setTimeout to ensure DOM is ready
                setTimeout(() => {
                    updateDataPanel();
                }, 10);
            }
        } catch (error) {
            appState.logError('Error in panel-specific updates', error);
        }
        
    } catch (error) {
        appState.logError('Error switching panel', error);
    }
}

function showItemProperties(item) {
    try {
        const propertiesContent = appState.getElement('properties-content');
        if (!propertiesContent) return;
        
        const type = item.dataset.type;
        const id = item.dataset.id;

        const html = `
            <div class="properties-container">
                <div style="margin-bottom: 20px; padding: 15px; background: #2d2d30; border-radius: 4px;">
                    <h4 style="margin: 0; color: ${THEME_COLORS.primary}; display: flex; align-items: center; gap: 10px;">
                        <span>${COMPONENT_ICONS[type] || 'ðŸ“¦'}</span>
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
                
                ${generatePropertiesHTML(type, item)}
                
                <div style="margin-top: 20px; padding: 15px; background: #2d2d30; border-radius: 4px;">
                    <h5 style="margin: 0 0 15px 0; color: ${THEME_COLORS.primary};">ðŸŽ¨ Styling Options</h5>
                    <div class="form-group">
                        <label>Font Size:</label>
                        <select onchange="updateItemStyle('fontSize', this.value)">
                            <option value="">Default</option>
                            <option value="12px">12px</option>
                            <option value="14px">14px</option>
                            <option value="16px">16px</option>
                            <option value="18px">18px</option>
                            <option value="20px">20px</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Text Alignment:</label>
                        <select onchange="updateItemStyle('textAlign', this.value)">
                            <option value="">Default</option>
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Color:</label>
                        <input type="color" onchange="updateItemStyle('color', this.value)" 
                               style="width: 100%; height: 40px;">
                    </div>
                </div>
            </div>
        `;
        
        propertiesContent.innerHTML = html;
        
    } catch (error) {
        appState.logError('Error showing item properties', error);
    }
}

function generatePropertiesHTML(type, item) {
    try {
        switch (type) {
            case 'text-input':
                return `
                    <div class="form-group">
                        <label>Label:</label>
                        <input type="text" value="${getElementText(item, 'label')}" 
                               onchange="updateItemProperty('label', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Placeholder:</label>
                        <input type="text" value="${getElementAttribute(item, 'input', 'placeholder')}" 
                               onchange="updateItemProperty('placeholder', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Required:</label>
                        <input type="checkbox" onchange="updateItemProperty('required', this.checked)" 
                               style="width: auto;">
                    </div>
                `;
                
            case 'number-input':
                return `
                    <div class="form-group">
                        <label>Label:</label>
                        <input type="text" value="${getElementText(item, 'label')}" 
                               onchange="updateItemProperty('label', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Min Value:</label>
                        <input type="number" onchange="updateItemProperty('min', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Max Value:</label>
                        <input type="number" onchange="updateItemProperty('max', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Step:</label>
                        <input type="number" step="0.1" onchange="updateItemProperty('step', this.value)">
                    </div>
                `;
                
            case 'calculated':
                return `
                    <div class="form-group">
                        <label>Label:</label>
                        <input type="text" value="${getElementText(item, 'label')}" 
                               onchange="updateItemProperty('label', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Calculation Rules:</label>
                        <textarea rows="4" onchange="updateItemProperty('rules', this.value)" 
                                  placeholder="Enter calculation rules (e.g., [strength] + [level])">${getElementAttribute(item, '[data-rules]', 'data-rules')}</textarea>
                        <small style="color: #858585; font-size: 11px;">
                            Use [fieldName] for field references and functions like sum(), avg(), mod(), etc.
                        </small>
                    </div>
                    <div class="form-group">
                        <label>Format:</label>
                        <select onchange="updateItemProperty('format', this.value)">
                            <option value="number">Number</option>
                            <option value="integer">Integer</option>
                            <option value="currency">Currency</option>
                            <option value="percentage">Percentage</option>
                            <option value="signed">Signed (+/-)</option>
                            <option value="modifier">Modifier</option>
                        </select>
                    </div>
                `;
                
            case 'progress-bar':
                return `
                    <div class="form-group">
                        <label>Label:</label>
                        <input type="text" value="${getElementText(item, 'label')}" 
                               onchange="updateItemProperty('label', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Max Value:</label>
                        <input type="number" value="${getElementAttribute(item, '.progress-fill', 'data-max-value')}" 
                               onchange="updateItemProperty('maxValue', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Listen To Component:</label>
                        <select onchange="updateItemProperty('listenTo', this.value)">
                            <option value="">Select a component</option>
                            ${generateComponentOptions()}
                        </select>
                    </div>
                `;
                
            case 'dice-button':
                return `
                    <div class="form-group">
                        <label>Button Text:</label>
                        <input type="text" value="${getElementText(item, 'button')}" 
                               onchange="updateItemProperty('buttonText', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Dice Type:</label>
                        <select onchange="updateItemProperty('diceType', this.value)">
                            <option value="1d4">1d4</option>
                            <option value="1d6">1d6</option>
                            <option value="1d8">1d8</option>
                            <option value="1d10">1d10</option>
                            <option value="1d12">1d12</option>
                            <option value="1d20" selected>1d20</option>
                            <option value="2d6">2d6</option>
                            <option value="3d6">3d6</option>
                            <option value="4d6">4d6</option>
                        </select>
                    </div>
                `;
                
            case 'reference-button':
                return `
                    <div class="form-group">
                        <label>Button Text:</label>
                        <input type="text" value="${getElementText(item, 'button')}" 
                               onchange="updateItemProperty('buttonText', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Reference Type:</label>
                        <select onchange="updateItemProperty('referenceType', this.value)">
                            <option value="spells">Spells</option>
                            <option value="equipment">Equipment</option>
                            <option value="skills">Skills</option>
                        </select>
                    </div>
                `;
                
            case 'info-button':
                return `
                    <div class="form-group">
                        <label>Button Text:</label>
                        <input type="text" value="${getElementText(item, 'button')}" 
                               onchange="updateItemProperty('buttonText', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Info Title:</label>
                        <input type="text" onchange="updateItemProperty('infoTitle', this.value)" 
                               placeholder="Information">
                    </div>
                    <div class="form-group">
                        <label>Info Content:</label>
                        <textarea rows="4" onchange="updateItemProperty('infoContent', this.value)" 
                                  placeholder="Enter information content">${getElementAttribute(item, 'button', 'data-info-content')}</textarea>
                    </div>
                `;
                
            default:
                return `<p style="color: #858585;">Properties for ${type} coming soon...</p>`;
        }
    } catch (error) {
        appState.logError('Error generating properties HTML', error);
        return `<p style="color: ${THEME_COLORS.danger};">Error loading properties</p>`;
    }
}

function generateComponentOptions() {
    try {
        const components = document.querySelectorAll('.sheet-item[data-type="number-input"], .sheet-item[data-type="fraction-number"]');
        return Array.from(components).map(comp => {
            const id = comp.dataset.id;
            const type = comp.dataset.type;
            const label = comp.querySelector('label')?.textContent || id;
            return `<option value="${id}">${label} (${type})</option>`;
        }).join('');
    } catch (error) {
        appState.logError('Error generating component options', error);
        return '';
    }
}

function getElementText(item, selector) {
    try {
        const element = item.querySelector(selector);
        return element ? element.textContent.trim() : '';
    } catch (error) {
        return '';
    }
}

function getElementAttribute(item, selector, attribute) {
    try {
        const element = item.querySelector(selector);
        return element ? (element.getAttribute(attribute) || '') : '';
    } catch (error) {
        return '';
    }
}

function updateItemProperty(property, value) {
    if (!appState.selectedItem) return;
    
    try {
        appState.saveState('Update Property');
        
        switch (property) {
            case 'label':
                const label = appState.selectedItem.querySelector('label');
                if (label) {
                    label.textContent = value;
                }
                break;
                
            case 'placeholder':
                const input = appState.selectedItem.querySelector('input');
                if (input) {
                    input.placeholder = value;
                }
                break;
                
            case 'required':
                const requiredInput = appState.selectedItem.querySelector('input');
                if (requiredInput) {
                    requiredInput.required = value;
                }
                break;
                
            case 'min':
                const minInput = appState.selectedItem.querySelector('input[type="number"]');
                if (minInput) {
                    minInput.min = value;
                }
                break;
                
            case 'max':
                const maxInput = appState.selectedItem.querySelector('input[type="number"]');
                if (maxInput) {
                    maxInput.max = value;
                }
                break;
                
            case 'step':
                const stepInput = appState.selectedItem.querySelector('input[type="number"]');
                if (stepInput) {
                    stepInput.step = value;
                }
                break;
                
            case 'rules':
                const calculated = appState.selectedItem.querySelector('[data-rules]');
                if (calculated) {
                    calculated.dataset.rules = value;
                    updateCalculatedFields();
                }
                break;
                
            case 'format':
                const formatElement = appState.selectedItem.querySelector('.calculated-value');
                if (formatElement) {
                    formatElement.dataset.format = value;
                    updateCalculatedFields();
                }
                break;
                
            case 'maxValue':
                const progressFill = appState.selectedItem.querySelector('.progress-fill');
                if (progressFill) {
                    progressFill.dataset.maxValue = value;
                    updateProgressBars();
                }
                break;
                
            case 'listenTo':
                const listenProgressFill = appState.selectedItem.querySelector('.progress-fill');
                if (listenProgressFill) {
                    listenProgressFill.dataset.listenTo = value;
                    updateProgressBars();
                }
                break;
                
            case 'buttonText':
                const button = appState.selectedItem.querySelector('button');
                if (button) {
                    button.textContent = value;
                }
                break;
                
            case 'diceType':
                const diceButton = appState.selectedItem.querySelector('button');
                if (diceButton) {
                    diceButton.dataset.diceType = value;
                }
                break;
                
            case 'referenceType':
                const refButton = appState.selectedItem.querySelector('button');
                if (refButton) {
                    refButton.dataset.referenceType = value;
                }
                break;
                
            case 'infoTitle':
                const infoButton = appState.selectedItem.querySelector('button');
                if (infoButton) {
                    infoButton.dataset.infoTitle = value;
                }
                break;
                
            case 'infoContent':
                const infoContentButton = appState.selectedItem.querySelector('button');
                if (infoContentButton) {
                    infoContentButton.dataset.infoContent = value;
                }
                break;
        }
        
        triggerAutoSave();
        
    } catch (error) {
        appState.logError('Error updating item property', error);
        appState.showNotification('Error updating property', 'error');
    }
}

function updateItemStyle(property, value) {
    if (!appState.selectedItem) return;
    
    try {
        appState.saveState('Style Update');
        
        const targetElement = appState.selectedItem.querySelector('input, textarea, select, label, span, button') || appState.selectedItem;
        if (targetElement && value) {
            targetElement.style[property] = value;
        }
        
        triggerAutoSave();
        
    } catch (error) {
        appState.logError('Error updating item style', error);
    }
}

function clearPropertiesPanel() {
    const propertiesContent = appState.getElement('properties-content');
    if (propertiesContent) {
        propertiesContent.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #858585;">
                <div style="font-size: 48px; margin-bottom: 20px;">âš™ï¸</div>
                <h4>No Component Selected</h4>
                <p>Select a component to edit its properties</p>
            </div>
        `;
    }
}

function updateDataPanel() {
    // This function would be called when the data panel is shown
    // Currently just a placeholder for future data panel features
}

// ===================================================================
// AUTO-SAVE SYSTEM
// ===================================================================

let autoSaveTimer = null;

function setupAutoSave() {
    try {
        if (appState.sheetData.settings.autoSave) {
            autoSaveTimer = setInterval(() => {
                if (appState.isDirty && Date.now() - appState.lastSaveTime > 30000) {
                    performAutoSave();
                }
            }, appState.sheetData.settings.autoSaveInterval);
        }
        
        // Enhanced page unload handling
        window.addEventListener('beforeunload', (e) => {
            if (appState.isDirty) {
                performAutoSave();
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Save before leaving?';
            }
        });
        
        // Save on visibility change (tab switching, etc.)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && appState.isDirty) {
                performAutoSave();
            }
        });
        
        return Promise.resolve();
        
    } catch (error) {
        appState.logError('Error setting up auto-save', error);
        return Promise.reject(error);
    }
}

function performAutoSave() {
    try {
        const canvas = appState.getElement('canvas');
        const saveData = {
            version: CONFIG.VERSION,
            timestamp: new Date().toISOString(),
            metadata: appState.sheetData.metadata,
            canvas: canvas ? canvas.innerHTML : '',
            data: appState.sheetData.data,
            styles: appState.sheetData.styles,
            references: appState.sheetData.references,
            settings: appState.sheetData.settings,
            fonts: DEFAULT_FONTS,
            labels: LABELS,
            componentCounter: appState.componentCounter,
            performance: {
                saveTime: Date.now(),
                componentCount: document.querySelectorAll('.sheet-item').length,
                memoryUsage: appState.performanceMetrics.memoryUsage
            }
        };
        
        // Store current save
        localStorage.setItem('ttrpg_autosave', JSON.stringify(saveData));
        
        // Keep backup of previous save
        const previousSave = localStorage.getItem('ttrpg_autosave');
        if (previousSave) {
            localStorage.setItem('ttrpg_autosave_backup', previousSave);
        }
        
        appState.markClean();
        appState.showNotification('Auto-saved successfully', 'success');
        updateStatus(`Auto-saved (${new Date().toLocaleTimeString()})`);
        
    } catch (error) {
        appState.logError('Auto-save error', error);
        appState.showNotification('Auto-save failed: ' + error.message, 'error');
    }
}

function triggerAutoSave() {
    appState.markDirty();
    
    // Debounced auto-save for better performance
    clearTimeout(triggerAutoSave.timeout);
    triggerAutoSave.timeout = setTimeout(() => {
        if (appState.isDirty) {
            performAutoSave();
        }
    }, 5000);
}

function loadAutoSave() {
    try {
        const autoSaveData = localStorage.getItem('ttrpg_autosave');
        if (!autoSaveData) return;
        
        const data = safeParse(autoSaveData);
        const saveDate = new Date(data.timestamp);
        const hoursSinceLastSave = (Date.now() - saveDate.getTime()) / (1000 * 60 * 60);
        
        if (confirm(
            `Found auto-saved data from ${saveDate.toLocaleString()} ` +
            `(${Math.round(hoursSinceLastSave * 10) / 10} hours ago).\n\n` +
            `Components: ${data.performance ? data.performance.componentCount : 'Unknown'}\n` +
            `Would you like to restore it?`
        )) {
            restoreFromSave(data);
            appState.showNotification('Auto-save restored successfully', 'success');
        }
    } catch (error) {
        appState.logError('Error loading auto-save', error);
        appState.showNotification('Failed to load auto-save', 'error');
        tryLoadBackup();
    }
}

function tryLoadBackup() {
    try {
        const backupData = localStorage.getItem('ttrpg_autosave_backup');
        if (backupData && confirm('Try loading backup save data?')) {
            const data = safeParse(backupData);
            restoreFromSave(data);
            appState.showNotification('Backup data restored', 'warning');
        }
    } catch (error) {
        appState.logError('Backup restore failed', error);
        appState.showNotification('Backup restore failed', 'error');
    }
}

function restoreFromSave(data) {
    try {
        if (data.canvas) {
            const canvas = appState.getElement('canvas');
            if (canvas) {
                canvas.innerHTML = data.canvas;
            }
        }
        
        if (data.data) appState.sheetData.data = data.data;
        if (data.styles) appState.sheetData.styles = data.styles;
        if (data.references) appState.sheetData.references = data.references;
        if (data.settings) appState.sheetData.settings = data.settings;
        if (data.metadata) appState.sheetData.metadata = data.metadata;
        if (data.fonts) DEFAULT_FONTS = data.fonts;
        if (data.labels) LABELS = data.labels;
        if (data.componentCounter) appState.componentCounter = data.componentCounter;
        
        // Restore UI state
        applyFontSetting();
        applyTheme();
        appState.setupAllEventListeners();
        updateComponentCount();
        updateSheetTree();
        updateCalculatedFields();
        updateProgressBars();
        
        appState.markClean();
        
    } catch (error) {
        appState.logError('Error restoring from save', error);
        throw error;
    }
}

// ===================================================================
// MENU SYSTEM
// ===================================================================

function initializeMenus() {
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
                { text: 'Export as HTML', shortcut: '', action: 'exportAsHTML' },
                { text: 'Export for Print', shortcut: '', action: 'exportForPrint' },
                { separator: true },
                { text: 'Settings', shortcut: 'Ctrl+,', action: 'showSettingsPanel' }
            ]
        },
        {
            name: 'Edit',
            id: 'edit',
            items: [
                { text: 'Undo', shortcut: 'Ctrl+Z', action: () => appState.undo() },
                { text: 'Redo', shortcut: 'Ctrl+Y', action: () => appState.redo() },
                { separator: true },
                { text: 'Cut', shortcut: 'Ctrl+X', action: 'cutSelected' },
                { text: 'Copy', shortcut: 'Ctrl+C', action: 'copySelected' },
                { text: 'Paste', shortcut: 'Ctrl+V', action: 'pasteComponent' },
                { text: 'Duplicate', shortcut: 'Ctrl+D', action: 'duplicateSelected' },
                { separator: true },
                { text: 'Select All', shortcut: 'Ctrl+A', action: 'selectAllComponents' },
                { text: 'Delete Selected', shortcut: 'Delete', action: 'deleteSelected' },
                { text: 'Clear Canvas', shortcut: 'Ctrl+Del', action: 'clearCanvas' }
            ]
        },
        {
            name: 'View',
            id: 'view',
            items: [
                { text: 'Preview Sheet', shortcut: 'Ctrl+P', action: 'previewSheet' },
                { text: 'Toggle Sidebar', shortcut: 'Ctrl+B', action: 'toggleSidebar' },
                { separator: true },
                { text: 'Zoom In', shortcut: 'Ctrl++', action: 'zoomIn' },
                { text: 'Zoom Out', shortcut: 'Ctrl+-', action: 'zoomOut' },
                { text: 'Reset Zoom', shortcut: 'Ctrl+0', action: 'resetZoom' },
                { separator: true },
                { text: 'Toggle Grid', shortcut: 'Ctrl+G', action: 'toggleGrid' },
                { text: 'Toggle Snap', shortcut: 'Ctrl+Shift+G', action: 'toggleSnap' },
                { separator: true },
                { text: 'Light Theme', shortcut: '', action: () => applyTheme('light') },
                { text: 'Dark Theme', shortcut: '', action: () => applyTheme('dark') },
                { text: 'High Contrast', shortcut: '', action: () => applyTheme('high_contrast') }
            ]
        },
        {
            name: 'Help',
            id: 'help',
            items: [
                { text: 'Getting Started', shortcut: 'F1', action: 'showTutorial' },
                { text: 'Keyboard Shortcuts', shortcut: '', action: 'showKeyboardShortcuts' },
                { text: 'Component Guide', shortcut: '', action: 'showComponentGuide' },
                { separator: true },
                { text: 'Report Issue', shortcut: '', action: 'reportIssue' },
                { text: 'About', shortcut: '', action: 'showAbout' }
            ]
        }
    ];

    return new Promise((resolve) => {
        try {
            menuConfigs.forEach(config => {
                createAndAttachMenu(config.name, config.id, config.items);
            });
            resolve();
        } catch (error) {
            appState.logError('Error initializing menus', error);
            resolve();
        }
    });
}

function createAndAttachMenu(menuText, menuType, items) {
    try {
        const menuItems = document.querySelectorAll('.menu-item');
        let menuItem = null;
        
        for (const item of menuItems) {
            if (item.textContent.trim() === menuText) {
                menuItem = item;
                break;
            }
        }
        
        if (!menuItem) {
            console.warn('Menu item not found: ' + menuText);
            return;
        }
        
        menuItem.style.position = 'relative';
        menuItem.style.cursor = 'pointer';
        
        const menu = createDropdownMenu(menuType, items);
        menuItem.appendChild(menu);
        
        menuItem.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdown(menu);
        });
    } catch (error) {
        appState.logError('Error creating menu ' + menuText, error);
    }
}

function createDropdownMenu(menuType, items) {
    const menu = document.createElement('div');
    menu.className = 'dropdown-menu';
    menu.id = menuType + '-dropdown';
    
    menu.style.cssText = `
        position: absolute; top: 100%; left: 0; background: #2d2d30;
        border: 1px solid #3e3e42; border-radius: 4px; min-width: 200px;
        display: none; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        max-height: 400px; overflow-y: auto;
    `;
    
    items.forEach(item => {
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
    
    menuItem.innerHTML = `
        <span style="flex: 1;">${item.text}</span>
        <span style="color: #858585; font-size: 11px; margin-left: 20px;">${item.shortcut || ''}</span>
    `;
    
    menuItem.style.cssText = `
        padding: 8px 12px; cursor: pointer; display: flex;
        justify-content: space-between; align-items: center;
        color: #d4d4d4; transition: background-color 0.2s;
    `;
    
    menuItem.addEventListener('click', (e) => {
        e.stopPropagation();
        closeDropdown();
        executeMenuAction(item.action);
    });
    
    menuItem.addEventListener('mouseenter', function() {
        this.style.background = '#3e3e42';
    });
    
    menuItem.addEventListener('mouseleave', function() {
        this.style.background = '';
    });
    
    return menuItem;
}

function toggleDropdown(targetMenu) {
    // Close other dropdowns
    const allMenus = document.querySelectorAll('.dropdown-menu');
    allMenus.forEach(menu => {
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

function closeDropdown() {
    if (currentDropdownMenu) {
        currentDropdownMenu.style.display = 'none';
        currentDropdownMenu = null;
    }
    
    const allMenus = document.querySelectorAll('.dropdown-menu');
    allMenus.forEach(menu => {
        menu.style.display = 'none';
    });
}

function executeMenuAction(action) {
    try {
        if (typeof action === 'string') {
            if (window[action] && typeof window[action] === 'function') {
                window[action]();
            } else {
                appState.logError('Function not found: ' + action);
            }
        } else if (typeof action === 'function') {
            action();
        }
    } catch (error) {
        appState.logError('Error executing menu action', error);
        appState.showNotification('Error executing menu action', 'error');
    }
}

// Menu action implementations
function showFileMenu() {
    const fileMenu = document.getElementById('file-dropdown');
    if (fileMenu) toggleDropdown(fileMenu);
}

function showEditMenu() {
    const editMenu = document.getElementById('edit-dropdown');
    if (editMenu) toggleDropdown(editMenu);
}

function showViewMenu() {
    const viewMenu = document.getElementById('view-dropdown');
    if (viewMenu) toggleDropdown(viewMenu);
}

function showHelpMenu() {
    const helpMenu = document.getElementById('help-dropdown');
    if (helpMenu) toggleDropdown(helpMenu);
}

// ===================================================================
// KEYBOARD SHORTCUTS
// ===================================================================

function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', handleKeyboardShortcuts);
    return Promise.resolve();
}

function handleKeyboardShortcuts(e) {
    // Skip if typing in input fields
    if (e.target.matches('input, textarea, [contenteditable]')) {
        if (e.key !== 'Escape' && !(e.ctrlKey || e.metaKey)) {
            return;
        }
    }
    
    try {
        if (e.key === 'Escape') {
            clearMultiSelection();
            if (appState.selectedItem) {
                appState.selectedItem.classList.remove('selected');
                appState.selectedItem.style.outline = '';
                appState.selectedItem = null;
                clearPropertiesPanel();
            }
            closeDropdown();
            return;
        }
        
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 's':
                    e.preventDefault();
                    if (e.shiftKey) {
                        exportSheetAs();
                    } else {
                        exportSheet();
                    }
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
                case 'c':
                    e.preventDefault();
                    copySelected();
                    break;
                case 'v':
                    e.preventDefault();
                    pasteComponent();
                    break;
                case 'x':
                    e.preventDefault();
                    cutSelected();
                    break;
                case 'd':
                    e.preventDefault();
                    duplicateSelected();
                    break;
                case 'a':
                    if (!e.target.matches('input, textarea')) {
                        e.preventDefault();
                        selectAllComponents();
                    }
                    break;
                case 'n':
                    e.preventDefault();
                    newSheet();
                    break;
                case 'o':
                    e.preventDefault();
                    importSheet();
                    break;
                case 'p':
                    e.preventDefault();
                    previewSheet();
                    break;
                case 'b':
                    e.preventDefault();
                    toggleSidebar();
                    break;
                case 'g':
                    e.preventDefault();
                    if (e.shiftKey) {
                        toggleSnap();
                    } else {
                        toggleGrid();
                    }
                    break;
                case '=':
                case '+':
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
                case ',':
                    e.preventDefault();
                    showSettingsPanel();
                    break;
            }
        }
        
        if (e.key === 'Delete' && !e.target.matches('input, textarea')) {
            e.preventDefault();
            if (e.ctrlKey) {
                clearCanvas();
            } else {
                deleteSelected();
            }
        }
        
        if (e.key === 'F1') {
            e.preventDefault();
            showTutorial();
        }
        
    } catch (error) {
        appState.logError('Error handling keyboard shortcut', error);
    }
}

// ===================================================================
// SHEET OPERATIONS
// ===================================================================

function newSheet() {
    try {
        if (document.querySelectorAll('.sheet-item').length > 0) {
            if (!confirm('Create new sheet? This will clear current work.')) {
                return;
            }
        }
        
        appState.saveState('New Sheet');
        clearCanvas();
        appState.componentCounter = 0;
        appState.sheetData.data = {
            characterName: '', playerName: '', class: '', race: '', level: 1,
            strength: 10, dexterity: 10, constitution: 10, 
            intelligence: 10, wisdom: 10, charisma: 10
        };
        appState.sheetData.metadata.title = 'Untitled Character Sheet';
        appState.sheetData.metadata.created = new Date().toISOString();
        
        updateStatus('New sheet created');
        appState.showNotification('New sheet created', 'success');
        triggerAutoSave();
        
    } catch (error) {
        appState.logError('Error creating new sheet', error);
        appState.showNotification('Error creating new sheet', 'error');
    }
}

function clearCanvas() {
    try {
        const canvas = appState.getElement('canvas');
        if (canvas) {
            canvas.innerHTML = `
                <div class="canvas-placeholder">
                    <h3>Start Building Your Character Sheet</h3>
                    <p>Drag components from the sidebar to begin</p>
                </div>
            `;
        }
        
        appState.selectedItem = null;
        selectedItem = null;
        clearMultiSelection();
        clearPropertiesPanel();
        updateComponentCount();
        updateSheetTree();
        
    } catch (error) {
        appState.logError('Error clearing canvas', error);
    }
}

function exportSheet() {
    try {
        const canvas = appState.getElement('canvas');
        if (!canvas) {
            appState.showNotification('Canvas not found', 'error');
            return;
        }
        
        const saveData = {
            version: CONFIG.VERSION,
            metadata: appState.sheetData.metadata,
            html: canvas.innerHTML,
            data: appState.sheetData.data,
            styles: appState.sheetData.styles,
            references: appState.sheetData.references,
            fonts: DEFAULT_FONTS,
            labels: LABELS,
            componentCounter: appState.componentCounter,
            timestamp: new Date().toISOString()
        };
        
        downloadJSON(saveData, (appState.sheetData.metadata.title || 'character-sheet') + '.json');
        appState.showNotification('Sheet exported successfully', 'success');
        
    } catch (error) {
        appState.logError('Export error', error);
        appState.showNotification('Export failed: ' + error.message, 'error');
    }
}

function exportSheetAs() {
    try {
        const filename = prompt('Enter filename (without extension):');
        if (filename) {
            const originalTitle = appState.sheetData.metadata.title;
            appState.sheetData.metadata.title = filename;
            exportSheet();
            appState.sheetData.metadata.title = originalTitle;
        }
    } catch (error) {
        appState.logError('Error exporting sheet as', error);
    }
}

function exportAsHTML() {
    try {
        const canvas = appState.getElement('canvas');
        if (!canvas) {
            appState.showNotification('Canvas not found', 'error');
            return;
        }
        
        const clone = canvas.cloneNode(true);
        const controls = clone.querySelectorAll('.item-controls, .canvas-placeholder');
        controls.forEach(control => control.remove());
        
        const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${appState.sheetData.metadata.title || 'Character Sheet'}</title>
    <style>
        body { 
            font-family: ${DEFAULT_FONTS}; 
            margin: 20px; 
            background: #f5f5f5; 
            color: #333;
        }
        .sheet-item { 
            margin: 10px 0; 
            padding: 10px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        .row { 
            display: flex; 
            flex-direction: row; 
            gap: 10px; 
            flex-wrap: wrap;
        }
        .column { 
            display: flex; 
            flex-direction: column; 
            gap: 10px; 
            flex: 1;
            min-width: 200px;
        }
        input, select, textarea { 
            padding: 8px; 
            border: 1px solid #ccc; 
            border-radius: 4px;
            width: 100%;
            font-family: inherit;
        }
        label {
            font-weight: bold;
            margin-bottom: 5px;
            display: block;
        }
        button {
            padding: 8px 16px;
            background: #007acc;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        .progress-container {
            width: 100%;
            height: 20px;
            background: #e0e0e0;
            border-radius: 10px;
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            background: #4caf50;
        }
        ${appState.sheetData.styles || ''}
    </style>
</head>
<body>
    <h1>${appState.sheetData.metadata.title || 'Character Sheet'}</h1>
    <div style="margin-bottom: 20px; padding: 10px; background: #e3f2fd; border-radius: 4px;">
        <small>Generated by TTRPG Character Sheet Builder v${CONFIG.VERSION} on ${new Date().toLocaleString()}</small>
    </div>
    ${clone.innerHTML}
</body>
</html>`;
        
        downloadFile(htmlContent, 'character-sheet.html', 'text/html');
        appState.showNotification('HTML exported successfully', 'success');
        
    } catch (error) {
        appState.logError('HTML export error', error);
        appState.showNotification('HTML export failed: ' + error.message, 'error');
    }
}

function exportForPrint() {
    try {
        exportAsHTML();
        appState.showNotification('Print-ready HTML exported', 'success');
    } catch (error) {
        appState.logError('Error exporting for print', error);
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
                if (file.size > CONFIG.FILE_SIZE_LIMIT) {
                    appState.showNotification('File too large (max 10MB)', 'error');
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const data = safeParse(e.target.result);
                        if (validateImportData(data)) {
                            loadSheetData(data);
                            appState.showNotification('Sheet imported successfully', 'success');
                        } else {
                            appState.showNotification('Invalid file format', 'error');
                        }
                    } catch (error) {
                        appState.logError('Import error', error);
                        appState.showNotification('Import failed: ' + error.message, 'error');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
        
    } catch (error) {
        appState.logError('Error importing sheet', error);
        appState.showNotification('Error importing sheet', 'error');
    }
}

function validateImportData(data) {
    try {
        // Basic validation of import data structure
        if (!data || typeof data !== 'object') return false;
        if (!data.html && !data.canvas) return false;
        if (!data.data || typeof data.data !== 'object') return false;
        
        // Version compatibility check
        if (data.version && data.version !== CONFIG.VERSION) {
            const proceed = confirm(
                `This file was created with version ${data.version}, ` +
                `but you're running version ${CONFIG.VERSION}. ` +
                `Some features may not work correctly. Continue?`
            );
            if (!proceed) return false;
        }
        
        return true;
    } catch (error) {
        appState.logError('Error validating import data', error);
        return false;
    }
}

function loadSheetData(data) {
    try {
        appState.saveState('Import Sheet');
        
        if (data.html || data.canvas) {
            const canvas = appState.getElement('canvas');
            if (canvas) {
                canvas.innerHTML = data.html || data.canvas;
            }
        }
        
        if (data.data) appState.sheetData.data = data.data;
        if (data.metadata) appState.sheetData.metadata = data.metadata;
        if (data.styles) appState.sheetData.styles = data.styles;
        if (data.references) appState.sheetData.references = data.references;
        if (data.fonts) DEFAULT_FONTS = data.fonts;
        if (data.labels) LABELS = data.labels;
        if (data.componentCounter) appState.componentCounter = data.componentCounter;
        
        applyFontSetting();
        appState.setupAllEventListeners();
        updateComponentCount();
        updateSheetTree();
        updateCalculatedFields();
        updateProgressBars();
        triggerAutoSave();
        
    } catch (error) {
        appState.logError('Error loading sheet data', error);
        throw error;
    }
}

// ===================================================================
// UTILITY FUNCTIONS
// ===================================================================

function updateComponentCount() {
    try {
        const count = document.querySelectorAll('.sheet-item').length;
        const componentCountElement = appState.getElement('component-count');
        if (componentCountElement) {
            componentCountElement.textContent = `Components: ${count}`;
        }
        
        appState.performanceMetrics.componentCount = count;
        
        if (performance.memory) {
            const memoryMB = Math.round(performance.memory.usedJSHeapSize / 1048576);
            appState.performanceMetrics.memoryUsage = memoryMB;
            updateStatus(`${count} components (${memoryMB}MB)`);
        } else {
            updateStatus(`${count} components`);
        }
    } catch (error) {
        appState.logError('Error updating component count', error);
    }
}

function updateStatus(message) {
    try {
        const statusElement = appState.getElement('sheet-status');
        if (statusElement) {
            statusElement.textContent = message;
            
            clearTimeout(updateStatus.timeout);
            updateStatus.timeout = setTimeout(() => {
                statusElement.textContent = 'Ready';
            }, 3000);
        }
    } catch (error) {
        // Don't log status update errors to avoid infinite loops
        console.warn('Error updating status:', error);
    }
}

function updateSheetTree() {
    try {
        const tree = appState.getElement('sheet-tree');
        if (!tree) return;
        
        const items = document.querySelectorAll('.sheet-item');
        if (items.length === 0) {
            tree.innerHTML = `
                <div style="text-align: center; padding: 30px; color: #858585;">
                    <div style="font-size: 24px; margin-bottom: 10px;">ðŸ“‹</div>
                    <div>No components added yet</div>
                </div>
            `;
            return;
        }

        let html = '';
        items.forEach(item => {
            const type = item.dataset.type;
            const id = item.dataset.id;
            const icon = COMPONENT_ICONS[type] || 'ðŸ“¦';
            const isSelected = item === appState.selectedItem;
            const label = item.querySelector('label')?.textContent || type;
            
            html += `
                <div class="tree-item ${isSelected ? 'selected' : ''}" 
                     onclick="selectItem(document.querySelector('[data-id=&quot;${id}&quot;]'))" 
                     style="padding: 8px; cursor: pointer; color: ${isSelected ? THEME_COLORS.primary : '#d4d4d4'}; 
                            border-radius: 4px; margin: 2px 0; transition: background 0.2s;"
                     onmouseover="this.style.background='#3e3e42'" 
                     onmouseout="this.style.background=''">
                    <span style="margin-right: 8px;">${icon}</span>
                    ${label} <small style="opacity: 0.7;">(${type})</small>
                </div>
            `;
        });
        
        tree.innerHTML = html;
        
    } catch (error) {
        appState.logError('Error updating sheet tree', error);
    }
}

function downloadJSON(data, filename) {
    try {
        const blob = new Blob([safeStringify(data)], { type: 'application/json' });
        downloadBlob(blob, filename);
    } catch (error) {
        appState.logError('Error downloading JSON', error);
        throw error;
    }
}

function downloadFile(content, filename, mimeType) {
    try {
        const blob = new Blob([content], { type: mimeType });
        downloadBlob(blob, filename);
    } catch (error) {
        appState.logError('Error downloading file', error);
        throw error;
    }
}

function downloadBlob(blob, filename) {
    try {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        appState.logError('Error downloading blob', error);
        throw error;
    }
}

// ===================================================================
// MODAL SYSTEM
// ===================================================================

function showModal(modalId) {
    try {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('show');
            
            // Add escape key handler
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    closeModal(modalId);
                    document.removeEventListener('keydown', handleEscape);
                }
            };
            document.addEventListener('keydown', handleEscape);
        }
    } catch (error) {
        appState.logError('Error showing modal', error);
    }
}

function closeModal(modalId) {
    try {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
        }
    } catch (error) {
        appState.logError('Error closing modal', error);
    }
}

function closeTab(tabElement) {
    try {
        // In a real application, this would close the tab
        // For now, just a placeholder
        appState.showNotification('Tab closing not implemented yet', 'info');
    } catch (error) {
        appState.logError('Error closing tab', error);
    }
}

// ===================================================================
// ADDITIONAL MODAL FUNCTIONS
// ===================================================================

function showDataEditor() {
    try {
        const modal = appState.getElement('data-modal');
        const editor = appState.getElement('data-editor');
        
        if (modal && editor) {
            editor.value = safeStringify(appState.sheetData.data, null, 2);
            showModal('data-modal');
        }
    } catch (error) {
        appState.logError('Error showing data editor', error);
    }
}

function saveSheetData() {
    try {
        const editor = appState.getElement('data-editor');
        if (!editor) return;
        
        const newData = safeParse(editor.value, null);
        if (newData) {
            appState.saveState('Update Sheet Data');
            appState.sheetData.data = newData;
            updateCalculatedFields();
            updateProgressBars();
            triggerAutoSave();
            closeModal('data-modal');
            appState.showNotification('Sheet data updated', 'success');
        } else {
            appState.showNotification('Invalid JSON format', 'error');
        }
    } catch (error) {
        appState.logError('Error saving sheet data', error);
        appState.showNotification('Error saving data', 'error');
    }
}

function formatJSON() {
    try {
        const editor = appState.getElement('data-editor');
        if (!editor) return;
        
        const data = safeParse(editor.value, null);
        if (data) {
            editor.value = safeStringify(data, null, 2);
            appState.showNotification('JSON formatted', 'success');
        } else {
            appState.showNotification('Invalid JSON format', 'error');
        }
    } catch (error) {
        appState.logError('Error formatting JSON', error);
    }
}

function validateJSON() {
    try {
        const editor = appState.getElement('data-editor');
        if (!editor) return;
        
        const data = safeParse(editor.value, null);
        if (data) {
            appState.showNotification('JSON is valid', 'success');
        } else {
            appState.showNotification('Invalid JSON format', 'error');
        }
    } catch (error) {
        appState.logError('Error validating JSON', error);
    }
}

function showGlobalCSS() {
    try {
        const modal = appState.getElement('css-modal');
        const editor = appState.getElement('css-editor');
        
        if (modal && editor) {
            editor.value = appState.sheetData.styles || '';
            showModal('css-modal');
        }
    } catch (error) {
        appState.logError('Error showing CSS editor', error);
    }
}

function applyGlobalCSS() {
    try {
        const editor = appState.getElement('css-editor');
        if (!editor) return;
        
        appState.saveState('Update Global CSS');
        appState.sheetData.styles = editor.value;
        
        // Apply styles to the document
        let styleElement = document.getElementById('global-sheet-styles');
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'global-sheet-styles';
            document.head.appendChild(styleElement);
        }
        
        styleElement.textContent = appState.sheetData.styles;
        
        triggerAutoSave();
        closeModal('css-modal');
        appState.showNotification('Global styles applied', 'success');
        
    } catch (error) {
        appState.logError('Error applying global CSS', error);
        appState.showNotification('Error applying styles', 'error');
    }
}

function resetCSS() {
    try {
        const editor = appState.getElement('css-editor');
        if (!editor) return;
        
        if (confirm('Reset all custom styles?')) {
            appState.saveState('Reset Global CSS');
            appState.sheetData.styles = '';
            editor.value = '';
            
            const styleElement = document.getElementById('global-sheet-styles');
            if (styleElement) {
                styleElement.textContent = '';
            }
            
            triggerAutoSave();
            appState.showNotification('Global styles reset', 'success');
        }
    } catch (error) {
        appState.logError('Error resetting CSS', error);
    }
}

function previewSheet() {
    try {
        const canvas = appState.getElement('canvas');
        const modal = appState.getElement('preview-modal');
        const content = appState.getElement('preview-content');
        
        if (!canvas || !modal || !content) return;
        
        const clone = canvas.cloneNode(true);
        
        // Clean up for preview
        const controls = clone.querySelectorAll('.item-controls, .canvas-placeholder');
        controls.forEach(control => control.remove());
        
        // Apply preview styles
        const sheetItems = clone.querySelectorAll('.sheet-item');
        sheetItems.forEach(item => {
            item.style.border = '1px solid #ccc';
            item.style.background = 'white';
            item.style.color = 'black';
        });
        
        content.innerHTML = clone.innerHTML;
        showModal('preview-modal');
        
    } catch (error) {
        appState.logError('Error showing preview', error);
        appState.showNotification('Error showing preview', 'error');
    }
}

// ===================================================================
// SETTINGS MANAGEMENT
// ===================================================================

function showSettingsPanel() {
    try {
        const modal = appState.getElement('settings-modal');
        if (modal) {
            populateSettingsModal();
            showModal('settings-modal');
        }
    } catch (error) {
        appState.logError('Error showing settings panel', error);
    }
}

function populateSettingsModal() {
    try {
        const fontsInput = appState.getElement('settings-fonts');
        if (fontsInput) {
            fontsInput.value = DEFAULT_FONTS;
        }
        
        const labelsTbody = appState.getElement('settings-labels-tbody');
        if (labelsTbody) {
            let html = '';
            for (const [type, label] of Object.entries(LABELS)) {
                html += `
                    <tr>
                        <td style="padding: 4px;">${type}</td>
                        <td style="padding: 4px;">
                            <input type="text" value="${label}" data-label-type="${type}" 
                                   style="width: 100%;" onchange="updateLabel('${type}', this.value)">
                        </td>
                    </tr>
                `;
            }
            labelsTbody.innerHTML = html;
        }
    } catch (error) {
        appState.logError('Error populating settings modal', error);
    }
}

function updateLabel(type, value) {
    try {
        LABELS[type] = value;
        appState.markDirty();
    } catch (error) {
        appState.logError('Error updating label', error);
    }
}

function saveSettings() {
    try {
        const fontsInput = appState.getElement('settings-fonts');
        if (fontsInput) {
            DEFAULT_FONTS = fontsInput.value;
            applyFontSetting();
        }
        
        // Save user preferences
        saveUserPreferences();
        
        closeModal('settings-modal');
        appState.showNotification('Settings saved', 'success');
        triggerAutoSave();
        
    } catch (error) {
        appState.logError('Error saving settings', error);
        appState.showNotification('Error saving settings', 'error');
    }
}

function loadUserPreferences() {
    return new Promise((resolve) => {
        try {
            const prefs = localStorage.getItem('ttrpg_preferences');
            if (prefs) {
                const preferences = safeParse(prefs);
                appState.currentTheme = preferences.theme || 'dark';
                appState.sheetData.settings.autoSave = preferences.autoSave !== false;
                appState.sheetData.settings.animations = preferences.animations !== false;
                DEFAULT_FONTS = preferences.fonts || DEFAULT_FONTS;
            }
            resolve();
        } catch (error) {
            appState.logError('Error loading preferences', error);
            resolve();
        }
    });
}

function saveUserPreferences() {
    try {
        const preferences = {
            theme: appState.currentTheme,
            autoSave: appState.sheetData.settings.autoSave,
            animations: appState.sheetData.settings.animations,
            fonts: DEFAULT_FONTS,
            version: CONFIG.VERSION
        };
        localStorage.setItem('ttrpg_preferences', safeStringify(preferences));
    } catch (error) {
        appState.logError('Error saving preferences', error);
    }
}

function applyFontSetting() {
    try {
        let style = document.getElementById('dynamic-fonts');
        if (!style) {
            style = document.createElement('style');
            style.id = 'dynamic-fonts';
            document.head.appendChild(style);
        }
        
        style.textContent = `
            body, .sheet-item, .sheet-item input, .sheet-item select, .sheet-item textarea {
                font-family: ${DEFAULT_FONTS} !important;
            }
        `;
    } catch (error) {
        appState.logError('Error applying font setting', error);
    }
}

// ===================================================================
// THEME MANAGEMENT
// ===================================================================

function applyTheme(theme = appState.currentTheme) {
    try {
        appState.currentTheme = theme;
        
        const themes = {
            dark: {
                background: '#1e1e1e',
                surface: '#2d2d30',
                border: '#3e3e42',
                text: '#d4d4d4',
                textSecondary: '#858585',
                primary: THEME_COLORS.primary
            },
            light: {
                background: '#ffffff',
                surface: '#f5f5f5',
                border: '#e0e0e0',
                text: '#333333',
                textSecondary: '#666666',
                primary: '#1976d2'
            },
            high_contrast: {
                background: '#000000',
                surface: '#1a1a1a',
                border: '#ffffff',
                text: '#ffffff',
                textSecondary: '#cccccc',
                primary: '#00ff00'
            }
        };
        
        const currentTheme = themes[theme] || themes.dark;
        
        let style = document.getElementById('theme-styles');
        if (!style) {
            style = document.createElement('style');
            style.id = 'theme-styles';
            document.head.appendChild(style);
        }
        
        style.textContent = `
            :root {
                --bg-color: ${currentTheme.background};
                --surface-color: ${currentTheme.surface};
                --border-color: ${currentTheme.border};
                --text-color: ${currentTheme.text};
                --text-secondary: ${currentTheme.textSecondary};
                --primary-color: ${currentTheme.primary};
            }
            body { 
                background: var(--bg-color); 
                color: var(--text-color); 
            }
            .sheet-item { 
                border-color: var(--border-color); 
                background: var(--surface-color); 
                color: var(--text-color);
            }
            .modal-content { 
                background: var(--surface-color); 
                border-color: var(--border-color); 
                color: var(--text-color);
            }
        `;
        
        saveUserPreferences();
        appState.showNotification(`Applied ${theme} theme`, 'success');
        
    } catch (error) {
        appState.logError('Error applying theme', error);
    }
}

// ===================================================================
// VIEW OPERATIONS
// ===================================================================

let currentZoom = 1;

function zoomIn() {
    try {
        currentZoom = Math.min(currentZoom + 0.1, 2);
        applyZoom();
    } catch (error) {
        appState.logError('Error zooming in', error);
    }
}

function zoomOut() {
    try {
        currentZoom = Math.max(currentZoom - 0.1, 0.5);
        applyZoom();
    } catch (error) {
        appState.logError('Error zooming out', error);
    }
}

function resetZoom() {
    try {
        currentZoom = 1;
        applyZoom();
    } catch (error) {
        appState.logError('Error resetting zoom', error);
    }
}

function applyZoom() {
    try {
        const canvas = appState.getElement('canvas');
        if (canvas) {
            canvas.style.transform = `scale(${currentZoom})`;
            canvas.style.transformOrigin = 'top left';
            updateStatus(`Zoom: ${Math.round(currentZoom * 100)}%`);
        }
    } catch (error) {
        appState.logError('Error applying zoom', error);
    }
}

function toggleSidebar() {
    try {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.toggle('collapsed');
            const isCollapsed = sidebar.classList.contains('collapsed');
            updateStatus(isCollapsed ? 'Sidebar hidden' : 'Sidebar shown');
            appState.showNotification(`Sidebar ${isCollapsed ? 'hidden' : 'shown'}`, 'info');
        }
    } catch (error) {
        appState.logError('Error toggling sidebar', error);
    }
}

function toggleGrid() {
    try {
        appState.sheetData.settings.showGrid = !appState.sheetData.settings.showGrid;
        applyGridSettings();
        appState.showNotification(`Grid ${appState.sheetData.settings.showGrid ? 'shown' : 'hidden'}`, 'info');
    } catch (error) {
        appState.logError('Error toggling grid', error);
    }
}

function toggleSnap() {
    try {
        appState.snapToGrid = !appState.snapToGrid;
        appState.showNotification(`Snap to grid ${appState.snapToGrid ? 'enabled' : 'disabled'}`, 'info');
    } catch (error) {
        appState.logError('Error toggling snap', error);
    }
}

function applyGridSettings() {
    try {
        const canvas = appState.getElement('canvas');
        if (canvas) {
            if (appState.sheetData.settings.showGrid) {
                canvas.style.backgroundImage = `
                    linear-gradient(rgba(79, 195, 247, 0.2) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(79, 195, 247, 0.2) 1px, transparent 1px)
                `;
                canvas.style.backgroundSize = `${appState.gridSize}px ${appState.gridSize}px`;
            } else {
                canvas.style.backgroundImage = 'none';
            }
        }
    } catch (error) {
        appState.logError('Error applying grid settings', error);
    }
}

// ===================================================================
// SELECTED ITEM OPERATIONS
// ===================================================================

function deleteSelected() {
    try {
        if (appState.multiSelectedItems.length > 0) {
            deleteMultiSelected();
        } else if (appState.selectedItem) {
            deleteItem(appState.selectedItem);
        } else {
            appState.showNotification('No component selected', 'warning');
        }
    } catch (error) {
        appState.logError('Error deleting selected', error);
    }
}

function copySelected() {
    try {
        if (appState.multiSelectedItems.length > 0) {
            copyMultiSelected();
        } else if (appState.selectedItem) {
            copyComponent(appState.selectedItem);
        } else {
            appState.showNotification('No component selected', 'warning');
        }
    } catch (error) {
        appState.logError('Error copying selected', error);
    }
}

function cutSelected() {
    try {
        copySelected();
        deleteSelected();
    } catch (error) {
        appState.logError('Error cutting selected', error);
    }
}

function duplicateSelected() {
    try {
        if (appState.selectedItem) {
            duplicateComponent(appState.selectedItem);
        } else {
            appState.showNotification('No component selected', 'warning');
        }
    } catch (error) {
        appState.logError('Error duplicating selected', error);
    }
}

// ===================================================================
// SETUP FUNCTIONS
// ===================================================================

function setupPerformanceMonitoring() {
    try {
        if (!CONFIG.PERFORMANCE_MONITORING) return Promise.resolve();
        
        // Monitor performance metrics
        setInterval(() => {
            const now = performance.now();
            appState.performanceMetrics.frameCount++;
            
            if (performance.memory) {
                appState.performanceMetrics.memoryUsage = Math.round(
                    performance.memory.usedJSHeapSize / 1048576
                );
            }
        }, 1000);
        
        return Promise.resolve();
    } catch (error) {
        appState.logError('Error setting up performance monitoring', error);
        return Promise.resolve();
    }
}

function setupKeyboardShortcuts() {
    // Already implemented in initializeKeyboardShortcuts
    return Promise.resolve();
}

function setupContextMenu() {
    // Context menu is handled through global event delegation
    return Promise.resolve();
}

function setupTooltips() {
    try {
        // Add tooltips to control buttons
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        const controlBtns = node.querySelectorAll ? 
                            node.querySelectorAll('.control-btn') : [];
                        controlBtns.forEach(addTooltip);
                        
                        if (node.classList && node.classList.contains('control-btn')) {
                            addTooltip(node);
                        }
                    }
                });
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Add tooltips to existing buttons
        document.querySelectorAll('.control-btn').forEach(addTooltip);
        
        return Promise.resolve();
    } catch (error) {
        appState.logError('Error setting up tooltips', error);
        return Promise.resolve();
    }
}

function addTooltip(btn) {
    try {
        if (btn.title) return; // Already has tooltip
        
        const text = btn.textContent.trim();
        const tooltips = {
            'âš™': 'Settings',
            'Ã—': 'Delete',
            'ðŸ“‹': 'Copy',
            'â†‘': 'Move Up',
            'â†“': 'Move Down'
        };
        
        btn.title = tooltips[text] || 'Action';
    } catch (error) {
        // Don't log tooltip errors
    }
}

function setupAccessibility() {
    try {
        // Add ARIA labels and roles
        const canvas = appState.getElement('canvas');
        if (canvas) {
            canvas.setAttribute('role', 'main');
            canvas.setAttribute('aria-label', 'Character Sheet Canvas');
        }
        
        // Screen reader announcements
        if (!document.getElementById('accessibility-status')) {
            const statusRegion = document.createElement('div');
            statusRegion.id = 'accessibility-status';
            statusRegion.setAttribute('aria-live', 'polite');
            statusRegion.setAttribute('aria-atomic', 'true');
            statusRegion.style.cssText = `
                position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;
            `;
            document.body.appendChild(statusRegion);
        }
        
        // High contrast mode detection
        if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
            applyTheme('high_contrast');
        }
        
        // Reduced motion detection
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            appState.sheetData.settings.animations = false;
            document.body.classList.add('reduced-motion');
        }
        
        return Promise.resolve();
    } catch (error) {
        appState.logError('Error setting up accessibility', error);
        return Promise.resolve();
    }
}

function announceToScreenReader(message) {
    try {
        const statusRegion = document.getElementById('accessibility-status');
        if (statusRegion) {
            statusRegion.textContent = message;
        }
    } catch (error) {
        // Don't log screen reader errors
    }
}

// ===================================================================
// HELP AND TUTORIAL SYSTEM
// ===================================================================

function showTutorial() {
    try {
        appState.showNotification('Tutorial system coming soon!', 'info');
        // Placeholder for tutorial implementation
    } catch (error) {
        appState.logError('Error showing tutorial', error);
    }
}

function showKeyboardShortcuts() {
    try {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>âŒ¨ï¸ Keyboard Shortcuts</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove();">Ã—</button>
                </div>
                <div style="padding: 20px; max-height: 400px; overflow-y: auto;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                        <div>
                            <h4 style="color: ${THEME_COLORS.primary}; margin-bottom: 15px;">File Operations</h4>
                            <ul style="list-style: none; padding: 0; margin: 0;">
                                <li style="margin-bottom: 8px;"><strong>Ctrl+N</strong> - New Sheet</li>
                                <li style="margin-bottom: 8px;"><strong>Ctrl+O</strong> - Open Sheet</li>
                                <li style="margin-bottom: 8px;"><strong>Ctrl+S</strong> - Save Sheet</li>
                                <li style="margin-bottom: 8px;"><strong>Ctrl+Shift+S</strong> - Save As</li>
                                <li style="margin-bottom: 8px;"><strong>Ctrl+P</strong> - Preview</li>
                            </ul>
                            
                            <h4 style="color: ${THEME_COLORS.primary}; margin: 20px 0 15px 0;">View</h4>
                            <ul style="list-style: none; padding: 0; margin: 0;">
                                <li style="margin-bottom: 8px;"><strong>Ctrl+B</strong> - Toggle Sidebar</li>
                                <li style="margin-bottom: 8px;"><strong>Ctrl++</strong> - Zoom In</li>
                                <li style="margin-bottom: 8px;"><strong>Ctrl+-</strong> - Zoom Out</li>
                                <li style="margin-bottom: 8px;"><strong>Ctrl+0</strong> - Reset Zoom</li>
                                <li style="margin-bottom: 8px;"><strong>Ctrl+G</strong> - Toggle Grid</li>
                            </ul>
                        </div>
                        
                        <div>
                            <h4 style="color: ${THEME_COLORS.primary}; margin-bottom: 15px;">Editing</h4>
                            <ul style="list-style: none; padding: 0; margin: 0;">
                                <li style="margin-bottom: 8px;"><strong>Ctrl+Z</strong> - Undo</li>
                                <li style="margin-bottom: 8px;"><strong>Ctrl+Y</strong> - Redo</li>
                                <li style="margin-bottom: 8px;"><strong>Ctrl+C</strong> - Copy</li>
                                <li style="margin-bottom: 8px;"><strong>Ctrl+V</strong> - Paste</li>
                                <li style="margin-bottom: 8px;"><strong>Ctrl+X</strong> - Cut</li>
                                <li style="margin-bottom: 8px;"><strong>Ctrl+D</strong> - Duplicate</li>
                                <li style="margin-bottom: 8px;"><strong>Delete</strong> - Delete Selected</li>
                            </ul>
                            
                            <h4 style="color: ${THEME_COLORS.primary}; margin: 20px 0 15px 0;">Navigation</h4>
                            <ul style="list-style: none; padding: 0; margin: 0;">
                                <li style="margin-bottom: 8px;"><strong>Escape</strong> - Deselect</li>
                                <li style="margin-bottom: 8px;"><strong>Ctrl+A</strong> - Select All</li>
                                <li style="margin-bottom: 8px;"><strong>F1</strong> - Show Tutorial</li>
                                <li style="margin-bottom: 8px;"><strong>Ctrl+,</strong> - Settings</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
    } catch (error) {
        appState.logError('Error showing keyboard shortcuts', error);
    }
}

function showComponentGuide() {
    try {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h3>ðŸ§© Component Guide</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove();">Ã—</button>
                </div>
                <div style="padding: 20px; max-height: 500px; overflow-y: auto;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                        
                        <div style="background: #2d2d30; padding: 15px; border-radius: 6px;">
                            <h4 style="color: ${THEME_COLORS.primary}; margin: 0 0 10px 0;">ðŸ“‹ Layout Components</h4>
                            <p><strong>Row Container:</strong> Arranges items horizontally in a flexible row</p>
                            <p><strong>Column Container:</strong> Stacks items vertically in a column</p>
                            <small style="color: #858585;">Tip: Nest containers to create complex layouts</small>
                        </div>
                        
                        <div style="background: #2d2d30; padding: 15px; border-radius: 6px;">
                            <h4 style="color: ${THEME_COLORS.primary}; margin: 0 0 10px 0;">ðŸ“ Form Elements</h4>
                            <p><strong>Text Input:</strong> Single-line text entry</p>
                            <p><strong>Number Input:</strong> Numeric values with validation</p>
                            <p><strong>Text Area:</strong> Multi-line text entry</p>
                            <p><strong>Dropdown:</strong> Selection from predefined options</p>
                            <p><strong>Checkbox:</strong> Boolean true/false values</p>
                        </div>
                        
                        <div style="background: #2d2d30; padding: 15px; border-radius: 6px;">
                            <h4 style="color: ${THEME_COLORS.primary}; margin: 0 0 10px 0;">ðŸ§® Smart Components</h4>
                            <p><strong>Calculated Field:</strong> Auto-calculates based on other fields</p>
                            <p><strong>Progress Bar:</strong> Visual representation of values</p>
                            <small style="color: #858585;">Use formulas like [fieldName] + 5 or sum([field1], [field2])</small>
                        </div>
                        
                        <div style="background: #2d2d30; padding: 15px; border-radius: 6px;">
                            <h4 style="color: ${THEME_COLORS.primary}; margin: 0 0 10px 0;">ðŸŽ² Interactive Elements</h4>
                            <p><strong>Dice Button:</strong> Roll dice with customizable types</p>
                            <p><strong>Reference Button:</strong> Display spells, equipment, skills</p>
                            <p><strong>Info Button:</strong> Show custom information boxes</p>
                        </div>
                        
                        <div style="background: #2d2d30; padding: 15px; border-radius: 6px;">
                            <h4 style="color: ${THEME_COLORS.primary}; margin: 0 0 10px 0;">ðŸ’¡ Pro Tips</h4>
                            <ul style="margin: 0; padding-left: 15px;">
                                <li>Use Ctrl+Click for multi-selection</li>
                                <li>Right-click components for context menu</li>
                                <li>Calculated fields update in real-time</li>
                                <li>Progress bars can link to other components</li>
                                <li>Auto-save keeps your work safe</li>
                            </ul>
                        </div>
                        
                        <div style="background: #2d2d30; padding: 15px; border-radius: 6px;">
                            <h4 style="color: ${THEME_COLORS.primary}; margin: 0 0 10px 0;">ðŸ”§ Advanced Features</h4>
                            <p><strong>Global CSS:</strong> Custom styling for your sheet</p>
                            <p><strong>Data Editor:</strong> Direct JSON data manipulation</p>
                            <p><strong>Export Options:</strong> HTML, JSON, print-ready formats</p>
                            <p><strong>Validation:</strong> Real-time input validation</p>
                        </div>
                        
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
    } catch (error) {
        appState.logError('Error showing component guide', error);
    }
}

function showAbout() {
    try {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>ðŸŽ² About Character Sheet Builder</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove();">Ã—</button>
                </div>
                <div style="padding: 30px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 20px;">ðŸŽ®</div>
                    <h4 style="color: ${THEME_COLORS.primary}; margin-bottom: 20px;">Professional TTRPG Character Sheet Builder</h4>
                    <p style="font-size: 18px; margin-bottom: 10px;"><strong>Version ${CONFIG.VERSION}</strong></p>
                    <p style="color: #858585; margin-bottom: 30px;">Build: ${CONFIG.BUILD}</p>
                    
                    <div style="text-align: left; background: #2d2d30; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h5 style="color: ${THEME_COLORS.primary}; margin: 0 0 15px 0;">âœ¨ Features</h5>
                        <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
                            <li>Drag-and-drop component system</li>
                            <li>Real-time calculations and progress tracking</li>
                            <li>Interactive dice rolling and reference systems</li>
                            <li>Auto-save with crash recovery</li>
                            <li>Multi-format export (JSON, HTML, Print)</li>
                            <li>Professional themes and custom styling</li>
                            <li>Advanced validation and error handling</li>
                            <li>Accessibility features and keyboard navigation</li>
                            <li>Performance monitoring and optimization</li>
                            <li>Production-ready security measures</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: left; background: #1e4d2b; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h5 style="color: #4caf50; margin: 0 0 15px 0;">ðŸŽ¯ Perfect for</h5>
                        <p style="margin: 0; line-height: 1.6;">
                            <strong>D&D 5e, Pathfinder, World of Darkness, FATE, Savage Worlds, 
                            Call of Cthulhu, and any custom TTRPG system</strong>
                        </p>
                    </div>
                    
                    <div style="background: #2d2d30; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <h5 style="color: ${THEME_COLORS.primary}; margin: 0 0 10px 0;">ðŸ”§ Technical Info</h5>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; text-align: left; font-size: 12px; color: #858585;">
                            <div>Components: ${document.querySelectorAll('.sheet-item').length}</div>
                            <div>Memory: ${appState.performanceMetrics.memoryUsage}MB</div>
                            <div>Browser: ${navigator.userAgent.split(' ')[0]}</div>
                            <div>Platform: ${navigator.platform}</div>
                        </div>
                    </div>
                    
                    <p style="color: #858585; font-size: 12px; margin: 0;">
                        Built with modern web technologies for maximum compatibility and performance
                    </p>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
    } catch (error) {
        appState.logError('Error showing about dialog', error);
    }
}

function reportIssue() {
    try {
        const errorLog = localStorage.getItem('ttrpg_error_log');
        const systemInfo = {
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            version: CONFIG.VERSION,
            build: CONFIG.BUILD,
            componentCount: document.querySelectorAll('.sheet-item').length,
            memoryUsage: appState.performanceMetrics.memoryUsage,
            performance: appState.performanceMetrics,
            settings: appState.sheetData.settings,
            errors: errorLog ? safeParse(errorLog, []) : [],
            sheetMetadata: appState.sheetData.metadata
        };
        
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px;">
                <div class="modal-header">
                    <h3>ðŸ› Report Issue</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove();">Ã—</button>
                </div>
                <div style="padding: 20px;">
                    <p>To report an issue, please copy the diagnostic information below and send it via your preferred support channel:</p>
                    
                    <div style="margin: 20px 0;">
                        <label style="display: block; margin-bottom: 10px; font-weight: bold;">Issue Description:</label>
                        <textarea id="issue-description" rows="4" style="width: 100%; padding: 10px; border: 1px solid #3e3e42; border-radius: 4px; background: #1e1e1e; color: #d4d4d4;" 
                                  placeholder="Please describe the issue you encountered..."></textarea>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <label style="display: block; margin-bottom: 10px; font-weight: bold;">Steps to Reproduce:</label>
                        <textarea id="issue-steps" rows="3" style="width: 100%; padding: 10px; border: 1px solid #3e3e42; border-radius: 4px; background: #1e1e1e; color: #d4d4d4;" 
                                  placeholder="1. First, I did...&#10;2. Then, I clicked...&#10;3. Finally, I saw..."></textarea>
                    </div>
                    
                    <details style="margin: 20px 0;">
                        <summary style="cursor: pointer; font-weight: bold; color: ${THEME_COLORS.primary};">ðŸ” Diagnostic Information (Click to expand)</summary>
                        <textarea readonly id="diagnostic-info" style="width: 100%; height: 200px; font-family: monospace; font-size: 11px; margin-top: 10px; padding: 10px; border: 1px solid #3e3e42; border-radius: 4px; background: #1e1e1e; color: #d4d4d4;">${safeStringify(systemInfo, null, 2)}</textarea>
                    </details>
                    
                    <div style="display: flex; gap: 10px; margin-top: 20px;">
                        <button onclick="copyIssueReport()" class="btn" style="flex: 1;">
                            ðŸ“‹ Copy Full Report
                        </button>
                        <button onclick="copyDiagnosticInfo()" class="btn btn-secondary">
                            ðŸ” Copy Diagnostic Info Only
                        </button>
                    </div>
                    
                    <div style="background: #2d2d30; padding: 15px; border-radius: 6px; margin-top: 20px;">
                        <h5 style="color: ${THEME_COLORS.info}; margin: 0 0 10px 0;">ðŸ’¡ Support Tip</h5>
                        <p style="margin: 0; font-size: 14px; color: #cccccc;">
                            For faster resolution, include your issue description, steps to reproduce, 
                            and the diagnostic information. No personal data is collected in the diagnostic info.
                        </p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
    } catch (error) {
        appState.logError('Error showing report issue dialog', error);
        appState.showNotification('Error opening issue reporter', 'error');
    }
}

function copyIssueReport() {
    try {
        const description = document.getElementById('issue-description')?.value || 'No description provided';
        const steps = document.getElementById('issue-steps')?.value || 'No steps provided';
        const diagnosticInfo = document.getElementById('diagnostic-info')?.value || '';
        
        const fullReport = `
ISSUE REPORT - TTRPG Character Sheet Builder v${CONFIG.VERSION}
================================================================

ISSUE DESCRIPTION:
${description}

STEPS TO REPRODUCE:
${steps}

DIAGNOSTIC INFORMATION:
${diagnosticInfo}

================================================================
Generated: ${new Date().toISOString()}
        `.trim();
        
        copyToClipboard(fullReport);
        appState.showNotification('Full issue report copied to clipboard', 'success');
        
    } catch (error) {
        appState.logError('Error copying issue report', error);
        appState.showNotification('Failed to copy issue report', 'error');
    }
}

function copyDiagnosticInfo() {
    try {
        const diagnosticInfo = document.getElementById('diagnostic-info')?.value || '';
        copyToClipboard(diagnosticInfo);
        appState.showNotification('Diagnostic info copied to clipboard', 'success');
    } catch (error) {
        appState.logError('Error copying diagnostic info', error);
        appState.showNotification('Failed to copy diagnostic info', 'error');
    }
}

function copyToClipboard(text) {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text);
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            textArea.remove();
        }
    } catch (error) {
        appState.logError('Error copying to clipboard', error);
        throw error;
    }
}

// ===================================================================
// CONTEXT MENU SYSTEM
// ===================================================================

function showContextMenu(e, item) {
    try {
        const existingMenu = document.getElementById('context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
        
        const menu = createContextMenu(item);
        menu.style.left = e.pageX + 'px';
        menu.style.top = e.pageY + 'px';
        
        document.body.appendChild(menu);
        
        // Close menu when clicking elsewhere
        setTimeout(() => {
            const handleClick = (event) => {
                if (!menu.contains(event.target)) {
                    menu.remove();
                    document.removeEventListener('click', handleClick);
                }
            };
            document.addEventListener('click', handleClick);
        }, 100);
        
        // Close menu on escape
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                menu.remove();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
        
    } catch (error) {
        appState.logError('Error showing context menu', error);
    }
}

function createContextMenu(item) {
    try {
        const menu = document.createElement('div');
        menu.id = 'context-menu';
        menu.style.cssText = `
            position: absolute; background: #2d2d30; border: 1px solid ${THEME_COLORS.primary};
            border-radius: 6px; padding: 8px 0; z-index: 10000; min-width: 180px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3); font-size: 14px;
        `;
        
        const menuItems = [
            { text: 'âš™ï¸ Properties', action: () => selectItem(item), enabled: true },
            { text: 'ðŸ“‹ Copy', action: () => copyComponent(item), enabled: true },
            { text: 'ðŸ“„ Duplicate', action: () => duplicateComponent(item), enabled: true },
            { separator: true },
            { text: 'â†‘ Move Up', action: () => moveComponentUp(item), enabled: true },
            { text: 'â†“ Move Down', action: () => moveComponentDown(item), enabled: true },
            { separator: true },
            { text: 'ðŸŽ¨ Quick Style', action: () => showQuickStyle(item), enabled: true },
            { text: 'ðŸ”— Link Data', action: () => showDataLinker(item), enabled: true },
            { separator: true },
            { text: 'ðŸ” Inspect Element', action: () => inspectElement(item), enabled: CONFIG.DEBUG },
            { text: 'ðŸ“Š View Data', action: () => viewComponentData(item), enabled: true },
            { separator: true },
            { text: 'âŒ Delete', action: () => deleteItem(item), enabled: true, class: 'danger' }
        ];
        
        menuItems.forEach(menuItem => {
            if (menuItem.separator) {
                const separator = document.createElement('div');
                separator.style.cssText = 'height: 1px; background: #3e3e42; margin: 4px 12px;';
                menu.appendChild(separator);
            } else if (menuItem.enabled) {
                const itemElement = document.createElement('div');
                itemElement.textContent = menuItem.text;
                itemElement.style.cssText = `
                    padding: 8px 16px; cursor: pointer; 
                    color: ${menuItem.class === 'danger' ? THEME_COLORS.danger : '#d4d4d4'};
                    transition: background-color 0.2s;
                `;
                
                itemElement.addEventListener('mouseenter', function() {
                    this.style.background = '#3e3e42';
                });
                
                itemElement.addEventListener('mouseleave', function() {
                    this.style.background = '';
                });
                
                itemElement.addEventListener('click', (e) => {
                    e.stopPropagation();
                    menu.remove();
                    menuItem.action();
                });
                
                menu.appendChild(itemElement);
            }
        });
        
        return menu;
        
    } catch (error) {
        appState.logError('Error creating context menu', error);
        return document.createElement('div');
    }
}

function showQuickStyle(item) {
    try {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>ðŸŽ¨ Quick Style</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove();">Ã—</button>
                </div>
                <div style="padding: 20px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <label>Background Color:</label>
                            <input type="color" onchange="applyQuickStyle('backgroundColor', this.value)" 
                                   style="width: 100%; height: 40px; border: none; border-radius: 4px;">
                        </div>
                        <div>
                            <label>Text Color:</label>
                            <input type="color" onchange="applyQuickStyle('color', this.value)" 
                                   style="width: 100%; height: 40px; border: none; border-radius: 4px;">
                        </div>
                        <div>
                            <label>Border Color:</label>
                            <input type="color" onchange="applyQuickStyle('borderColor', this.value)" 
                                   style="width: 100%; height: 40px; border: none; border-radius: 4px;">
                        </div>
                        <div>
                            <label>Border Width:</label>
                            <select onchange="applyQuickStyle('borderWidth', this.value)">
                                <option value="0px">None</option>
                                <option value="1px" selected>1px</option>
                                <option value="2px">2px</option>
                                <option value="3px">3px</option>
                                <option value="4px">4px</option>
                            </select>
                        </div>
                        <div>
                            <label>Border Radius:</label>
                            <select onchange="applyQuickStyle('borderRadius', this.value)">
                                <option value="0px">Square</option>
                                <option value="4px" selected>Rounded</option>
                                <option value="8px">More Rounded</option>
                                <option value="50%">Circle</option>
                            </select>
                        </div>
                        <div>
                            <label>Font Weight:</label>
                            <select onchange="applyQuickStyle('fontWeight', this.value)">
                                <option value="normal" selected>Normal</option>
                                <option value="bold">Bold</option>
                                <option value="lighter">Light</option>
                            </select>
                        </div>
                    </div>
                    <div style="margin-top: 20px; text-align: center;">
                        <button onclick="resetQuickStyle()" class="btn btn-secondary" style="margin-right: 10px;">Reset</button>
                        <button onclick="this.closest('.modal').remove();" class="btn">Done</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Store reference to current item for styling
        window._quickStyleTarget = item;
        
    } catch (error) {
        appState.logError('Error showing quick style', error);
    }
}

function applyQuickStyle(property, value) {
    try {
        if (window._quickStyleTarget) {
            appState.saveState('Quick Style');
            window._quickStyleTarget.style[property] = value;
            triggerAutoSave();
        }
    } catch (error) {
        appState.logError('Error applying quick style', error);
    }
}

function resetQuickStyle() {
    try {
        if (window._quickStyleTarget && confirm('Reset all styles for this component?')) {
            appState.saveState('Reset Quick Style');
            window._quickStyleTarget.style.cssText = '';
            triggerAutoSave();
            appState.showNotification('Component styles reset', 'success');
        }
    } catch (error) {
        appState.logError('Error resetting quick style', error);
    }
}

function showDataLinker(item) {
    try {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>ðŸ”— Data Linker</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove();">Ã—</button>
                </div>
                <div style="padding: 20px;">
                    <p>Link this component to data fields or other components:</p>
                    
                    <div style="margin: 15px 0;">
                        <label>Data Field:</label>
                        <select id="data-field-select" style="width: 100%; margin-top: 5px;">
                            <option value="">Select a data field</option>
                            ${generateDataFieldOptions()}
                        </select>
                    </div>
                    
                    <div style="margin: 15px 0;">
                        <label>Component Dependency:</label>
                        <select id="component-dependency-select" style="width: 100%; margin-top: 5px;">
                            <option value="">Select a component</option>
                            ${generateComponentDependencyOptions()}
                        </select>
                    </div>
                    
                    <div style="margin-top: 20px; text-align: center;">
                        <button onclick="applyDataLink()" class="btn" style="margin-right: 10px;">Apply Links</button>
                        <button onclick="this.closest('.modal').remove();" class="btn btn-secondary">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        window._dataLinkTarget = item;
        
    } catch (error) {
        appState.logError('Error showing data linker', error);
    }
}

function generateDataFieldOptions() {
    try {
        return Object.keys(appState.sheetData.data).map(field => 
            `<option value="${field}">${field}</option>`
        ).join('');
    } catch (error) {
        return '';
    }
}

function generateComponentDependencyOptions() {
    try {
        const components = document.querySelectorAll('.sheet-item');
        return Array.from(components).map(comp => {
            const id = comp.dataset.id;
            const type = comp.dataset.type;
            const label = comp.querySelector('label')?.textContent || id;
            return `<option value="${id}">${label} (${type})</option>`;
        }).join('');
    } catch (error) {
        return '';
    }
}

function applyDataLink() {
    try {
        const dataField = document.getElementById('data-field-select')?.value;
        const componentDep = document.getElementById('component-dependency-select')?.value;
        
        if (window._dataLinkTarget) {
            appState.saveState('Apply Data Link');
            
            if (dataField) {
                const input = window._dataLinkTarget.querySelector('[data-json-path]');
                if (input) {
                    input.dataset.jsonPath = dataField;
                }
            }
            
            if (componentDep) {
                window._dataLinkTarget.dataset.depends = componentDep;
            }
            
            triggerAutoSave();
            appState.showNotification('Data links applied', 'success');
        }
        
        document.querySelector('.modal.show')?.remove();
        
    } catch (error) {
        appState.logError('Error applying data link', error);
    }
}

function inspectElement(item) {
    try {
        if (!CONFIG.DEBUG) return;
        
        const inspector = {
            id: item.dataset.id,
            type: item.dataset.type,
            element: item,
            data: appState.sheetData.data,
            computedStyle: window.getComputedStyle(item),
            boundingRect: item.getBoundingClientRect(),
            children: item.children.length,
            parent: item.parentElement?.tagName,
            jsonPaths: Array.from(item.querySelectorAll('[data-json-path]')).map(el => el.dataset.jsonPath)
        };
        
        console.group(`ðŸ” Component Inspector: ${item.dataset.type}`);
        console.log('Element:', item);
        console.log('Data:', inspector);
        console.groupEnd();
        
        appState.showNotification('Component data logged to console', 'info');
        
    } catch (error) {
        appState.logError('Error inspecting element', error);
    }
}

function viewComponentData(item) {
    try {
        const jsonPaths = Array.from(item.querySelectorAll('[data-json-path]')).map(el => el.dataset.jsonPath);
        const componentData = {};
        
        jsonPaths.forEach(path => {
            if (path && appState.sheetData.data[path] !== undefined) {
                componentData[path] = appState.sheetData.data[path];
            }
        });
        
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>ðŸ“Š Component Data</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove();">Ã—</button>
                </div>
                <div style="padding: 20px;">
                    <h4>Component: ${item.dataset.type} (${item.dataset.id})</h4>
                    <textarea readonly style="width: 100%; height: 200px; font-family: monospace; font-size: 12px; padding: 10px; background: #1e1e1e; color: #d4d4d4; border: 1px solid #3e3e42; border-radius: 4px;">${safeStringify(componentData, null, 2)}</textarea>
                    <div style="margin-top: 15px; text-align: center;">
                        <button onclick="copyToClipboard('${safeStringify(componentData).replace(/'/g, "\\'")}'); appState.showNotification('Data copied', 'success');" class="btn">Copy Data</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
    } catch (error) {
        appState.logError('Error viewing component data', error);
    }
}

// ===================================================================
// VALIDATION SYSTEM
// ===================================================================

function showValidationResults(validation) {
    try {
        if (validation.valid && validation.warnings.length === 0) {
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${validation.valid ? 'âš ï¸ Validation Warnings' : 'âŒ Validation Errors'}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove();">Ã—</button>
                </div>
                <div style="padding: 20px;">
                    ${!validation.valid ? `
                        <div style="background: rgba(244, 67, 54, 0.1); border: 1px solid ${THEME_COLORS.danger}; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
                            <h5 style="color: ${THEME_COLORS.danger}; margin: 0 0 10px 0;">Errors:</h5>
                            <ul style="margin: 0; padding-left: 20px;">
                                ${validation.errors.map(error => `<li>${error}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${validation.warnings.length > 0 ? `
                        <div style="background: rgba(255, 152, 0, 0.1); border: 1px solid ${THEME_COLORS.warning}; padding: 15px; border-radius: 6px;">
                            <h5 style="color: ${THEME_COLORS.warning}; margin: 0 0 10px 0;">Warnings:</h5>
                            <ul style="margin: 0; padding-left: 20px;">
                                ${validation.warnings.map(warning => `<li>${warning}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    <div style="margin-top: 20px; text-align: center;">
                        <button onclick="this.closest('.modal').remove();" class="btn">OK</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
    } catch (error) {
        appState.logError('Error showing validation results', error);
    }
}

// ===================================================================
// ERROR HANDLING AND RECOVERY
// ===================================================================

function showErrorDialog(message, details = null) {
    try {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header" style="background: ${THEME_COLORS.danger}; color: white;">
                    <h3>âŒ Error</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove();" style="color: white;">Ã—</button>
                </div>
                <div style="padding: 20px;">
                    <p><strong>An error occurred:</strong></p>
                    <div style="background: rgba(244, 67, 54, 0.1); padding: 10px; border-radius: 4px; color: ${THEME_COLORS.danger}; margin: 10px 0;">
                        ${message}
                    </div>
                    ${details ? `
                        <details style="margin-top: 15px;">
                            <summary style="cursor: pointer; color: ${THEME_COLORS.primary};">Technical Details</summary>
                            <pre style="background: #f5f5f5; padding: 10px; overflow: auto; font-size: 12px; margin-top: 10px; border-radius: 4px; color: #333;">${details}</pre>
                        </details>
                    ` : ''}
                    <div style="margin-top: 20px; text-align: center;">
                        <button onclick="performAutoSave(); this.closest('.modal').remove();" class="btn" style="margin-right: 10px;">Save & Continue</button>
                        <button onclick="this.closest('.modal').remove();" class="btn btn-secondary">Continue</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
    } catch (error) {
        // Fallback error display
        alert(`Error: ${message}`);
    }
}

// ===================================================================
// FINALIZATION AND CLEANUP
// ===================================================================

// Save preferences on page unload
window.addEventListener('beforeunload', () => {
    try {
        saveUserPreferences();
        if (appState.isDirty) {
            performAutoSave();
        }
    } catch (error) {
        console.error('Error during page unload:', error);
    }
});

// Cleanup on page unload
window.addEventListener('unload', () => {
    try {
        appState.cleanup();
    } catch (error) {
        console.error('Error during cleanup:', error);
    }
});

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
    try {
        if (document.hidden && appState.isDirty) {
            performAutoSave();
        } else if (!document.hidden) {
            // Page became visible again - check for updates
            updateCalculatedFields();
            updateProgressBars();
        }
    } catch (error) {
        appState.logError('Error handling visibility change', error);
    }
});

// ===================================================================
// EXPOSE GLOBAL API FOR EXTENSIBILITY
// ===================================================================

// Expose safe API for external extensions
window.TTRPGBuilder = {
    version: CONFIG.VERSION,
    
    // Safe component operations
    createComponent: (type, container) => {
        try {
            return createComponent(type, container);
        } catch (error) {
            appState.logError('External API: Error creating component', error);
            return null;
        }
    },
    
    // Safe data operations
    getData: () => {
        return appState.deepClone(appState.sheetData.data);
    },
    
    setData: (path, value) => {
        try {
            if (typeof path === 'string' && path.length > 0) {
                appState.sheetData.data[path] = appState.sanitizeString(value);
                appState.markDirty();
                return true;
            }
            return false;
        } catch (error) {
            appState.logError('External API: Error setting data', error);
            return false;
        }
    },
    
    // Safe utility functions
    showNotification: (message, type = 'info') => {
        try {
            appState.showNotification(message, type);
        } catch (error) {
            appState.logError('External API: Error showing notification', error);
        }
    },
    
    // Safe state operations
    saveState: (action) => {
        try {
            appState.saveState(action);
        } catch (error) {
            appState.logError('External API: Error saving state', error);
        }
    },
    
    // Performance metrics (read-only)
    getPerformanceMetrics: () => {
        return { ...appState.performanceMetrics };
    },
    
    // Validation
    validateSheet: () => {
        try {
            return appState.validateSheet();
        } catch (error) {
            appState.logError('External API: Error validating sheet', error);
            return { valid: false, errors: ['Validation failed'], warnings: [] };
        }
    }
};

// Freeze the API to prevent tampering
if (Object.freeze) {
    Object.freeze(window.TTRPGBuilder);
}

// ===================================================================
// FINAL STATUS UPDATE
// ===================================================================

// Update status when fully loaded
if (document.readyState === 'complete') {
    setTimeout(() => {
        updateStatus('Ready - TTRPG Character Sheet Builder v' + CONFIG.VERSION);
    }, 1000);
} else {
    window.addEventListener('load', () => {
        setTimeout(() => {
            updateStatus('Ready - TTRPG Character Sheet Builder v' + CONFIG.VERSION);
        }, 1000);
    });
}

// Log successful initialization
if (CONFIG.DEBUG) {
    console.log(`%cðŸŽ² TTRPG Character Sheet Builder v${CONFIG.VERSION}`, 
        'color: #4fc3f7; font-size: 16px; font-weight: bold;');
    console.log('âœ… Application successfully initialized');
    console.log('ðŸ“Š Performance monitoring enabled');
    console.log('ðŸ”’ Security measures active');
    console.log('ðŸ’¾ Auto-save configured');
    console.log('ðŸŽ¨ Theme system ready');
    console.log('âŒ¨ï¸ Keyboard shortcuts active');
    console.log('ðŸ”§ Production build ready');
}

// ===================================================================
// VISUAL JSON REFERENCE BUILDER - NODE-BASED EDITOR
// ===================================================================

class VisualJSONBuilder {
    constructor() {
        this.canvas = null;
        this.nodes = new Map();
        this.connections = new Map();
        this.nodeCounter = 0;
        this.selectedNode = null;
        this.selectedConnection = null;
        this.dragNode = null;
        this.dragOffset = { x: 0, y: 0 };
        this.zoom = 1;
        this.panOffset = { x: 0, y: 0 };
        this.connectionMode = false;
        this.connectionStart = null;
        this.tempConnection = null;
        this.gridSize = 20;
        this.showGrid = true;
        this.nodeTypes = this.initializeNodeTypes();
        this.templates = this.initializeTemplates();
        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 50;
    }

    initializeNodeTypes() {
        return {
            'root': {
                name: 'Root Object',
                color: '#4fc3f7',
                icon: 'ðŸ“¦',
                inputs: [],
                outputs: ['object'],
                defaultProperties: { name: 'Root' },
                category: 'Structure'
            },
            'object': {
                name: 'Object',
                color: '#ff9800',
                icon: 'ðŸ“‹',
                inputs: ['any'],
                outputs: ['object'],
                defaultProperties: { name: 'Object' },
                category: 'Structure'
            },
            'array': {
                name: 'Array',
                color: '#9c27b0',
                icon: 'ðŸ“Š',
                inputs: ['any'],
                outputs: ['array'],
                defaultProperties: { name: 'Array' },
                category: 'Structure'
            },
            'string': {
                name: 'String',
                color: '#4caf50',
                icon: 'ðŸ“',
                inputs: [],
                outputs: ['string'],
                defaultProperties: { name: 'String', value: '' },
                category: 'Data'
            },
            'number': {
                name: 'Number',
                color: '#2196f3',
                icon: 'ðŸ”¢',
                inputs: [],
                outputs: ['number'],
                defaultProperties: { name: 'Number', value: 0 },
                category: 'Data'
            },
            'boolean': {
                name: 'Boolean',
                color: '#795548',
                icon: 'â˜‘ï¸',
                inputs: [],
                outputs: ['boolean'],
                defaultProperties: { name: 'Boolean', value: false },
                category: 'Data'
            },
            'property': {
                name: 'Property',
                color: '#607d8b',
                icon: 'ðŸ·ï¸',
                inputs: ['any'],
                outputs: ['property'],
                defaultProperties: { name: 'Property', key: 'key' },
                category: 'Structure'
            },
            'spell': {
                name: 'Spell Template',
                color: '#e91e63',
                icon: 'âœ¨',
                inputs: [],
                outputs: ['object'],
                defaultProperties: {
                    name: 'Spell',
                    spellName: 'New Spell',
                    level: 1,
                    school: 'Evocation',
                    castingTime: '1 action',
                    range: '30 feet',
                    components: 'V, S',
                    duration: 'Instantaneous',
                    description: 'Spell description here'
                },
                category: 'Templates'
            },
            'equipment': {
                name: 'Equipment Template',
                color: '#ff5722',
                icon: 'âš”ï¸',
                inputs: [],
                outputs: ['object'],
                defaultProperties: {
                    name: 'Equipment',
                    itemName: 'New Item',
                    type: 'Weapon',
                    damage: '1d8',
                    weight: '3 lb',
                    cost: '10 gp',
                    properties: [],
                    description: 'Item description here'
                },
                category: 'Templates'
            },
            'skill': {
                name: 'Skill Template',
                color: '#673ab7',
                icon: 'ðŸŽ¯',
                inputs: [],
                outputs: ['object'],
                defaultProperties: {
                    name: 'Skill',
                    skillName: 'New Skill',
                    ability: 'Strength',
                    proficient: false,
                    expertise: false,
                    description: 'Skill description here'
                },
                category: 'Templates'
            }
        };
    }

    initializeTemplates() {
        return {
            'spell_database': {
                name: 'Spell Database',
                description: 'Complete spell reference structure',
                nodes: [
                    { type: 'root', x: 100, y: 100, properties: { name: 'Spells' } },
                    { type: 'array', x: 300, y: 100, properties: { name: 'SpellList' } },
                    { type: 'spell', x: 500, y: 50, properties: {} },
                    { type: 'spell', x: 500, y: 150, properties: {} }
                ]
            },
            'equipment_database': {
                name: 'Equipment Database',
                description: 'Equipment and item reference structure',
                nodes: [
                    { type: 'root', x: 100, y: 100, properties: { name: 'Equipment' } },
                    { type: 'array', x: 300, y: 100, properties: { name: 'Items' } },
                    { type: 'equipment', x: 500, y: 50, properties: {} },
                    { type: 'equipment', x: 500, y: 150, properties: {} }
                ]
            },
            'character_stats': {
                name: 'Character Stats',
                description: 'Basic character statistics structure',
                nodes: [
                    { type: 'root', x: 100, y: 100, properties: { name: 'Character' } },
                    { type: 'string', x: 300, y: 50, properties: { name: 'Name', value: 'Character Name' } },
                    { type: 'number', x: 300, y: 100, properties: { name: 'Level', value: 1 } },
                    { type: 'string', x: 300, y: 150, properties: { name: 'Class', value: 'Fighter' } }
                ]
            }
        };
    }

    show() {
        try {
            this.createModal();
            this.initializeCanvas();
            this.setupEventListeners();
            this.loadTemplate('spell_database');
            showModal('json-builder-modal');
        } catch (error) {
            appState.logError('Error showing JSON builder', error);
        }
    }

    createModal() {
        const modal = document.createElement('div');
        modal.id = 'json-builder-modal';
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 95vw; max-height: 95vh; width: 1200px; height: 800px; display: flex; flex-direction: column;">
                <div class="modal-header" style="flex-shrink: 0;">
                    <h3>ðŸ”— Visual JSON Reference Builder</h3>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <button onclick="if(window.jsonBuilder) window.jsonBuilder.saveGraph()" class="btn btn-secondary" style="padding: 6px 12px;">ðŸ’¾ Save</button>
                        <button onclick="if(window.jsonBuilder) window.jsonBuilder.loadGraph()" class="btn btn-secondary" style="padding: 6px 12px;">ðŸ“ Load</button>
                        <button onclick="if(window.jsonBuilder) window.jsonBuilder.exportJSON()" class="btn" style="padding: 6px 12px;">ðŸ“¤ Export JSON</button>
                        <button class="modal-close" onclick="if(window.jsonBuilder) window.jsonBuilder.close();">Ã—</button>
                    </div>
                </div>
                
                <div style="display: flex; flex: 1; min-height: 0;">
                    <!-- Node Palette -->
                    <div style="width: 250px; background: #2d2d30; border-right: 1px solid #3e3e42; display: flex; flex-direction: column;">
                        <div style="padding: 15px; border-bottom: 1px solid #3e3e42;">
                            <h4 style="margin: 0 0 15px 0; color: ${THEME_COLORS.primary};">Node Library</h4>
                            
                            <!-- Templates -->
                            <div style="margin-bottom: 20px;">
                                <h5 style="margin: 0 0 10px 0; color: #cccccc;">Templates</h5>
                                <select id="template-select" onchange="if(window.jsonBuilder) window.jsonBuilder.loadTemplate(this.value)" style="width: 100%; margin-bottom: 10px;">
                                    <option value="">Choose Template</option>
                                    <option value="spell_database">Spell Database</option>
                                    <option value="equipment_database">Equipment Database</option>
                                    <option value="character_stats">Character Stats</option>
                                </select>
                                <button onclick="if(window.jsonBuilder) window.jsonBuilder.clearCanvas()" class="btn btn-secondary" style="width: 100%; padding: 6px;">ðŸ—‘ï¸ Clear All</button>
                            </div>
                            
                            <!-- Controls -->
                            <div style="margin-bottom: 20px;">
                                <h5 style="margin: 0 0 10px 0; color: #cccccc;">Controls</h5>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
                                    <button onclick="if(window.jsonBuilder) window.jsonBuilder.undo()" class="btn btn-secondary" style="padding: 6px; font-size: 12px;">â†¶ Undo</button>
                                    <button onclick="if(window.jsonBuilder) window.jsonBuilder.redo()" class="btn btn-secondary" style="padding: 6px; font-size: 12px;">â†· Redo</button>
                                    <button onclick="if(window.jsonBuilder) window.jsonBuilder.zoomIn()" class="btn btn-secondary" style="padding: 6px; font-size: 12px;">ðŸ”+</button>
                                    <button onclick="if(window.jsonBuilder) window.jsonBuilder.zoomOut()" class="btn btn-secondary" style="padding: 6px; font-size: 12px;">ðŸ”-</button>
                                </div>
                                <label style="display: flex; align-items: center; margin-top: 10px; cursor: pointer;">
                                    <input type="checkbox" ${this.showGrid ? 'checked' : ''} onchange="if(window.jsonBuilder) window.jsonBuilder.toggleGrid(this.checked)" style="margin-right: 8px;">
                                    Show Grid
                                </label>
                            </div>
                        </div>
                        
                        <!-- Node Types -->
                        <div style="flex: 1; overflow-y: auto; padding: 15px;">
                            <div id="node-palette"></div>
                        </div>
                    </div>
                    
                    <!-- Main Canvas Area -->
                    <div style="flex: 1; display: flex; flex-direction: column;">
                        <!-- Canvas -->
                        <div style="flex: 1; position: relative; overflow: hidden; background: #1e1e1e;">
                            <canvas id="json-builder-canvas" style="display: block; cursor: grab;"></canvas>
                        </div>
                        
                        <!-- Properties Panel -->
                        <div style="height: 200px; background: #2d2d30; border-top: 1px solid #3e3e42; overflow-y: auto;">
                            <div id="node-properties" style="padding: 15px;">
                                <div style="text-align: center; color: #858585; padding: 40px;">
                                    Select a node to edit its properties
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- JSON Output -->
                    <div style="width: 300px; background: #2d2d30; border-left: 1px solid #3e3e42; display: flex; flex-direction: column;">
                        <div style="padding: 15px; border-bottom: 1px solid #3e3e42;">
                            <h4 style="margin: 0; color: ${THEME_COLORS.primary};">JSON Output</h4>
                        </div>
                        <div style="flex: 1; padding: 15px;">
                            <textarea id="json-output" readonly style="width: 100%; height: 100%; font-family: monospace; font-size: 11px; background: #1e1e1e; color: #d4d4d4; border: 1px solid #3e3e42; border-radius: 4px; padding: 10px; resize: none;"></textarea>
                        </div>
                        <div style="padding: 15px; border-top: 1px solid #3e3e42;">
                            <button onclick="if(window.jsonBuilder) window.jsonBuilder.copyJSON()" class="btn" style="width: 100%; padding: 8px;">ðŸ“‹ Copy JSON</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.populateNodePalette();
    }

    populateNodePalette() {
        const palette = document.getElementById('node-palette');
        const categories = {};
        
        // Group nodes by category
        Object.entries(this.nodeTypes).forEach(([type, nodeType]) => {
            if (!categories[nodeType.category]) {
                categories[nodeType.category] = [];
            }
            categories[nodeType.category].push({ type, ...nodeType });
        });
        
        // Create category sections
        Object.entries(categories).forEach(([category, nodes]) => {
            const categoryDiv = document.createElement('div');
            categoryDiv.style.marginBottom = '20px';
            
            const categoryTitle = document.createElement('h5');
            categoryTitle.textContent = category;
            categoryTitle.style.cssText = 'margin: 0 0 10px 0; color: #cccccc; font-size: 12px; text-transform: uppercase;';
            categoryDiv.appendChild(categoryTitle);
            
            nodes.forEach(node => {
                const nodeButton = document.createElement('div');
                nodeButton.className = 'node-palette-item';
                nodeButton.draggable = true;
                nodeButton.dataset.nodeType = node.type;
                nodeButton.style.cssText = `
                    display: flex; align-items: center; gap: 8px; padding: 8px;
                    margin-bottom: 4px; background: ${node.color}20; border: 1px solid ${node.color}40;
                    border-radius: 4px; cursor: grab; transition: all 0.2s;
                    font-size: 12px; color: #d4d4d4;
                `;
                
                nodeButton.innerHTML = `
                    <span style="font-size: 14px;">${node.icon}</span>
                    <span>${node.name}</span>
                `;
                
                nodeButton.addEventListener('mouseenter', function() {
                    this.style.background = node.color + '40';
                    this.style.borderColor = node.color;
                });
                
                nodeButton.addEventListener('mouseleave', function() {
                    this.style.background = node.color + '20';
                    this.style.borderColor = node.color + '40';
                });
                
                nodeButton.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', node.type);
                });
                
                categoryDiv.appendChild(nodeButton);
            });
            
            palette.appendChild(categoryDiv);
        });
    }

    initializeCanvas() {
        this.canvas = document.getElementById('json-builder-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.render();
    }

    setupEventListeners() {
        // Canvas events
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Drag and drop from palette
        this.canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });
        
        this.canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            const nodeType = e.dataTransfer.getData('text/plain');
            if (nodeType) {
                const rect = this.canvas.getBoundingClientRect();
                const canvasX = (e.clientX - rect.left - this.panOffset.x) / this.zoom;
                const canvasY = (e.clientY - rect.top - this.panOffset.y) / this.zoom;
                this.createNode(nodeType, canvasX, canvasY);
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (!document.getElementById('json-builder-modal')) return;
            
            if (e.key === 'Delete' && this.selectedNode) {
                this.deleteNode(this.selectedNode);
            } else if (e.key === 'Escape') {
                this.selectedNode = null;
                this.clearProperties();
                this.render();
            } else if (e.ctrlKey && e.key === 'z') {
                e.preventDefault();
                this.undo();
            } else if (e.ctrlKey && e.key === 'y') {
                e.preventDefault();
                this.redo();
            }
        });
    }

    createNode(type, x, y) {
        const nodeType = this.nodeTypes[type];
        if (!nodeType) return null;
        
        const node = {
            id: 'node_' + (++this.nodeCounter),
            type: type,
            x: x || 100,
            y: y || 100,
            width: 120,
            height: 60,
            properties: { ...nodeType.defaultProperties },
            inputs: [],
            outputs: []
        };
        
        this.nodes.set(node.id, node);
        this.saveHistory();
        this.render();
        this.updateJSON();
        
        return node;
    }

    deleteNode(nodeId) {
        if (!this.nodes.has(nodeId)) return;
        
        // Remove all connections to this node
        const connectionsToRemove = [];
        this.connections.forEach((connection, id) => {
            if (connection.from === nodeId || connection.to === nodeId) {
                connectionsToRemove.push(id);
            }
        });
        
        connectionsToRemove.forEach(id => this.connections.delete(id));
        this.nodes.delete(nodeId);
        
        if (this.selectedNode === nodeId) {
            this.selectedNode = null;
            this.clearProperties();
        }
        
        this.saveHistory();
        this.render();
        this.updateJSON();
    }

    onMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - this.panOffset.x) / this.zoom;
        const y = (e.clientY - rect.top - this.panOffset.y) / this.zoom;
        
        // Check for node selection
        const clickedNode = this.getNodeAt(x, y);
        
        if (clickedNode) {
            this.selectedNode = clickedNode.id;
            this.showProperties(clickedNode);
            
            if (e.button === 0) { // Left click
                this.dragNode = clickedNode.id;
                this.dragOffset.x = x - clickedNode.x;
                this.dragOffset.y = y - clickedNode.y;
                this.canvas.style.cursor = 'grabbing';
            }
        } else {
            this.selectedNode = null;
            this.clearProperties();
            
            if (e.button === 0) { // Left click for panning
                this.dragNode = 'canvas';
                this.dragOffset.x = e.clientX - this.panOffset.x;
                this.dragOffset.y = e.clientY - this.panOffset.y;
                this.canvas.style.cursor = 'grabbing';
            }
        }
        
        this.render();
    }

    onMouseMove(e) {
        if (this.dragNode === 'canvas') {
            this.panOffset.x = e.clientX - this.dragOffset.x;
            this.panOffset.y = e.clientY - this.dragOffset.y;
            this.render();
        } else if (this.dragNode && this.nodes.has(this.dragNode)) {
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left - this.panOffset.x) / this.zoom;
            const y = (e.clientY - rect.top - this.panOffset.y) / this.zoom;
            
            const node = this.nodes.get(this.dragNode);
            node.x = x - this.dragOffset.x;
            node.y = y - this.dragOffset.y;
            
            this.render();
        }
    }

    onMouseUp(e) {
        if (this.dragNode) {
            this.canvas.style.cursor = 'grab';
            this.dragNode = null;
            this.saveHistory();
            this.updateJSON();
        }
    }

    onWheel(e) {
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.1, Math.min(3, this.zoom * zoomFactor));
        
        // Zoom toward mouse position
        this.panOffset.x = mouseX - (mouseX - this.panOffset.x) * (newZoom / this.zoom);
        this.panOffset.y = mouseY - (mouseY - this.panOffset.y) * (newZoom / this.zoom);
        
        this.zoom = newZoom;
        this.render();
    }

    getNodeAt(x, y) {
        for (const [id, node] of this.nodes) {
            if (x >= node.x && x <= node.x + node.width &&
                y >= node.y && y <= node.y + node.height) {
                return node;
            }
        }
        return null;
    }

    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        ctx.save();
        ctx.translate(this.panOffset.x, this.panOffset.y);
        ctx.scale(this.zoom, this.zoom);
        
        // Draw grid
        if (this.showGrid) {
            this.drawGrid(ctx);
        }
        
        // Draw connections
        this.connections.forEach(connection => {
            this.drawConnection(ctx, connection);
        });
        
        // Draw nodes
        this.nodes.forEach(node => {
            this.drawNode(ctx, node);
        });
        
        ctx.restore();
    }

    drawGrid(ctx) {
        const gridSpacing = this.gridSize;
        const startX = Math.floor(-this.panOffset.x / this.zoom / gridSpacing) * gridSpacing;
        const startY = Math.floor(-this.panOffset.y / this.zoom / gridSpacing) * gridSpacing;
        const endX = startX + (this.canvas.width / this.zoom) + gridSpacing;
        const endY = startY + (this.canvas.height / this.zoom) + gridSpacing;
        
        ctx.strokeStyle = '#3e3e42';
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        for (let x = startX; x <= endX; x += gridSpacing) {
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
        }
        
        for (let y = startY; y <= endY; y += gridSpacing) {
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
        }
        
        ctx.stroke();
    }

    drawNode(ctx, node) {
        const nodeType = this.nodeTypes[node.type];
        const isSelected = this.selectedNode === node.id;
        
        // Node background
        ctx.fillStyle = isSelected ? nodeType.color : nodeType.color + '80';
        ctx.strokeStyle = isSelected ? '#ffffff' : nodeType.color;
        ctx.lineWidth = isSelected ? 2 : 1;
        
        ctx.beginPath();
        ctx.roundRect(node.x, node.y, node.width, node.height, 6);
        ctx.fill();
        ctx.stroke();
        
        // Node icon and text
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        
        // Icon
        ctx.fillText(nodeType.icon, node.x + 8, node.y + 20);
        
        // Name
        ctx.font = '12px Arial';
        ctx.fillText(nodeType.name, node.x + 30, node.y + 20);
        
        // Properties preview
        ctx.font = '10px Arial';
        ctx.fillStyle = '#cccccc';
        const previewText = this.getNodePreviewText(node);
        ctx.fillText(previewText, node.x + 8, node.y + 40);
        
        // Connection points
        this.drawConnectionPoints(ctx, node);
    }

    drawConnectionPoints(ctx, node) {
        const nodeType = this.nodeTypes[node.type];
        const pointRadius = 4;
        
        // Input points (left side)
        if (nodeType.inputs.length > 0) {
            const inputY = node.y + node.height / 2;
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(node.x, inputY, pointRadius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Output points (right side)
        if (nodeType.outputs.length > 0) {
            const outputY = node.y + node.height / 2;
            ctx.fillStyle = '#f44336';
            ctx.beginPath();
            ctx.arc(node.x + node.width, outputY, pointRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawConnection(ctx, connection) {
        const fromNode = this.nodes.get(connection.from);
        const toNode = this.nodes.get(connection.to);
        
        if (!fromNode || !toNode) return;
        
        const fromX = fromNode.x + fromNode.width;
        const fromY = fromNode.y + fromNode.height / 2;
        const toX = toNode.x;
        const toY = toNode.y + toNode.height / 2;
        
        ctx.strokeStyle = '#4fc3f7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        // Bezier curve for smooth connection
        const cp1x = fromX + 50;
        const cp1y = fromY;
        const cp2x = toX - 50;
        const cp2y = toY;
        
        ctx.moveTo(fromX, fromY);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, toX, toY);
        ctx.stroke();
        
        // Arrow head
        const angle = Math.atan2(toY - cp2y, toX - cp2x);
        const arrowLength = 10;
        
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(
            toX - arrowLength * Math.cos(angle - Math.PI / 6),
            toY - arrowLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(toX, toY);
        ctx.lineTo(
            toX - arrowLength * Math.cos(angle + Math.PI / 6),
            toY - arrowLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
    }

    getNodePreviewText(node) {
        switch (node.type) {
            case 'string':
                return `"${node.properties.value || ''}"`;
            case 'number':
                return node.properties.value?.toString() || '0';
            case 'boolean':
                return node.properties.value ? 'true' : 'false';
            case 'spell':
                return node.properties.spellName || 'New Spell';
            case 'equipment':
                return node.properties.itemName || 'New Item';
            case 'skill':
                return node.properties.skillName || 'New Skill';
            default:
                return node.properties.name || '';
        }
    }

    showProperties(node) {
        const propertiesPanel = document.getElementById('node-properties');
        const nodeType = this.nodeTypes[node.type];
        
        let html = `
            <h4 style="margin: 0 0 15px 0; color: ${THEME_COLORS.primary};">
                ${nodeType.icon} ${nodeType.name} Properties
            </h4>
        `;
        
        // Generate property inputs based on node type
        Object.entries(node.properties).forEach(([key, value]) => {
            const inputType = this.getInputType(value);
            html += `
                <div style="margin-bottom: 10px;">
                    <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #cccccc;">${key}:</label>
                    ${this.generatePropertyInput(key, value, inputType, node.id)}
                </div>
            `;
        });
        
        // Add button for new properties
        html += `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #3e3e42;">
                <button onclick="if(window.jsonBuilder) window.jsonBuilder.addProperty('${node.id}')" class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px;">+ Add Property</button>
            </div>
        `;
        
        propertiesPanel.innerHTML = html;
    }

    getInputType(value) {
        if (typeof value === 'boolean') return 'checkbox';
        if (typeof value === 'number') return 'number';
        return 'text';
    }

    generatePropertyInput(key, value, inputType, nodeId) {
        const escapedValue = typeof value === 'string' ? value.replace(/"/g, '&quot;') : value;
        
        switch (inputType) {
            case 'checkbox':
                return `<input type="checkbox" ${value ? 'checked' : ''} onchange="if(window.jsonBuilder) window.jsonBuilder.updateProperty('${nodeId}', '${key}', this.checked)">`;
            case 'number':
                return `<input type="number" value="${value}" onchange="if(window.jsonBuilder) window.jsonBuilder.updateProperty('${nodeId}', '${key}', parseFloat(this.value) || 0)" style="width: 100%;">`;
            default:
                return `<input type="text" value="${escapedValue}" onchange="if(window.jsonBuilder) window.jsonBuilder.updateProperty('${nodeId}', '${key}', this.value)" style="width: 100%;">`;
        }
    }

    updateProperty(nodeId, key, value) {
        const node = this.nodes.get(nodeId);
        if (node) {
            node.properties[key] = value;
            this.render();
            this.updateJSON();
            this.saveHistory();
        }
    }

    addProperty(nodeId) {
        const propertyName = prompt('Property name:');
        if (propertyName && propertyName.trim()) {
            const node = this.nodes.get(nodeId);
            if (node) {
                node.properties[propertyName.trim()] = '';
                this.showProperties(node);
                this.updateJSON();
                this.saveHistory();
            }
        }
    }

    clearProperties() {
        const propertiesPanel = document.getElementById('node-properties');
        propertiesPanel.innerHTML = `
            <div style="text-align: center; color: #858585; padding: 40px;">
                Select a node to edit its properties
            </div>
        `;
    }

    updateJSON() {
        try {
            const result = this.generateJSON();
            const output = document.getElementById('json-output');
            if (output) {
                output.value = JSON.stringify(result, null, 2);
            }
        } catch (error) {
            const output = document.getElementById('json-output');
            if (output) {
                output.value = 'Error generating JSON: ' + error.message;
            }
        }
    }

    generateJSON() {
        // Find root nodes (nodes with no inputs connected)
        const rootNodes = [];
        this.nodes.forEach(node => {
            const hasInputConnection = Array.from(this.connections.values()).some(conn => conn.to === node.id);
            if (!hasInputConnection || node.type === 'root') {
                rootNodes.push(node);
            }
        });
        
        if (rootNodes.length === 0) {
            return {};
        }
        
        // If there's only one root, return its data directly
        if (rootNodes.length === 1) {
            return this.nodeToJSON(rootNodes[0]);
        }
        
        // Multiple roots - create an object with each root as a property
        const result = {};
        rootNodes.forEach(node => {
            const key = node.properties.name || node.type;
            result[key] = this.nodeToJSON(node);
        });
        
        return result;
    }

    nodeToJSON(node) {
        switch (node.type) {
            case 'root':
            case 'object':
                return this.objectNodeToJSON(node);
            case 'array':
                return this.arrayNodeToJSON(node);
            case 'string':
                return node.properties.value || '';
            case 'number':
                return node.properties.value || 0;
            case 'boolean':
                return node.properties.value || false;
            case 'spell':
                return {
                    name: node.properties.spellName,
                    level: node.properties.level,
                    school: node.properties.school,
                    castingTime: node.properties.castingTime,
                    range: node.properties.range,
                    components: node.properties.components,
                    duration: node.properties.duration,
                    description: node.properties.description
                };
            case 'equipment':
                return {
                    name: node.properties.itemName,
                    type: node.properties.type,
                    damage: node.properties.damage,
                    weight: node.properties.weight,
                    cost: node.properties.cost,
                    properties: node.properties.properties || [],
                    description: node.properties.description
                };
            case 'skill':
                return {
                    name: node.properties.skillName,
                    ability: node.properties.ability,
                    proficient: node.properties.proficient,
                    expertise: node.properties.expertise,
                    description: node.properties.description
                };
            default:
                return node.properties;
        }
    }

    objectNodeToJSON(node) {
        const result = {};
        
        // Get connected child nodes
        const childConnections = Array.from(this.connections.values()).filter(conn => conn.from === node.id);
        
        childConnections.forEach(connection => {
            const childNode = this.nodes.get(connection.to);
            if (childNode) {
                const key = childNode.properties.key || childNode.properties.name || childNode.type;
                result[key] = this.nodeToJSON(childNode);
            }
        });
        
        return result;
    }

    arrayNodeToJSON(node) {
        const result = [];
        
        // Get connected child nodes
        const childConnections = Array.from(this.connections.values()).filter(conn => conn.from === node.id);
        
        childConnections.forEach(connection => {
            const childNode = this.nodes.get(connection.to);
            if (childNode) {
                result.push(this.nodeToJSON(childNode));
            }
        });
        
        return result;
    }

    loadTemplate(templateName) {
        if (!templateName || !this.templates[templateName]) return;
        
        this.clearCanvas();
        const template = this.templates[templateName];
        
        template.nodes.forEach((nodeData, index) => {
            const node = this.createNode(nodeData.type, nodeData.x, nodeData.y);
            if (node && nodeData.properties) {
                Object.assign(node.properties, nodeData.properties);
            }
        });
        
        this.render();
        this.updateJSON();
    }

    clearCanvas() {
        this.nodes.clear();
        this.connections.clear();
        this.selectedNode = null;
        this.clearProperties();
        this.render();
        this.updateJSON();
        this.saveHistory();
    }

    saveHistory() {
        const state = {
            nodes: new Map(this.nodes),
            connections: new Map(this.connections),
            timestamp: Date.now()
        };
        
        // Remove future history if we're not at the end
        this.history = this.history.slice(0, this.historyIndex + 1);
        
        this.history.push(state);
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreState(this.history[this.historyIndex]);
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.restoreState(this.history[this.historyIndex]);
        }
    }

    restoreState(state) {
        this.nodes = new Map(state.nodes);
        this.connections = new Map(state.connections);
        this.selectedNode = null;
        this.clearProperties();
        this.render();
        this.updateJSON();
    }

    zoomIn() {
        this.zoom = Math.min(3, this.zoom * 1.2);
        this.render();
    }

    zoomOut() {
        this.zoom = Math.max(0.1, this.zoom * 0.8);
        this.render();
    }

    toggleGrid(show) {
        this.showGrid = show;
        this.render();
    }

    saveGraph() {
        try {
            const graphData = {
                nodes: Array.from(this.nodes.entries()),
                connections: Array.from(this.connections.entries()),
                metadata: {
                    created: new Date().toISOString(),
                    zoom: this.zoom,
                    panOffset: this.panOffset
                }
            };
            
            const blob = new Blob([JSON.stringify(graphData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'json-reference-graph.json';
            link.click();
            URL.revokeObjectURL(url);
            
            appState.showNotification('Graph saved successfully', 'success');
        } catch (error) {
            appState.logError('Error saving graph', error);
            appState.showNotification('Error saving graph', 'error');
        }
    }

    loadGraph() {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            const graphData = JSON.parse(e.target.result);
                            this.restoreGraph(graphData);
                            appState.showNotification('Graph loaded successfully', 'success');
                        } catch (error) {
                            appState.logError('Error loading graph', error);
                            appState.showNotification('Error loading graph file', 'error');
                        }
                    };
                    reader.readAsText(file);
                }
            };
            input.click();
        } catch (error) {
            appState.logError('Error initiating graph load', error);
        }
    }

    restoreGraph(graphData) {
        this.clearCanvas();
        
        if (graphData.nodes) {
            this.nodes = new Map(graphData.nodes);
        }
        
        if (graphData.connections) {
            this.connections = new Map(graphData.connections);
        }
        
        if (graphData.metadata) {
            this.zoom = graphData.metadata.zoom || 1;
            this.panOffset = graphData.metadata.panOffset || { x: 0, y: 0 };
        }
        
        this.render();
        this.updateJSON();
        this.saveHistory();
    }

    exportJSON() {
        try {
            const jsonData = this.generateJSON();
            const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'reference-data.json';
            link.click();
            URL.revokeObjectURL(url);
            
            appState.showNotification('JSON exported successfully', 'success');
        } catch (error) {
            appState.logError('Error exporting JSON', error);
            appState.showNotification('Error exporting JSON', 'error');
        }
    }

    copyJSON() {
        try {
            const output = document.getElementById('json-output');
            if (output) {
                output.select();
                document.execCommand('copy');
                appState.showNotification('JSON copied to clipboard', 'success');
            }
        } catch (error) {
            appState.logError('Error copying JSON', error);
            appState.showNotification('Error copying JSON', 'error');
        }
    }

    close() {
        try {
            const modal = document.getElementById('json-builder-modal');
            if (modal) {
                modal.remove();
            }
            
            // Clean up global reference
            if (window.jsonBuilder === this) {
                delete window.jsonBuilder;
            }
        } catch (error) {
            appState.logError('Error closing JSON builder', error);
        }
    }
}

// Global instance for the JSON builder
let jsonBuilder = null;

function showJSONBuilder() {
    try {
        if (jsonBuilder) {
            jsonBuilder.close();
        }
        
        jsonBuilder = new VisualJSONBuilder();
        window.jsonBuilder = jsonBuilder; // Make available globally for onclick handlers
        jsonBuilder.show();
        
    } catch (error) {
        appState.logError('Error showing JSON builder', error);
        appState.showNotification('Error opening JSON builder', 'error');
    }
}

// Defensive programming - ensure functions exist before they're called
window.showJSONBuilder = showJSONBuilder;

// Add CanvasRenderingContext2D.roundRect polyfill for older browsers
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        this.beginPath();
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.lineTo(x + width, y + height - radius);
        this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.lineTo(x + radius, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
        this.closePath();
    };
}

// ===================================================================
// INITIALIZATION SAFETY AND ERROR RECOVERY
// ===================================================================

// Ensure critical functions are available globally
window.switchPanel = switchPanel;
window.selectItem = selectItem;
window.deleteItem = deleteItem;
window.copyComponent = copyComponent;
window.showJSONBuilder = showJSONBuilder;
window.updateDataPanel = updateDataPanel;

// Safe initialization with retry mechanism
function initializeAppSafely() {
    const maxRetries = 3;
    let retryCount = 0;
    
    function attemptInit() {
        try {
            initializeApp();
        } catch (error) {
            retryCount++;
            appState.logError(`Initialization attempt ${retryCount} failed`, error);
            
            if (retryCount < maxRetries) {
                console.warn(`Retrying initialization in 1 second... (${retryCount}/${maxRetries})`);
                setTimeout(attemptInit, 1000);
            } else {
                console.error('All initialization attempts failed. Starting in degraded mode.');
                initializeDegradedMode();
            }
        }
    }
    
    attemptInit();
}

function initializeDegradedMode() {
    try {
        // Basic functionality only
        console.log('Starting in degraded mode...');
        
        // Ensure basic event listeners work
        document.addEventListener('click', (e) => {
            if (e.target.matches('[onclick*="switchPanel"]')) {
                const panelMatch = e.target.getAttribute('onclick').match(/switchPanel\('(\w+)'\)/);
                if (panelMatch) {
                    try {
                        switchPanel(panelMatch[1]);
                    } catch (error) {
                        console.error('Error switching panel in degraded mode:', error);
                    }
                }
            }
        });
        
        updateStatus('Running in safe mode - some features may be limited');
        
    } catch (error) {
        console.error('Even degraded mode failed:', error);
        // Show basic error message
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif; text-align: center; background: #1e1e1e; color: white;">
                <div>
                    <h2>âš ï¸ Application Error</h2>
                    <p>The application failed to initialize properly.</p>
                    <p>Please refresh the page to try again.</p>
                    <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 20px; background: #4fc3f7; color: white; border: none; border-radius: 4px; cursor: pointer;">Refresh Page</button>
                </div>
            </div>
        `;
    }
}

// Enhanced DOM ready check
function ensureDOMReady(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback);
    } else {
        // DOM is already ready
        callback();
    }
}

// Replace the original DOMContentLoaded listener
if (document.readyState === 'loading') {
    document.removeEventListener('DOMContentLoaded', initializeApp);
    document.addEventListener('DOMContentLoaded', initializeAppSafely);
} else {
    initializeAppSafely();
}

// ===================================================================
// ENHANCED ERROR REPORTING
// ===================================================================

// Catch and report syntax errors
window.addEventListener('error', (event) => {
    if (event.error && event.error.toString().includes('SyntaxError')) {
        console.error('Syntax Error Detected:', {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error
        });
        
        // Show user-friendly error message
        if (appState && appState.showNotification) {
            appState.showNotification('Code error detected - some features may not work', 'error');
        }
    }
});

// ===================================================================
// SAFE FUNCTION DEFINITIONS FOR ONCLICK HANDLERS
// ===================================================================

// Ensure all onclick functions are safely defined
window.closeModal = function(modalId) {
    try {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
        }
    } catch (error) {
        console.error('Error closing modal:', error);
    }
};

window.showModal = function(modalId) {
    try {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('show');
        }
    } catch (error) {
        console.error('Error showing modal:', error);
    }
};

// Safe wrapper for JSON builder functions
window.safeJsonBuilder = {
    saveGraph: function() {
        try {
            if (window.jsonBuilder && window.jsonBuilder.saveGraph) {
                window.jsonBuilder.saveGraph();
            }
        } catch (error) {
            console.error('Error saving graph:', error);
        }
    },
    
    loadGraph: function() {
        try {
            if (window.jsonBuilder && window.jsonBuilder.loadGraph) {
                window.jsonBuilder.loadGraph();
            }
        } catch (error) {
            console.error('Error loading graph:', error);
        }
    },
    
    exportJSON: function() {
        try {
            if (window.jsonBuilder && window.jsonBuilder.exportJSON) {
                window.jsonBuilder.exportJSON();
            }
        } catch (error) {
            console.error('Error exporting JSON:', error);
        }
    },
    
    close: function() {
        try {
            if (window.jsonBuilder && window.jsonBuilder.close) {
                window.jsonBuilder.close();
            }
        } catch (error) {
            console.error('Error closing JSON builder:', error);
        }
    }
};

// ===================================================================
// FINALIZATION AND CLEANUP
// ===================================================================

// Add JSON Builder button to the data panel
function updateDataPanel() {
    try {
        const dataPanel = document.getElementById('data-panel');
        if (dataPanel) {
            const existingContent = dataPanel.innerHTML;
            if (!existingContent.includes('showJSONBuilder')) {
                const jsonBuilderButton = `
                    <button class="btn" onclick="showJSONBuilder()" style="width: 100%; margin-bottom: 10px;">
                        ðŸ”— Visual JSON Builder
                    </button>
                `;
                
                // Insert the button after the existing content
                const sections = dataPanel.querySelectorAll('.component-section');
                if (sections.length > 0) {
                    sections[0].insertAdjacentHTML('beforeend', jsonBuilderButton);
                } else {
                    // If no sections exist, create one
                    const section = document.createElement('div');
                    section.className = 'component-section';
                    section.innerHTML = `
                        <div class="component-section-title">JSON Tools</div>
                        ${jsonBuilderButton}
                    `;
                    dataPanel.appendChild(section);
                }
            }
        }
    } catch (error) {
        appState.logError('Error updating data panel', error);
    }
}

// Add to help menu
function showComponentGuide() {
    try {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h3>ðŸ§© Component Guide</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove();">Ã—</button>
                </div>
                <div style="padding: 20px; max-height: 500px; overflow-y: auto;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                        
                        <div style="background: #2d2d30; padding: 15px; border-radius: 6px;">
                            <h4 style="color: ${THEME_COLORS.primary}; margin: 0 0 10px 0;">ðŸ“‹ Layout Components</h4>
                            <p><strong>Row Container:</strong> Arranges items horizontally in a flexible row</p>
                            <p><strong>Column Container:</strong> Stacks items vertically in a column</p>
                            <small style="color: #858585;">Tip: Nest containers to create complex layouts</small>
                        </div>
                        
                        <div style="background: #2d2d30; padding: 15px; border-radius: 6px;">
                            <h4 style="color: ${THEME_COLORS.primary}; margin: 0 0 10px 0;">ðŸ“ Form Elements</h4>
                            <p><strong>Text Input:</strong> Single-line text entry</p>
                            <p><strong>Number Input:</strong> Numeric values with validation</p>
                            <p><strong>Text Area:</strong> Multi-line text entry</p>
                            <p><strong>Dropdown:</strong> Selection from predefined options</p>
                            <p><strong>Checkbox:</strong> Boolean true/false values</p>
                        </div>
                        
                        <div style="background: #2d2d30; padding: 15px; border-radius: 6px;">
                            <h4 style="color: ${THEME_COLORS.primary}; margin: 0 0 10px 0;">ðŸ§® Smart Components</h4>
                            <p><strong>Calculated Field:</strong> Auto-calculates based on other fields</p>
                            <p><strong>Progress Bar:</strong> Visual representation of values</p>
                            <small style="color: #858585;">Use formulas like [fieldName] + 5 or sum([field1], [field2])</small>
                        </div>
                        
                        <div style="background: #2d2d30; padding: 15px; border-radius: 6px;">
                            <h4 style="color: ${THEME_COLORS.primary}; margin: 0 0 10px 0;">ðŸŽ² Interactive Elements</h4>
                            <p><strong>Dice Button:</strong> Roll dice with customizable types</p>
                            <p><strong>Reference Button:</strong> Display spells, equipment, skills</p>
                            <p><strong>Info Button:</strong> Show custom information boxes</p>
                        </div>
                        
                        <div style="background: #2d2d30; padding: 15px; border-radius: 6px;">
                            <h4 style="color: ${THEME_COLORS.primary}; margin: 0 0 10px 0;">ðŸ”— Visual JSON Builder</h4>
                            <p><strong>Node-Based Editor:</strong> Create complex reference data visually</p>
                            <p><strong>Templates:</strong> Pre-built structures for spells, equipment, etc.</p>
                            <p><strong>Real-time Preview:</strong> See JSON output as you build</p>
                            <small style="color: #858585;">Perfect for non-coders to create reference databases</small>
                        </div>
                        
                        <div style="background: #2d2d30; padding: 15px; border-radius: 6px;">
                            <h4 style="color: ${THEME_COLORS.primary}; margin: 0 0 10px 0;">ðŸ’¡ Pro Tips</h4>
                            <ul style="margin: 0; padding-left: 15px;">
                                <li>Use Ctrl+Click for multi-selection</li>
                                <li>Right-click components for context menu</li>
                                <li>Calculated fields update in real-time</li>
                                <li>Progress bars can link to other components</li>
                                <li>Visual JSON Builder makes reference creation easy</li>
                                <li>Auto-save keeps your work safe</li>
                            </ul>
                        </div>
                        
                        <div style="background: #2d2d30; padding: 15px; border-radius: 6px;">
                            <h4 style="color: ${THEME_COLORS.primary}; margin: 0 0 10px 0;">ðŸ”§ Advanced Features</h4>
                            <p><strong>Global CSS:</strong> Custom styling for your sheet</p>
                            <p><strong>Data Editor:</strong> Direct JSON data manipulation</p>
                            <p><strong>Export Options:</strong> HTML, JSON, print-ready formats</p>
                            <p><strong>Validation:</strong> Real-time input validation</p>
                            <p><strong>Visual JSON Builder:</strong> Node-based reference editor</p>
                        </div>
                        
                    </div>
                    
                    <div style="margin-top: 30px; padding: 20px; background: #1e4d2b; border-radius: 8px; text-align: center;">
                        <h4 style="color: #4caf50; margin: 0 0 15px 0;">ðŸš€ Quick Start with JSON Builder</h4>
                        <p style="margin: 0 0 15px 0;">
                            New to creating reference data? Try the Visual JSON Builder! 
                            It lets you create complex spell databases, equipment lists, and custom references 
                            using an easy drag-and-drop node interface.
                        </p>
                        <button onclick="this.closest('.modal').remove(); showJSONBuilder();" class="btn" style="background: #4caf50;">
                            ðŸ”— Open JSON Builder
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
    } catch (error) {
        appState.logError('Error showing component guide', error);
    }
}

// ===================================================================
// END OF PRODUCTION-READY MAIN.JS
// ===================================================================
