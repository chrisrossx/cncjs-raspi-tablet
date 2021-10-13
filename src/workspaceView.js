import { MACHINE_HOLD, MACHINE_IDLE, MACHINE_STALL, MACHINE_RUN, MACHINE_STOP } from "./machine";
import dateFormat from "dateformat";

export class WorkspaceView {
    
    constructor(application) {
        this.application = application; 
        this.leftButtonHandler;
        this.rightButtonHandler;
        this.watchPath = '';
        this.previous_tab_on_error = null;
    

        this.el = {
            mdi_text: [
                $("#mditext0"),
                $("#mditext1"),
                $("#mditext2"),
                $("#mditext3"),
            ],
            wpos: {
                "X": $("#wpos-x"),
                "Y": $("#wpos-y"),
                "Z": $("#wpos-z"),
                "A": $("#wpos-a"),
            },
        }

        $("#btn-start").on('click', () => this.doLeftButton());
        $("#btn-pause").on('click', () => this.doRightButton());


        $('[data-route="workspace"] select[data-name="select-file"]').on('change', () => this.loadGCode());

        $('#refresh-files').on('click', () => this.getFileList());
        $('#load-file').on('click', () => this.loadGCode());
        $('#unload-file').on('click', () => {
            this.application.machine.unloadGCode();
        })

        $("#btn-mditext0").on('click', () => this.on_mdi('#mditext0'));
        $("#btn-mditext1").on('click', () => this.on_mdi('#mditext1'));
        $("#btn-mditext2").on('click', () => this.on_mdi('#mditext2'));
        $("#btn-mditext3").on('click', () => this.on_mdi('#mditext3'));

        this.el.mdi_text[0].on('click', (e) => this.on_mdi_text_click(e, 0));
        this.el.mdi_text[1].on('click', (e) => this.on_mdi_text_click(e, 1));
        this.el.mdi_text[2].on('click', (e) => this.on_mdi_text_click(e, 2));
        this.el.mdi_text[3].on('click', (e) => this.on_mdi_text_click(e, 3));
        this.el.wpos.X.on('click', (e) => this.on_axis_text_click(e, "X"));
        this.el.wpos.Y.on('click', (e) => this.on_axis_text_click(e, "Y"));
        this.el.wpos.Z.on('click', (e) => this.on_axis_text_click(e, "Z"));
        this.el.wpos.A.on('click', (e) => this.on_axis_text_click(e, "A"));
 
        $("#btn-mditextm4").on('click', () => {this.application.machine.MDIcmd("M3")});
        $("#btn-mditextm5").on('click', () => {this.application.machine.MDIcmd("M5")});
        
        $("#btn-goAxisX0").on('click', () => {this.application.machine.goAxis('X', 0)});
        $("#btn-goAxisY0").on('click', () => {this.application.machine.goAxis('Y', 0)});
        $("#btn-goAxisZ0").on('click', () => {this.application.machine.goAxis('Z', 0)});
        $("#btn-goAxisA0").on('click', () => {this.application.machine.goAxis('A', 0)});

        $("#btn-zeroAxisX").on('click', () => {this.application.machine.zeroAxis('X')});
        $("#btn-zeroAxisY").on('click', () => {this.application.machine.zeroAxis('Y')});
        $("#btn-zeroAxisZ").on('click', () => {this.application.machine.zeroAxis('Z')});
        $("#btn-zeroAxisA").on('click', () => {this.application.machine.zeroAxis('A')});


        $("#units-inch").on('click', (event) => {
            event.preventDefault();
            this.application.controller.command('gcode', 'G20');
        });

        $("#units-mm").on('click', (event) => {
            event.preventDefault();
            this.application.controller.command('gcode', 'G21');
        });

        $("#btn-errors-dismiss").on('click', () => {
            this.clearError();
        })

    }

    on_axis_text_click(event, axis) {
        if(this.is_clickable() == false){
            event.currentTarget.blur();
            return false;
        }
        var label = "Set Axis " + axis;
        var value = this.el.wpos[axis].val();

        this.application.numpad.update_keys(axis);
        this.application.numpad.show(label, value,
            (val) => {
                this.application.machine.setAxisByValue(axis, val);
            },
            (val) => {
                this.application.machine.goAxis(axis, val);
            },
            (val) => {}
        );
    }
    

    on_mdi_text_click(event, index) {
        if(this.is_clickable() == false){
            event.currentTarget.blur();
            return false;
        }
        var label = "Set MDI Code " + index;
        var value = this.el.mdi_text[index].val();
        this.application.keyboard.show(label, value,
            (val) => {
                this.el.mdi_text[index].val(val);
            },
            (val) => {
                this.el.mdi_text[index].val(val);
                this.el.mdi_text[index].focus();
            }
        );
    }
    
    toggleFullscreen = function() {
        // var messages = document.getElementById('messages');

        if (document.fullscreenElement) {
            document.exitFullscreen();
            // messages.rows = 2;
        } else {
            document.documentElement.requestFullscreen();
            // messages.rows = 4;
        }
        // messages.scrollTop = messages.scrollHeight;
    }


    showError(msg){
        this.previous_tab_on_error = this.application.tabs.tab;
        $("#error-body").html(msg);
        this.application.tabs.el.btn_tab_errors.show()
        this.application.tabs.change("errors");
    }

    clearError(){
        if(this.previous_tab_on_error == "errors" || this.previous_tab_on_error == null){
            this.application.tabs.change("jog");
        }else{
            this.application.tabs.change(this.previous_tab_on_error);
        }
        this.application.tabs.el.btn_tab_errors.hide();
    }

    on_mdi(mdi_id){
        var gcode = $(mdi_id).val(); 
        this.application.machine.MDIcmd(gcode);
    }

    echoData = function(data) {
        var messages = $('[data-route="workspace"] [id="messages"]');
        messages.text(messages.text() + "\n" + data);
        messages[0].scrollTop = messages[0].scrollHeight;
    }

    showGCode(name, gcode) {
        this.application.machine.gCodeLoaded = gcode != '';
        if (!this.application.machine.gCodeLoaded) {
            gcode = "(No GCode loaded)";
        }
    
        this.application.machine.filename = name;
        if (name != "") {
            var basename = name.split('/').slice(-1)[0];
            $('[data-route="workspace"] select[data-name="select-file"]').val(basename);
        } else {
            $('[data-route="workspace"] select[data-name="select-file"]').val($('[data-route="workspace"] select[data-name="select-file"] option:first').val());
            $("#target").val($("#target option:first").val());
        }

        $('[data-route="workspace"] [id="gcode"]').text(gcode);
        if (this.application.machine.gCodeLoaded) {
            window.displayer.showToolpath(gcode, this.application.machine.wpos, this.application.machine.mpos);
        }else{
            window.displayer.clearToolpath();
        }
        if (this.application.machine.machineWorkflow != MACHINE_STALL) {
            this.update();
        }
    }
    

    nthLineEnd(str, n){
        if (n <= 0)
            return 0;
        var L= str.length, i= -1;
        while(n-- && i++<L){
          i= str.indexOf("\n", i);
            if (i < 0) break;
        }
        return i;
    }
    

    scrollToLine(lineNumber) {
        var gCodeLines = $('[data-route="workspace"] [id="gcode"]');
        var lineHeight = parseInt(gCodeLines.css('line-height'));
        var gCodeText = gCodeLines.text();
      
        gCodeLines.scrollTop((lineNumber-2) * lineHeight);
        gCodeLines.select();
      
        var start;
        var end;
        if (lineNumber <= 0) {
            start = 0;
            end = 1;
        } else {
            start = (lineNumber == 1) ? 0 : start = this.nthLineEnd(gCodeText, lineNumber-1) + 1;
            end = gCodeText.indexOf("\n", start);
        }
      
        gCodeLines[0].selectionStart = start;
        gCodeLines[0].selectionEnd = end;
      }
      


    setButton(name, isEnabled, color, text) {
        var button = $('[data-route="workspace"] ' + name);
        button.prop('disabled', !isEnabled);
        button.removeClass('btn-primary btn-light btn-danger');
        switch(color){
            case 'gray':
                button.addClass('btn-light');
                break;
            case 'green':
                button.addClass('btn-success');
                break;
            case 'red':
                button.addClass('btn-danger');
                break;
        }
        button.prop('innerText', text);
    }
        
    setLeftButton(isEnabled, color, text, click) {
        this.setButton('#btn-start', isEnabled, color, text);
        this.leftButtonHandler = click;
    }
    
    doLeftButton() {
        if (this.leftButtonHandler) {
            this.leftButtonHandler();
        }
    }
    
    setRightButton(isEnabled, color, text, click) {
        this.setButton('#btn-pause', isEnabled, color, text);
        this.rightButtonHandler = click;
    }
    
    doRightButton() {
        if (this.rightButtonHandler) {
            this.rightButtonHandler();
        }
    }
   

    update_dwpos(){
        var digits = this.application.machine.modal.units == 'G20' ? 4: 3;
        var dwpos = {
            x: Number(this.application.machine.wpos.x).toFixed(digits),
            y: Number(this.application.machine.wpos.y).toFixed(digits),
            z: Number(this.application.machine.wpos.z).toFixed(digits),
            a: isNaN(this.application.machine.wpos.a)  ? "--" : Number(this.application.machine.wpos.a).toFixed(2)
        };

        $('[data-route="workspace"] [id="wpos-x"]').prop('value', dwpos.x);
        $('[data-route="workspace"] [id="wpos-y"]').prop('value', dwpos.y);
        $('[data-route="workspace"] [id="wpos-z"]').prop('value', dwpos.z);
        $('[data-route="workspace"] [id="wpos-a"]').prop('value', dwpos.a);

        $('[data-route="workspace"] [data-name="wpos-label"]').text(this.application.machine.modal.wcs);
    }

    update_active_state(){
        if (this.application.machine.machineWorkflow == MACHINE_RUN) {
            var rateText = this.application.machine.modal.units == 'G21' ? Number(this.application.machine.velocity).toFixed(0) + ' mm/min' : Number(this.application.machine.velocity).toFixed(2) + ' in/min';
            $('[data-route="workspace"] [data-name="active-state"]').val(rateText);
        } else {
            
            var stateText;
            if(this.application.machine.machineWorkflow == MACHINE_HOLD, this.application.machine.stateName==''){
                stateText = "Hold";
            }else{
                stateText = this.application.machine.stateName == 'Error' ? "Error: " + this.application.machine.errorMessage : this.application.machine.stateName;
            }
            
            $('[data-route="workspace"] [data-name="active-state"]').val(stateText);
        }
    }

    update_state_buttons(){
        switch (this.application.machine.machineWorkflow) {
            case MACHINE_STALL:
                this.setLeftButton(false, 'gray', 'Start', null);
                this.setRightButton(false, 'gray', 'Pause', null);
                break;
            case MACHINE_STOP:
            case MACHINE_IDLE:
                if (this.application.machine.gCodeLoaded) {
                    // A GCode file is ready to go
                    this.setLeftButton(true, 'green', 'Start', () => this.application.machine.runGCode());
                    this.setRightButton(false, 'gray', 'Pause', null);
                } else {
                    // Can't start because no GCode to run
                    this.setLeftButton(false, 'gray', 'Start', null);
                    this.setRightButton(false, 'gray', 'Pause', null);
                }
                break;
            case MACHINE_HOLD:
                this.setLeftButton(true, 'green', 'Resume', this.application.machine.resumeGCode);
                this.setRightButton(true, 'red', 'Stop', this.application.machine.stopGCode);
                break;
            case MACHINE_RUN:
                this.setLeftButton(false, 'gray', 'Start', null);
                this.setRightButton(true, 'red', 'Pause', this.application.machine.pauseGCode);
                break;
        }

    }

    update_units(){
        var newUnits = this.application.machine.modal.units == 'G21' ? 'mm ' : 'Inch ';
        if ($('[data-route="workspace"] [id="units"]').text() != newUnits) {
            $('[data-route="workspace"] [id="units"]').text(newUnits);
            this.application.jog.set_values();
        }
        $('[data-route="workspace"] [id="units"]').prop('disabled', this.application.connection.controllerType == 'Marlin');
    }

    update_spindle_speed(){
        if (this.application.machine.spindleSpeed) {
            var spindleText = 'Off';
            switch (this.application.machine.spindleDirection) {
                case 'M3': 
                    spindleText = 'CW'; 
                    break;
                case 'M4': 
                    spindleText = 'CCW'; 
                    break;
                case 'M5': 
                    spindleText = 'Off'; 
                    break;
                default:  
                    spindleText = 'Off'; 
                    break;
            }
            $('[data-route="workspace"] [id="spindle"]').text(Number(this.application.machine.spindleSpeed) + ' RPM ' + spindleText);
        }

    }

    update_distance(){
        
        var distanceText = this.application.machine.modal.distance == 'G90'
        ? this.application.machine.modal.distance
        : "<div style='color:red'>" + this.application.machine.modal.distance + "</div>";
        $('[data-route="workspace"] [id="distance"]').html(distanceText);
    }


    is_clickable(){
        return this.application.machine.machineWorkflow <= MACHINE_IDLE
    }

    update_clickable(){
        var cannotClick = !this.is_clickable();

        $('[data-route="workspace"] .axis-button').prop('disabled', cannotClick);
        $('[data-route="workspace"] #tab-mdi .btn').prop('disabled', cannotClick);
        $('[data-route="workspace"] #tab-gcode .btn').prop('disabled', cannotClick);
        $('[data-route="workspace"] [data-name="select-file"]').prop('disabled', cannotClick);
        $('[data-route="workspace"] #units').prop('disabled', cannotClick);

        $('[data-route="workspace"] .btn-jog-xy').prop('disabled', cannotClick);
        $('[data-route="workspace"] .btn-jog-z').prop('disabled', cannotClick);
        $('#jox-xy-distance').prop('disabled', cannotClick);
        $('#jox-z-distance').prop('disabled', cannotClick);

    }


    formatElapsedTime(time){
        var elapsed = time;
        if (elapsed < 0)
            elapsed = 0;
        var seconds = Math.floor(elapsed / 1000);
        var minutes = Math.floor(seconds / 60);
        var hours = Math.floor(minutes / 60);

        seconds = seconds % 60;
        if (seconds < 10){
            seconds = '0' + seconds;
        }
        minutes = minutes % 60;
        if (minutes < 10){
            minutes = '0' + minutes;
        }
        if (hours < 10){
            hours = '0' + hours;
        }
        
        // formatTime = 
        if(elapsed == 0){
            return "--";
        }else{
            return hours + ":" + minutes + ':' + seconds;

        }
    }

    numberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    update_runtime(){
        if(this.application.machine.filename == ''){
            $('[data-route="workspace"] [id="gcode_lines"]').text("-- / --");
            
            $('[data-route="workspace"] [id="runtime"]').text("--");
            $('[data-route="workspace"] [id="gcode_elapsed"]').text("--");
            
            $('[data-route="workspace"] [id="gcode_start"]').text("--");
            $('[data-route="workspace"] [id="gcode_remaining"]').text("--");
            $('[data-route="workspace"] [id="gcode_finish"]').text("--");
            $('[data-route="workspace"] [id="line"]').text("--");
            
            
        }else{
            
            var elapsedTime = this.formatElapsedTime(this.application.machine.elapsedTime);
            $('[data-route="workspace"] [id="runtime"]').text(elapsedTime);
            $('[data-route="workspace"] [id="gcode_elapsed"]').text(elapsedTime);
            
            if(this.application.machine.startTime == 0){
                $('[data-route="workspace"] [id="gcode_start"]').text('--');
            }else{
                var start = new Date(this.application.machine.startTime);
                $('[data-route="workspace"] [id="gcode_start"]').text(dateFormat(start, "HH:mm:ss"));
            }
            $('[data-route="workspace"] [id="gcode_remaining"]').text(this.formatElapsedTime(this.application.machine.remainingTime));
            $('[data-route="workspace"] [id="gcode_finish"]').text(this.formatElapsedTime(this.application.machine.finishTime));
            
            if (this.application.machine.machineWorkflow == MACHINE_RUN || this.application.machine.machineWorkflow == MACHINE_HOLD || this.application.machine.machineWorkflow == MACHINE_STOP) {
                // var receivedLines = this.application.machine.receivedLines == 0 ? "--" : ;
                this.scrollToLine(this.application.machine.receivedLines);
                
                var gcode_lines =  this.numberWithCommas(this.application.machine.receivedLines) + " / " + this.numberWithCommas(this.application.machine.totalLines)
                $('[data-route="workspace"] [id="gcode_lines"]').text(gcode_lines);
                
            }
            var gcode_lines =  this.numberWithCommas(this.application.machine.receivedLines) + " / " + this.numberWithCommas(this.application.machine.totalLines)
            $('[data-route="workspace"] [id="gcode_lines"]').text(gcode_lines);
            $('[data-route="workspace"] [id="line"]').text(this.application.machine.receivedLines);
        }
    }

    update_gcode(){
        window.displayer.reDrawTool(this.application.machine.modal, this.application.machine.mpos);
    }

    update(){
        // if (cnc.filename == '') {
        //	canStart = false;
        //}

        this.update_dwpos();
        this.update_active_state();
        this.update_state_buttons();
        this.update_units();
        this.update_spindle_speed();
        this.update_distance();
        this.update_clickable();
        this.update_runtime();
        this.update_gcode();



        

    }

    getFileList() {

        $.get("../api/watch/files", {token: this.application.controller.token, path: this.watchPath}, (data) => {
            var selector = $('[data-route="workspace"] select[data-name="select-file"]');
            var legend;
            selector.empty();
            data.files.sort(function (a, b) {
                return a.name.localeCompare(b.name);
            });
            if (this.watchPath === '') {
                legend = 'Load GCode File';
                selector.append($("<option disabled />").text(legend));
            } else {
                legend = 'Load GCode File [./' + this.watchPath + "]";
                selector.append($("<option disabled />").text(legend));
                selector.append($("<option/>").text('..'));
            }
    
            $.each(data.files, function(index, file) {
                if (file.type === 'd') {
                    selector.append($("<option/>").text(file.name + '/'));
                }
            });
            $.each(data.files, function(index, file) {
                if (file.type === 'f' && !file.name.endsWith("~")) {
                    selector.append($("<option/>").text(file.name));
                }
            });
            var selected = this.application.machine.filename.split('/').slice(-1)[0];
            if (selected == '')
                selected = legend;
            $('[data-route="workspace"] select[data-name="select-file"]').val(selected);
        }, "json");
    }
        


    loadGCode() {

        var filename = $('[data-route="workspace"] select[data-name="select-file"] option:selected')[0].text;
        if (filename === '..') {
            this.watchPath = this.watchPath.slice(0, -1).replace(/[^/]*$/,'');
            this.application.machine.filename = '';
            this.getFileList();
        } else if (filename.endsWith('/')) {
            this.watchPath = this.watchPath + filename;
            this.application.machine.filename = '';
            this.getFileList();
        } else {
            this.application.controller.command('watchdir:load', this.watchPath + filename);
        }
    }
 
    


}