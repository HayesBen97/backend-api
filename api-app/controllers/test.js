// const SerpApi = require('google-search-results-nodejs')
// const search = new SerpApi.GoogleSearch('Your Private Key')

// function defineQuery(query) {

//     query_params = {
//         q: query,
//         google_domain: "Google Domain", 
//         location: "Location Requested", 
//         device: device,
//         hl: "Google UI Language",
//         gl: "Google Country",
//         safe: "Safe Search Flag",
//         num: "Number of Results",
//         start: "Pagination Offset",
//         api_key: "Your SERP API Key",  // https://serpapi.com/dashboard
//         tbm: "nws|isch|shop",
//         tbs: "custom to be search criteria",
//         async: true|false,   // allow async query
//         output: "json|html", // output format
//     }
//     return query_params
// }

// export const SerpApiInstance = async (req, res) => {

// }

// let singletonInstance = (function () {
//     let instance;

//     function createInstance() {
//         let object = new Object()
//     }
// })

// export const googleResultSearch = async (req, res) => {
    
//     const query = defineQuery(req.body.query)

//     callback = (data) => {
//         console.log(data)
//     }

//     search.json(query, callback)
// }