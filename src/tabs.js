import $ from 'jQuery';


export class Tabs {
  constructor(){
    
    this.el = {
      tab_jog: $("#tab-jog"),
      tab_gcode: $("#tab-gcode"),
      tab_mdi: $("#tab-mdi"),
      tab_errors: $("#tab-errors"),
      btn_tab_jog: $("#btn-tab-jog"),
      btn_tab_gcode: $("#btn-tab-gcode"),
      btn_tab_mdi: $("#btn-tab-mdi"),
      btn_tab_errors: $("#btn-tab-errors"),
    }

    this.tab = null;

    this.el.btn_tab_jog.on("click", () => {
      this.change("jog");
    });
  
    this.el.btn_tab_gcode.on("click", () => {
      this.change("gcode");
    });
  
    this.el.btn_tab_mdi.on("click", () => {
      this.change("mdi");
    });
  
    this.el.btn_tab_errors.on("click", () => {
      this.change("errors");
    });
  



  }

  change(new_tab) {
    
    this.tab = new_tab;

    this.el.tab_gcode.css('visibility', 'hidden');
    this.el.tab_mdi.css('visibility', 'hidden');
    this.el.tab_jog.css('visibility', 'hidden');
    this.el.tab_errors.css('visibility', 'hidden');
    this.el.btn_tab_gcode.removeClass(["btn-primary", "btn-dark"]);
    this.el.btn_tab_mdi.removeClass(["btn-primary", "btn-dark"]);
    this.el.btn_tab_jog.removeClass(["btn-primary", "btn-dark"]);
    this.el.btn_tab_errors.removeClass(["btn-danger-not-selected", "btn-danger"]);

    if(new_tab == "jog"){
      this.el.tab_jog.css('visibility', 'visible');
      this.el.btn_tab_jog.addClass("btn-primary")
    }else{
      this.el.btn_tab_jog.addClass("btn-dark")
    }
    if(new_tab == "gcode"){
      this.el.tab_gcode.css('visibility', 'visible');
      this.el.btn_tab_gcode.addClass("btn-primary")
    }else{
      this.el.btn_tab_gcode.addClass("btn-dark")
    }
    if(new_tab == "mdi"){
      this.el.tab_mdi.css('visibility', 'visible');
      this.el.btn_tab_mdi.addClass("btn-primary")
    }else{
      this.el.btn_tab_mdi.addClass("btn-dark")
    }
    if(new_tab == "errors"){
      this.el.tab_errors.css('visibility', 'visible');
      this.el.btn_tab_errors.addClass("btn-danger")
    }else{
      this.el.btn_tab_errors.addClass("btn-danger-not-selected")
    }

  }




}
  