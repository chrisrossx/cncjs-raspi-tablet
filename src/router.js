import * as director from 'director/build/director';
import $ from 'jQuery';


export class Router{
    constructor(application){
        this.application = application 
        this.router = new director.Router({
            '/': () => {
                if (this.application.connected) {
                    window.location = '#/workspace';
                } else {
                    this.application.connection.reconnect();
                    // window.location = application.reconnect() ? '#/workspace' : '#/connection';
                    window.location = "#/connection"
                }
            },
            '/connection': function() {
            },
            '/workspace': function() {
            },
            '/toolpath': function() {
            }
        });

        this.router.configure({
            on: function() {
                var route = window.location.hash.slice(2);
                var views = $('[data-route]');
                var view = views.filter('[data-route="' + route + '"]');
                window.views = views;
                window.view = view
                if (view.length) {
                    views.addClass('hidden');
                    view.removeClass('hidden');
                }
    
                // console.log("route: " + route);
    
            }
        });
    
    

    }

    init() {
        this.router.init();
    }


}
