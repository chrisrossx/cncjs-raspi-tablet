import $ from 'jQuery';
import Keyboard from 'simple-keyboard';

class BaseKeyboard{
    
    constructor(containerID, dismissID){
        var container = $(containerID)
        this.el = {
            container: container,
            dismiss: container.find(".dismiss"),
            label: container.find(".label"),
            input: container.find(".modal-input"),
        }

        this.dismiss_callback = null;
        this.enter_callback = null;
        this.set_callback = null;
        this.goto_callback = null;

        this.el.container.on('click', (e) => {
            if(e.target === this.el.container[0]){
                e.preventDefault();
                this.on_dismiss(this.el.input.val());
            }
        });

        this.el.dismiss.on('click', (e) => {
            e.preventDefault();
            this.on_dismiss(this.el.input.val());
        })

    }
    
    on_dismiss(value){
        this.hide();
        this.dismiss_callback && this.dismiss_callback(value);
    }

    on_set(value){
        this.hide()
        this.set_callback && this.set_callback(value);
    }

    on_goto(value){
        this.hide()
        this.goto_callback && this.goto_callback(value);
    }

    on_enter(value){
        this.hide()
        this.enter_callback && this.enter_callback(value);
    }

    onChange(text){
        this.el.input.val(text);
    }

    onKeyPress(button) {

        if(button === "{enter}"){
            this.on_enter(this.el.input.val())
        }

        if(button === "{set}"){
            this.on_set(this.el.input.val())
        }

        if(button === "{goto}"){
            this.on_goto(this.el.input.val())
        }

        if(button === "{cancel}"){
            this.hide()
            this.dismiss_callback && this.dismiss_callback(this.el.input.val());
        }

        if(button === "{clear}"){
            var text = "";
            this.el.input.val(text);
            this.keyboard.setInput(text)
        }

        if (button === "{shift}" || button === "{lock}"){
            this.handleShift();
        } 
    }


    handleShift() {
        let currentLayout = this.keyboard.options.layoutName;
        let shiftToggle = currentLayout === "default" ? "shift" : "default";

        this.keyboard.setOptions({
            layoutName: shiftToggle
        });
    }

    hide(){
        this.el.container.hide();
    }

    show(label, value, dismiss_callback){
        this.dismiss_callback = dismiss_callback || null;
        this.el.container.show();
        this.el.label.html(label);
        this.el.input.val(value);
        this.keyboard.setInput(value);
        this.keyboard.setCaretPosition(value.length);
    }
    
}


export class CNCNumpad extends BaseKeyboard{
    constructor(){

        super("#numpad-keyboard");

        this.keyboard = new Keyboard(".numpad-keyboard-instance",{
            onChange: input => { this.onChange(input) },
            onKeyPress: (button) => this.onKeyPress(button),
            layout: {
                default: ["1 2 3", "4 5 6", "7 8 9", "- 0 .", "{bksp}", "{clear} {set} {goto}"],
                // shift: ["! / #", "$ % ^", "& * (", "{blsp} ) +", "{bksp}", "{clear} {set} {goto}"]
            },
            inputName: "numpad-keyboard-input",
            theme: "hg-theme-default hg-layout-numeric numeric-theme",
            display: {
                "{set}": "Set Y",
                "{goto}": "GoTo Y",
                "{cancel}": "Cancel",
                "{clear}": "Clear",
                "{bksp}": "Bksp",
                "{shift}": "Shift"
            }
        });
        
        
    }

    show(label, value, set_callback, goto_callback, dismiss_callback){
        this.set_callback = set_callback;
        this.goto_callback = goto_callback;
        this.dismiss_callback = dismiss_callback;
        super.show(label, value, dismiss_callback);
    }

    update_keys(axis){
        this.keyboard.setOptions({
            display: {
                "{set}": "Set " + axis,
                "{goto}": "GoTo " + axis,
                "{cancel}": "Cancel",
                "{clear}": "Clear",
                "{bksp}": "Bksp",
                "{shift}": "Shift"
            }            
        })
    }

}

export class CNCKeyboard extends BaseKeyboard{

    constructor(){
        super("#text-keyboard");

        this.keyboard = new Keyboard(".text-keyboard-instance",{
            onChange: input => { this.onChange(input) },
            onKeyPress: (button) => this.onKeyPress(button),
            layout: {
                'default': [
                  '` 1 2 3 4 5 6 7 8 9 0 - = {bksp}',
                  '{tab} Q W E R T Y U I O P [ ] \\',
                  '{lock} A S D F G H J K L ; \' {enter}',
                  '{shift} Z X C V B N M , . / {shift}',
                  '.com @ {space}'
                ],
                'shift': [
                  '~ ! @ # $ % ^ & * ( ) _ + {bksp}',
                  '{tab} q w e r t y u i o p { } |',
                  '{lock} a s d f g h j k l : " {enter}',
                  '{shift} z x c v b n m < > ? {shift}',
                  '.com @ {space}'
                ]
            }
        });
    }

    show(label, value, enter_callback, dismiss_callback){
        this.enter_callback = enter_callback;
        super.show(label, value, dismiss_callback);
    }


}