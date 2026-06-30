import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import connectMongo from './database/mongoose.js';
import Question from './models/Question.js';
import { fetchQuestionData, verifySubmission } from './services/leetcode.js';
import { recordSubmissionByPlayerId, addBonusXpByPlayerId } from './modules/users/users.service.js';

// Connect to MongoDB
connectMongo();

const PORT = process.env.PORT || 5000;

// Create HTTP Server wrapping the Express app
const server = http.createServer(app);

// Initialize Socket.IO (The "Valorant Lobby" engine)
const io = new Server(server, {
    cors: {
        origin: '*', // We'll restrict this to the frontend URL later
        methods: ['GET', 'POST']
    }
});

// Track active players: playerId -> socket.id
const activePlayers = new Map();
// Track player's current party: playerId -> partyId
const playerParty = new Map();
// Track parties: partyId -> { leaderId, members: [PlayerProfile], matchMode }
const parties = new Map();

const broadcastPartyUpdate = (partyId) => {
    const party = parties.get(partyId);
    if (!party) return;
    party.members.forEach(member => {
        const socketId = activePlayers.get(member.playerId);
        if (socketId) {
            io.to(socketId).emit('party_updated', party);
        }
    });
};

const handlePlayerLeaveParty = (playerId) => {
    const partyId = playerParty.get(playerId);
    if (!partyId) return;

    const party = parties.get(partyId);
    if (!party) return;

    // Remove player from party
    party.members = party.members.filter(m => m.playerId !== playerId);
    
    if (party.members.length === 0) {
        // Disband empty party
        parties.delete(partyId);
    } else if (party.leaderId === playerId) {
        // Pick a random new leader
        const randomIndex = Math.floor(Math.random() * party.members.length);
        party.leaderId = party.members[randomIndex].playerId;
        broadcastPartyUpdate(partyId);
    } else {
        // Just broadcast update
        broadcastPartyUpdate(partyId);
    }

    playerParty.delete(playerId);
};

// Handle Socket connections
io.on('connection', (socket) => {
    console.log(`🟢 New player connected: ${socket.id}`);

    socket.on('register_player', (payload) => {
        // Handle both old string payload and new object payload to prevent server crashes during dev refresh
        const playerId = typeof payload === 'string' ? payload : payload?.playerId;
        const playerProfile = payload?.playerProfile || { playerId, username: 'Unknown' };

        if (!playerId) return;

        activePlayers.set(playerId, socket.id);
        socket.playerId = playerId;
        socket.playerProfile = playerProfile;

        // Leave any existing party first
        handlePlayerLeaveParty(playerId);

        // Create a solo party for this player
        const partyId = playerId;
        parties.set(partyId, {
            leaderId: playerId,
            members: [playerProfile],
            matchMode: 'competitive',
            numRounds: 1
        });
        playerParty.set(playerId, partyId);

        broadcastPartyUpdate(partyId);
        console.log(`Player ${playerId} registered with socket ${socket.id} (Solo Party Created)`);
    });

    socket.on('send_invite', ({ toPlayerId, fromPlayer }) => {
        const targetSocketId = activePlayers.get(toPlayerId);
        if (targetSocketId) {
            // Include the partyId in the invite
            const partyId = playerParty.get(fromPlayer.playerId);
            io.to(targetSocketId).emit('receive_invite', { from: fromPlayer, partyId });
        }
    });

    socket.on('accept_invite', ({ toPlayerId, fromPlayer, partyId }) => {
        const targetParty = parties.get(partyId);
        if (!targetParty) return;

        // Leave current party
        handlePlayerLeaveParty(fromPlayer.playerId);

        // Join the new party
        targetParty.members.push(fromPlayer);
        playerParty.set(fromPlayer.playerId, partyId);
        
        broadcastPartyUpdate(partyId);
    });

    socket.on('update_profile', (playerProfile) => {
        const playerId = socket.playerId;
        if (!playerId) return;

        socket.playerProfile = playerProfile;

        // Update the profile in the party if they are in one
        const partyId = playerParty.get(playerId);
        if (partyId) {
            const party = parties.get(partyId);
            if (party) {
                const memberIndex = party.members.findIndex(m => m.playerId === playerId);
                if (memberIndex !== -1) {
                    party.members[memberIndex] = playerProfile;
                    broadcastPartyUpdate(partyId);
                }
            }
        }
    });

    socket.on('change_match_mode', ({ playerId, mode }) => {
        const partyId = playerParty.get(playerId);
        if (!partyId) return;
        
        const party = parties.get(partyId);
        if (party && party.leaderId === playerId) {
            party.matchMode = mode;
            broadcastPartyUpdate(partyId);
        }
    });

    socket.on('change_num_rounds', ({ playerId, numRounds }) => {
        const partyId = playerParty.get(playerId);
        if (!partyId) return;
        
        const party = parties.get(partyId);
        if (party && party.leaderId === playerId) {
            party.numRounds = numRounds;
            broadcastPartyUpdate(partyId);
        }
    });

    socket.on('start_match', async ({ playerId }) => {
        const partyId = playerParty.get(playerId);
        if (!partyId) return;
        
        const party = parties.get(partyId);
        // Only allow leader to start match
        if (party && party.leaderId === playerId) {
            try {
                // Initialize match state
                party.currentRound = 1;
                party.scores = {};
                party.members.forEach(m => { party.scores[m.playerId] = 0; });

                // Pick random question from DB
                const count = await Question.countDocuments();
                const random = Math.floor(Math.random() * count);
                const questionMeta = await Question.findOne().skip(random);
                
                if (questionMeta) {
                    party.matchStartTime = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
                    party.question = questionMeta;
                    const problemData = await fetchQuestionData(questionMeta.titleSlug);
                    party.problemData = problemData;
                    
                    // Broadcast updated party with problemData to all members
                    broadcastPartyUpdate(partyId);
                }
            } catch (e) {
                console.error("Error fetching match data:", e);
            }

            // Broadcast to all members to transition to loading screen
            party.members.forEach(member => {
                const memberSocketId = activePlayers.get(member.playerId);
                if (memberSocketId) {
                    io.to(memberSocketId).emit('match_started', { partyId, mode: party.matchMode, problemData: party.problemData });
                }
            });
        }
    });

    socket.on('verify_win', async ({ playerId, leetcodeUsername }) => {
        const partyId = playerParty.get(playerId);
        if (!partyId) return;
        
        const party = parties.get(partyId);
        if (party && party.question && party.matchStartTime) {
            const isVerified = await verifySubmission(leetcodeUsername, party.question.titleSlug, party.matchStartTime);
            if (isVerified) {
                // RECORD THE WIN IN DATABASE
                try {
                    await recordSubmissionByPlayerId(playerId, party.question.title, party.question.difficulty);
                } catch (e) {
                    console.error("Failed to record win in database:", e);
                }

                // Increment score
                if (!party.scores) party.scores = {};
                party.scores[playerId] = (party.scores[playerId] || 0) + 1;

                if (party.currentRound < party.numRounds) {
                    // Next round path
                    party.members.forEach(member => {
                        const memberSocketId = activePlayers.get(member.playerId);
                        if (memberSocketId) {
                            io.to(memberSocketId).emit('round_ended', { winnerId: playerId, nextRoundIn: 5, scores: party.scores });
                        }
                    });

                    // Wait 5 seconds, then load next question
                    setTimeout(async () => {
                        party.currentRound++;
                        try {
                            const count = await Question.countDocuments();
                            const random = Math.floor(Math.random() * count);
                            const questionMeta = await Question.findOne().skip(random);
                            
                            if (questionMeta) {
                                party.matchStartTime = Math.floor(Date.now() / 1000);
                                party.question = questionMeta;
                                const problemData = await fetchQuestionData(questionMeta.titleSlug);
                                party.problemData = problemData;
                                
                                broadcastPartyUpdate(partyId);
                                
                                party.members.forEach(member => {
                                    const memberSocketId = activePlayers.get(member.playerId);
                                    if (memberSocketId) {
                                        io.to(memberSocketId).emit('next_round', { currentRound: party.currentRound, problemData: party.problemData, scores: party.scores });
                                    }
                                });
                            }
                        } catch (e) {
                            console.error("Error fetching next round data:", e);
                        }
                    }, 5000);
                } else {
                    // Match ended path
                    // Determine overall winner (max score)
                    let maxScore = -1;
                    let overallWinner = playerId;
                    Object.entries(party.scores).forEach(([pid, score]) => {
                        if (score > maxScore) {
                            maxScore = score;
                            overallWinner = pid;
                        }
                    });
                    
                    party.members.forEach(member => {
                        const memberSocketId = activePlayers.get(member.playerId);
                        if (memberSocketId) {
                            io.to(memberSocketId).emit('match_ended', { winnerId: overallWinner, scores: party.scores });
                        }
                    });
                    
                    // Award bonus XP to winner
                    if (party.matchMode === 'competitive') {
                        try {
                            addBonusXpByPlayerId(overallWinner, 50);
                        } catch (e) {
                            console.error("Failed to add bonus XP:", e);
                        }
                    }
                }
            } else {
                socket.emit('verify_failed', { message: 'No recent accepted submission found on LeetCode.' });
            }
        }
    });

    socket.on('leave_party', ({ playerId }) => {
        handlePlayerLeaveParty(playerId);
        
        // Re-create a solo party for this player
        const playerProfile = socket.playerProfile;
        if (playerProfile) {
            const partyId = playerId;
            parties.set(partyId, {
                leaderId: playerId,
                members: [playerProfile],
                matchMode: 'competitive',
                numRounds: 1
            });
            playerParty.set(playerId, partyId);
            broadcastPartyUpdate(partyId);
        }
    });

    socket.on('code_sync', ({ partyId, playerId, code, language }) => {
        const party = parties.get(partyId);
        if (!party) return;
        
        // Broadcast code_update to all other members in the party
        party.members.forEach(member => {
            if (member.playerId !== playerId) {
                const memberSocketId = activePlayers.get(member.playerId);
                if (memberSocketId) {
                    io.to(memberSocketId).emit('code_update', { playerId, code, language });
                }
            }
        });
    });

    socket.on('notepad_sync', ({ partyId, playerId, content }) => {
        const party = parties.get(partyId);
        if (!party) return;
        
        // Broadcast notepad_update to all other members in the party
        party.members.forEach(member => {
            if (member.playerId !== playerId) {
                const memberSocketId = activePlayers.get(member.playerId);
                if (memberSocketId) {
                    io.to(memberSocketId).emit('notepad_update', { playerId, content });
                }
            }
        });
    });

    socket.on('chat_message', ({ partyId, playerId, message }) => {
        const party = parties.get(partyId);
        if (!party) return;
        
        // Broadcast to all members including sender so they get uniform timestamp/ordering if needed,
        // or just broadcast to others and locally append. We will broadcast to everyone in the party.
        party.members.forEach(member => {
            const memberSocketId = activePlayers.get(member.playerId);
            if (memberSocketId) {
                io.to(memberSocketId).emit('new_chat_message', { playerId, message, timestamp: new Date().toISOString() });
            }
        });
    });

    socket.on('disconnect', () => {
        console.log(`🔴 Player disconnected: ${socket.id}`);
        if (socket.playerId) {
            handlePlayerLeaveParty(socket.playerId);
            activePlayers.delete(socket.playerId);
        }
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`🚀 CodeArena Backend running on http://localhost:${PORT}`);
});
