import { response } from 'express';
import config from '../config';

const rp = require('request-promise');
const puppeteer = require('puppeteer');
const fs = require('fs')
const SerpApi = require('google-search-results-nodejs')
const search = new SerpApi.GoogleSearch()
const { SERP_API_KEY } = config;

console.log("Beginning Article Search");

async function saveStaticDataToFile(data) {
    let response;
    console.log(data)
    for(let i = 0; i < data.length; i++) {
        fs.writeFile(`./rawArticle${i}.txt`, data[i].article, function(err) {
            response = "success"
            if(err) {
                response = "failed"
                return console.log(err);
            }
            console.log("The files has been saved.");
        }); 
    }
    return response
}

async function articleSearch(url, res) {
    console.log("article search")
    try {
        const articleRegex = /(^.+[A-ZÁ-Ý][a-zá-ý].+\.)/gm;
        let articleData;
        let data;
        let results = [];
        let urlList = [];
        let launchOptions = {
            headless: true
        }
        for(let i = 0; i < url.organic_results.length; i++) {
            urlList.push(url.organic_results[i].link)
        }
        console.log("List: ", urlList)
        for(let i = 0; i < url.organic_results.length; i++) {
            let response;
            let article;

            console.log(`article: ${i}`)
            try {
            let browser = await puppeteer.launch(launchOptions);
            let page = await browser.newPage();
            await page.goto(urlList[i], {
                waitUntil: 'networkidle2',
            });
            data =  await page.evaluate(() => {
                // console.log("document query")
                article = document.querySelector('article').innerText
                response = "success";
                return {
                    article,
                    response
                }
                });
            }catch(err) {
                console.log(err)
            }
            if(!data.article){
                try {
                    let browser = await puppeteer.launch(launchOptions);
                    let page = await browser.newPage();
                    await page.goto(urlList[i], {
                        waitUntil: 'networkidle2',
                    });
                    data =  await page.evaluate(() => {
                        // console.log("document query")
                        article = document.querySelector('article-content').innerText
                        response = "success";
                        return {
                            article,
                            response
                        }
                        });
                    }catch(err) {
        
                    }
            }
            if(!data.article){
                try {
                    let browser = await puppeteer.launch(launchOptions);
                    let page = await browser.newPage();
                    await page.goto(urlList[i], {
                        waitUntil: 'networkidle2',
                    });
                    data =  await page.evaluate(() => {
                        // console.log("document query")
                        article = document.querySelector('content').innerText
                        response = "success";
                        return {
                            article,
                            response
                        }
                        });
                    }catch(err) {
        
                    }
                }
                if(!data.article){
                    try {
                        let browser = await puppeteer.launch(launchOptions);
                        let page = await browser.newPage();
                        await page.goto(urlList[i], {
                            waitUntil: 'networkidle2',
                        });
                        data =  await page.evaluate(() => {
                            // console.log("document query")
                            article = document.querySelector('main').innerText
                            response = "success";
                            return {
                                article,
                                response
                            }
                            });
                        }catch(err) {
            
                        }
                    }
                articleData = data.article.match(articleRegex)
            results.push(articleData)
        }
        // await browser.close()
        // console.log(results)
        // console.log("article: ",articleData);
        process.setMaxListeners(0);
        await sThreeBucketUpload(results);

        return res.send({
            status: 200,
            result: results,
        });
        }catch(err) {
            console.log(err)
        }
    }



async function sThreeBucketUpload (req, res) {
    for(let i = 0; i < req.length; i++){
        (async () => {
            await s3
                .putObject({
                    Body: JSON.stringify(req[i]),
                    Bucket: "marketmate-article-bucket",
                    Key: "article.txt",
                })
                .promise();
        })();
    }
}

export async function googleSearch(req, res) {
    try {
        console.log("req.body: ", req.params);
        let search = new SerpApi.GoogleSearch();
        console.log(search)
        let result = await search.json({
            api_key: SERP_API_KEY,
            q: req.body.query,          // search query
            location: "United Kingdom", // location 
        }, (data) => {
        articleSearch(data, res)
        })
    }catch(err) {
    console.log(err)
    }
}

// Search for article export
// export const articleSearchExample = async (req, res) => {
// (async () => {
//     let url = "https://www.bighospitality.co.uk/Article/2021/11/17/Huge-relief-as-Welsh-Government-opts-not-to-extend-NHS-Covid-Pass-policy-across-hospitality"

//     const browser = await puppeteer.launch();
//     const page = await browser.newPage();
//     await page.goto(url, {
//         waitUntil: 'networkidle2',
//     });
//     let data =  await page.evaluate(() => {

        
//         let article = document.querySelector('article[class=Detail]').innerText;

        

//         return {
//             title,
//             article
//         }
//     });
//     console.log(data);
//     //saveStaticDataToFile(data.article)
//     debugger;
//     await browser.close();
// })();
// }

// articleSearchExample()
// googleSearch("whats the latest in beer trends");


