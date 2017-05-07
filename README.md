# Betaflight mobile configurator
Minimal phonegap-wrapper for running the betaflight configurator on mobile devices over bluetooth (BLE).

Communication is handled by BLE Central plugin: https://github.com/don/cordova-plugin-ble-central

Use a bluetooth 4.1 capable module (for example HM-16 / HM-17), connected to a free UART on you flight controller.
If you want to check for device compatibility beforehand, download a bluetooth 4.1 discovery app on your device (for example Lightblue) and make sure you can discover the bluetooth module.

Assumed service and characteristic for the bt module is FFE0 (service) and FFE1 (characteristic). If this not correct for your module, make according changes in the serial.js-script inside of the www/js folder.

For building / deploying, refer to official Phonegap docs.

For local development, Phonegap Desktop App / 'phonegap serve' together with the Phonegap Developer App on your device is recommended. A known issue is that 3- and 4-finger taps are not working right now for this repo.

For deployment, use Phonegap CLI or Phonegap build.


Tested on iPhone/iPad, but not on Android.

For tablets, the original stylesheet for the configurator works fine.

For phones, the layout is not ideal and usage on phones is not recommended at the moment. Someone would need to create a suitable responsive stylesheet for that formfactor.


# Credits
ctn - primary author and maintainer of Baseflight Configurator from which Cleanflight Configurator project was forked.

Hydra - author and maintainer of Cleanflight Configurator from which the Betaflight Configurator project was forked.

Borisbstyle and all other Betaflight contributors - authors and maintaners of Betaflight Configurator which this project use.
