import './main.scss';
import * as bootstrap from 'bootstrap';
import $ from 'jQuery';

import {Tabs} from './tabs.js';
import {Router} from './router.js';
import {Connection} from './connection.js';
import {CNCJSController} from './controller.js';
import {Machine} from './machine.js';
import {WorkspaceView} from './workspaceView';
import {JogButtons} from './jog';
import {CNCKeyboard, CNCNumpad} from './keyboard.js';

import './toolpath-displayer.js';

window.bootstrap = bootstrap;
window.$ = $;

class Application {

    constructor() {
      
        this.controller = new CNCJSController();
        this.connection = new Connection(this);
        this.router = new Router(this);
        this.machine = new Machine(this);
        this.workspaceView = new WorkspaceView(this);
        this.controller.socket.connect();
        this.keyboard = new CNCKeyboard();
        this.numpad = new CNCNumpad();
        this.tabs = new Tabs();
        this.tabs.change("jog");
        this.jog = new JogButtons(this);



        this.controller.socket.on('error', function(){
            console.log("socket.io on 'error'");
            window.location = '/?continue=' + encodeURIComponent(window.location.pathname);
        });

        this.controller.socket.on('connect', () => {
            $('#page-loading').remove(); // Remove loading message
            this.router.init();
            window.location = '#/';

            this.controller.listAllPorts();

            this.machine.filename = '';
            this.workspaceView.getFileList();
        });

    }


}


window.application = new Application()
var application = window.application;
