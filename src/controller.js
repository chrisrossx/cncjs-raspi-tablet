import $ from 'jQuery';


var GRBL = 'Grbl';
var SMOOTHIE = 'Smoothie';
var TINYG = 'TinyG';
var MARLIN = 'Marlin';

// Workflow State
var WORKFLOW_STATE_RUNNING = 'running';
var WORKFLOW_STATE_PAUSED = 'paused';
var WORKFLOW_STATE_IDLE = 'idle';

export class CNCJSController {



    constructor(default_token){

        this.token = this.getToken(default_token);
        // WebSocket
        this.socket = window.io({
            query: 'token=' + this.token,
            autoConnect: false
        });

        this.port = '';
        this.baudrate = 115200;
        this.type = '';
        this.state = {};
        this.settings = {};
        this.status = {};
        this.workflowState = WORKFLOW_STATE_IDLE;

        this.callbacks = {
            //
            // System Events
            //
            'startup': [],
            'config:change': [],
            'task:start': [],
            'task:finish': [],
            'task:error': [],
            'serialport:list': [],
            'serialport:change': [],
            'serialport:open': [],
            'serialport:close': [],
            'serialport:error': [],
            'serialport:read': [],
            'serialport:write': [],
            'gcode:load': [],
            'gcode:unload': [],
            'feeder:status': [],
            'sender:status': [],
            'workflow:state': [],
            'Grbl:state': [],
            'Grbl:settings': [],
            'Smoothie:state': [],
            'Smoothie:settings': [],
            'TinyG:state': [],
            'TinyG:settings': [],
            'Marlin:state': [],
            'Marlin:settings': []
        };
        this.bindCallbacks();

        // this.socket.on('connect', function() {
        //     console.log("CNCJSController.socket.connect");
        // });


        // this.socket.on('error', function() {
        //     console.log("CNCJSController.socket.connect");
        //     window.location = '/?continue=' + encodeURIComponent(window.location.pathname);
        // });
        

    }


    bindCallbacks() {
        Object.keys(this.callbacks).forEach(function(eventName) {
            this.socket.on(eventName, function() {
                var args = Array.prototype.slice.call(arguments);
    
                if (eventName === 'serialport:open') {
                    this.port = args[0].port;
                    this.type = args[0].controllerType;
                }
                if (eventName === 'serialport:close') {
                    this.port = '';
                    this.state = {};
                    this.settings = {};
                    this.workflowState = WORKFLOW_STATE_IDLE;
                }
                if (eventName === 'workflow:state') {
                    this.workflowState = args[0];
                }
                if (eventName === 'Grbl:state') {
                    this.type = GRBL;
                    this.state = args[0];
                }
                if (eventName === 'Grbl:settings') {
                    this.type = GRBL;
                    this.settings = args[0];
                }
                if (eventName === 'Smoothie:state') {
                    this.type = SMOOTHIE;
                    this.state = args[0];
                }
                if (eventName === 'Smoothie:settings') {
                    this.type = SMOOTHIE;
                    this.settings = args[0];
                }
                if (eventName === 'TinyG:state') {
                    this.type = TINYG;
                    this.state = args[0];
                }
                if (eventName === 'TinyG:settings') {
                    this.type = TINYG;
                    this.settings = args[0];
                }
            if (eventName === 'Marlin:state') {
            this.type = MARLIN;
            this.state = args[0];
            }
            if (eventName === 'Marlin:settings') {
            this.type = MARLIN;
            this.settings = args[0];
            }
                if (eventName === 'feeder:status') {
                    this.status = args[0];
                }
                if (eventName === 'sender:status') {
                    this.status = args[0];
                }
    
                this.callbacks[eventName].forEach(function(callback) {
                    callback.apply(callback, args);
                });
            }.bind(this));
        }.bind(this));        
    }


    getToken(default_token) {
        
        if (!default_token) {
            try {
                var cnc = {};
                cnc = JSON.parse(localStorage.getItem('cnc') || {});
                cnc.state = cnc.state || {};
                cnc.state.session = cnc.state.session || {};
                var token = cnc.state.session.token || '';
                return token;
                // console.log("Found Token in localStorage")
            } catch (err) {
                return default_token;
                // Ignore error
            }
        }else{
            return default_token
            // console.log("Found Token in url param")
        }
    }

    on(eventName, callback) {
        var callbacks = this.callbacks[eventName];
        if (!callbacks) {
            console.error('Undefined event name:', eventName);
            return;
        }
        if (typeof callback === 'function') {
            callbacks.push(callback);
        }
    };
    
    off(eventName, callback) {
        var callbacks = this.callbacks[eventName];
        if (!callbacks) {
            console.error('Undefined event name:', eventName);
            return;
        }
        if (typeof callback === 'function') {
            callbacks.splice(callbacks.indexOf(callback), 1);
        }
    };

    openPort(port, options) {
        this.socket.emit('open', port, options);
    
        this.type = options.controllerType;
        this.port = port;
        this.baudrate = options.baudrate;
    };
    
    closePort(port) {
        port = port || this.port;
    
        if (port) {
        this.socket.emit('close', port);
        }
    
        this.type = '';
        this.port = '';
        this.baudrate = 0;
    };
    
    listAllPorts() {
        this.socket.emit('list');
    };

    // @param {string} cmd The command string
    // @example Example Usage
    // - Load G-code
    //   controller.command('gcode:load', name, gcode, callback)
    // - Unload G-code
    //   controller.command('gcode:unload')
    // - Start sending G-code
    //   controller.command('gcode:start')
    // - Stop sending G-code
    //   controller.command('gcode:stop')
    // - Pause
    //   controller.command('gcode:pause')
    // - Resume
    //   controller.command('gcode:resume')
    // - Feed Hold
    //   controller.command('feedhold')
    // - Cycle Start
    //   controller.command('cyclestart')
    // - Status Report
    //   controller.command('statusreport')
    // - Homing
    //   controller.command('homing')
    // - Sleep
    //   controller.command('sleep')
    // - Unlock
    //   controller.command('unlock')
    // - Reset
    //   controller.command('reset')
    // - Feed Override
    //   controller.command('feedOverride')
    // - Spindle Override
    //   controller.command('spindleOverride')
    // - Rapid Override
    //   controller.command('rapidOverride')
    // - G-code
    //   controller.command('gcode', 'G0X0Y0')
    // - Load a macro
    //   controller.command('macro:load', '<macro-id>', { /* optional vars */ }, callback)
    // - Run a macro
    //   controller.command('macro:run', '<macro-id>', { /* optional vars */ }, callback)
    // - Load file from a watch directory
    //   controller.command('watchdir:load', '/path/to/file', callback)
    command(cmd) {
        var args = Array.prototype.slice.call(arguments, 1);
        this.socket.emit.apply(this.socket, ['command', this.port, cmd].concat(args));
    };

    // @param {string} data The data to write.
    // @param {object} [context] The associated context information.
    write(data, context) {
        this.socket.emit('write', this.port, data, context);
    };

    // @param {string} data The data to write.
    // @param {object} [context] The associated context information.
    writeln(data, context) {
        this.socket.emit('writeln', this.port, data, context);
    };



}
