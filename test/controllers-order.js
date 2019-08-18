const assert = require('chai').assert
const timeline = require('../controllers/order')

describe('file orders', function () {

    describe('function ordersNoDepositAtAirport', function () {
        //value send
        const orders = [
            {
                orderID: '1',
                pickupType: 'airport',
                pickupDate: '2018-09-08T02:30:00'
            },
            {
                orderID: '2',
                pickupType: 'airport',
                pickupDate: '2018-09-08T03:00:00'
            },
            {
                orderID: '3',
                pickupType: 'hotel',
                pickupDate: '2018-09-07T01:30:00'
            },
        ]

        const date = '2018-09-07'

        const ordersNoDepositAtAirport = timeline.ordersNoDepositAtAirport(orders, date)

        it('should return order', function () {
            //result true
            result = [
                {
                    orderID: '1',
                    pickupType: 'airport',
                    pickupDate: '2018-09-08T02:30:00'
                },
                {
                    orderID: '3',
                    pickupType: 'hotel',
                    pickupDate: '2018-09-07T01:30:00'
                },
            ]
            //result false
            const resultfalse = [
                {
                    orderID: '1',
                    pickupType: 'airport',
                    pickupDate: '2018-09-08T02:30:00'
                },
                {
                    orderID: '2',
                    pickupType: 'airport',
                    pickupDate: '2018-09-08T09:30:00'
                },
            ]
            assert.deepEqual(ordersNoDepositAtAirport, result, 'ordersNoDepositAtAirport is false')
        })
    })

})