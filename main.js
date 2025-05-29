'use strict';


var CONFIG = {
    VERSION: '3.2.0',
    BUILD: 'production',
    DEBUG: false,
    PERFORMANCE_MONITORING: true,
    AUTO_SAVE_INTERVAL: 30000,
    MAX_UNDO_STEPS: 50,
    MAX_ERRORS_STORED: 20,
    COMPONENT_LIMIT: 1000,
    FILE_SIZE_LIMIT: 10 * 1024 * 1024,
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

var THEME_COLORS = {
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

var COMPONENT_ICONS = {
    row: '📋', column: '📊', 'text-input': '✏️', 'number-input': '🔢',
    textarea: '📝', select: '🔽', checkbox: '☑️', label: '🏷️',
    calculated: '🧮', 'progress-bar': '📊', 'dice-button': '🎲', 
    'reference-button': '📚', 'info-button': 'ℹ️', button: '🔘',
    table: '📋', tabs: '🗂️', slider: '🎚️', rating: '⭐', 
    chart: '📊', image: '🖼️', event: '⚡'
};

var DEFAULT_FONTS = "'JetBrains Mono', 'Consolas', 'Monaco', 'Courier New', monospace";

var LABELS = {
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

function AppState() {
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

    this.domCache = new window.Map();
    this.eventListeners = new window.Map();
    this.observers = new window.Map();
    this.validationRules = new window.Map();
    this.customValidators = new window.Map();
    this.calculationCache = new window.Map();
    this.dependencies = new window.Map();

    // Initialize validation, performance, and error tracking
    this.initializeValidation();
    this.initializePerformanceMonitoring();
    this.initializeErrorTracking();
}

// All prototype methods below...

AppState.prototype.getElement = function(id, useCache) {
    if (typeof useCache === 'undefined') useCache = true;
    if (!useCache || !this.domCache.has(id)) {
        var element = document.getElementById(id);
        if (element && useCache) {
            this.domCache.set(id, element);
            this.observeElementRemoval(element, id);
        }
        return element;
    }
    return this.domCache.get(id);
};

AppState.prototype.observeElementRemoval = function(element, id) {
    if (!window.MutationObserver || this.observers.has(id)) return;
    var self = this;
    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                for (var i = 0; i < mutation.removedNodes.length; i++) {
                    var removedNode = mutation.removedNodes[i];
                    if (removedNode === element || 
                        (removedNode.contains && removedNode.contains(element))) {
                        self.domCache.delete(id);
                        observer.disconnect();
                        self.observers.delete(id);
                        break;
                    }
                }
            }
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    this.observers.set(id, observer);
};

AppState.prototype.clearDOMCache = function() {
    this.domCache.clear();
    var self = this;
    this.observers.forEach(function(observer) { observer.disconnect(); });
    this.observers.clear();
};

AppState.prototype.saveState = function(action, metadata) {
    try {
        var canvas = this.getElement('canvas');
        var state = {
            action: action,
            timestamp: Date.now(),
            canvas: canvas ? this.compressHTML(canvas.innerHTML) : '',
            data: this.deepClone(this.sheetData),
            selectedItem: this.selectedItem && this.selectedItem.dataset ? this.selectedItem.dataset.id : null,
            multiSelectedItems: [],
            componentCounter: this.componentCounter,
            metadata: metadata ? Object.assign({}, metadata, { version: CONFIG.VERSION }) : { version: CONFIG.VERSION }
        };
        for (var i = 0; i < this.multiSelectedItems.length; i++) {
            var item = this.multiSelectedItems[i];
            if (item.dataset && item.dataset.id) {
                state.multiSelectedItems.push(item.dataset.id);
            }
        }
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
};

AppState.prototype.undo = function() {
    if (this.undoStack.length === 0) return false;
    try {
        var canvas = this.getElement('canvas');
        var currentState = {
            canvas: canvas ? this.compressHTML(canvas.innerHTML) : '',
            data: this.deepClone(this.sheetData),
            selectedItem: this.selectedItem && this.selectedItem.dataset ? this.selectedItem.dataset.id : null,
            multiSelectedItems: [],
            componentCounter: this.componentCounter
        };
        for (var i = 0; i < this.multiSelectedItems.length; i++) {
            var item = this.multiSelectedItems[i];
            if (item.dataset && item.dataset.id) {
                currentState.multiSelectedItems.push(item.dataset.id);
            }
        }
        this.redoStack.push(currentState);
        var previousState = this.undoStack.pop();
        this.restoreState(previousState);
        this.updateUndoRedoButtons();
        this.showNotification('Undo: ' + previousState.action, 'info');
        return true;
    } catch (error) {
        this.logError('Failed to undo', error);
        return false;
    }
};

AppState.prototype.redo = function() {
    if (this.redoStack.length === 0) return false;
    try {
        var canvas = this.getElement('canvas');
        var currentState = {
            canvas: canvas ? this.compressHTML(canvas.innerHTML) : '',
            data: this.deepClone(this.sheetData),
            selectedItem: this.selectedItem && this.selectedItem.dataset ? this.selectedItem.dataset.id : null,
            multiSelectedItems: [],
            componentCounter: this.componentCounter
        };
        for (var i = 0; i < this.multiSelectedItems.length; i++) {
            var item = this.multiSelectedItems[i];
            if (item.dataset && item.dataset.id) {
                currentState.multiSelectedItems.push(item.dataset.id);
            }
        }
        this.undoStack.push(currentState);
        var nextState = this.redoStack.pop();
        this.restoreState(nextState);
        this.updateUndoRedoButtons();
        this.showNotification('Redo completed', 'info');
        return true;
    } catch (error) {
        this.logError('Failed to redo', error);
        return false;
    }
};

AppState.prototype.restoreState = function(state) {
    try {
        var canvas = this.getElement('canvas');
        if (canvas && state.canvas) {
            canvas.innerHTML = this.decompressHTML(state.canvas);
        }
        this.sheetData = this.deepClone(state.data);
        this.componentCounter = state.componentCounter;
        // Restore selections
        this.selectedItem = null;
        this.multiSelectedItems = [];
        if (state.selectedItem) {
            var element = document.querySelector('[data-id="' + state.selectedItem + '"]');
            if (element) this.selectItem(element);
        }
        if (state.multiSelectedItems && state.multiSelectedItems.length > 0) {
            for (var i = 0; i < state.multiSelectedItems.length; i++) {
                var id = state.multiSelectedItems[i];
                var el = document.querySelector('[data-id="' + id + '"]');
                if (el) {
                    this.multiSelectedItems.push(el);
                    el.classList.add('multi-selected');
                    el.style.outline = '2px solid ' + THEME_COLORS.warning;
                }
            }
        }
        this.setupAllEventListeners && this.setupAllEventListeners();
        this.updateComponentCount && this.updateComponentCount();
        this.updateSheetTree && this.updateSheetTree();
        this.updateCalculatedFields && this.updateCalculatedFields();
        this.updateProgressBars && this.updateProgressBars();
        this.validateSheet && this.validateSheet();
    } catch (error) {
        this.logError('Error restoring state', error);
        this.showNotification('Error restoring state', 'error');
    }
};

AppState.prototype.updateUndoRedoButtons = function() {
    var undoItems = document.querySelectorAll('[data-action="undo"]');
    var redoItems = document.querySelectorAll('[data-action="redo"]');
    var i;
    for (i = 0; i < undoItems.length; i++) {
        var item = undoItems[i];
        if (this.undoStack.length === 0) {
            item.style.opacity = '0.5';
            item.style.pointerEvents = 'none';
            item.title = 'Nothing to undo';
        } else {
            item.style.opacity = '1';
            item.style.pointerEvents = 'auto';
            var lastAction = this.undoStack[this.undoStack.length - 1];
            item.title = 'Undo: ' + lastAction.action;
        }
    }
    for (i = 0; i < redoItems.length; i++) {
        var ritem = redoItems[i];
        if (this.redoStack.length === 0) {
            ritem.style.opacity = '0.5';
            ritem.style.pointerEvents = 'none';
            ritem.title = 'Nothing to redo';
        } else {
            ritem.style.opacity = '1';
            ritem.style.pointerEvents = 'auto';
            ritem.title = 'Redo available';
        }
    }
};

// Validation system
AppState.prototype.initializeValidation = function() {
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
};

AppState.prototype.validateField = function(fieldName, value) {
    var rule = this.validationRules.get(fieldName);
    if (!rule) return { valid: true };
    var errors = [];
    if (rule.required && (value === null || value === undefined || value === '')) {
        errors.push(fieldName + ' is required');
    }
    if (!rule.required && (value === null || value === undefined || value === '')) {
        return { valid: true };
    }
    if (rule.type === 'number') {
        var num = parseFloat(value);
        if (isNaN(num)) {
            errors.push(fieldName + ' must be a number');
        } else {
            if (rule.min !== undefined && num < rule.min) {
                errors.push(fieldName + ' must be at least ' + rule.min);
            }
            if (rule.max !== undefined && num > rule.max) {
                errors.push(fieldName + ' must be at most ' + rule.max);
            }
        }
    }
    if (typeof value === 'string') {
        if (rule.minLength !== undefined && value.length < rule.minLength) {
            errors.push(fieldName + ' must be at least ' + rule.minLength + ' characters');
        }
        if (rule.maxLength !== undefined && value.length > rule.maxLength) {
            errors.push(fieldName + ' must be at most ' + rule.maxLength + ' characters');
        }
        if (rule.pattern && !rule.pattern.test(value)) {
            errors.push(rule.message || (fieldName + ' format is invalid'));
        }
    }
    return {
        valid: errors.length === 0,
        errors: errors
    };
};

AppState.prototype.validateSheet = function() {
    var errors = [];
    var warnings = [];
    var it = this.validationRules.entries();
    var entry;
    while ((entry = it.next()) && !entry.done) {
        var pair = entry.value;
        var fieldName = pair[0];
        var rule = pair[1];
        if (rule.required) {
            var value = this.getFieldValue(fieldName);
            var validation = this.validateField(fieldName, value);
            if (!validation.valid) {
                errors = errors.concat(validation.errors);
            }
        }
    }
    var componentCount = document.querySelectorAll('.sheet-item').length;
    if (componentCount > CONFIG.COMPONENT_LIMIT) {
        warnings.push('Too many components (' + componentCount + '/' + CONFIG.COMPONENT_LIMIT + ')');
    }
    var maxDepth = this.calculateMaxNestingDepth();
    if (maxDepth > CONFIG.VALIDATION.MAX_NESTING_DEPTH) {
        warnings.push('Nesting too deep (' + maxDepth + '/' + CONFIG.VALIDATION.MAX_NESTING_DEPTH + ')');
    }
    return {
        valid: errors.length === 0,
        errors: errors,
        warnings: warnings
    };
};

// Performance monitoring
AppState.prototype.initializePerformanceMonitoring = function() {
    if (!CONFIG.PERFORMANCE_MONITORING) return;
    if (window.performance && window.performance.mark) {
        this.performanceMetrics.startTime = performance.now();
        var self = this;
        setInterval(function() {
            if (performance.memory) {
                self.performanceMetrics.memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1048576);
            }
            self.performanceMetrics.frameCount++;
            self.performanceMetrics.componentCount = document.querySelectorAll('.sheet-item').length;
        }, 1000);
    }
};

// Error tracking
AppState.prototype.initializeErrorTracking = function() {
    var self = this;
    window.addEventListener('error', function(event) {
        self.logError('Global error', event.error, {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
        });
    });
    window.addEventListener('unhandledrejection', function(event) {
        self.logError('Unhandled promise rejection', event.reason);
    });
};

AppState.prototype.logError = function(message, error, metadata) {
    var errorInfo = {
        message: message,
        error: error && error.toString ? error.toString() : 'Unknown error',
        stack: error && error.stack ? error.stack : '',
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        version: CONFIG.VERSION,
        metadata: metadata || {}
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
};

// Utility methods
AppState.prototype.deepClone = function(obj) {
    try {
        return JSON.parse(JSON.stringify(obj));
    } catch (error) {
        this.logError('Failed to deep clone object', error);
        return {};
    }
};

AppState.prototype.compressHTML = function(html) {
    return html.replace(/>\s+</g, '><').trim();
};

AppState.prototype.decompressHTML = function(html) {
    return html;
};

AppState.prototype.sanitizeHTML = function(html) {
    if (!CONFIG.SECURITY.SANITIZE_HTML) return html;
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/javascript:/gi, '');
};

AppState.prototype.sanitizeString = function(str) {
    if (typeof str !== 'string') return str;
    if (str.length > CONFIG.SECURITY.MAX_STRING_LENGTH) {
        str = str.substring(0, CONFIG.SECURITY.MAX_STRING_LENGTH);
    }
    return CONFIG.SECURITY.PREVENT_XSS ? this.escapeHTML(str) : str;
};

AppState.prototype.escapeHTML = function(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
};

AppState.prototype.generateId = function() {
    this.componentCounter++;
    return 'item_' + this.componentCounter + '_' + Date.now();
};

AppState.prototype.updateSheetMetadata = function() {
    this.sheetData.metadata.modified = new Date().toISOString();
    this.sheetData.metadata.version = CONFIG.VERSION;
};

AppState.prototype.markDirty = function() {
    this.isDirty = true;
    this.updateSheetMetadata();
};

AppState.prototype.markClean = function() {
    this.isDirty = false;
    this.lastSaveTime = Date.now();
};

AppState.prototype.getFieldValue = function(fieldName) {
    if (typeof this.sheetData.data[fieldName] !== 'undefined') {
        return this.sheetData.data[fieldName];
    }
    var element = document.querySelector('[data-json-path="' + fieldName + '"]');
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
};

AppState.prototype.calculateMaxNestingDepth = function() {
    function calculateDepth(element, depth) {
        if (typeof depth === 'undefined') depth = 0;
        var children = element.querySelectorAll('.sheet-item');
        if (children.length === 0) return depth;
        var maxChildDepth = depth;
        for (var i = 0; i < children.length; i++) {
            maxChildDepth = Math.max(maxChildDepth, calculateDepth(children[i], depth + 1));
        }
        return maxChildDepth;
    }
    var canvas = this.getElement('canvas');
    return canvas ? calculateDepth(canvas) : 0;
};

AppState.prototype.showNotification = function(message, type, duration) {
    if (typeof type === 'undefined') type = 'info';
    if (typeof duration === 'undefined') duration = 3000;
    var notification = this.createNotification(message, type);
    document.body.appendChild(notification);
    requestAnimationFrame(function() {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    });
    setTimeout(function() {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(function() {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, duration);
};

AppState.prototype.createNotification = function(message, type) {
    var colors = {
        success: THEME_COLORS.success,
        error: THEME_COLORS.danger,
        warning: THEME_COLORS.warning,
        info: THEME_COLORS.info
    };
    var icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    var notification = document.createElement('div');
    notification.style.cssText =
        'position: fixed;top: 20px;right: 20px;background: ' + (colors[type] || colors.info) +
        ';color: white;padding: 12px 20px;border-radius: 6px;font-weight: 500;box-shadow: 0 4px 12px rgba(0,0,0,0.3);z-index: 10000;opacity: 0;transform: translateX(100%);transition: all 0.3s ease;max-width: 300px;word-wrap: break-word;cursor: pointer;font-size: 14px;';
    notification.innerHTML = '<span style="margin-right: 8px;">' + (icons[type] || icons.info) + '</span>' + message;
    notification.addEventListener('click', function() {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(function() {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    });
    return notification;
};

// Utility: Debounce
function debounce(func, wait, immediate) {
    var timeout;
    return function() {
        var context = this, args = arguments;
        var later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

// Utility: Throttle
function throttle(func, limit) {
    var inThrottle;
    return function() {
        var context = this, args = arguments;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(function() { inThrottle = false; }, limit);
        }
    };
}

// Utility: Safe JSON parse
function safeParse(jsonString, defaultValue) {
    if (typeof defaultValue === 'undefined') defaultValue = {};
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        if (window.appState) appState.logError('JSON parse error', error);
        return defaultValue;
    }
}

// Utility: Safe JSON stringify
function safeStringify(obj, replacer, space) {
    if (typeof replacer === 'undefined') replacer = null;
    if (typeof space === 'undefined') space = 2;
    try {
        return JSON.stringify(obj, replacer, space);
    } catch (error) {
        if (window.appState) appState.logError('JSON stringify error', error);
        return '{}';
    }
}

// --- Utility: DOM Ready ---
function onReady(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
}

// --- Menu Dropdowns ---
function createDropdown(menuEl, items) {
    let dropdown = document.createElement('div');
    dropdown.className = 'dropdown-menu';
    dropdown.tabIndex = -1;
    dropdown.style.position = 'absolute';
    dropdown.style.top = menuEl.offsetHeight + 'px';
    dropdown.style.left = '0px';
    dropdown.style.background = '#23272e';
    dropdown.style.color = '#fff';
    dropdown.style.border = '1px solid #444';
    dropdown.style.borderRadius = '4px';
    dropdown.style.minWidth = '140px';
    dropdown.style.zIndex = 1000;
    dropdown.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    dropdown.style.fontSize = '14px';
    dropdown.style.padding = '4px 0';

    items.forEach(item => {
        let el = document.createElement('div');
        el.className = 'dropdown-item';
        el.style.padding = '6px 18px';
        el.style.cursor = 'pointer';
        el.innerHTML = (item.icon ? item.icon + ' ' : '') + item.label;
        el.addEventListener('click', e => {
            e.stopPropagation();
            dropdown.remove();
            item.action && item.action();
        });
        dropdown.appendChild(el);
    });

    // Remove dropdown on blur or click outside
    function removeDropdown(e) {
        if (!dropdown.contains(e.target) && e.target !== menuEl) {
            dropdown.remove();
            document.removeEventListener('mousedown', removeDropdown);
        }
    }
    document.addEventListener('mousedown', removeDropdown);

    menuEl.appendChild(dropdown);
    dropdown.focus();
}

// --- Menu Actions ---
function setupMenus() {
    const menuBar = document.querySelector('.menu-bar');
    if (!menuBar) return;
    menuBar.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function() {
            const menu = this.getAttribute('data-menu');
            if (menu === 'file') { /* show file menu dropdown */ }
            if (menu === 'edit') { /* show edit menu dropdown */ }
            if (menu === 'view') { /* show view menu dropdown */ }
            if (menu === 'help') { /* show help menu dropdown */ }
        });
        item.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') this.click();
        });
    });
}

function setupActivityBar() {
    document.querySelectorAll('.activity-icon').forEach(icon => {
        icon.addEventListener('click', function() {
            switchPanel(this.getAttribute('data-panel'));
        });
        icon.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') this.click();
        });
    });
}

function setupStatusBar() {
    document.querySelectorAll('.status-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.getAttribute('data-action');
            if (action === 'preview') previewSheet();
            if (action === 'css') showGlobalCSS();
            if (action === 'settings') showSettingsPanel();
        });
        btn.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') this.click();
        });
    });
}

function setupModalCloses() {
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-close');
            closeModal(id);
        });
        btn.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') this.click();
        });
    });
}

function setupDataPanel() {
    document.querySelectorAll('[data-action="show-data-editor"]').forEach(btn => {
        btn.addEventListener('click', showDataEditor);
    });
    document.querySelectorAll('[data-action="export-sheet"]').forEach(btn => {
        btn.addEventListener('click', exportSheet);
    });
    document.querySelectorAll('[data-action="import-sheet"]').forEach(btn => {
        btn.addEventListener('click', importSheet);
    });
    document.querySelectorAll('[data-action="save-sheet-data"]').forEach(btn => {
        btn.addEventListener('click', saveSheetData);
    });
    document.querySelectorAll('[data-action="format-json"]').forEach(btn => {
        btn.addEventListener('click', formatJSON);
    });
    document.querySelectorAll('[data-action="validate-json"]').forEach(btn => {
        btn.addEventListener('click', validateJSON);
    });
}

function setupCSSPanel() {
    document.querySelectorAll('[data-action="apply-global-css"]').forEach(btn => {
        btn.addEventListener('click', applyGlobalCSS);
    });
    document.querySelectorAll('[data-action="reset-css"]').forEach(btn => {
        btn.addEventListener('click', resetCSS);
    });
}

function setupSettingsPanel() {
    document.querySelectorAll('[data-action="save-settings"]').forEach(btn => {
        btn.addEventListener('click', saveSettings);
    });
}

function setupTabs() {
    document.querySelectorAll('[data-action="close-tab"]').forEach(btn => {
        btn.addEventListener('click', function() {
            closeTab(this);
        });
        btn.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') this.click();
        });
    });
}

// --- Initialize Everything ---
onReady(function() {
    setupMenus();
    setupActivityBar();
    setupStatusBar();
    setupModalCloses();
    setupDataPanel();
    setupCSSPanel();
    setupSettingsPanel();
    setupTabs();
    // ...other initialization...
});

// --- Export for legacy support ---
window.previewSheet = previewSheet;
window.showGlobalCSS = showGlobalCSS;
window.showSettingsPanel = showSettingsPanel;
window.closeModal = closeModal;