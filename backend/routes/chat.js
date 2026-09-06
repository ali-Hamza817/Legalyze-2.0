const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const Document = require('../models/Document');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const openai = require('../config/openai');
const { generateEmbedding } = require('../utils/documentProcessor');
const pineconeService = require('../services/pineconeService');
const { extractFacts } = require('../services/factExtractor');
const { detectIntent, getDocumentTypeName } = require('../services/intentDetector');
const { generateFieldStatusMessage, mapFactsToFields } = require('../services/fieldMapper');
const { getPakistanSystemPrompt, detectCaseType } = require('../services/pakistanLegalPrompts');
const { getJudgmentContext } = require('../services/judgmentScraper');
const LegalAgentService = require('../services/LegalAgentService');

// @route   POST /api/chat
// @desc    Send message and get AI response
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { message, conversationId } = req.body;
        let documentIds = req.body.documentIds; // Use let to allow reassignment in fallback logic

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }

        let conversation;

        // Get or create conversation
        if (conversationId) {
            conversation = await Conversation.findOne({
                _id: conversationId,
                user: req.user.id
            });

            if (!conversation) {
                return res.status(404).json({
                    success: false,
                    message: 'Conversation not found'
                });
            }

            // Update documentIds if provided
            if (documentIds && documentIds.length > 0) {
                const existingDocs = conversation.documentIds.map(id => id.toString());
                const newDocs = documentIds.filter(id => !existingDocs.includes(id));
                
                if (newDocs.length > 0) {
                    conversation.documentIds.push(...newDocs);
                }
            }
        } else {
            // Create new conversation
            conversation = new Conversation({
                user: req.user.id,
                messages: [],
                documentIds: documentIds || []
            });
        }

        // Add user message
        const userMessage = {
            role: 'user',
            content: message
        };

        if (req.body.files) {
            userMessage.files = req.body.files;
        }

        if (req.body.metadata) {
            userMessage.metadata = req.body.metadata;
        }

        conversation.messages.push(userMessage);

        // Prepare context from documents (Chat-Scoped RAG)
        let context = '';
        let hasDocumentContext = false;
        
        // Always try to retrieve context if we have a conversation ID or specific docs
        
        // --- CONTEXT AUTO-RESOLUTION FIX ---
        // If the frontend didn't send specific documentIds, but we are in a chat session (conversationId),
        // we MUST find all documents associated with this chat to provide full context.
        if ((!documentIds || documentIds.length === 0) && conversationId) {
            console.log('🔍 Auto-resolving documents for Chat ID:', conversationId);
            try {
                // Find all docs linked to this chat
                const chatDocs = await Document.find({ chatId: conversationId }).select('_id');
                if (chatDocs.length > 0) {
                    documentIds = chatDocs.map(d => d._id);
                    console.log(`✅ Auto-resolved ${documentIds.length} documents from session context.`);
                } else {
                    console.log('ℹ️ No documents found for this chat session.');
                    
                    // FALLBACK: Check for recent orphaned/unsorted uploads (last 15 mins) by this user
                    // This handles the case where frontend uploaded doc but hasn't linked it to a chat ID yet
                    console.log('⚠️ Attempting fallback: Looking for recent user uploads...');
                    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
                    const recentDocs = await Document.find({
                        user: req.user.id,
                        createdAt: { $gte: fifteenMinutesAgo },
                        // Optional: filter for 'unsorted' if you want to be strict, but for now just grab recent
                    }).sort({ createdAt: -1 }).limit(1).select('_id');

                    if (recentDocs.length > 0) {
                        documentIds = [recentDocs[0]._id];
                        console.log(`✅ Fallback: Auto-attached most recent upload: ${recentDocs[0]._id}`);
                        
                        // Optionally link it to this conversation now?
                        // await Document.findByIdAndUpdate(recentDocs[0]._id, { chatId: conversationId });
                    }
                }
            } catch (err) {
                console.error('❌ Error resolving chat documents:', err);
            }
        } else if (!documentIds || documentIds.length === 0) {
            // Case: New Conversation (No conversationId yet)
             console.log('⚠️ New Conversation: Looking for recent user uploads...');
             const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
             const recentDocs = await Document.find({
                 user: req.user.id,
                 createdAt: { $gte: fifteenMinutesAgo }
             }).sort({ createdAt: -1 }).limit(1).select('_id');

             if (recentDocs.length > 0) {
                 documentIds = [recentDocs[0]._id];
                 console.log(`✅ Fallback (New Chat): Auto-attached most recent upload: ${recentDocs[0]._id}`);
             }
        }
        // -----------------------------------

        // === AGENTIC RAG FLOW ===
        console.log('⚖️ Executing Agentic legal research...');
        const agenticResult = await LegalAgentService.processQuery(message, {
            conversationId,
            documentIds,
            userId: req.user.id,
            history: conversation.messages.slice(-10)
            // Note: LegalAgentService now internally enforces 'user-uploads' namespace for user documents
        });

        const aiResponse = agenticResult.content;
        // =========================

        // Add AI response to conversation
        conversation.messages.push({
            role: 'assistant',
            content: aiResponse
        });

        // === INTELLIGENT DOCUMENT GENERATION FEATURE ===
        // Extract facts from user message and update user profile
        let extractionResult = null;
        let intentResult = null;
        let generationData = null;

        try {
            // Get user with existing facts
            const user = await User.findById(req.user.id);
            
            // Extract facts from the conversation
            const conversationMessages = conversation.messages.map(msg => ({
                role: msg.role,
                content: msg.content
            }));
            
            extractionResult = await extractFacts(conversationMessages, user.extractedFacts || {});
            
            if (extractionResult.success) {
                // Update user's extracted facts
                user.extractedFacts = extractionResult.facts;
                user.factsLastUpdated = new Date();
                await user.save();
                
                console.log('✅ Facts extracted and saved:', extractionResult.newlyExtracted);
            }
            
            // Detect if user wants to generate a document
            intentResult = await detectIntent(message, conversationMessages.slice(-5));
            
            if (intentResult.success && intentResult.hasIntent && intentResult.documentType) {
                console.log(`🎯 Document generation intent detected: ${intentResult.documentType}`);
                
                // Generate field status message
                const fieldStatus = generateFieldStatusMessage(
                    extractionResult.facts,
                    intentResult.documentType
                );
                
                // Map facts to template fields
                const mappedFields = mapFactsToFields(
                    extractionResult.facts,
                    intentResult.documentType
                );
                
                // Prepare generation data to send to frontend
                generationData = {
                    hasGenerationIntent: true,
                    documentType: intentResult.documentType,
                    documentTypeName: getDocumentTypeName(intentResult.documentType),
                    message: fieldStatus.message,
                    completeness: fieldStatus.completeness,
                    mappedFields: mappedFields,
                    canGenerate: fieldStatus.canGenerate
                };
                
                // Override AI response with generation message
                conversation.messages[conversation.messages.length - 1].content = fieldStatus.message;
                conversation.messages[conversation.messages.length - 1].metadata = {
                    generationIntent: true,
                    documentType: intentResult.documentType
                };
            }
            
        } catch (error) {
            console.error('Error in intelligent generation:', error);
            // Don't fail the whole request, just log the error
        }

        // Save conversation
        await conversation.save();

        // Generate title for new conversation
        if (conversation.messages.length <= 2 && conversation.title === 'New Conversation') {
            try {
                const titleCompletion = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: 'Generate a very concise, professional legal chat title (strictly 3-4 words) for this conversation based on the user message. Do not use quotes, do not use "Title:", just the text.'
                        },
                        {
                            role: 'user',
                            content: message
                        }
                    ],
                    temperature: 0.5,
                    max_tokens: 20
                });

                const newTitle = titleCompletion.choices[0].message.content.trim();
                conversation.title = newTitle;
                await conversation.save();
            } catch (error) {
                console.error('Title generation error:', error);
                // Fallback is already handled by model default or pre-save hook
            }
        }

        res.status(200).json({
            success: true,
            data: {
                conversationId: conversation._id,
                message: conversation.messages[conversation.messages.length - 1].content,
                conversation: {
                    id: conversation._id,
                    title: conversation.title,
                    messages: conversation.messages
                },
                // Include generation data if intent was detected
                ...(generationData && { generation: generationData })
            }
        });

    } catch (error) {
        console.error('❌ Chat error:', error.message);
        console.error('Stack Trace:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Error processing chat message',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   GET /api/chat/conversations
// @desc    Get all user conversations
// @access  Private
router.get('/conversations', protect, async (req, res) => {
    try {
        const conversations = await Conversation.find({
            user: req.user.id,
            isActive: true
        })
        .select('title createdAt updatedAt messages metadata')
        .sort({ updatedAt: -1 });

        // Format conversations with message count
        const formattedConversations = conversations.map(conv => ({
            id: conv._id,
            title: conv.title,
            messageCount: conv.messages.length,
            lastMessage: conv.messages[conv.messages.length - 1]?.content.substring(0, 100),
            createdAt: conv.createdAt,
            updatedAt: conv.updatedAt,
            metadata: conv.metadata
        }));

        res.status(200).json({
            success: true,
            data: formattedConversations
        });

    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching conversations'
        });
    }
});

// @route   GET /api/chat/conversations/:id
// @desc    Get conversation by ID
// @access  Private
router.get('/conversations/:id', protect, async (req, res) => {
    try {
        const conversation = await Conversation.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                id: conversation._id,
                title: conversation.title,
                messages: conversation.messages,
                documentIds: conversation.documentIds,
                createdAt: conversation.createdAt,
                updatedAt: conversation.updatedAt
            }
        });

    } catch (error) {
        console.error('Get conversation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching conversation'
        });
    }
});

// @route   DELETE /api/chat/conversations/:id
// @desc    Delete conversation
// @access  Private
router.delete('/conversations/:id', protect, async (req, res) => {
    try {
        const conversation = await Conversation.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found'
            });
        }

        conversation.isActive = false;
        await conversation.save();

        res.status(200).json({
            success: true,
            message: 'Conversation deleted successfully'
        });

    } catch (error) {
        console.error('Delete conversation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting conversation'
        });
    }
});

module.exports = router;
