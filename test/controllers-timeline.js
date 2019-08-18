const assert = require('chai').assert
const timeline = require('../controllers/timeline')


describe('file timeline', function () {
    // describe('function orderWithDriverPickupDate', function () {
    //     //value send
    //     const ordersDeliver = [
    //         {
    //         driverPickupDate: '2018-09-07T00:30:00',
    //         dropPlace: {
    //             lat: 13.7444683,
    //             lng: 100.5277199
    //         }
    //     },
    //         {
    //         driverPickupDate: '2018-09-07T02:30:00',
    //         dropPlace: {
    //             lat: 13.7444683,
    //             lng: 100.5277199
    //         }
    //     },
    //         {
    //         driverPickupDate: '2018-09-07T04:30:00',
    //         dropPlace: {
    //             lat: 13.7444683,
    //             lng: 100.5277199
    //         }
    //     },
    // ]

    //     const order = {
    //         driverPickupDate: '2018-09-07T00:30:00',
    //         driverDropDate: '2018-09-07T00:30:00',
    //         dropPlace: {
    //             lat: 13.7444683,
    //             lng: 100.5277199
    //         },
    //     }

    //     const orderWithDriverPickupDate = timeline.orderWithDriverPickupDate(ordersDeliver, order)
    //     //result true

    //     //result false

    //     it('should return order', function () {


    //         assert.equal(orderWithDriverPickupDate, 'result false')


    //     })
    // })
    describe('function driverDropFromLastPickupToFirstDrop', function () {
        //value send
        const ordersDeliver = [
            {
                driverPickupDate: '2018-09-07T00:30:00',
                dropPlace: {
                    lat: 13.7444683,
                    lng: 100.5277199,
                }
            },
            {
                driverPickupDate: '2018-09-07T01:00:00',
                dropPlace: {
                    lat: 13.7444683,
                    lng: 100.5277199,
                }
            },
            {
                driverPickupDate: '2018-09-07T02:00:00',
                dropPlace: {
                    lat: 13.7444683,
                    lng: 100.5277199,
                }
            },
        ]

        const order = {
            pickupPlace: {
                lat: 13.7444683,
                lng: 100.5277199,
            }
        }

        const driverDropFromLastPickupToFirstDrop = timeline.driverDropFromLastPickupToFirstDrop(ordersDeliver, order)

        it('should return order', function () {
            //result true
            const result = {
                driverDropDate: '2018-09-07T02:15:00',
                pickupPlace: {
                    lat: 13.7444683,
                    lng: 100.5277199,
                }
            }
            //result false
            const resultfalse = {
                driverDropDate: '2018-09-07T02:00:00',
                pickupPlace: {
                    lat: 13.7444683,
                    lng: 100.5277199,
                }
            }
            assert.deepEqual(driverDropFromLastPickupToFirstDrop, result, 'driverDropDate is false')
        })
    })

    describe('function driverDropFromLastDropToNextDrop', function () {
        //value send
        const ordersDeliver = [
            {
                driverDropDate: '2018-09-07T00:30:00',
                pickupPlace: {
                    lat: 13.7444683,
                    lng: 100.5277199,
                },
                pickupLoc: 'MBK',
            },
            {
                driverDropDate: '2018-09-07T01:00:00',
                pickupPlace: {
                    lat: 13.7444683,
                    lng: 100.5277199,
                },
                pickupLoc: 'MBK',
            },
            {
                driverDropDate: '2018-09-07T02:00:00',
                pickupPlace: {
                    lat: 13.7444683,
                    lng: 100.5277199,
                },
                pickupLoc: 'MBK',
            },
        ]

        const order = {
            pickupPlace: {
                lat: 13.7444683,
                lng: 100.5277199,
            },
            pickupLoc: 'MBK',
        }

        const driverDropFromLastDropToNextDrop = timeline.driverDropFromLastDropToNextDrop(ordersDeliver, order)

        it('should return order', function () {
            //result true
            const result = {
                driverDropDate: '2018-09-07T00:30:00',
                pickupPlace: {
                    lat: 13.7444683,
                    lng: 100.5277199,
                },
                pickupLoc: 'MBK',
            }
            //result false
            const resultfalse = {
                driverDropDate: '2018-09-07T02:00:00',
                pickupPlace: {
                    lat: 13.7444683,
                    lng: 100.5277199,
                },
                pickupLoc: 'MBK',
            }
            assert.deepEqual(driverDropFromLastDropToNextDrop, result, 'driverDropDate is false')
        })
    })

    describe('function orderDriverDropAtSamePickupLoc', function () {
        //value send
        const ordersDeliver = [
            {
                driverPickupDate: '2018-09-07T00:30:00',
                dropLoc: 'BKK',
            },
            {
                driverPickupDate: '2018-09-07T01:00:00',
                dropLoc: 'BKK',
            },
            {
                driverPickupDate: '2018-09-07T02:00:00',
                dropLoc: 'MBK',
            },
        ]

        const order = {
            pickupLoc: 'MBK',
            driverPickupDate: '2018-09-07T03:00:00'
        }

        const orderDriverDropAtSamePickupLoc = timeline.orderDriverDropAtSamePickupLoc(ordersDeliver, order)

        it('should return order', function () {
            //result true
            const result = {
                pickupLoc: 'MBK',
                driverPickupDate: '2018-09-07T03:00:00',
                driverDropDate: '2018-09-07T02:00:00'
            }
            //result false
            const resultfalse = {
                pickupLoc: 'MBK',
                driverPickupDate: '2018-09-07T03:00:00',
                driverDropDate: '2018-09-07T03:00:00'
            }
            assert.deepEqual(orderDriverDropAtSamePickupLoc, result, 'driverDropDate is false')
        })
    })

    describe('function findOrderFastestCritical', function () {
        //value send
        const orders = [
            {
                id: '1',
                critical: '2018-09-12T04:30:00.000Z',
                driverPickupDate: '',
                dropDate: ''
            },
            {
                id: '2',
                critical: '2018-09-13T12:29:00.000Z',
                driverPickupDate: '',
                dropDate: ''
            },
            {
                id: '3',
                critical: '2018-09-13T12:30:00.000Z',
                driverPickupDate: '',
                dropDate: ''
            },
            {
                id: '4',
                critical: '2018-09-14T04:30:00.000Z',
                driverPickupDate: '',
                dropDate: ''
            },
        ]

        const date = '2018-09-13'

        const findOrderFastestCritical = timeline.findOrderFastestCritical(orders, date)

        it('should return order', function () {
            //result true
            result =
                {
                    id: '2',
                    critical: '2018-09-13T12:29:00.000Z',
                    driverPickupDate: '',
                    dropDate: ''
                }
            //result false
            const resultfalse =
                {
                    id: '1',
                    critical: '2018-09-12T04:30:00.000Z',
                    driverPickupDate: '',
                    dropDate: ''
                }

            assert.deepEqual(findOrderFastestCritical, result, 'findOrderFastestCritical is false')
        })
    })

    describe('function driverAfterCustomer', function () {
        //return true 
        const orderdriverAfterCustomer = {
            driverPickupDate: '2018-09-07T10:30:00',
            dropDate: '2018-09-07T02:30:00'
        }
        //return false
        const orderdriverAfterCustomerFail = {
            driverPickupDate: '2018-09-07T00:30:00',
            dropDate: '2018-09-07T01:30'
        }

        const driverAfterCustomer = timeline.driverAfterCustomer(orderdriverAfterCustomer)

        it('should return true', function () {

            assert.equal(driverAfterCustomer, true, 'driver pickup before Customer drop')
        })
    })

    describe('function driverBeforeCritical', function () {
        //return true 
        const orderdriverBeforeCritical = {
            driverPickupDate: '2018-09-07T10:30:00',
            critical: '2018-09-07T20:30:00'
        }
        //return false
        const orderdriverBeforeCriticalFail = {
            driverPickupDate: '2018-09-07T10:30:00',
            critical: '2018-09-07T00:30:00'
        }

        const driverBeforeCritical = timeline.driverBeforeCritical(orderdriverBeforeCritical)

        it('should return true', function () {

            assert.equal(driverBeforeCritical, true, 'driver pickup after critical time')
        })
    })

    describe('function customerBeforeCritical', function () {
        //return true 
        const ordercustomerBeforeCritical = {
            dropDate: '2018-09-07T10:30:00'
        }, fastCritical = '2018-09-07T20:30:00'
        //return false
        const ordercustomerBeforeCriticalFail = {
            dropDate: '2018-09-07T30:30:00'
        }, fastCriticalfail = '2018-09-07T20:10:00'

        const customerBeforeCritical = timeline.customerBeforeCritical(ordercustomerBeforeCritical, fastCritical)

        it('should return true', function () {

            assert.equal(customerBeforeCritical, true, 'customer drop after fast critical time')
        })
    })

    describe('function driverBeforeCricalService', function () {
        //return true 
        const orderdriverBeforeCricalService = {
            driverPickupDate: '2018-09-07T00:30:00'
        }, fastCritical = '2018-09-07T20:30:00'
        //return false
        const orderdriverBeforeCricalServiceFail = {
            driverPickupDate: '2018-09-07T10:30:00'
        }, fastCriticalfail = '2018-09-07T30:10:00'

        const driverBeforeCricalService = timeline.driverBeforeCricalService(orderdriverBeforeCricalService, fastCritical)

        it('should return true', function () {

            assert.equal(driverBeforeCricalService, true, 'driver pickup add 15 min after fast critical time')
        })
    })

    describe('function driverGoOnThreeHours', function () {
        //return true 
        const orderdriverGoOnThreeHours = {
            driverPickupDate: '2018-09-07T00:30:00',
            dropDate: '2018-09-07T10:30:00'
        }
        //return false
        const orderdriverGoOnThreeHoursFail = {
            driverPickupDate: '2018-09-07T10:30:00',
            dropDate: '2018-09-07T00:30:00'
        }

        const driverGoOnThreeHours = timeline.driverGoOnThreeHours(orderdriverGoOnThreeHours)

        it('should return true', function () {

            assert.equal(driverGoOnThreeHours, true, 'driver pickup after customer drop')
        })
    })

    describe('function driverDontGoDropToSamePickupLoc', function () {
        //return true 
        const orderdriverDontGoDropToSamePickupLoc = {
            pickupLoc: 'airport'
        }, ordersDeliver = [{
            dropLoc: 'suwanaphum1'
        }, {
            dropLoc: 'suwanaphum2'
        }, {
            dropLoc: 'suwanaphum3'
        }]
        //return false
        const orderdriverDontGoDropToSamePickupLocFail = {
            pickupLoc: 'airport'
        }, ordersDeliverFail = [{
            dropLoc: 'suwanaphum'
        }, {
            dropLoc: 'airport'
        }, {
            dropLoc: 'airport2'
        }]

        const driverDontGoDropToSamePickupLoc = timeline.driverDontGoDropToSamePickupLoc(
            orderdriverDontGoDropToSamePickupLoc, ordersDeliver)

        it('should return true', function () {

            assert.equal(driverDontGoDropToSamePickupLoc, true, 'driver pickupLoc Same DropLoc')
        })
    })

    describe('function driverDropAtOneAirport', function () {
        //Return TRUE
        //if 1
        const orderdriverDropAtOneAirportif1 = {
            pickupType: 'hotel'
        }, ordersDeliverif1 = [{
            pickupType: 'airport'
        }]
        //if 2
        const orderdriverDropAtOneAirportif2 = {
            pickupType: 'airport',
            dropType: 'airport'
        }, ordersDeliverif2 = [{
            pickupType: 'airport'
        }]
        //if 3
        const orderdriverDropAtOneAirportif3 = {
            pickupLoc: 'donmuang'
        }, ordersDeliverif3 = [{
            pickupType: 'airport',
            pickupLoc: 'donmuang'
        }]
        //if all
        const orderdriverDropAtOneAirportifall = {
            pickupType: 'airport',
            dropType: 'airport',
            pickupLoc: 'donmuang'
        }, ordersDeliverifall = [{
            pickupType: 'airport',
            pickupLoc: 'donmuang'
        }]

        //Return False
        //if 1
        const orderdriverDropAtOneAirportFailif1 = {
            pickupType: 'airport'
        }, ordersDeliverFailif1 = [{
            pickupType: 'airport'
        }]
        //if 2
        const orderdriverDropAtOneAirportFailif2 = {
            pickupType: 'hotel',
            dropType: 'airport'
        }, ordersDeliverFailif2 = [{
            pickupType: 'airport'
        }]
        //if 3
        const orderdriverDropAtOneAirportFailif3 = {
            pickupLoc: 'donmuang'
        }, ordersDeliverFailif3 = [{
            pickupType: 'airport',
            pickupLoc: 'suwannaphum'
        }]
        //if all
        const orderdriverDropAtOneAirportFailifall = {
            pickupType: 'airport',
            dropType: 'hotel',
            pickupLoc: 'donmuang'
        }, ordersDeliverFailifall = [{
            pickupType: 'airport',
            pickupLoc: 'suwannaphum'
        }]

        const driverDropAtOneAirportif1 = timeline.driverDropAtOneAirport(orderdriverDropAtOneAirportif1, ordersDeliverif1)
        const driverDropAtOneAirportif2 = timeline.driverDropAtOneAirport(orderdriverDropAtOneAirportif2, ordersDeliverif2)
        const driverDropAtOneAirportif3 = timeline.driverDropAtOneAirport(orderdriverDropAtOneAirportif3, ordersDeliverif3)
        const driverDropAtOneAirportifall = timeline.driverDropAtOneAirport(orderdriverDropAtOneAirportifall, ordersDeliverifall)

        it('should return true if 1', function () {
            // if 1
            assert.equal(driverDropAtOneAirportif1, true, 'customer pickup at airport')
        })
        it('should return true if 2', function () {
            //if 2
            assert.equal(driverDropAtOneAirportif2, true, 'customer dropType or pickupType Not Airport')
        })
        it('should return true if 3', function () {
            //if 3
            assert.equal(driverDropAtOneAirportif3, true, 'customer order pickupLoc and ordersDeliver pickupLoc Not Match')
        })
        it('should return true if all', function () {
            //if all
            assert.equal(driverDropAtOneAirportifall, true, 'Driver Drop not one Airport')
        })
    })

    describe('function planNoOverLoad', function () {
        //return true 
        const orderplanNoOverLoad = {
            luggage: 5
        }, capacity = 35, ordersDeliver = [{
            luggage: 16
        }]
        //return false
        const orderplanNoOverLoadFail = {
            luggage: 12
        }, capacityFail = 35, ordersDeliverFail = [{
            luggage: 26
        }]

        const planNoOverLoad = timeline.planNoOverLoad(orderplanNoOverLoad, ordersDeliver, capacity)

        it('should return true', function () {

            assert.equal(planNoOverLoad, true, 'luggage over capacity')
        })
    })

    describe('function driverDropBeforeCritical', function () {
        //return true 
        const orderdriverDropBeforeCritical = {
            driverDropDate: '2018-09-07T00:30:00',
            critical: '2018-09-07T10:30:00'
        }
        //return false
        const orderdriverDropBeforeCriticalFail = {
            driverDropDate: '2018-09-07T30:30:00',
            critical: '2018-09-07T00:30:00'
        }
        const driverDropBeforeCritical = timeline.driverDropBeforeCritical(orderdriverDropBeforeCritical)

        it('should return true', function () {

            assert.equal(driverDropBeforeCritical, true, 'Driver drop after critical')
        })
    })

    describe('function driverPickBeforeDrop', function () {
        //return true 
        const orderdriverPickBeforeDrop = {
            driverPickupDate: '2018-09-07T00:00:00',
            driverDropDate: '2018-09-07T20:30:00'
        }
        //return false
        const orderdriverPickBeforeDropFail = {
            driverPickupDate: '2018-09-07T30:30:00',
            driverDropDate: '2018-09-07T00:30:00'
        }
        const driverPickBeforeDrop = timeline.driverPickBeforeDrop(orderdriverPickBeforeDrop)

        it('should return true', function () {

            assert.equal(driverPickBeforeDrop, true, 'Driver pickup after Drop')
        })
    })

    describe('function driverDropBeforeCustomerPickup', function () {
        //return true
        const orderdriverDropBeforeCustomerPickup = {
            pickupDate: '2018-09-07T16:00:00',
            driverDropDate: '2018-09-07T15:30:00'
        }
        //return false
        const orderdriverDropBeforeCustomerPickupFail = {
            pickupDate: '2018-09-07T16:30:00',
            driverDropDate: '2018-09-07T17:00:00'
        }

        const driverDropBeforeCustomerPickup = timeline.driverDropBeforeCustomerPickup(orderdriverDropBeforeCustomerPickup)

        it('should return true', function () {

            assert.equal(driverDropBeforeCustomerPickup, true, 'Driver drop after Customer Pickup')
        })
    })

    describe('function findOrderFastDriverPickupDate', function () {
        //value send
        const ordersDeliver = [
            {
                driverPickupDate: '2018-09-07T02:10:00'
            },
            {
                driverPickupDate: '2018-09-07T07:20:00'
            },
            {
                driverPickupDate: '2018-09-07T10:30:00'
            },
            {
                driverPickupDate: '2018-09-07T17:40:00'
            },
        ]

        const findOrderFastDriverPickupDate = timeline.findOrderFastDriverPickupDate(ordersDeliver)

        it('should return findOrderFastDriverPickupDate', function () {
            // result true
            const result = {
                driverPickupDate: '2018-09-07T02:10:00'
            }

            // result false
            const resultfalse = {
                driverPickupDate: '2018-09-07T17:40:00'
            }


            assert.deepEqual(findOrderFastDriverPickupDate, result, 'driverDropDate is not fast critical')
        })
    })

    describe('function customerBeforeFastDriverPickup', function () {
        //value send true
        const order = {
            dropDate: '2018-09-07T06:30:00'
        }
        const orderFirstDriverPickup = {
            driverPickupDate: '2018-09-07T10:00:00'
        }
        //value send false
        const orderfalse = {
            dropDate: '2018-09-07T20:30:00'
        }
        const orderFirstDriverPickupfalse = {
            driverPickupDate: '2018-09-07T10:00:00'
        }

        const customerBeforeFastDriverPickup = timeline.customerBeforeFastDriverPickup(order, orderFirstDriverPickup)

        it('should return true', function () {

            assert.deepEqual(customerBeforeFastDriverPickup, true, 'customer drop after DriverPickup')
        })
    })

    describe('function ordersWithDurationFromOrigin', function () {
        //value send true is value = 0 
        const orders = [
            {
                dropPlace: {
                    lat: 13.7444683,
                    lng: 100.5277199
                }
            }
        ]
        const orderFastCritical = {
            dropPlace: {
                lat: 13.7444683,
                lng: 100.5277199
            }
        }
        //value send true is value = 31709 
        const ordersvalue = [
            {
                dropPlace: {
                    lat: 13.7444683,
                    lng: 100.5277199
                }
            }
        ]
        const orderFastCriticalvalue = {
            dropPlace: {
                lat: 16,
                lng: 200
            }
        }

        const ordersWithDurationFromOrigin = timeline.ordersWithDurationFromOrigin(orders, orderFastCritical)
        const ordersWithDurationFromOriginvalue = timeline.ordersWithDurationFromOrigin(ordersvalue, orderFastCriticalvalue)

        it('should return ordersWithDurationFromOrigin not value', function () {
            //result true is value = 0
            const result = [{
                dropPlace: {
                    lat: 13.7444683,
                    lng: 100.5277199
                },
                durationFromOrigin: 0
            }]
            //result false
            const resultfalse = [{
                dropPlace: {
                    lat: 13.7444683,
                    lng: 100.5277199
                },
                durationFromOrigin: 200
            }]

            assert.deepEqual(ordersWithDurationFromOrigin, result, 'durationFromOrigin is false')
        })

        it('should return ordersWithDurationFromOrigin is value', function () {
            //result true is value = 31709 
            const result = [{
                dropPlace: {
                    lat: 13.7444683,
                    lng: 100.5277199
                },
                durationFromOrigin: 31709
            }]
            //result false
            const resultfalse = [{
                dropPlace: {
                    lat: 13.7444683,
                    lng: 100.5277199
                },
                durationFromOrigin: 0
            }]

            assert.deepEqual(ordersWithDurationFromOriginvalue, result, 'durationFromOrigin is false')
        })
    })

    describe('function orderStartDriverPickup', function () {
        // value true
        const order = {
            dropDate: '2018-09-07T10:00:00',
            airbnb: '',
            pickupDate: '2018-09-07T20:00:00'
        }
        // value true is airbnb
        const orderairbnb = {
            dropDate: '2018-09-07T10:00:00',
            airbnb: 'inbound',
            pickupDate: '2018-09-07T20:00:00'
        }

        const orderStartDriverPickup = timeline.orderStartDriverPickup(order)
        const orderStartDriverPickupairbnb = timeline.orderStartDriverPickup(orderairbnb)

        it('should return order', function () {
            //result true
            const result = {
                dropDate: '2018-09-07T10:00:00',
                airbnb: '',
                pickupDate: '2018-09-07T20:00:00',
                driverPickupDate: '2018-09-07T10:00:00'
            }
            //result true is false
            const resultairbnbfalse = {
                dropDate: '2018-09-07T10:00:00',
                airbnb: 'inbound',
                pickupDate: '2018-09-07T20:00:00',
                driverPickupDate: '2018-09-07T09:00:00'
            }

            assert.deepEqual(orderStartDriverPickup, result, 'driverPickup ')
        })
        it('should return order is airbnb', function () {
            //result true is airbnb
            const resultairbnb = {
                dropDate: '2018-09-07T10:00:00',
                airbnb: 'inbound',
                pickupDate: '2018-09-07T20:00:00',
                driverPickupDate: '2018-09-07T19:00:00'
            }
            //result true is false
            const resultairbnbfalse = {
                dropDate: '2018-09-07T10:00:00',
                airbnb: 'inbound',
                pickupDate: '2018-09-07T20:00:00',
                driverPickupDate: '2018-09-07T09:00:00'
            }

            assert.deepEqual(orderStartDriverPickupairbnb, resultairbnb, 'driverPickup ')
        })


    })
})