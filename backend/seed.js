import 'dotenv/config';
import mongoose from 'mongoose';
import Question from './src/models/Question.js';

const LEETCODE_GRAPHQL_API = 'https://leetcode.com/graphql';

async function fetchLeetcodeQuestions(limit = 3000) {
    const query = `
        query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
            problemsetQuestionList: questionList(
                categorySlug: $categorySlug
                limit: $limit
                skip: $skip
                filters: $filters
            ) {
                totalNum
                data {
                    difficulty
                    title
                    titleSlug
                    isPaidOnly
                }
            }
        }
    `;

    const variables = {
        categorySlug: "",
        skip: 0,
        limit: limit,
        filters: {}
    };

    const response = await fetch(LEETCODE_GRAPHQL_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables })
    });

    const result = await response.json();
    return result.data.problemsetQuestionList.data;
}

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        
        console.log('Fetching questions from LeetCode GraphQL API...');
        
        // Fetch up to 3000 questions (there are currently ~3000+ on LeetCode)
        const allQuestions = await fetchLeetcodeQuestions(3000);
        
        // Filter out premium questions
        const freeQuestions = allQuestions.filter(q => !q.isPaidOnly);
        
        const seedQuestions = freeQuestions.map(q => ({
            title: q.title,
            titleSlug: q.titleSlug,
            difficulty: q.difficulty // LeetCode GraphQL already returns "Easy", "Medium", "Hard"
        }));

        console.log(`Found ${seedQuestions.length} free questions. Seeding database...`);

        await Question.deleteMany({}); // clear existing
        await Question.insertMany(seedQuestions);
        console.log('Successfully seeded questions from LeetCode!');
    } catch (e) {
        console.error('Error seeding data:', e);
    } finally {
        mongoose.disconnect();
    }
}

seed();
