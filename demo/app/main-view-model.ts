import * as dialogs from '@nativescript/core/ui/dialogs';
import { Observable } from '@nativescript/core/data/observable';
import { ObservableArray } from '@nativescript/core/data/observable-array';
import { topmost } from '@nativescript/core/ui/frame';
import { Prop } from './utils/obs-prop';
import { Bluetooth, getBluetoothInstance, Peripheral } from 'nativescript-bluetooth';

export class DemoAppModel extends Observable {
    @Prop() public isLoading = false;

    public peripherals = new ObservableArray<Peripheral>();
    private _bluetooth = getBluetoothInstance();

    constructor() {
        super();
        // enables the console.logs from the Bluetooth source code
        this._bluetooth.debug = true;

        // using an event listener instead of the 'onDiscovered' callback of 'startScanning'
        this._bluetooth.on(Bluetooth.device_discovered_event, (eventData: any) => {
            const perip = eventData.data as Peripheral;
            let index = -1;
            this.peripherals.some((p, i) => {
                if (p.UUID === perip.UUID) {
                    index = i;
                    return true;
                }
                return false;
            });
            console.log('Peripheral found:', JSON.stringify(eventData.data), index);
            if (index === -1) {
                this.peripherals.push(perip);
            } else {
                this.peripherals.setItem(index, perip);
            }
        });
    }

    public doIsBluetoothEnabled() {
        console.log('doIsBluetoothEnabled tap');
        this._bluetooth.isBluetoothEnabled().then(enabled => {
            if (enabled === false) {
                dialogs.alert('Bluetooth is DISABLED.');
            } else {
                dialogs.alert('Bluetooth is ENABLED.');
            }
        });
    }

    public doEnableBluetooth() {
        this._bluetooth.enable().then(enabled => {
            setTimeout(() => {
                dialogs.alert({
                    title: 'Did the user allow enabling Bluetooth by our app?',
                    message: enabled ? 'Yes' : 'No',
                    okButtonText: 'OK, nice!'
                });
            }, 500);
        });
    }

    public onPeripheralTap(args) {
        this.doStopScanning();
        console.log('!!&&&&***** Clicked item with index ' + args.index);
        const peri = this.peripherals.getItem(args.index);
        console.log('--- peripheral selected: ' + peri.UUID);

        const navigationEntry = {
            moduleName: 'services-page',
            context: {
                peripheral: peri
            },
            animated: true
        };
        topmost().navigate(navigationEntry);
    }

    public onPeripheralTestTap(peri) {
        this.doStopScanning();
        console.log('!!&&&&***** Long press item with index ' + peri);
        console.log('--- peripheral selected: ' + peri.UUID);

        const navigationEntry = {
            moduleName: 'test-page',
            context: {
                peripheral: peri
            },
            animated: true
        };
        topmost().navigate(navigationEntry);
    }

    // this one 'manually' checks for permissions
    public doScanForHeartrateMontitor() {
        this._bluetooth.hasCoarseLocationPermission().then(granted => {
            if (!granted) {
                this._bluetooth.requestCoarseLocationPermission().then(
                    // doing it like this for demo / testing purposes.. better usage is demonstrated in 'doStartScanning' below
                    granted2 => {
                        dialogs.alert({
                            title: 'Granted?',
                            message: granted2 ? 'Yep - now invoke that button again' : 'Nope',
                            okButtonText: 'OK!'
                        });
                    }
                );
            } else {
                const heartrateService = '180d';
                // const omegaService = '12345678-9012-3456-7890-1234567890ee';

                this.isLoading = true;
                // reset the array
                this.peripherals.splice(0, this.peripherals.length);
                this._bluetooth
                    .startScanning({
                        // beware: the peripheral must advertise ALL these services
                        filters: [{ serviceUUID: heartrateService }],
                        seconds: 4,
                        // onDiscovered: peripheral => {
                        //     this.peripherals.push(peripheral);
                        // },
                        skipPermissionCheck: true // we can skip permissions as we use filters:   https://developer.android.com/guide/topics/connectivity/bluetooth-le
                    })
                    .then(
                        p => {
                            this.isLoading = false;
                            console.log('p', p);
                        },
                        err => {
                            this.isLoading = false;
                            dialogs.alert({
                                title: 'Whoops!',
                                message: err,
                                okButtonText: 'OK, got it'
                            });
                        }
                    );
            }
        });
    }

    // this one 'manually' checks for permissions
    public doScanForBeacon() {
        this._bluetooth.hasCoarseLocationPermission().then(granted => {
            if (!granted) {
                this._bluetooth.requestCoarseLocationPermission().then(
                    // doing it like this for demo / testing purposes.. better usage is demonstrated in 'doStartScanning' below
                    granted2 => {
                        dialogs.alert({
                            title: 'Granted?',
                            message: granted2 ? 'Yep - now invoke that button again' : 'Nope',
                            okButtonText: 'OK!'
                        });
                    }
                );
            } else {
                // const heartrateService = '180d';
                // const omegaService = '12345678-9012-3456-7890-1234567890ee';

                this.isLoading = true;
                // reset the array
                this.peripherals.splice(0, this.peripherals.length);
                this._bluetooth
                    .startScanning({
                        // beware: the peripheral must advertise ALL these services
                        filters: [{ serviceUUID: '0000feaa-0000-1000-8000-00805f9b34fb' }],
                        seconds: 4,
                        // onDiscovered: peripheral => {
                        //     this.peripherals.push(peripheral);
                        // },
                        skipPermissionCheck: true // we can skip permissions as we use filters:   https://developer.android.com/guide/topics/connectivity/bluetooth-le
                    })
                    .then(
                        p => {
                            this.isLoading = false;
                            console.log('p', p);
                        },
                        err => {
                            this.isLoading = false;
                            dialogs.alert({
                                title: 'Whoops!',
                                message: err,
                                okButtonText: 'OK, got it'
                            });
                        }
                    );
            }
        });
    }

    // this one uses automatic permission handling
    public doStartScanning() {
        this.isLoading = true;
        // reset the array
        this.peripherals.length = 0;
        this._bluetooth
            .startScanning({
                seconds: 50, // passing in seconds makes the plugin stop scanning after <seconds> seconds
                // onDiscovered: peripheral => {
                //     console.log("peripheral discovered. Not adding it here because we're using a listener.");
                //     // this.peripherals.push(peripheral);
                // },
                skipPermissionCheck: false // we can't skip permissions and we need enabled location as we dont use filters: https://developer.android.com/guide/topics/connectivity/bluetooth-le
            })
            .then(() => (this.isLoading = false))
            .catch(err => {
                this.isLoading = false;
                dialogs.alert({
                    title: 'Whoops!',
                    message: err ? err : 'Unknown error',
                    okButtonText: 'OK, got it'
                });
            });
    }

    public doStopScanning() {
        this._bluetooth.stopScanning().then(
            () => {
                this.isLoading = false;
            },
            err => {
                dialogs.alert({
                    title: 'Whoops!',
                    message: err,
                    okButtonText: 'OK, so be it'
                });
            }
        );
    }

    public doStartBeacon() {
        //let serviceUuid = 'B9401000-F5F8-466E-AFF9-25556B57FE6D';
        let serviceUuid = '0000FEAA-0000-1000-8000-00805F9B34FB';
        let serviceData = 0x10;
        let name = 'test CoronaBeacon';
        this._bluetooth.startBeaconAdvertising(serviceUuid, serviceData, name);
    }

    public doStopBeacon() {
        this._bluetooth.stopBeaconAdvertising();
    }


    /*
  DemoAppModel.prototype.doWrite = function () {
    // send 1 byte to switch a light on
    var data = new Uint8Array(1);
    data[0] = 1;

    bluetooth.write(
      {
        peripheralUUID: mostRecentlyFoundperipheralUUID,
        serviceUUID: "B9401000-F5F8-466E-AFF9-25556B57FE6D", // TODO dummy
        characteristicUUID: "B9402001-F5F8-466E-AFF9-25556B57FE6D", // TODO dummy
        value: data.buffer,
        awaitResponse: true // if false you will not get notified of errors (fire and forget)
      }
    ).then(
      function(result) {
        dialogs.alert({
          title: "Write result",
          message: JSON.stringify(result),
          okButtonText: "OK, splendid"
        });
      },
      function (err) {
        dialogs.alert({
          title: "Whoops!",
          message: err,
          okButtonText: "Hmmkay"
        });
      }
    );
  };
*/
}
