const settings = require('./settings.json')
const ForecastIo = require('forecastio')
const moment = require('moment')
const amqp = require('amqp-connection-manager')

const connection = amqp.connect([settings.amqpURI])
const forecastIo = new ForecastIo(settings.forecastAPIKey)
const channelWrapper = connection.createChannel({
    json: true,
    setup: (channel) => {
        console.log('Connected')
        return channel.assertQueue('input', { durable: true })
    },
})
const getBericht = new Promise(async (res) => {
    let bericht = 'Error'
    try {
        let forecastIO = await forecastIo.forecast(settings.lat, settings.lng,  { units: 'si', lang: 'de' })
        bericht = `${ forecastIO.currently.temperature }C*${ forecastIO.hourly.summary }`
    } catch {
        
    }
    res(bericht)
})
getBericht
.then(bericht => {
    console.log(bericht)
    return channelWrapper.sendToQueue('input', ['2B', bericht])
})
.then(() => process.exit(0))
.catch(() => process.exit(0))