const LEETCODE_API = 'https://leetcode.com/graphql';

export const fetchQuestionData = async (titleSlug) => {
    const query = `
        query questionData($titleSlug: String!) {
            question(titleSlug: $titleSlug) {
                questionId
                title
                titleSlug
                difficulty
                content
                topicTags {
                    name
                }
                codeSnippets {
                    langSlug
                    code
                }
            }
        }
    `;
    
    const response = await fetch(LEETCODE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { titleSlug } })
    });
    const data = await response.json();
    return data?.data?.question;
};

export const verifySubmission = async (username, titleSlug, matchStartTimeUnixSec) => {
    const query = `
        query recentAcSubmissions($username: String!, $limit: Int!) {
            recentAcSubmissionList(username: $username, limit: $limit) {
                id
                title
                titleSlug
                timestamp
                statusDisplay
            }
        }
    `;
    
    try {
        const response = await fetch(LEETCODE_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, variables: { username, limit: 15 } })
        });
        const data = await response.json();
        const submissions = data?.data?.recentAcSubmissionList || [];
        
        // Find if they submitted an Accepted solution for this problem after the match started
        // Added a 60-second buffer to account for minor clock drift between our servers and LeetCode
        const validSubmission = submissions.find(sub => {
            const timeDiff = parseInt(sub.timestamp) - matchStartTimeUnixSec;
            console.log(`Checking submission: ${sub.titleSlug}, Status: ${sub.statusDisplay}, TimeDiff: ${timeDiff}s`);
            return sub.titleSlug === titleSlug && 
                   sub.statusDisplay === 'Accepted' && 
                   timeDiff >= -60; 
        });
        
        return !!validSubmission;
    } catch (e) {
        console.error("LeetCode Verification Error:", e);
        return false;
    }
};
