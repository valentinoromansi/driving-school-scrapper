import axios from "axios";
import { resolve } from "path";
import * as cheerio from 'cheerio';
import fs from 'fs'

const URL_PROTOCOL = 'https://';
const URL_DOMAIN = 'klindic.autoskola-testovi.com';
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
let $: cheerio.CheerioAPI
const headers = {
  headers: { 
    cookie: 'PHPSESSID=gud57f4tvqmf1935ivor8s0kf2; cookie=here' 
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
type QuestionType = 'SELECTED' | 'TYPED' 
type ExamQuestion = {
  question: string,
  answers: Answer[],
  imagesUrls: string[],
  type: QuestionType
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
      // Detect question type and parse out value if it is 'TYPED'. If answer values is 'null' then type is 'SELECTED'
      const typedAnswerText = $(questionEl).find('tr:nth-child(5) > td > table > tbody > tr:nth-child(2) > td > font').html()
      const recognitionString = 'Ispravan odgovor : ';
      const questionType: QuestionType = typedAnswerText?.includes(recognitionString) ? 'TYPED' : 'SELECTED'
      // answers
      let answers: Answer[] = [];
      if (questionType == 'SELECTED') {
        const answersWrapperEl = $(questionEl).find('tr:nth-child(5) > td > table > tbody > .blockRow > td:nth-child(2)');
        answers = answersWrapperEl.map((i, answerEl) => {
          return {
            text: $(answerEl).find('.odgovor').html(),
            correct: $(answerEl).find('font > b').text() == 'Ispravan odgovor'
          } as Answer
        }).get()
      }
      if (questionType == 'TYPED') {
        const typedAnswerValue = questionType == 'TYPED' ? typedAnswerText?.substring(recognitionString.length, typedAnswerText.length) : null
        answers.push({
          text: typedAnswerValue,
          correct: true
        } as Answer)
      }

// #pitanje1 > tbody > tr:nth-child(5) > td > table > tbody > tr:nth-child(2) > td > font
      const examQuestion: ExamQuestion = {
        question: question,
        answers: answers,
        imagesUrls: imagesUrls,
        type: questionType
      };
      examQuestions.push(examQuestion)
    });
    //
    await sleep(1000) // Sleep for 1sec to avoid potential server side timeout
  };
  
  fs.writeFileSync('resources/questions.json', JSON.stringify(examQuestions, null, 2), 'utf8');
  
  console.log(`${examQuestions.length} exam question saved.`)