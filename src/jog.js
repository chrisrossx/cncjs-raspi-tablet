// import * as config from './config.js';

export class JogButtons{
    constructor(application){
        this.application = application;
        this.el = {
            xy_distance_btns: [
                $("#btn-jog-xy-0"),
                $("#btn-jog-xy-1"),
                $("#btn-jog-xy-2"),
                $("#btn-jog-xy-3"),
                $("#btn-jog-xy-4"),
                $("#btn-jog-xy-5"),
                $("#btn-jog-xy-6"),
                $("#btn-jog-xy-7"),
                $("#btn-jog-xy-8"),
                $("#btn-jog-xy-9"),
                $("#btn-jog-xy-10"),
                $("#btn-jog-xy-11"),
            ],
            z_distance_btns: [
                $("#btn-jog-z-0"),
                $("#btn-jog-z-1"),
                $("#btn-jog-z-2"),
                $("#btn-jog-z-3"),
                $("#btn-jog-z-4"),
                $("#btn-jog-z-5"),
            ],
            jog_xy_select: $("#jox-xy-distance"),
            jog_z_select: $("#jox-z-distance"),
            btn_jog_x_plus: $("#btn-jog-x-plus"),
            btn_jog_x_minus: $("#btn-jog-x-minus"),
            btn_jog_y_plus: $("#btn-jog-y-plus"),
            btn_jog_y_minus: $("#btn-jog-y-minus"),
            btn_jog_z_plus: $("#btn-jog-z-plus"),
            btn_jog_z_minus: $("#btn-jog-z-minus"),
        }


        this.el.btn_jog_x_plus.on('click', () => {this.sendMove("X+")});
        this.el.btn_jog_x_minus.on('click', () => {this.sendMove("X-")});
        this.el.btn_jog_y_plus.on('click', () => {this.sendMove("Y+")});
        this.el.btn_jog_y_minus.on('click', () => {this.sendMove("Y-")});
        this.el.btn_jog_z_plus.on('click', () => {this.sendMove("Z+")});
        this.el.btn_jog_z_minus.on('click', () => {this.sendMove("Z-")});

    }

    paramsTogcode(params){
        params = params || {};
        var args = [];
        Object.entries(params).forEach((entry) => {
            args.push( '' + entry[0] + entry[1]);
        })
        var s = args.join(' ');
        return s;
    }

    jog(params) {
        if (this.application.machine.modal.distance == 'G90') {
            this.application.controller.command('gcode', 'G91'); // relative distance
            this.application.controller.command('gcode', 'G0 ' + this.paramsTogcode(params));
            this.application.controller.command('gcode', 'G90'); // absolute distance
        } else {
            this.application.controller.command('gcode', 'G0 ' + this.paramsTogcode(params));
        }
    };

    move(params) {
        if (this.application.machine.modal.distance == 'G90') {
            this.application.controller.command('gcode', 'G0 ' + this.paramsTogcode(params));
        } else {
            this.application.controller.command('gcode', 'G90'); // absolute distance
            this.application.controller.command('gcode', 'G0 ' + this.paramsTogcode(params));
            this.application.controller.command('gcode', 'G91'); // relative distance
        }
    };

    sendMove(command){

        var xy_distance = this.el.jog_xy_select.val() || 0;
        var z_distance = this.el.jog_z_select.val() || 0;
   
        var fn = {
            'G28': () => this.application.controller.command('gcode', 'G28'),
            'G30': () => this.application.controller.command('gcode', 'G30'),
            'X0Y0Z0': () => this.move({X: 0, Y: 0, Z: 0}),
            'X0': () => this.move({X: 0}),
            'Y0': () => this.move({Y: 0}),
            'Z0': () => this.move({Z: 0}),
            'X-Y+': () => this.jog({ X: -xy_distance, Y: xy_distance }),
            'X+Y+': () => this.jog({ X: xy_distance, Y: xy_distance }),
            'X-Y-': () => this.jog({ X: -xy_distance, Y: -xy_distance }),
            'X+Y-': () => this.jog({ X: xy_distance, Y: -xy_distance }),
            'X-': () => this.jog({ X: -xy_distance }),
            'X+': () => this.jog({ X: xy_distance }),
            'Y-': () => this.jog({ Y: -xy_distance }),
            'Y+': () => this.jog({ Y: xy_distance }),
            'Z-': () => this.jog({ Z: -z_distance }),
            'Z+': () => this.jog({ Z: z_distance }),
        }[command];
        fn && fn();
    }

    on_xy_btn_click(val){
        this.el.jog_xy_select.val(val);
    }
    
    on_z_btn_click(val){
        this.el.jog_z_select.val(val);
    }

    set_values(){

        var set = function(btns, btns_mm, btns_inch, select, jog_mm, jog_inch, select_default_mm, select_default_inch){
            var i = 0;
            btns.forEach((btn) => {
                let val = this.application.machine.modal.units == "G21" ? btns_mm[i] : btns_inch[i];
                btn.html(val);
                btn.off('click');
                btn.on('click', () => this.on_xy_btn_click(val));
                i++;
            });

            var values = this.application.machine.modal.units == "G21" ? jog_mm : jog_inch; 
            select.empty();
            values.forEach((val) => {
                select.append($("<option/>").text(val));
            })
            var select_default = this.application.machine.modal.units == "G21" ? select_default_mm : select_default_inch;
            select.val(select_default);
        }.bind(this);

        set(this.el.xy_distance_btns,
            window.jog_xy_buttons_mm,
            window.jog_xy_buttons_inch,
            this.el.jog_xy_select,
            window.jog_xy_select_mm,
            window.jog_xy_select_inch,
            window.jog_xy_select_mm_default,
            window.jog_xy_select_inch_default
        );
        
        set(this.el.z_distance_btns,
            window.jog_z_buttons_mm,
            window.jog_z_buttons_inch,
            this.el.jog_z_select,
            window.jog_z_select_mm,
            window.jog_z_select_inch,
            window.jog_z_select_mm_default,
            window.jog_z_select_inch_default
        );

    }


}