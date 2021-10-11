import $ from 'jQuery';
import Cookies from 'js.cookie';

export class Connection{

    constructor(application){
        this.application = application;
        this.port = Cookies.get('cnc.port');
        this.baudrate = Cookies.get('cnc.baudrate');
        this.connected = false;
        this.controllerType = Cookies.get('cnc.controllerType');


        this.application.controller.on('serialport:list', (list) => {
            var $el = $('[data-route="connection"] select[data-name="port"]');
        
    
            $el.empty();
            $.each(list, function(key, value) {
                var portText = value.port;
                if (value.manufacturer) {
                    portText += ' (' + value.manufacturer + ')';
                }
                var $option = $('<option></option>')
                .attr('value', value.port)
                .attr('data-inuse', value.inuse)
                .html(portText);
                $el.append($option);
            });
        
            $el.prop("disabled", false);
    
            if (this.controllerType) {
                $('[data-route="connection"] select[data-name="controllerType"]').val(this.controllerType);
            }
            if (this.port) {
                $('[data-route="connection"] select[data-name="port"]').val(this.port);
            }
            if (this.baudrate) {
                $('[data-route="connection"] select[data-name="baudrate"]').val(this.baudrate);
            }
        
        });     
        
        $('[data-route="connection"] [data-name="btn-ports-sync"]').on('click', () => {
            var $el = $('[data-route="connection"] select[data-name="port"]');
            $el.prop("disabled", true);
            this.application.controller.listAllPorts();
        });
    
    
        $('[data-route="connection"] [data-name="btn-open"]').on('click', () => {
            var controllerType = $('[data-route="connection"] [data-name="controllerType"]').val();
            var port = $('[data-route="connection"] [data-name="port"]').val();
            var baudrate = $('[data-route="connection"] [data-name="baudrate"]').val();
        
            if (port) {
                this.application.controller.openPort(port, {
                    controllerType: controllerType,
                    baudrate: Number(baudrate)
                });
            }
        }
        );
    
        // Close
        $('[data-route="connection"] [data-name="btn-close"]').on('click', () => {
            this.application.controller.closePort();
        });
        
        this.application.controller.on('serialport:open', (options) => {
            this.application.machine.initState();
        
            var controllerType = options.controllerType;
            var port = options.port;
            var baudrate = options.baudrate;
        
            this.connected = true;
            this.controllerType = controllerType;
            this.port = port;
            this.baudrate = baudrate;
        
            $('[data-route="connection"] [data-name="btn-open"]').prop('disabled',true);
            $('[data-route="connection"] [data-name="btn-close"]').prop('disabled',false);
            $("#connection-back").removeClass("hidden");
            this.clear_connection_error();
        
            Cookies.set('cnc.controllerType', controllerType, {expires: 365});
            Cookies.set('cnc.port', port, {expires: 365});
            Cookies.set('cnc.baudrate', baudrate, {expires: 365});
        
            if (controllerType === 'Grbl') {
                // Read the settings so we can determine the units for position reports
                // This will trigger a Grbl:settings callback to set grblReportingUnits
        
                // This has a problem: The first status report arrives before the
                // settings report, so interpreting the numbers from the first status
                // report is ambiguous.  Subsequent status reports are interpreted correctly.
                // We work around that by deferring status reports until the settings report.
                // I commented this out because of https://github.com/cncjs/cncjs-shopfloor-tablet/issues/20
                // controller.writeln('$$');
            }
            window.location = '#/workspace';
        });
    
        this.application.controller.on('serialport:close', (options) => {
            var port = options.port;
        
            this.connected = false;
            this.controllerType = '';
            this.port = '';
            this.baudrate = 0;
        
            $('[data-route="connection"] [data-name="btn-open"]').prop('disabled',false);
            $('[data-route="connection"] [data-name="btn-close"]').prop('disabled',true);
            $("#connection-back").addClass("hidden");
            $('[data-route="workspace"] [data-name="active-state"]').val('NoConnect');
            window.location = '#/connection';
        });
        
        this.application.controller.on('serialport:error', (options) => {
            var port = options.port;
    
            this.connected = false;
            this.controllerType = '';
            this.port = '';
            this.baudrate = 0;
        
            console.log('Error opening serial port \'' + port + '\'');
            var msg = "Error opening serial port \'" + port + "\'";
            this.show_connection_error(msg)
    
        });
        
    }

    show_connection_error(message){
        var el = $("#connection-error");
        el.html(message);
        el.removeClass("hidden")
    }
    
    clear_connection_error(){
        var el = $("#connection-error");
        el.html('');
        el.addClass("hidden")
    }
    
    reconnect() {
        if (this.controllerType && this.port && this.baudrate) {
            this.application.controller.openPort(this.port, {
                    controllerType: this.controllerType,
                    baudrate: Number(this.baudrate)
            });
            return true;
        }
        return false;
    
    };



}
