'use strict';

var serial = {
    serviceId: 'FFE0',          // Modify to suit your ble module
    characteristicId: 'FFE1',   // Modify to suit your ble module

    connectionId:    false,
    openRequested:   false,
    openCanceled:    false,
    bitrate:         0,
    bytesReceived:   0,
    bytesSent:       0,
    failed:          0,
    connectionType:  'serial', 

    transmitting:   false,
    outputBuffer:  [],

    deviceNames: [],
    deviceIds: [],

    scanning: false,
    scanListeners: [],

    isConnecting: false,
    isDisconnecting: false,

    logHead: 'SERIAL: ',

    connect: function (path, options, callback) {
        var testUrl = path.match(/^tcp:\/\/([A-Za-z0-9\.-]+)(?:\:(\d+))?$/)

        if (testUrl) {
            callback(false);
        } else {
            this.connectSerial(path, options, callback);
        }
    },
    connectSerial: function (path, options, callback) {
        if (this.isConnecting || this.connectionId) return;

        var self = this;
        self.openRequested = true;

        var deviceIdx = self.deviceNames.indexOf(path);
        var deviceId = self.deviceIds[deviceIdx] || '';

        this._stopScanning(function() {
           self.isConnecting = true;
           
           ble.connect(deviceId,
                function success(connectionInfo) {
                    self.isConnecting = false;
                    self.connectionId = connectionInfo.id;
                    self.bitrate = 9600;
                    self.bytesReceived = 0;
                    self.bytesSent = 0;
                    self.failed = 0;
                    self.openRequested = false;

                    self.onReceive.addListener(function(info) {
                        self.bytesReceived += info.data.byteLength;
                    });

                    self.onReceiveError.addListener(function(info) {
                        console.error(info);
                    });

                    ble.startNotification(self.connectionId, 
                        self.serviceId,
                        self.characteristicId,
                        self.onReceive._onData.bind(self.onReceive),
                        self.onReceiveError._onError.bind(self.onReceiveError)
                    );

                    if (callback) callback({
                        connectionId: connectionInfo.id
                    });
                },
                function failure() {
                    console.log('SERIAL: Failed to open serial port');
                    self.openRequested = false;
                    self.isConnecting = false;

                    if (callback) callback(false);
                }
            );
        });
    },
    disconnect: function (callback) {
        if (this.isDisconnecting || this.isConnecting) return;

        var self = this;

        if (self.connectionId) {            
            self.emptyOutputBuffer();

            // remove listeners
            self.onReceive.listeners = [];
            self.onReceiveError.listeners = [];

            self.isDisconnecting = true;

            function success() {
                console.log(self.logHead + 'Connection with ID: ' + self.connectionId + ' closed, Sent: ' + self.bytesSent + ' bytes, Received: ' + self.bytesReceived + ' bytes');

                self.isDisconnecting = false;
                self.connectionId = false;
                self.bitrate = 0;

                if (callback) callback(true);
            }

            function failure() {
                console.log(self.logHead + 'Failed to close connection with ID: ' + self.connectionId + ' closed, Sent: ' + self.bytesSent + ' bytes, Received: ' + self.bytesReceived + ' bytes');

                self.isDisconnecting = false;
                
                if (callback) callback(false);
            }

            ble.stopNotification(
                self.connectionId, 
                self.serviceId,
                self.characteristicId,
                function() {
                    ble.disconnect(self.connectionId, success, failure);
                },
                failure
            );
        } else {
            // connection wasn't opened, so we won't try to close anything
            // instead we will rise canceled flag which will prevent connect from continueing further after being canceled
            self.openCanceled = true;
        }
    },
    getDevices: function (callback) {
        if (!callback) return;

        if (this.scanning) {
            this.scanListeners.push(callback);
            return;
        }

        // Avoid new scans while connected to a device
        if (this.isConnecting || this.isDisconnecting || this.connectionId) {
            callback(this.deviceNames);
            return;
        }

        this.scanning = true;
        this.scanListeners.push(callback);

        var self = this;
        var deviceNames = [];
        var deviceIds = [];

        ble.startScan(
            [self.serviceId], 
            function success (device) {
                deviceNames.push(device.name);
                deviceIds.push(device.id);
            },
            function failure() {
                console.error('Could not start scan');
            }
        );

        setTimeout(function() {
            self._stopScanning(null, deviceNames, deviceIds);
        }, 3000);
    },

    getInfo: function (callback) {},
    getControlSignals: function (callback) {},
    setControlSignals: function (signals, callback) {},

    send: function (data, callback) {
        var self = this;
        this.outputBuffer.push({'data': data, 'callback': callback});

        function send() {
            // store inside separate variables in case array gets destroyed
            var data = self.outputBuffer[0].data,
                callback = self.outputBuffer[0].callback;

            ble.writeWithoutResponse(
                self.connectionId,
                self.serviceId,
                self.characteristicId,
                data,
                function success() {
                    // track sent bytes for statistics
                    self.bytesSent += data.length;

                    // fire callback
                    if (callback) callback({
                        bytesSent: data.byteLength
                    });

                    // remove data for current transmission form the buffer
                    self.outputBuffer.shift();

                    // if there is any data in the queue fire send immediately, otherwise stop trasmitting
                    if (self.outputBuffer.length) {
                        // keep the buffer withing reasonable limits
                        if (self.outputBuffer.length > 100) {
                            var counter = 0;

                            while (self.outputBuffer.length > 100) {
                                self.outputBuffer.pop();
                                counter++;
                            }

                            console.log(self.logHead + 'Send buffer overflowing, dropped: ' + counter + ' entries');
                        }

                        send();
                    } else {
                        self.transmitting = false;
                    }

                },
                function failure() {}
            );
        }

        if (!this.transmitting) {
            this.transmitting = true;
            send();
        }
    },
    onReceive: {
        listeners: [],

        addListener: function (function_reference) {
            var idx = this.listeners.indexOf(function_reference);
            if (idx < 0) {
                this.listeners.push(function_reference);
            }
        },
        removeListener: function (function_reference) {
            var idx = this.listeners.indexOf(function_reference);
            if (idx > -1) {
                this.listeners.splice(idx, 1);
            }
        },
        _onData: function(data) {
            var payload = {
                data: data
            };

            this.listeners.forEach(function(listener) {
                listener(payload);
            });
        }
    },
    onReceiveError: {
        listeners: [],

        addListener: function (function_reference) {
            var idx = this.listeners.indexOf(function_reference);
            if (idx < 0) {
                this.listeners.push(function_reference);
            }
        },
        removeListener: function (function_reference) {
            var idx = this.listeners.indexOf(function_reference);
            if (idx > -1) {
                this.listeners.splice(idx, 1);
            }
        },
        _onError: function(error) {
            this.listeners.forEach(function(listener) {
                listener(error);
            });
        }
    },
    emptyOutputBuffer: function () {
        this.outputBuffer = [];
        this.transmitting = false;
    },

    _stopScanning: function(callback, foundDeviceNames, foundDeviceIds) {
        if (!this.scanning) return;

        var self = this;

        ble.stopScan(
            function success() {
                if (foundDeviceNames) self.deviceNames = foundDeviceNames;
                if (foundDeviceIds) self.deviceIds = foundDeviceIds;
                
                console.log(self.deviceNames);

                self.scanListeners.forEach(function(listener) {
                    listener(self.deviceNames);
                });

                self.scanListeners = [];
                self.scanning = false;

                if (callback) callback();
            },
            function failure() {
                self.scanListeners = [];
                self.scanning = false;

                console.error('Could not stop scan');

                if (callback) callback();
            }
        );
    }
};
