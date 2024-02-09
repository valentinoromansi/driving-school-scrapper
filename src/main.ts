import axios from "axios";
import { resolve } from "path";
import * as cheerio from 'cheerio';

const URL_DOMAIN = 'klindic.autoskola-testovi.com';
const sleep = () => new Promise(resolve => setTimeout(resolve, 1000))
let $: cheerio.CheerioAPI

/**
 * Initial exam table fetch
 */
const examsTableRes = await axios
  .get("https://klindic.autoskola-testovi.com/index.php?module=view_details&assignment_id=167&user_id=56986", {
  headers: {
    cookie: 'PHPSESSID=l3rquoo4vli22pr99d1pfe54l3; cookie=here'
  }
})
const examsTableHtml = examsTableRes.data

$ = cheerio.load(examsTableHtml);

/**
 * Exam URLs extraction
 */
const examUrls: string[] = []
$('#table-3 > tbody > tr')
  .each((i, el) => {
    const uri = $(el).find('td > a').attr('href') 
    if(uri)
      examUrls.push(`${URL_DOMAIN}/${uri}`)
  });
console.log(`Exam urls: ${JSON. stringify(examUrls, undefined, 2)}`)

/**
 * Exam URLs extraction
 */