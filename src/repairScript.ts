import axios from "axios";
import { resolve } from "path";
import * as cheerio from 'cheerio';
import fs from 'fs'


type Answer = {
    id: number,
    text: string,
    correct: boolean
  }
  type QuestionType = 'SELECTED' | 'TYPED' 
  type ExamQuestion = {
    id: number,
    question: string,
    answers: Answer[],
    imagesUrls: string[],
    type: QuestionType
  }

const questions: ExamQuestion[] =  JSON.parse(fs.readFileSync('resources/questions.json', { encoding: 'utf8' }));
questions.forEach((question, i) => {
  question.id = i + 1
  question.answers.forEach((answer, ai) => {
    answer.id = ai + 1    
  });
})

fs.writeFileSync('resources/questions.json', JSON.stringify(questions, null, 2), 'utf8');

