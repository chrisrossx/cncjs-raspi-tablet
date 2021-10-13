export const MACHINE_STALL = 0;
export const MACHINE_STOP = 1;
export const MACHINE_IDLE = 2;
export const MACHINE_RUN = 3;
export const MACHINE_HOLD = 4;

export class Machine {

    constructor(application) {
        
        this.application = application; 
        this.oldFilename = '';
        this.filename = '';
        this.running = false;
        this.userStopRequested = false;
        this.oldState = null;
        this.probing = false; 
        this.savedGrblState;
        this.stateName;
        this.spindleSpeed;
        this.spindleDirection;
        this.feedOverride = 1.0;
        this.rapidOverride = 1.0;
        this.spindleOverride = 1.0;
        this.workflowState = '';
        this.machineWorkflow = MACHINE_STALL;
        this.senderHold = false;
        this.senderHoldReason = ''; 
        this.errorMessage; 
        this.velocity = 0;
        this.gCodeLoaded = false;
        this.elapsedTime = 0;
        this.finishTime = 0;
        this.startTime = 0;
        this.remainingTime = 0;
        this.receivedLines = 0;
        this.totalLines = 0;
        this.wpos = {};
        this.mpos = {};
        this.modal = {};
        
        // GRBL reports position in units according to the $13 setting,
        // independent of the GCode in/mm parser state.
        // We track the $13 value by watching for the Grbl:settings event and by
        // watching for manual changes via serialport:write.  Upon initial connection,
        // we issue a settings request in serialport:open.
        this.grblReportingUnits = 0;  // initially undefined

        this.application.controller.on('Grbl:state', (data) => this.on_grbl_state(data));
        this.application.controller.on('Grbl:settings', (data) => this.on_grbl_settings(data));
        this.application.controller.on('Smoothie:state', (data) => this.on_somother_state(data));
        this.application.controller.on('Marlin:state', (data) => this.on_marline_state(data)); 
        this.application.controller.on('TinyG:state', (data) => this.on_tinyg_state(data));
         
        this.application.controller.on('serialport:write', (data) => this.on_serialport_write(data));
        this.application.controller.on('workflow:state', (data) => this.on_workflow_state(data));
        this.application.controller.on('sender:status', (data) => this.on_sender_status(data)); 
        this.application.controller.on('gcode:load', (name, gcode) => this.on_gcode_load(name, gcode));
        this.application.controller.on('serialport:read', (data) => this.on_serialport_read(data));

        this.application.controller.on('gcode:unload', ()=>{
            this.initState();
        });
    }
    
    on_tinyg_state(data) {
        var sr = data.sr || {};
        var machineState = sr.machineState;
        var feedrate = sr.feedrate;
    
        this.velocity = sr.velocity || 0;
        this.spindleSpeed = sr.sps;
        this.spindleDirection = this.modal.spindle;
        stateName = {
            0: 'Init',
            1: 'Ready',
            2: 'Alarm',
            3: 'Pgm Stop',
            4: 'Pgm End',
            5: 'Run',
            6: 'Hold',
            7: 'Probe',
            8: 'Cycle',
            9: 'Homing',
            10: 'Jog',
            11: 'Interlock',
        }[machineState] || 'N/A';
        if (machineState == "") {
            return;
        }
    
        if (sr.modal) {
            Object.assign(this.modal, sr.modal);
        }
        this.mpos = sr.mpos;
        this.wpos = sr.wpos;
        var INIT = 0, READY = 1, ALARM = 2, STOP = 3, END = 4, RUN = 5,
            HOLD = 6, PROBE = 7, CYCLE = 8, HOMING = 9, JOG = 10, INTERLOCK = 11;
        if ([INIT, ALARM, INTERLOCK].indexOf(machineState) >= 0) {
            this.machineWorkflow = MACHINE_STALL;
        } else if ([END].indexOf(machineState) >= 0) {
            // MACHINE_STOP state happens only once at the end of the program,
            // then it switches to MACHINE_IDLE.  This permits the GCode viewer
            // to show that the program finished, but then lets the user scroll
            // around in the viewer.
            if (this.machineWorkflow == MACHINE_STOP) {
                this.machineWorkflow = MACHINE_IDLE;
                this.receivedLines = 0;
            } else {
                this.machineWorkflow =  MACHINE_STOP;
            }
        } else if ([READY, STOP].indexOf(machineState) >= 0) {
            this.machineWorkflow = (machineState == STOP && this.workflowState == 'paused') ? MACHINE_HOLD : MACHINE_IDLE;
        } else if ([RUN, CYCLE, HOMING, PROBE, JOG].indexOf(machineState) >= 0) {
            this.machineWorkflow = MACHINE_RUN;
            this.running = true;
        } else {
            this.machineWorkflow = MACHINE_HOLD;
        }
    
        if (machineState == STOP) {
            if (this.userStopRequested) {
                // Manual stop
                this.userStopRequested = false;
                this.running = false;
                this.stateName = 'UserStop';
            } else {
                // Automatic stop at end of program or sequence
                if (this.running) {
                    if (this.senderHold) {
                        // If it is a hold condition like an M0 pause,
                        // the program has not ended so we go to hold
                        // state and do not clear the running variable.
                        this.machineWorkflow = MACHINE_HOLD;
                        this.stateName = senderHoldReason;
                        if (this.stateName == "M6") {
                            if (sr.tool) {
                                this.stateName += " T" + sr.tool;
                            }
                        }
                    } else {
                            // If it is a real stop instead of a hold,
                            // we clear running to show that the program is done.
                            this.running = false;
                    }
                }
            }
        }
        if (machineState == END) {
            this.running = false;
            if (this.userStopRequested) {
            // Manual stop
                this.userStopRequested = false;
                this.stateName = 'UserStop';
            } else if (this.oldState != END) {
                if (this.probing) {
                    this.probing = false;
                    if (this.oldFilename) {
                        this.application.controller.command('watchdir:load', this.oldFilename);
                        this.oldFilename = null;
                    }
                }
            }
        }
        this.oldState = machineState;
    
        switch (modal.units) {
            case 'G20':
                // TinyG reports machine coordinates in mm regardless of the in/mm mode
                this.mpos.x /= 25.4;
                this.mpos.y /= 25.4;
                this.mpos.z /= 25.4;
                break;
        }
        this.receivedLines = sr.line;
    
        // G2core now reports the overrides via properties
        // troe, tro, froe, fro, spoe, and spo, but as of this
        // writing the cncjs server uses the old properties
        // mfo and mto, and does not propagate the new properties
        this.spindleOverride = 1.0;
        this.rapidOverride = 1.0;
        this.feedOverride = 1.0;
    
        this.application.workspaceView.update();
    }
    

    on_serialport_read(data){
        
        // if (data.r) {
            // this.line++;
        // }

        switch (this.application.connection.controllerType) {
            case 'Marlin':
                if (data.startsWith('echo:')) {
                    this.application.workspaceView.echoData(data);
                    this.stateName = data.substring(5);
                    if (this.machineWorkflow == MACHINE_IDLE) {
                        this.machineWorkflow = MACHINE_STALL;  // Disables Start button
                    }
                } else if (data.startsWith('ok') && this.machineWorkflow == MACHINE_STALL) {
                    this.stateName = 'Idle';
                    this.machineWorkflow = MACHINE_IDLE;
                } else if (data.startsWith('Error:')) {
                    this.application.workspaceView.echoData(data);
                    this.stateName = data;
                }
                this.application.workspaceView.update();
                break;
            case 'Smoothie':
            case 'Grbl':
                if (!data.startsWith('ok')) {
                    this.application.workspaceView.echoData(data);
                }
                if (data.startsWith('error:')) {
                    this.stateName = data;
                    this.application.workspaceView.showError(this.stateName);
                }
                this.application.workspaceView.update();
                break;
            case 'TinyG':
                if (!data.startsWith('{"qr"')) {
                    this.application.workspaceView.echoData(data);
                }
                break;
        }
    }


    //controller.on('gcode:load', function(name, gcode) {
    on_gcode_load(name, gcode){
        // Force the line count display to update.  It normally does not
        // update in MACHINE_IDLE state because you don't want to change
        // the GCode display while jogging.
        var oldMachineWorkflow = this.machineWorkflow;
        this.machineWorkflow = MACHINE_STOP;
        this.receivedLines = 0;
        this.totalLines = gcode.split(/\r?\n/).length - 1;
        this.application.workspaceView.update();
        this.machineWorkflow = oldMachineWorkflow;
        this.application.workspaceView.showGCode(name, gcode);
        if (this.probing) {
            this.runGCode();
        }
    };
    
    on_sender_status(status){
        if (status.elapsedTime) {
            this.elapsedTime = status.elapsedTime;
        }
        if (status.finishTime) {
            this.finishTime = status.finishTime
        }
        if (status.remainingTime) {
            this.remainingTime = status.remainingTime;
        }
        if (status.startTime) {
            this.startTime = status.startTime;
        }
        if (status.total) {
            this.totalLines = status.total
        }

        
        if (this.application.connection.controllerType != 'TinyG' && status.received) {
            // TinyG/g2core reports the line count in the state report,
            // reflecting the line that is actually being executed. That
            // is more interesting to the user than how many lines have
            // been sent, so we only use the sender line count if the
            // better one is not available.
            this.receivedLines = status.received;
        }



        this.senderHold = status.hold;
        if (this.senderHold) {
            if (status.holdReason) {
                if (status.holdReason.err) {
                    this.senderHoldReason = 'Error';
                    this.errorMessage = status.holdReason.err;
                    this.application.workspaceView.showError(this.errorMessage);
                } else {
                this.senderHoldReason = status.holdReason.data;
                }
            } else {
                this.senderHoldReason = "";
            }
        }
        if (this.application.connection.controllerType == 'Marlin') {
            this.application.workspaceView.update();
        }
    }
    

    on_workflow_state(state) {
        switch(state) {
            case 'idle': 
                this.line = 0; 
                break;
            case 'paused': break;
            case 'running': break;
        }
    
        this.workflowState = state;
        // We do not update the view yet, because the workflow
        // messages reflect the state of the sender, not the
        // machine.  The machine state usually lags the workflow
        // state, often by a rather long time.  We want the UI
        // to be synchronized to the machine state, so user
        // interactions appear to control the machine directly,
        // without long queue delays.
        if (this.application.connection.controllerType == 'Marlin') {
            switch(state) {
                case 'idle': this.machineWorkflow = MACHINE_IDLE; this.running = false; break;
                case 'paused': this.machineWorkflow = MACHINE_HOLD; break;
                case 'running': this.machineWorkflow = MACHINE_RUN; break;
            }
            this.application.workspaceView.update();
        }
    }
    
    on_serialport_write(data){
        // Track manual changes to the Grbl position reporting units setting
        // We are looking for either $13=0 or $13=1
        if (this.application.connection.controllerType === 'Grbl') {
            let cmd = data.split('=');
            if (cmd.length === 2 && cmd[0] === "$13") {
                this.grblReportingUnits = Number(cmd[1]) || 0;
            }
        }

    }
        
    

    on_grbl_state(data){
        // If we do not yet know the reporting units from the $13 setting, we copy
        // the data for later processing when we do know.
        if (typeof this.grblReportingUnits === 'undefined') {
            this.savedGrblState = JSON.parse(JSON.stringify(data));
        } else {
            this.renderGrblState(data);
        }
    }

    on_grbl_settings(data){
        var settings = data.settings || {};
        if (settings['$13'] !== undefined) {
            this.grblReportingUnits = Number(settings['$13']) || 0;
    
            if (typeof this.savedGrblState !== 'undefined') {
                this.renderGrblState(this.savedGrblState);
                // Don't re-render the state if we get later settings reports,
                // as the savedGrblState is probably stale.
                this.savedGrblState = undefined;
            }
        }
    }

    // Smoothie state and GRBL state are similar except for the overrides.
    // GRBL has ov: []  while Smootie has ovF and ovS.
    // Smoothie also has currentFeedrate and feedrateOverride

    // controller.on('Smoothie:state', function(data) 
    on_somother_state(data){
        var status = data.status || {};
        var stateName = status.activeState;
        this.mpos = status.mpos;
        this.wpos = status.wpos;
        // Smoothie states are Idle, Run, Hold
        // canClick = stateName == 'Idle';
        this.stateName = this.setMachineWorkflow(stateName);

        var parserstate = data.parserstate || {};
        if (parserstate.modal) {
            Object.assign(this.modal, parserstate.modal);
        };

        // Smoothie reports both mpos and wpos in the current units
        // so no scaling is necessary

        // The following feedrate code is untested
        if (status.currentFeedrate) {
            this.velocity = status.currentFeedrate;
        } else if (status.feedrate) {
            this.velocity = status.currentFeedrate * status.feedrateOverride/100.0;
        } else {
            this.velocity = parserstate.feedrate;
        }
        this.spindleSpeed = parserstate.spindle;
        this.spindleDirection = this.modal.spindle;

        this.spindleOverride = status.ovF/100.0;
        this.rapidOverride = 1.0;
        this.feedOverride = status.ovS/100.0;

        this.application.workspaceView.update();
    }

    on_marline_state(data) {
        if (data.modal) {
            Object.assign(this.modal, data.modal);
        }
        this.velocity = data.feedrate;
        Object.assign(this.mpos, data.pos);
    
        // Marlin does not have a stalled state and it
        // does not report its actual state, so we move
        // to idle state automatically.
        if (!this.stateName || this.stateName == 'NoConnect') {
            this.machineWorkflow = MACHINE_IDLE;
            this.stateName = "Idle";
        }
    
        if (this.modal.units === 'G20') {
            // Marlin always reports position in mm
            this.mpos.x /= 25.4;
            this.mpos.y /= 25.4;
            this.mpos.z /= 25.4;
        }
        this.wpos = this.mpos;
        this.application.workspaceView.update();
    
        extruderTemperature = Number(data.extruder.deg || 0).toFixed(0);
        extruderTarget = Number(data.extruder.degTarget || 0).toFixed(0);
        // Override the Spindle Speed with Extruder Temperature
        if(extruderTarget){
            $('[data-route="workspace"] [id="spindle"]').html(extruderTemperature + '&deg;C / ' + extruderTarget + "&deg;C");
        }
    }
    
    probe() {
        this.oldFilename = this.filename;
        this.probing = true;
        this.application.controller.command('watchdir:load', "Probe.nc");
    }
    

    runUserCommand(name) {
        $.get("../api/commands", {token: this.application.controller.token, paging: false}, function(data) {
            var cmd = data.records.find(function(record) {
                return record.enabled && record.title == name;
            });
            if (cmd) {
                j$.post("../api/commands/run/" + cmd.id + "?token=" + this.application.controller.token);
            }
        });
    }
    
    runGCode() {
        this.running = true;
        this.application.controller.command('gcode:start')
    }

    pauseGCode() {
        this.application.controller.command('gcode:pause');
    }
    
    resumeGCode() {
        this.application.controller.command('gcode:resume');
    }
    
    unloadGCode() {
        this.application.controller.command('gcode:unload');
        this.application.machine.totalLines = null;
        this.application.machine.receivedLines = null;
    }
    
    stopGCode() {
        this.userStopRequested = true;
        this.application.controller.command('gcode:stop', { force: true })
    }
    
    MDIcmd(value) {
        this.application.controller.command('gcode', value);
    }

    zeroAxis(axis) {
        this.setAxisByValue(axis, 0);
    }

    currentAxisPNum() {
        return 'P' + String(Number(this.modal.wcs.substring(1)) - 53);
    }
    
    setAxisByValue(axis, coordinate) {
        this.application.controller.command('gcode', 'G10 L20 ' + this.currentAxisPNum() + ' ' + axis + coordinate);
    }
    
    goAxis(axis, coordinate) {
        if (this.modal.distance == 'G90') {
            this.application.controller.command('gcode', 'G0 ' + axis + coordinate);
        } else {
            this.application.controller.command('gcode', 'G90');
            this.application.controller.command('gcode', 'G0 ' + axis + coordinate);
            this.application.controller.command('gcode', 'G91');
        }
    }


    initState() {
        // Select the "Load GCode File" heading instead of any file
        this.application.workspaceView.showGCode('', '');
        this.filename = '';
        this.oldFilename = '';
        this.running = false;
        this.elapsedTime = 0;
        this.remainingTime = 0;
        this.startTime = 0;
        this.finishTime = 0;
        this.userStopRequested = false;
        this.oldState = null;
        this.probing = false;
    }
    
    // This is used for GRBL and Smoothie.  It sets machineWorkflow
    // and possibly adjusts stateName based on the state and the
    // reason for stopping.
    setMachineWorkflow(stateName) {
        if (stateName == 'Idle') {
            this.machineWorkflow = MACHINE_IDLE;
            if (this.senderHold && this.senderHoldReason !== '%wait') {
                // M6 goes to IDLE state but the program has
                // has not really ended so we go to HOLD state.
                this.machineWorkflow = MACHINE_HOLD;
                stateName = this.senderHoldReason;
            }
        } else if (stateName == 'Hold') {
            this.machineWorkflow = MACHINE_HOLD;
            // M0 goes to HOLD state
            if (this.senderHold && this.senderHoldReason !== '%wait') {
               stateName = this.senderHoldReason;
            }
        } else if (stateName == 'Alarm') {
            this.machineWorkflow = MACHINE_STALL;
        } else {
            this.machineWorkflow = MACHINE_RUN;
        }

        return stateName;
    }

    renderGrblState(data) {

        var status = data.status || {};
        var stateName = status.activeState;
        this.mpos = status.mpos;
        this.wpos = status.wpos;
        
        // Grbl states are Idle, Run, Jog, Hold
        // The code used to allow click in Run state but that seems wrong
        // canClick = stateName == 'Idle';
        this.stateName = this.setMachineWorkflow(stateName);

        var parserstate = data.parserstate || {};
        if (parserstate.modal) {
            Object.assign(this.modal, parserstate.modal);
        }

        // Unit conversion factor - depends on both $13 setting and parser units
        var factor = 1.0;

        switch (this.modal.units) {
        case 'G20':
            factor = this.grblReportingUnits === 0 ? 1/25.4 : 1.0 ;
            break;
        case 'G21':
            factor = this.grblReportingUnits === 0 ? 1.0 : 25.4;
            break;
        }

        this.mpos.x *= factor;
        this.mpos.y *= factor;
        this.mpos.z *= factor;

        this.wpos.x *= factor;
        this.wpos.y *= factor;
        this.wpos.z *= factor;

        if (status.feedrate) {
            this.velocity = status.feedrate * factor;
        } else if (parserstate.feedrate) {
            this.velocity = parserstate.feedrate * factor;
        }
        this.spindleSpeed = parserstate.spindle;
        this.spindleDirection = this.modal.spindle;

        this.feedOverride = status.ov[0]/100.0;
        this.rapidOverride = status.ov[1]/100.0;
        this.spindleOverride = status.ov[2]/100.0;

        this.application.workspaceView.update();
    }


}