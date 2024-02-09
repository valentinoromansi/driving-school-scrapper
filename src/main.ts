import axios from "axios";
import { resolve } from "path";
import * as cheerio from 'cheerio';
import fs from 'fs'

const URL_PROTOCOL = 'https://';
const URL_DOMAIN = 'klindic.autoskola-testovi.com';
const sleep = () => new Promise(resolve => setTimeout(resolve, 1000))
let $: cheerio.CheerioAPI
const headers = {
  headers: { 
    cookie: 'PHPSESSID=l3rquoo4vli22pr99d1pfe54l3; cookie=here' 
  } 
}

/**
 * Initial exam table fetch
 */
const examsTableHtml = (
  await axios.get(
    `${URL_PROTOCOL}${URL_DOMAIN}/index.php?module=view_details&assignment_id=167&user_id=56986`, 
    headers
  )).data

/**
 * Exam URLs extraction
 */
$ = cheerio.load(examsTableHtml);
let examUrls: string[] = []
$('#table-3 > tbody > tr')
  .each((i, row) => {
    const uri = $(row).find('td > a').attr('href') 
    if(uri)
      examUrls.push(`${URL_DOMAIN}/${uri}`)
  });


/**
 * Exam URLs extraction
 */
type Answer = {
  text: string,
  correct: boolean
}
type ExamQuestion = {
  question: string,
  answers: Answer[],
  imagesUrls: string[]
}

// This is only for now to test with 2 exams
//examUrls.length = 5;

let examQuestions: ExamQuestion[] = [];

for (const examUrl of examUrls){
  console.log(`Parsing data from ${examUrl}...`)
  const examRes = await axios.get(`${URL_PROTOCOL}${examUrl}`, headers)
  const examsHtml = examRes.data
  $ = cheerio.load(examsHtml);
  
  const examUrls: string[] = []
  $('#pitanje1 > tbody')
    .each((_, questionEl) => {
      // question
      const question = $(questionEl).find('.pitanje').text().replace(/\n|\r/g, "").trim();   
      if(examQuestions.map(q => q.question).includes(question))
        return;
      // Image URLs
      const imagesUrls = $(questionEl)
        .find('.pitanje img')
        .map((_, imgEl) => { return `${URL_DOMAIN}/${$(imgEl).attr('src')}` })
        .get();
      // answers
      const answersWrapperEl = $(questionEl).find('tr:nth-child(5) > td > table > tbody > .blockRow > td:nth-child(2)');
      const answers: Answer[] = answersWrapperEl.map((i, answerEl) => {
        return {
          text: $(answerEl).find('.odgovor').html(),
          correct: $(answerEl).find('font > b').text() == 'Ispravan odgovor'
        } as Answer
      }).get()

      const examQuestion: ExamQuestion = {
        question: question,
        answers: answers,
        imagesUrls: imagesUrls
      };
      examQuestions.push(examQuestion)
    });
  };
  
  fs.writeFileSync('resources/exam.json', JSON.stringify(examQuestions, null, 2), 'utf8');
  
  console.log(`${examQuestions.length} exam question saved.`)