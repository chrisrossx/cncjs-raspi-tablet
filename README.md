# CNCJS-RASPI-SEVEN

This CNCJS UI was specifically designed to work with the official 7" Raspberry Pi Touch Screen Display.  It features a tab's interface in order to fit in more information. 

Features
* Reset, Unlock the machine.
* Jog the machine
* Set Work Coordinates
* MDI
* Serial Messages Display
* Gcode List
* GCode Renderer
* GCode execute status
* Error Message Display
* Homing
* Load and Execute programs from the CNCJS watch directory

Additional Features / Improvements from the cncjs-shopflor-tablet project
* Additiona machine state infromation on the GCode tab
* Ability to unload gcode, or handle unload events from other loaded interfaces. 
* Reset and Unlock buttons on the top NavBar when the state is in Alarm or Stall. 
* Seperate Z Jog Distance buttons and pulldowns from the XY axis. Ability to toggle this feature on and off.
* User configurable Button and Pulldown values for metric and inch jog distances. 

# Screen Shots

![Jog Tab](/screenshot_jog.png)

![Jog Tab](/screenshot_gcode.png)

![Jog Tab](/screenshot_mdi.png)

![Jog Tab](/screenshot_keyboard.png)

# Starting Point

This project started as a re-skinning of the official [shopfloor-tablet](https://github.com/cncjs/cncjs-shopfloor-tablet) UI from the [cncjs](https://cnc.js.org/) project.

The code from cncjs-shopfloor-tablet has been refactored to use ES6 classes.

# Limitations
* This project has only been tested with Grbl. While the code for the other controllers has been copied from the cncjs-shopfloor-tablet, it has not been tested. 

# Setup

## Kiosk Mode

You can setup a browser to automatically be run in kiosk mode on startup of the Raspberry Pi. 
* Starting the chromium browser in --kios mode, the fullscreen command in the Navbar menu will not work. 

## CNCJS Security Token Limitation 

When the app is first loaded into a browser, it will redirect to the CNCJS user login page, that will then set a security token in the broswers localStorage.  If you do not have any users setup in CNCJS, it will set the default token. However it will not redirect the user back the CNCJS-RASPI-TABLET page. A way to workaround this would be to set the token as a url parameter in the browser link. 

For example:
'''
http://127.0.0.1:8000/raspi/?token=xxxxxx
'''

## Default Port for Connection Page

You can set a port paramater on the loading URL, to set a default port to select in the Port Option Dialog on the Connection Page.

For example:
'''
http://127.0.0.1:8000/raspi/#?port=COM10&token=xxxxxx
'''
