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
        bericht = `${ forecastIO.currently.temperature }C\n\n${ forecastIO.hourly.summary.replace(/(\r\n|\n|\r)/gm, '') }`
    } catch (e) {
        
    }
    res(bericht)
})
getBericht
.then(str => {
    
	str = str.replace(/Ä/g, '[')
	str = str.replace(/Ü/g, '[')
	str = str.replace(/Ö/g, '\\')

	str = str.replace(/ä/g, '{')
	str = str.replace(/ö/g, '|')
	str = str.replace(/ü/g, '}')
	str = str.replace(/ß/g, '~')

    console.log(str)
    return channelWrapper.sendToQueue('input', ['2B', str])
})
.then(() => process.exit(0))
.catch(() => process.exit(0))